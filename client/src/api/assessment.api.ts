import api from './axios.instance';

export interface AssessmentSession {
  id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMED_OUT' | 'ABANDONED';
  timeLimitSecs: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  resumeId: string;
  selectedSkills?: string[];
  resume?: { fileName: string };
  _count?: { sessionAnswers: number };
}

export interface Question {
  id: string;
  promptText: string;
  options?: { text: string }[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface SessionDetail extends AssessmentSession {
  questionsBySkill: Record<string, {
    skillName: string;
    targetCount: number;
    mcqs: Question[];
    subjective: Question[];
  }>;
  totalQuestions: number;
  answeredCount: number;
}

export interface SkillScore {
  skillName: string;
  mcqScore: number;
  subjectiveScore: number;
  truthScore: number;
}

export interface SessionResult {
  sessionId: string;
  status: string;
  completedAt: string;
  skillScores: SkillScore[];
  overallScore: {
    authenticityScore: number;
    breakdown: any[];
  };
}

export interface Answer {
  questionId: string;
  answer?: string;
  selectedOption?: number;
}

export const assessmentApi = {
  createSession: async (resumeId: string, participantId?: string): Promise<{ message: string; session: AssessmentSession }> => {
    const response = await api.post('/assessment/sessions', { resumeId, participantId });
    return response.data;
  },

  getCreationProgress: async (resumeId: string): Promise<{ total: number; generated: number; message: string }> => {
    const response = await api.get(`/assessment/sessions/progress/${resumeId}`);
    return response.data;
  },

  getSessions: async (): Promise<AssessmentSession[]> => {
    const response = await api.get<AssessmentSession[]>('/assessment/sessions');
    return response.data;
  },

  getSession: async (id: string): Promise<SessionDetail> => {
    const response = await api.get<SessionDetail>(`/assessment/sessions/${id}`);
    return response.data;
  },

  startSession: async (id: string): Promise<{ message: string; session: AssessmentSession }> => {
    const response = await api.post(`/assessment/sessions/${id}/start`);
    return response.data;
  },

  submitAnswers: async (id: string, answers: Answer[]): Promise<void> => {
    await api.post(`/assessment/sessions/${id}/answers`, { answers });
  },

  completeSession: async (id: string): Promise<{ message: string; session: AssessmentSession }> => {
    const response = await api.post(`/assessment/sessions/${id}/complete`);
    return response.data;
  },

  getResult: async (id: string): Promise<SessionResult> => {
    const response = await api.get<SessionResult>(`/assessment/sessions/${id}/result`);
    return response.data;
  },

  logViolation: async (id: string, type: 'TAB_SWITCH' | 'OTHER'): Promise<void> => {
    await api.post(`/assessment/sessions/${id}/violation`, { type });
  },

  uploadSnapshot: async (id: string, imageUrl: string): Promise<void> => {
    await api.post(`/assessment/sessions/${id}/snapshots`, { imageUrl });
  },
};
