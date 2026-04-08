import prisma from '../../config/database';
import { QuestionSource } from '@prisma/client';
import { questionGenerator } from './question.generator';
import { calculateSkillTruthScore, calculateAuthenticityScore } from '../../shared/utils/score.calculator';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../config/logger';

export class AssessmentService {
  public generationProgress = new Map<string, { total: number; generated: number; message: string; expiresAt: number }>();

  /** If a skill already has this many MCQs in DB, skip AI generation entirely */
  private readonly SKIP_AI_THRESHOLD = 20;

  // Clean up stale progress entries (prevent memory leak)
  private cleanupProgress(resumeId: string) {
    this.generationProgress.delete(resumeId);
  }

  private setProgress(resumeId: string, data: { total: number; generated: number; message: string }) {
    this.generationProgress.set(resumeId, { ...data, expiresAt: Date.now() + 5 * 60 * 1000 });
    // Auto-cleanup after 5 minutes to prevent memory leaks
    setTimeout(() => this.generationProgress.delete(resumeId), 5 * 60 * 1000);
  }
  async createSession(userId: string, resumeId: string, participantId?: string) {
    // Verify resume belongs to user and is parsed
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId, status: 'PARSED' },
      include: {
        resumeSkills: {
          include: { skill: true },
        },
      },
    });

    if (!resume) {
      throw new AppError('Resume not found or not yet parsed', 404);
    }

    if (resume.resumeSkills.length === 0) {
      throw new AppError('No skills found in resume. Please upload a different resume.', 400);
    }

    // Select top 5 skills. Sort candidate skills by level and experience first
    let sortedSkills = [...resume.resumeSkills].sort((a, b) => {
      const levelMap: Record<string, number> = { 'EXPERT': 3, 'INTERMEDIATE': 2, 'BEGINNER': 1 };
      const levelDiff = levelMap[b.claimedLevel] - levelMap[a.claimedLevel];
      if (levelDiff !== 0) return levelDiff;
      return (b.yearsExperience || 0) - (a.yearsExperience || 0);
    }).map(rs => ({ skill: rs.skill, claimedLevel: rs.claimedLevel }));

    let timeLimitSecs = 3600;

    // If joining a room, forcefully inject room-specific skills the recruiter uploaded questions for
    if (participantId) {
      const participant = await prisma.roomParticipant.findUnique({ 
          where: { id: participantId },
          include: { room: true } 
      });
      if (participant) {
        if (participant.room.durationLimit) {
            timeLimitSecs = participant.room.durationLimit * 60;
        }

        const roomSkillsRaw = await prisma.question.findMany({
          where: { roomId: participant.roomId, source: 'RECRUITER', isActive: true },
          select: { skillId: true, skill: true },
          distinct: ['skillId']
        });

        const roomSkillIds = new Set(roomSkillsRaw.map(r => r.skillId));
        
        // Build recruiter prioritized list
        const recruiterSkills = roomSkillsRaw.map(r => {
          const existing = sortedSkills.find(s => s.skill.id === r.skillId);
          return { skill: r.skill, claimedLevel: existing ? existing.claimedLevel : 'INTERMEDIATE' };
        });

        // Filter out recruiter skills from candidate's general pile so we don't duplicate
        const filteredCandidateSkills = sortedSkills.filter(s => !roomSkillIds.has(s.skill.id));
        
        // Merge with recruiter skills ALWAYS at the top
        sortedSkills = [...recruiterSkills, ...filteredCandidateSkills];
      }
    }

    // Cap to top 5 skills to stay within rate limits and provide a reasonably sized assessment
    sortedSkills = sortedSkills.slice(0, 5);

    const selectedSkillIds = sortedSkills.map(s => s.skill.id);

    // Check if a session already exists for this participant to avoid duplicates
    if (participantId) {
      const existingRoomSession = await prisma.assessmentSession.findFirst({
        where: { userId, participantId }
      });
      if (existingRoomSession) return existingRoomSession;
    }

    // Create session
    const session = await prisma.assessmentSession.create({
      data: {
        userId,
        resumeId,
        participantId,
        status: 'PENDING',
        timeLimitSecs,
        selectedSkills: selectedSkillIds,
      },
    });

    // Generate questions for selected skills (targeting 10 total)
    let dynamicPoolTotal = 0;
    const questionsPerSkill = Math.floor(10 / sortedSkills.length);
    const remaining = 10 % sortedSkills.length;
    sortedSkills.forEach((_, index) => {
      const base = questionsPerSkill + (index < remaining ? 1 : 0);
      dynamicPoolTotal += Math.floor(base * 1.5);
    });

    this.setProgress(resumeId, { total: dynamicPoolTotal, generated: 0, message: 'Initializing AI models...' });

    // Launch generation in background (do not await)
    this.generateQuestionsForSession(session.id, sortedSkills, 10, resumeId, dynamicPoolTotal)
      .catch(err => {
        logger.error(`Background question generation failed for session ${session.id}:`, err);
        if (resumeId) {
          const current = this.generationProgress.get(resumeId);
          if (current) this.setProgress(resumeId, { ...current, message: 'Generation failed' });
        }
      });

    return session;
  }

  private async generateQuestionsForSession(
    sessionId: string,
    resumeSkills: Array<{ skill: { id: string; name: string }; claimedLevel: string }>,
    targetTotal: number,
    resumeId?: string,
    dynamicPoolTotal?: number
  ) {
    const questionsPerSkill = Math.floor(targetTotal / resumeSkills.length);
    const remaining = targetTotal % resumeSkills.length;

    // Use a concurrency limit to avoid hitting AI rate limits too hard (e.g., 3 at a time)
    const CONCURRENCY_LIMIT = 3;
    const skillsToProcess = [...resumeSkills];
    
    const processSkill = async (rs: typeof resumeSkills[0], index: number) => {
      const baseCount = questionsPerSkill + (index < remaining ? 1 : 0);
      const dynamicPoolCount = Math.floor(baseCount * 1.5);
      const level = rs.claimedLevel as 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';

      try {
        const totalExistingMCQs = await prisma.question.count({
          where: { skillId: rs.skill.id, type: 'MCQ', isActive: true, source: { in: ['AI_GENERATED', 'MANUAL'] } },
        });

        if (totalExistingMCQs >= this.SKIP_AI_THRESHOLD) {
          logger.info(`Skipping AI: sufficient DB pool (${totalExistingMCQs} MCQs) for skill: ${rs.skill.name}`);
          return;
        }

        const newMcqsNeeded = Math.max(0, dynamicPoolCount - totalExistingMCQs);
        const existingSubjective = await prisma.question.findFirst({
          where: { skillId: rs.skill.id, type: 'SUBJECTIVE', isActive: true },
        });

        if (newMcqsNeeded > 0 || !existingSubjective) {
          if (resumeId) {
            const current = this.generationProgress.get(resumeId);
            if (current) this.setProgress(resumeId, { ...current, message: `Generating questions for ${rs.skill.name}...` });
          }

          // Generate questions
          const result = await questionGenerator.generateCombined(rs.skill.name, level, newMcqsNeeded > 0 ? newMcqsNeeded : 1, 1);
          
          if (result && result.mcqs && result.mcqs.length > 0 && newMcqsNeeded > 0) {
            const mcqData = result.mcqs.map((mcq: any) => ({
              skillId: rs.skill.id,
              type: 'MCQ' as const,
              difficulty: mcq.difficulty,
              promptText: mcq.promptText,
              options: mcq.options,
              correctOption: mcq.options.findIndex((o: any) => o.isCorrect),
              source: 'AI_GENERATED' as const,
            }));
            await prisma.question.createMany({ data: mcqData });
          }

          if (result && result.subjective && result.subjective.length > 0 && !existingSubjective) {
            const subj = result.subjective[0] as any;
            await prisma.question.create({
              data: {
                skillId: rs.skill.id,
                type: 'SUBJECTIVE' as const,
                difficulty: subj.difficulty,
                promptText: subj.promptText,
                options: { idealAnswer: subj.idealAnswer, keyPoints: subj.keyPoints },
                source: 'AI_GENERATED' as const,
              }
            });
          }
        }
      } catch (err) {
        logger.error(`Failed to generate questions for skill ${rs.skill.name}:`, err);
      } finally {
        if (resumeId) {
          const current = this.generationProgress.get(resumeId);
          if (current) {
            this.setProgress(resumeId, { 
              ...current, 
              generated: Math.min(current.generated + dynamicPoolCount, dynamicPoolTotal || current.total)
            });
          }
        }
      }
    };

    // Process in batches
    for (let i = 0; i < skillsToProcess.length; i += CONCURRENCY_LIMIT) {
      const batch = skillsToProcess.slice(i, i + CONCURRENCY_LIMIT).map((rs, batchIdx) => 
        processSkill(rs, i + batchIdx)
      );
      await Promise.all(batch);
    }

    if (resumeId) {
        const current = this.generationProgress.get(resumeId);
        if (current) this.setProgress(resumeId, { ...current, message: 'Complete', generated: dynamicPoolTotal || current.total });
    }
  }

  async saveSnapshot(sessionId: string, userId: string, imageUrl: string) {
    const session = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId, status: 'IN_PROGRESS' },
    });

    if (!session) {
      throw new AppError('Session not found or not in progress', 404);
    }

    return prisma.assessmentSnapshot.create({
      data: {
        sessionId,
        imageUrl,
      },
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        resume: {
          include: {
            resumeSkills: {
              include: { skill: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    const selectedSkillsParam = (session.selectedSkills as string[]) || [];

    const skillsList = await prisma.skill.findMany({
      where: { id: { in: selectedSkillsParam } }
    });

    const populatedSkills = selectedSkillsParam.map(skillId => {
      const skill = skillsList.find(s => s.id === skillId)!;
      const resSkill = session.resume.resumeSkills.find(rs => rs.skillId === skillId);
      return {
        skill: skill,
        claimedLevel: resSkill ? resSkill.claimedLevel : 'INTERMEDIATE'
      };
    }).filter(s => s.skill);

    // Determine how many questions per skill originally targeted
    const resumeSkillsCount = populatedSkills.length || 1;
    const targetTotal = 10;
    const baseQuestionsPerSkill = Math.floor(targetTotal / resumeSkillsCount);
    const remaining = targetTotal % resumeSkillsCount;

    // Fetch questions mapped by skill
    const questionsBySkill: Record<string, any> = {};

    for (const [index, rs] of populatedSkills.entries()) {
      // Dynamic Pool Request
      const countForThisSkill = baseQuestionsPerSkill + (index < remaining ? 1 : 0);
      const dynamicPoolCount = Math.floor(countForThisSkill * 1.5);

      let mcqs = await prisma.question.findMany({
        where: {
          skillId: rs.skill.id,
          type: 'MCQ',
          isActive: true,
          // Only standard questions (not recruiter QB — those are fetched separately)
          source: { in: ['AI_GENERATED', 'MANUAL'] },
        },
        take: dynamicPoolCount,
        orderBy: { createdAt: 'asc' },
      });

      // Inject recruiter QB questions if this session belongs to a room
      if (session.participantId) {
        const participant = await prisma.roomParticipant.findUnique({
          where: { id: session.participantId },
          select: { roomId: true },
        });
        if (participant?.roomId) {
          const recruiterQs = await prisma.question.findMany({
            where: {
              skillId: rs.skill.id,
              type: 'MCQ',
              isActive: true,
              source: QuestionSource.RECRUITER,
              roomId: participant.roomId,
            },
          });
          // Prepend recruiter questions so they are always served first
          if (recruiterQs.length > 0) {
            logger.info(`Injecting ${recruiterQs.length} recruiter QB questions for skill ${rs.skill.name} in room ${participant.roomId}`);
            mcqs = [...recruiterQs, ...mcqs.slice(0, Math.max(dynamicPoolCount - recruiterQs.length, 0))];
          }
        }
      }

      // If pool is below target for this skill, attempt to fill it
      if (mcqs.length < countForThisSkill) {
        logger.info(`Pool below target for skill ${rs.skill.name} (${mcqs.length}/${countForThisSkill}), attempting to fill...`);
        try {
          const level = rs.claimedLevel as 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
          const result = await questionGenerator.generateCombined(rs.skill.name, level, dynamicPoolCount, 1);
          if (result && result.mcqs && result.mcqs.length > 0) {
            const mcqData = result.mcqs.map((mcq: any) => ({
              skillId: rs.skill.id,
              type: 'MCQ' as const,
              difficulty: mcq.difficulty,
              promptText: mcq.promptText,
              options: mcq.options,
              correctOption: mcq.options.findIndex((o: any) => o.isCorrect),
              source: 'AI_GENERATED' as const,
            }));
            await prisma.question.createMany({ data: mcqData });
            mcqs = await prisma.question.findMany({
              where: { skillId: rs.skill.id, type: 'MCQ', isActive: true },
              take: dynamicPoolCount,
            });
            logger.info(`Regenerated ${mcqs.length} questions for skill ${rs.skill.name}`);
          }
          if (result && result.subjective && result.subjective.length > 0) {
            const subj = result.subjective[0] as any;
            await prisma.question.create({
              data: {
                skillId: rs.skill.id,
                type: 'SUBJECTIVE' as const,
                difficulty: subj.difficulty,
                promptText: subj.promptText,
                options: { idealAnswer: subj.idealAnswer }, // Store ideal answer in options json
                source: 'AI_GENERATED' as const,
              }
            });
          }
        } catch (err) {
          logger.error(`On-demand question regeneration failed for ${rs.skill.name}:`, err);
        }
      }

      const subjective = await prisma.question.findMany({
        where: { skillId: rs.skill.id, type: 'SUBJECTIVE', isActive: true },
        take: 1,
      });

      // Only add +1 for subjective if one actually exists (fixes off-by-one when generation fails)
      const hasSubjective = subjective.length > 0;

      // Shuffle the MCQs so candidates get a unique order
      for (let i = mcqs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mcqs[i], mcqs[j]] = [mcqs[j], mcqs[i]];
      }

      questionsBySkill[rs.skill.id] = {
        skillName: rs.skill.name,
        targetCount: countForThisSkill + (hasSubjective ? 1 : 0),
        mcqs: mcqs.map((q: any) => ({
          id: q.id,
          promptText: q.promptText,
          options: Array.isArray(q.options) ? (q.options as any[]).map((o: any) => ({ text: o.text })) : [], // Hide correct answer
          difficulty: q.difficulty,
        })),
        subjective: subjective.map((q: any) => ({
          id: q.id,
          promptText: q.promptText,
          difficulty: q.difficulty,
          // Not sending the ideal answer to the client!
        }))
      };
    }

    return {
      ...session,
      questionsBySkill,
      targetTotal,
      answeredCount: await prisma.sessionAnswer.count({
        where: { sessionId },
      }),
    };
  }

  async startSession(sessionId: string, userId: string) {
    const session = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    if (session.status === 'IN_PROGRESS') {
      return session; // Already started, return gracefully
    }

    if (session.status !== 'PENDING') {
      throw new AppError(`Cannot start session with status: ${session.status}`, 400);
    }

    return prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    questionId: string,
    answer?: string,
    selectedOption?: number
  ) {
    const session = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId, status: 'IN_PROGRESS' },
    });

    if (!session) {
      throw new AppError('Session not found or not in progress', 404);
    }

    // Check time limit
    if (session.startedAt) {
      const elapsed = (Date.now() - session.startedAt.getTime()) / 1000;
      if (elapsed > session.timeLimitSecs) {
        await this.completeSession(sessionId, userId, true);
        throw new AppError('Time limit exceeded', 400);
      }
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new AppError('Question not found', 404);
    }

    // For MCQ, check if correct
    let isCorrect: boolean | null = null;
    if (question.type === 'MCQ' && selectedOption !== undefined) {
      isCorrect = selectedOption === question.correctOption;
    }

    return prisma.sessionAnswer.upsert({
      where: {
        sessionId_questionId: { sessionId, questionId },
      },
      update: {
        candidateAnswer: answer,
        selectedOption,
        isCorrect,
      },
      create: {
        sessionId,
        questionId,
        candidateAnswer: answer,
        selectedOption,
        isCorrect,
      },
    });
  }

  async logViolation(sessionId: string, userId: string, type: 'TAB_SWITCH' | 'OTHER') {
    const session = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId, status: 'IN_PROGRESS' },
    });

    if (!session) {
      throw new AppError('Session not found or not in progress', 404);
    }

    return prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        // TAB_SWITCH increments tabSwitchCount, all other violations increment violationCount
        tabSwitchCount: type === 'TAB_SWITCH' ? { increment: 1 } : undefined,
        violationCount: type !== 'TAB_SWITCH' ? { increment: 1 } : undefined,
      },
    });
  }

  async completeSession(sessionId: string, userId: string, timedOut: boolean = false) {
    const session = await prisma.assessmentSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        sessionAnswers: {
          include: {
            question: {
              include: { skill: true },
            },
          },
        },
        resume: {
          include: {
            resumeSkills: {
              include: { skill: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session not found', 404);
    }

    await this.evaluateSubjectiveAnswers(session.sessionAnswers);

    // Calculate scores
    await this.calculateSessionScores(session);

    // Update session status
    return prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        status: timedOut ? 'TIMED_OUT' : 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  private async evaluateSubjectiveAnswers(answers: any[]) {
    // We only care about SUBJECTIVE questions
    const subjectiveAnswers = answers.filter(a => a.question.type === 'SUBJECTIVE' && a.candidateAnswer);
    if (subjectiveAnswers.length === 0) return;

    // Dynamically import to avoid circular dependencies if any, and grab standard instances
    const { langchainAiClient } = await import('../../shared/ai/langchain.client');
    const { ANSWER_EVALUATION_SYSTEM, ANSWER_EVALUATION_USER } = await import('../../shared/ai/prompts/answer-eval.prompt');
    const { z } = await import('zod');
    const { SystemMessage, HumanMessage } = await import('@langchain/core/messages');

    const evalSchema = z.object({
      score: z.number().min(0).max(10),
      feedback: z.string(),
      strengths: z.array(z.string()),
      improvements: z.array(z.string())
    });

    const structuredLlm = (langchainAiClient as any).withStructuredOutput(evalSchema);

    // Process each subjective answer
    const evalPromises = subjectiveAnswers.map(async (answer) => {
      try {
        const options = answer.question.options as any;
        const keyPoints = options?.keyPoints || [options?.idealAnswer].filter(Boolean);

        const messages = [
          new SystemMessage(ANSWER_EVALUATION_SYSTEM),
          new HumanMessage(ANSWER_EVALUATION_USER(answer.question.promptText, keyPoints, answer.candidateAnswer))
        ];

        logger.info(`Evaluating subjective answer for question ${answer.questionId}`);
        const result = await structuredLlm.invoke(messages) as any;

        const score = result.score;
        const feedback = result.feedback;

        // Save back to DB
        await prisma.sessionAnswer.update({
          where: { id: answer.id },
          data: {
            aiEvalScore: score,
            aiEvalFeedback: feedback
          }
        });

        logger.info(`Evaluated subjective answer ${answer.id}: Score ${score}`);

      } catch (err) {
        logger.error(`Failed to evaluate subjective answer ${answer.id}:`, err);
      }
    });

    await Promise.all(evalPromises);
  }

  private async calculateSessionScores(session: any) {
    // Group answers by skill
    const skillAnswers: Record<string, {
      mcqCorrect: number;
      mcqTotal: number;
      subjectiveScores: number[];
      claimedLevel: string;
    }> = {};

    for (const rs of session.resume.resumeSkills) {
      skillAnswers[rs.skill.id] = {
        mcqCorrect: 0,
        mcqTotal: 0,
        subjectiveScores: [],
        claimedLevel: rs.claimedLevel,
      };
    }

    for (const answer of session.sessionAnswers) {
      const skillId = answer.question.skillId;
      if (!skillAnswers[skillId]) continue;

      if (answer.question.type === 'MCQ') {
        skillAnswers[skillId].mcqTotal++;
        if (answer.isCorrect) {
          skillAnswers[skillId].mcqCorrect++;
        }
      } else if (answer.aiEvalScore !== null) {
        skillAnswers[skillId].subjectiveScores.push(answer.aiEvalScore);
      }
    }

    // Calculate and save skill scores
    const skillScoreResults: Array<{
      skillId: string;
      truthScore: number;
      claimedLevel: string;
    }> = [];

    // Parallelize skill score calculations and database upserts
    const scoreTasks = Object.entries(skillAnswers).map(async ([skillId, data]) => {
      const result = calculateSkillTruthScore({
        mcqCorrect: data.mcqCorrect,
        mcqTotal: data.mcqTotal,
        subjectiveScores: data.subjectiveScores,
        claimedLevel: data.claimedLevel as any,
      });

      await prisma.skillScore.upsert({
        where: {
          sessionId_skillId: { sessionId: session.id, skillId },
        },
        update: {
          mcqScore: result.mcqScore,
          subjScore: result.subjectiveScore,
          truthScore: result.truthScore,
        },
        create: {
          sessionId: session.id,
          skillId,
          mcqScore: result.mcqScore,
          subjScore: result.subjectiveScore,
          truthScore: result.truthScore,
        },
      });

      return {
        skillId,
        truthScore: result.truthScore,
        claimedLevel: data.claimedLevel,
      };
    });

    const results = await Promise.all(scoreTasks);
    skillScoreResults.push(...results);

    // Calculate overall authenticity score
    const authenticityResult = calculateAuthenticityScore({
      skillScores: skillScoreResults.map(s => ({
        ...s,
        claimedLevel: s.claimedLevel as any,
      })),
    });

    // Run final updates in parallel
    await Promise.all([
      prisma.assessmentSession.update({
        where: { id: session.id },
        data: {
          overallScore: authenticityResult.authenticityScore,
        }
      }),
      prisma.resumeTruthScore.upsert({
        where: { resumeId: session.resumeId },
        update: {
          authenticityScore: authenticityResult.authenticityScore,
          breakdown: authenticityResult.breakdown,
        },
        create: {
          resumeId: session.resumeId,
          authenticityScore: authenticityResult.authenticityScore,
          breakdown: authenticityResult.breakdown,
        },
      })
    ]);
  }

  async getSessionResult(sessionId: string, userId: string) {
    const session = await prisma.assessmentSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: { in: ['COMPLETED', 'TIMED_OUT'] },
      },
      include: {
        skillScores: {
          include: { skill: true },
        },
        resume: {
          include: {
            truthScore: true,
          },
        },
      },
    });

    if (!session) {
      throw new AppError('Session not found or not completed', 404);
    }

    return {
      sessionId: session.id,
      status: session.status,
      completedAt: session.completedAt,
      skillScores: session.skillScores.map((ss: any) => ({
        skillName: ss.skill.name,
        mcqScore: ss.mcqScore,
        subjectiveScore: ss.subjScore,
        truthScore: ss.truthScore,
      })),
      overallScore: session.resume.truthScore,
    };
  }

  async getUserSessions(userId: string) {
    return prisma.assessmentSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        resume: {
          select: { id: true, fileName: true },
        },
        _count: {
          select: { sessionAnswers: true },
        },
      },
    });
  }
}

export const assessmentService = new AssessmentService();
