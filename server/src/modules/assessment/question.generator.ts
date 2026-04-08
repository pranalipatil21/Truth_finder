import { langchainAiClient } from '../../shared/ai/langchain.client';
import { MCQ_GENERATION_SYSTEM, MCQ_GENERATION_USER } from '../../shared/ai/prompts/mcq-generation.prompt';
import { SUBJECTIVE_GENERATION_SYSTEM, SUBJECTIVE_GENERATION_USER } from '../../shared/ai/prompts/subjective-gen.prompt';
import { COMBINED_GENERATION_SYSTEM, COMBINED_GENERATION_USER } from '../../shared/ai/prompts/combined-generation.prompt';
import {
  GeneratedMCQ,
  GeneratedSubjective,
  CombinedGenerationResult
} from './assessment.dto';
import logger from '../../config/logger';
import { z } from 'zod';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

// Zod schemas for structured output
const mcqSchema = z.object({
  questions: z.array(z.object({
    promptText: z.string(),
    options: z.array(z.object({
      text: z.string(),
      isCorrect: z.boolean()
    })),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'])
  }))
});

const subjectiveSchema = z.object({
  questions: z.array(z.object({
    promptText: z.string(),
    idealAnswer: z.string(),
    keyPoints: z.array(z.string()),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'])
  }))
});

const combinedSchema = z.object({
  mcqs: z.array(z.object({
    promptText: z.string(),
    options: z.array(z.object({
      text: z.string(),
      isCorrect: z.boolean()
    })),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'])
  })),
  subjective: z.array(z.object({
    promptText: z.string(),
    idealAnswer: z.string(),
    keyPoints: z.array(z.string()),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'])
  }))
});

export class QuestionGenerator {
  async generateMCQs(
    skillName: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
    count: number = 5
  ): Promise<GeneratedMCQ[]> {
    try {
      const structuredLlm = (langchainAiClient as any).withStructuredOutput(mcqSchema);
      const messages = [
        new SystemMessage(MCQ_GENERATION_SYSTEM),
        new HumanMessage(MCQ_GENERATION_USER(skillName, level, count))
      ];

      const result = await structuredLlm.invoke(messages) as { questions: GeneratedMCQ[] };
      return result.questions || [];
    } catch (error) {
      logger.error(`MCQ generation failed for ${skillName}:`, error);
      return [];
    }
  }

  async generateSubjective(
    skillName: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
    count: number = 2
  ): Promise<GeneratedSubjective[]> {
    try {
      const structuredLlm = (langchainAiClient as any).withStructuredOutput(subjectiveSchema);
      const messages = [
        new SystemMessage(SUBJECTIVE_GENERATION_SYSTEM),
        new HumanMessage(SUBJECTIVE_GENERATION_USER(skillName, level, count))
      ];

      const result = await structuredLlm.invoke(messages) as { questions: GeneratedSubjective[] };
      return result.questions || [];
    } catch (error) {
      logger.error(`Subjective generation failed for ${skillName}:`, error);
      return [];
    }
  }

  async generateMcqs(
    skillName: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
    count: number = 10
  ): Promise<CombinedGenerationResult | null> {
    try {
      // Calculate ~33/34/33 distribution for dynamic pool
      const getDistribution = (total: number) => {
        const easy = Math.floor(total / 3);
        const hard = Math.floor(total / 3);
        const medium = total - easy - hard;
        return { easy, medium, hard };
      };

      const mcqSplit = getDistribution(count);

      const structuredLlm = (langchainAiClient as any).withStructuredOutput(combinedSchema);
      const messages = [
        new SystemMessage(COMBINED_GENERATION_SYSTEM),
        new HumanMessage(COMBINED_GENERATION_USER(
          skillName,
          level,
          mcqSplit.easy,
          mcqSplit.medium,
          mcqSplit.hard,
          1, // 1 subjective
          0,
          0
        ))
      ];

      // Added strict timeout to prevent infinite hanging
      const result = await Promise.race([
        structuredLlm.invoke(messages),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI generation timed out')), 25000))
      ]) as CombinedGenerationResult;

      return result;
    } catch (error) {
      logger.error(`Combined generation failed for ${skillName}:`, error);
      return null;
    }
  }

  async generateCombined(
    skillName: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT',
    mcqCount: number = 5,
    _subjCount: number = 2
  ): Promise<CombinedGenerationResult | null> {
    // We now request 1 subjective question to be used as a verification query
    return this.generateMcqs(skillName, level, mcqCount);
  }
}

export const questionGenerator = new QuestionGenerator();
