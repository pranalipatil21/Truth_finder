import prisma from '../../config/database';
import { QuestionSource } from '@prisma/client';
import { AppError } from '../../middleware/error.middleware';

export class RecruiterService {
    async getCandidates(query?: string, skills?: string[]) {
        const where: any = {
            role: 'CANDIDATE',
        };

        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (skills && skills.length > 0) {
            where.resumes = {
                some: {
                    resumeSkills: {
                        some: {
                            skill: {
                                name: { in: skills, mode: 'insensitive' }
                            }
                        }
                    }
                }
            };
        }

        const candidates = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                resumes: {
                    where: { status: 'PARSED' },
                    include: {
                        truthScore: true,
                        resumeSkills: {
                            include: { skill: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return candidates.map(c => {
            const latestResume = c.resumes[0];
            return {
                id: c.id,
                name: c.name,
                email: c.email,
                latestResumeId: latestResume?.id,
                truthScore: latestResume?.truthScore?.authenticityScore,
                skills: latestResume?.resumeSkills.map(rs => rs.skill.name).slice(0, 5) || []
            };
        });
    }

    async getCandidateDetails(candidateId: string) {
        const candidate = await prisma.user.findFirst({
            where: { id: candidateId, role: 'CANDIDATE' },
            include: {
                resumes: {
                    where: { status: 'PARSED' },
                    include: {
                        truthScore: true,
                        resumeSkills: {
                            include: {
                                skill: {
                                    include: { category: true }
                                }
                            }
                        },
                        assessmentSessions: {
                            where: { status: 'COMPLETED' },
                            include: {
                                skillScores: {
                                    include: { skill: true }
                                },
                                snapshots: true
                            },
                            orderBy: { completedAt: 'desc' },
                            take: 1
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!candidate) {
            throw new AppError('Candidate not found', 404);
        }

        const latestResume = candidate.resumes[0];

        return {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            resume: latestResume ? {
                id: latestResume.id,
                fileName: latestResume.fileName,
                truthScore: latestResume.truthScore,
                skills: latestResume.resumeSkills.map(rs => ({
                    name: rs.skill.name,
                    category: rs.skill.category.name,
                    claimedLevel: rs.claimedLevel,
                    yearsExperience: rs.yearsExperience
                })),
                lastAssessment: latestResume.assessmentSessions[0]
            } : null
        };
    }

    async getCandidateResumeFile(candidateId: string) {
        const candidate = await prisma.user.findFirst({
            where: { id: candidateId, role: 'CANDIDATE' },
            include: {
                resumes: {
                    where: { status: 'PARSED' },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!candidate || candidate.resumes.length === 0) {
            throw new AppError('Candidate or resume not found', 404);
        }

        const latestResume = candidate.resumes[0];
        
        // Also ensure file actually exists on disk
        const fs = require('fs');
        if (!fs.existsSync(latestResume.filePath)) {
            throw new AppError('Resume file not found on disk', 404);
        }

        return {
            filePath: latestResume.filePath,
            fileName: latestResume.fileName
        };
    }

    async addToShortlist(recruiterId: string, candidateId: string, notes?: string) {
        return prisma.shortlist.upsert({
            where: {
                recruiterId_candidateId: {
                    recruiterId,
                    candidateId
                }
            },
            update: { notes },
            create: {
                recruiterId,
                candidateId,
                notes
            }
        });
    }

    async removeFromShortlist(recruiterId: string, candidateId: string) {
        return prisma.shortlist.delete({
            where: {
                recruiterId_candidateId: {
                    recruiterId,
                    candidateId
                }
            }
        });
    }

    async getShortlist(recruiterId: string) {
        const shortlist = await prisma.shortlist.findMany({
            where: { recruiterId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        resumes: {
                            where: { status: 'PARSED' },
                            include: {
                                truthScore: true
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                }
            }
        });

        return shortlist.map(s => ({
            ...s,
            candidate: {
                id: s.candidate.id,
                name: s.candidate.name,
                email: s.candidate.email,
                truthScore: s.candidate.resumes[0]?.truthScore?.authenticityScore
            }
        }));
    }

    // ─── Question Bank (QB) ────────────────────────────────────────────────────

    async getQuestionBank(recruiterId: string, roomId: string) {
        // Verify room belongs to this recruiter
        const room = await prisma.assessmentRoom.findFirst({
            where: { id: roomId, recruiterId },
        });
        if (!room) throw new AppError('Room not found or access denied', 403);

        return prisma.question.findMany({
            where: { roomId, source: QuestionSource.RECRUITER, isActive: true },
            include: { skill: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addQuestionToBank(
        recruiterId: string,
        roomId: string,
        dto: {
            skillId: string;
            type: 'MCQ' | 'SUBJECTIVE';
            difficulty: 'EASY' | 'MEDIUM' | 'HARD';
            promptText: string;
            options?: { text: string; isCorrect?: boolean }[];
            correctOption?: number;
        }
    ) {
        // Verify room belongs to this recruiter
        const room = await prisma.assessmentRoom.findFirst({
            where: { id: roomId, recruiterId },
        });
        if (!room) throw new AppError('Room not found or access denied', 403);

        // Verify skill exists
        const skill = await prisma.skill.findUnique({ where: { id: dto.skillId } });
        if (!skill) throw new AppError('Skill not found', 404);

        return prisma.question.create({
            data: {
                skillId: dto.skillId,
                type: dto.type,
                difficulty: dto.difficulty,
                promptText: dto.promptText,
                options: dto.options ?? null,
                correctOption: dto.correctOption ?? null,
                source: QuestionSource.RECRUITER,
                recruiterId,
                roomId,
            },
            include: { skill: { select: { id: true, name: true } } },
        });
    }

    async deleteFromQuestionBank(recruiterId: string, questionId: string) {
        const question = await prisma.question.findFirst({
            where: { id: questionId, recruiterId, source: QuestionSource.RECRUITER },
        });
        if (!question) throw new AppError('Question not found or access denied', 403);

        return prisma.question.update({
            where: { id: questionId },
            data: { isActive: false },
        });
    }

    async addQuestionsFromCsv(recruiterId: string, roomId: string, filePath: string) {
        const fs = require('fs');
        const { parse } = require('csv-parse/sync');

        // Verify room belongs to this recruiter
        const room = await prisma.assessmentRoom.findFirst({
            where: { id: roomId, recruiterId },
        });
        if (!room) throw new AppError('Room not found or access denied', 403);

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        if (records.length === 0) {
            throw new AppError('CSV file is empty', 400);
        }

        const addedQuestions = [];
        const failedRows = [];
        
        for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const rowNum = i + 1; // 1-indexed for user readability
            try {
                const skillName = record.Skill || record.Topic;
                const type = record.Type || 'MCQ'; // Default to MCQ if they use the simple format without Type
                const difficulty = record.Difficulty || 'MEDIUM'; // Default to MEDIUM
                const promptText = record.Prompt || record.Question;
                
                if (!skillName || !type || !difficulty || !promptText) {
                    failedRows.push(`Row ${rowNum}: Missing required columns (Skill/Topic, Type, Difficulty, Prompt/Question)`);
                    continue;
                }

                // Fetch or ignore if skill is missing (could also auto-create, but typically we want strict matching)
                const skill = await prisma.skill.findFirst({
                    where: { name: { equals: skillName, mode: 'insensitive' } }
                });
                
                if (!skill) {
                    failedRows.push(`Row ${rowNum}: Skill/Topic "${skillName}" not found in database.`);
                    continue; // Skip rows with unknown skills to prevent crashes
                }
                
                let options = null;
                let correctOption = null;

                if (type === 'MCQ') {
                    // Check for both templates: Option1 vs Option A
                    const opts: { text: string; isCorrect?: boolean }[] = [];
                    if (record.Option1 || record['Option A']) opts.push({ text: record.Option1 || record['Option A'] });
                    if (record.Option2 || record['Option B']) opts.push({ text: record.Option2 || record['Option B'] });
                    if (record.Option3 || record['Option C']) opts.push({ text: record.Option3 || record['Option C'] });
                    if (record.Option4 || record['Option D']) opts.push({ text: record.Option4 || record['Option D'] });
                    
                    if (opts.length === 0) {
                        failedRows.push(`Row ${rowNum}: MCQ requires at least 2 options. Found none.`);
                        continue;
                    }

                    // Resolve correct option index
                    let correctIdx = -1;
                    if (record.CorrectOptionIndex !== undefined && record.CorrectOptionIndex !== '') {
                        correctIdx = parseInt(record.CorrectOptionIndex, 10);
                    } else if (record.Answer !== undefined && record.Answer !== '') {
                        // User template with explicit text answer
                        correctIdx = opts.findIndex(o => o.text.trim().toLowerCase() === record.Answer.trim().toLowerCase());
                    }

                    if (correctIdx >= 0 && correctIdx < opts.length) {
                        opts[correctIdx].isCorrect = true;
                        options = opts;
                        correctOption = correctIdx;
                    } else {
                        if (record.Answer !== undefined && record.Answer !== '') {
                             failedRows.push(`Row ${rowNum}: The Answer "${record.Answer}" did not match any of the provided Options.`);
                             continue;
                        } else {
                            // Default back to option 0 if invalid
                            opts[0] = { ...opts[0], isCorrect: true };
                            options = opts;
                            correctOption = 0;
                        }
                    }
                } else if (type === 'SUBJECTIVE') {
                    options = {
                        idealAnswer: record.IdealAnswer || '',
                        keyPoints: record.KeyPoints ? record.KeyPoints.split(';') : []
                    };
                } else {
                    failedRows.push(`Row ${rowNum}: Invalid Type "${type}". Must be MCQ or SUBJECTIVE.`);
                    continue;
                }

                if (!options) {
                    failedRows.push(`Row ${rowNum}: Invalid options configuration.`);
                    continue;
                }

                const q = await prisma.question.create({
                    data: {
                        skillId: skill.id,
                        type: type === 'MCQ' ? 'MCQ' : 'SUBJECTIVE',
                        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
                        promptText,
                        options,
                        correctOption,
                        source: QuestionSource.RECRUITER,
                        recruiterId,
                        roomId,
                    }
                });
                addedQuestions.push(q);
            } catch (error) {
                // Skip invalid rows silently
                console.error('Row parse error', error);
                failedRows.push(`Row ${rowNum}: Unknown parse error.`);
            }
        }

        // Cleanup temp file
        try { fs.unlinkSync(filePath); } catch (e) { }

        let message = `Successfully added ${addedQuestions.length} questions from CSV.`;
        if (failedRows.length > 0) {
            message += ` Failed on ${failedRows.length} rows.`;
        }

        return {
            message,
            count: addedQuestions.length,
            failedRows
        };
    }
}

export const recruiterService = new RecruiterService();
