import api from './axios.instance';

export interface AdminStats {
    userCount: number;
    assessmentCount: number;
    questionCount: number;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
    isActive: boolean;
    createdAt: string;
}

export const adminApi = {
    getStats: async () => {
        const response = await api.get<AdminStats>('/admin/stats');
        return response.data;
    },

    getUsers: async () => {
        const response = await api.get<UserInfo[]>('/admin/users');
        return response.data;
    },

    updateUserRole: async (id: string, role: string) => {
        const response = await api.patch(`/admin/users/${id}`, { role });
        return response.data;
    },

    getQuestions: async (skillId?: string) => {
        const params = new URLSearchParams();
        if (skillId) params.append('skillId', skillId);
        const response = await api.get<any[]>('/admin/questions?' + params.toString());
        return response.data;
    },

    deleteQuestion: async (id: string) => {
        const response = await api.delete(`/admin/questions/${id}`);
        return response.data;
    },

    getSkills: async () => {
        const response = await api.get<any[]>('/admin/skills');
        return response.data;
    },

    createSkillCategory: async (name: string, description?: string) => {
        const response = await api.post('/admin/skills', { name, description });
        return response.data;
    },

    deleteSkillCategory: async (id: string) => {
        const response = await api.delete(`/admin/skills/${id}`);
        return response.data;
    },

    getAnalytics: async () => {
        const response = await api.get<any>('/admin/analytics');
        return response.data;
    },
};
