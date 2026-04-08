export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  provider?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Resume {
  id: string;
  fileName: string;
  status: 'UPLOADED' | 'PARSING' | 'PARSED' | 'FAILED';
  parsedAt?: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;
  claimedLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  yearsExperience?: number;
}

export interface Question {
  id: string;
  type: 'MCQ' | 'SUBJECTIVE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  promptText: string;
  options?: { text: string; isCorrect?: boolean }[];
}

export interface AssessmentSession {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'ABANDONED';
  timeLimitSecs: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface SkillScore {
  skillId: string;
  skillName: string;
  mcqScore?: number;
  subjScore?: number;
  truthScore: number;
}

export interface TruthScore {
  authenticityScore: number;
  breakdown: SkillScore[];
  computedAt: string;
}
