import { z } from 'zod';

export const uploadResumeSchema = z.object({
  // File is handled by multer
});

export interface ExtractedSkill {
  name: string;
  category: 'programming_language' | 'framework' | 'database' | 'cloud' | 'tool' | 'soft_skill';
  claimedLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  yearsExperience: number | null;
}

export interface SkillExtractionResult {
  skills: ExtractedSkill[];
}
