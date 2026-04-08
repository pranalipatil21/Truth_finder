import api from './axios.instance';

export interface Candidate {
    id: string;
    name: string;
    email: string;
    latestResumeId?: string;
    truthScore?: number;
    skills: string[];
}

export interface CandidateDetails extends Candidate {
    resume: {
        id: string;
        fileName: string;
        truthScore: any;
        skills: Array<{
            name: string;
            category: string;
            claimedLevel: string;
            yearsExperience: number;
        }>;
        lastAssessment: {
            id: string;
            status: string;
            timeLimitSecs: number;
            tabSwitchCount: number;
            violationCount: number;
            snapshots: Array<{
                id: string;
                imageUrl: string;
                capturedAt: string;
            }>;
            skillScores: any[];
        } | null;
    } | null;
}

export const recruiterApi = {
    getCandidates: async (query?: string, skills?: string[]) => {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (skills?.length) params.append('skills', skills.join(','));

        const response = await api.get<Candidate[]>(`/recruiter/candidates?${params.toString()}`);
        return response.data;
    },

    getCandidateDetails: async (id: string) => {
        const response = await api.get<CandidateDetails>(`/recruiter/candidates/${id}`);
        return response.data;
    },

    getShortlist: async () => {
        const response = await api.get<any[]>('/recruiter/shortlist');
        return response.data;
    },

    addToShortlist: async (candidateId: string, notes?: string) => {
        const response = await api.post('/recruiter/shortlist', { candidateId, notes });
        return response.data;
    },

    removeFromShortlist: async (candidateId: string) => {
        const response = await api.delete(`/recruiter/shortlist/${candidateId}`);
        return response.data;
    },

    // ─── Question Bank ────────────────────────────────────────────────────────

    getQuestionBank: async (roomId: string) => {
        const response = await api.get<any[]>(`/recruiter/rooms/${roomId}/questions`);
        return response.data;
    },

    addQuestion: async (roomId: string, dto: {
        skillId: string;
        type: 'MCQ' | 'SUBJECTIVE';
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        promptText: string;
        options?: { text: string; isCorrect?: boolean }[];
        correctOption?: number;
    }) => {
        const response = await api.post(`/recruiter/rooms/${roomId}/questions`, dto);
        return response.data;
    },

    deleteQuestion: async (roomId: string, questionId: string) => {
        const response = await api.delete(`/recruiter/rooms/${roomId}/questions/${questionId}`);
        return response.data;
    },
};
