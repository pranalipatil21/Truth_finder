import api from './axios.instance';

export interface SkillScore {
    skillName: string;
    mcqScore: number;
    subjectiveScore: number;
    truthScore: number;
}

export interface ResumeScore {
    resumeId: string;
    fileName: string;
    overallScore: {
        authenticityScore: number;
        tier: string;
        breakdown: any[];
    } | null;
    sessions: Array<{
        sessionId: string;
        completedAt: string;
        overallScore: number | null;
        skillScores: SkillScore[];
    }>;
}

export interface CandidateOverview {
    totalResumes: number;
    completedAssessments: number;
    averageAuthenticityScore: number;
    resumes: Array<{
        id: string;
        fileName: string;
        score: number;
        status: string;
    }>;
}

export const scoringApi = {
    getResumeScore: async (resumeId: string): Promise<ResumeScore> => {
        const response = await api.get(`/scores/resume/${resumeId}`);
        return response.data;
    },

    getScoreBySession: async (sessionId: string): Promise<ResumeScore> => {
        const response = await api.get(`/scores/session/${sessionId}`);
        return response.data;
    },

    getCandidateOverview: async (): Promise<CandidateOverview> => {
        const response = await api.get('/scores/candidate/overview');
        return response.data;
    },
};
