import api from './axios.instance';

export interface Resume {
  id: string;
  fileName: string;
  status: 'UPLOADED' | 'PARSING' | 'PARSED' | 'FAILED';
  parsedAt?: string;
  createdAt: string;
  _count?: { resumeSkills: number };
}

export interface ResumeSkill {
  id: string;
  name: string;
  category: string;
  claimedLevel: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
  yearsExperience?: number;
}

export const resumeApi = {
  upload: async (file: File): Promise<{ message: string; resume: Resume }> => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await api.post('/resume/upload', formData);
    return response.data;
  },

  getAll: async (): Promise<Resume[]> => {
    const response = await api.get<Resume[]>('/resume');
    return response.data;
  },

  getById: async (id: string): Promise<Resume> => {
    const response = await api.get<Resume>(`/resume/${id}`);
    return response.data;
  },

  getSkills: async (id: string): Promise<ResumeSkill[]> => {
    const response = await api.get<ResumeSkill[]>(`/resume/${id}/skills`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/resume/${id}`);
  },
};
