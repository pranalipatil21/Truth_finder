import prisma from '../../config/database';
import { aiClient } from '../../shared/ai/ai.client';
import { SKILL_EXTRACTION_SYSTEM } from '../../shared/ai/prompts/skill-extraction.prompt';
import { deleteFile } from './resume.parser';
import { ExtractedSkill, SkillExtractionResult } from './resume.dto';
import { AppError } from '../../middleware/error.middleware';
import logger from '../../config/logger';

export class ResumeService {
  async uploadResume(userId: string, file: Express.Multer.File) {
    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        userId,
        fileName: file.originalname,
        filePath: file.path,
        status: 'UPLOADED',
      },
    });

    // Start async parsing
    this.parseResumeAsync(resume.id, file.path, file.mimetype).catch(err => {
      logger.error(`Failed to parse resume ${resume.id}:`, err);
    });

    return resume;
  }

  private async parseResumeAsync(resumeId: string, filePath: string, _mimeType: string) {
    try {
      // 1. Check if resume still exists (sanity check)
      const initialResume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (!initialResume) {
        logger.warn(`Parsing aborted: Resume ${resumeId} no longer exists in database.`);
        await deleteFile(filePath);
        return;
      }

      // 2. Update status to parsing
      await prisma.resume.update({
        where: { id: resumeId },
        data: { status: 'PARSING' },
      });

      // 3. Extract text locally from PDF/DOCX
      const { extractTextFromFile } = await import('./resume.parser');
      const text = await extractTextFromFile(filePath);

      // 4. Save raw text to database
      await prisma.resume.update({
        where: { id: resumeId },
        data: { rawText: text },
      });

      // 5. Extract skills using AI with the parsed text
      const extractedSkills = await this.extractSkillsWithAi(text);
      logger.info(`Extracted ${extractedSkills.length} skills for resume ${resumeId}`);

      // 6. Get or create skills in database
      await this.saveExtractedSkills(resumeId, extractedSkills);

      // 7. Update resume status to PARSED
      // Re-verify existence before final update
      const finalResume = await prisma.resume.findUnique({ where: { id: resumeId } });
      if (finalResume) {
        await prisma.resume.update({
          where: { id: resumeId },
          data: {
            status: 'PARSED',
            parsedAt: new Date(),
          },
        });
      }

      // 8. Delete temp file
      await deleteFile(filePath);

    } catch (error) {
      logger.error(`Resume parsing failed for ${resumeId}:`, error);

      try {
        // Try to update status to FAILED only if record still exists
        const exists = await prisma.resume.findUnique({ where: { id: resumeId } });
        if (exists) {
          await prisma.resume.update({
            where: { id: resumeId },
            data: { status: 'FAILED' },
          });
        }
      } catch (innerError) {
        logger.error(`Failed to update resume status to FAILED for ${resumeId}:`, innerError);
      }

      await deleteFile(filePath);
    }
  }

  private async extractSkillsWithAi(resumeText: string): Promise<ExtractedSkill[]> {
    const result = await aiClient.chatJson<SkillExtractionResult>({
      messages: [
        { role: 'system', content: SKILL_EXTRACTION_SYSTEM },
        { role: 'user', content: `Extract technical skills from the following resume:\n\n${resumeText}` },
      ],
      temperature: 0.1,
    });

    return result.skills || [];
  }

  private async saveExtractedSkills(resumeId: string, skills: ExtractedSkill[]) {
    try {
      // Parallelize category and skill creation/upsert
      const skillTasks = skills.map(async (skill) => {
        const category = await prisma.skillCategory.upsert({
          where: { name: skill.category },
          update: {},
          create: { name: skill.category },
        });

        const dbSkill = await prisma.skill.upsert({
          where: { name: skill.name },
          update: { categoryId: category.id },
          create: {
            name: skill.name,
            categoryId: category.id
          },
        });

        await prisma.resumeSkill.upsert({
          where: {
            resumeId_skillId: {
              resumeId,
              skillId: dbSkill.id,
            },
          },
          update: {
            claimedLevel: skill.claimedLevel,
            yearsExperience: skill.yearsExperience,
          },
          create: {
            resumeId,
            skillId: dbSkill.id,
            claimedLevel: skill.claimedLevel,
            yearsExperience: skill.yearsExperience,
          },
        });
      });

      await Promise.all(skillTasks);
    } catch (err) {
      logger.error(`Failed to save skills:`, err);
      throw err;
    }
  }

  async getResume(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      include: {
        resumeSkills: {
          include: {
            skill: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    return resume;
  }

  async getResumeSkills(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    const skills = await prisma.resumeSkill.findMany({
      where: { resumeId },
      include: {
        skill: {
          include: {
            category: true,
          },
        },
      },
    });

    return skills.map(rs => ({
      id: rs.skill.id,
      name: rs.skill.name,
      category: rs.skill.category.name,
      claimedLevel: rs.claimedLevel,
      yearsExperience: rs.yearsExperience,
    }));
  }

  async getUserResumes(userId: string) {
    return prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { resumeSkills: true },
        },
      },
    });
  }

  async deleteResume(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!resume) {
      throw new AppError('Resume not found', 404);
    }

    // Delete file if exists
    if (resume.filePath) {
      await deleteFile(resume.filePath);
    }

    await prisma.resume.delete({
      where: { id: resumeId },
    });

    return { message: 'Resume deleted successfully' };
  }
}

export const resumeService = new ResumeService();
