import { z } from 'zod';

export const createSessionSchema = z.object({
  resumeId: z.string(),
  participantId: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string().optional(),
  selectedOption: z.number().optional(),
});

export const submitAnswersSchema = z.object({
  answers: z.array(submitAnswerSchema),
});

export interface GeneratedMCQ {
  promptText: string;
  options: { text: string; isCorrect: boolean }[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface GeneratedSubjective {
  promptText: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  idealAnswer: string;
  keyPoints: string[];
}

export interface MCQGenerationResult {
  questions: GeneratedMCQ[];
}

export interface SubjectiveGenerationResult {
  questions: GeneratedSubjective[];
}

export interface CombinedGenerationResult {
  mcqs: GeneratedMCQ[];
  subjective: GeneratedSubjective[];
}

export interface AnswerEvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}
