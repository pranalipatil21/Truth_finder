import prisma from '../../config/database';
import { AppError } from '../../middleware/error.middleware';

export class ScoringService {
    async getResumeScore(resumeId: string, userId: string) {
        console.debug('Fetching resume score', { resumeId, userId });
        const resume = await prisma.resume.findFirst({
            where: { id: resumeId, userId },
            include: {
                truthScore: true,
                resumeSkills: {
                    include: {
                        skill: true,
                    },
                },
            },
        });

        if (!resume) {
            throw new AppError(`Resume ${resumeId} not found for user ${userId}`, 404);
        }

        // Get all completed sessions for this resume
        const sessions = await prisma.assessmentSession.findMany({
            where: { resumeId, userId, status: 'COMPLETED' },
            orderBy: { completedAt: 'desc' },
            include: {
                skillScores: {
                    include: {
                        skill: true,
                    },
                },
            },
        });

        return {
            resumeId: resume.id,
            fileName: resume.fileName,
            overallScore: resume.truthScore,
            sessions: sessions.map((session: any) => ({
                sessionId: session.id,
                completedAt: session.completedAt,
                overallScore: session.overallScore || null,
                skillScores: session.skillScores.map((ss: any) => ({
                    skillName: ss.skill.name,
                    mcqScore: ss.mcqScore,
                    subjectiveScore: ss.subjScore,
                    truthScore: ss.truthScore,
                })),
            })),
        };
    }

    async getCandidateOverview(userId: string) {
        const resumes = await prisma.resume.findMany({
            where: { userId },
            include: {
                truthScore: true,
            },
        });

        const completedSessions = await prisma.assessmentSession.count({
            where: { userId, status: 'COMPLETED' },
        });

        const averageScore = resumes.length > 0
            ? resumes.reduce((acc: number, r: any) => acc + (r.truthScore?.authenticityScore || 0), 0) / resumes.length
            : 0;

        return {
            totalResumes: resumes.length,
            completedAssessments: completedSessions,
            averageAuthenticityScore: Math.round(averageScore * 100) / 100,
            resumes: resumes.map((r: any) => ({
                id: r.id,
                fileName: r.fileName,
                score: r.truthScore?.authenticityScore || 0,
                status: r.status,
            })),
        };
    }
}

export const scoringService = new ScoringService();
