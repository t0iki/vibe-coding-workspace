import axios from 'axios';
import { Candidate } from '@/types/candidate';
import { Evaluation, CreateEvaluation } from '@/types/evaluation';
import { EvaluationTemplate, CreateEvaluationTemplate, UpdateEvaluationTemplate } from '@/types/template';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 候補者API
export const candidatesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    source?: string;
    search?: string;
  }) => {
    const response = await api.get('/candidates', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/candidates/${id}`);
    return response.data;
  },

  create: async (data: Partial<Candidate>) => {
    const response = await api.post('/candidates', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Candidate>) => {
    const response = await api.patch(`/candidates/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/candidates/${id}`);
  },
};

// 評価API
export const evaluationsApi = {
  getByCandidate: async (candidateId: string) => {
    const response = await api.get(`/evaluations/candidate/${candidateId}`);
    return response.data;
  },

  create: async (data: CreateEvaluation) => {
    const response = await api.post('/evaluations', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateEvaluation>) => {
    const response = await api.patch(`/evaluations/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/evaluations/${id}`);
  },
};

// アップロードAPI
export const uploadApi = {
  uploadPDF: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  uploadBulk: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/upload/bulk', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },
};

// 検索API
export const searchApi = {
  searchSimilar: async (params: {
    candidateId?: string;
    text?: string;
    limit?: number;
    filters?: {
      source?: string;
      skills?: string[];
    };
  }) => {
    const response = await api.post('/search/similar', params);
    return response.data;
  },

  searchBySkills: async (params: {
    requiredSkills: string[];
    optionalSkills?: string[];
    limit?: number;
  }) => {
    const response = await api.post('/search/by-skills', params);
    return response.data;
  },
};

// マッチングAPI
export const matchingApi = {
  calculateMatch: async (candidateId: string, similarCandidatesLimit?: number) => {
    const response = await api.post(`/matching/calculate/${candidateId}`, {
      similarCandidatesLimit,
    });
    return response.data;
  },

  calculateBatch: async (candidateIds: string[], similarCandidatesLimit?: number) => {
    const response = await api.post('/matching/calculate-batch', {
      candidateIds,
      similarCandidatesLimit,
    });
    return response.data;
  },
};

// 評価テンプレートAPI
export const templatesApi = {
  getAll: async (params?: {
    position?: string;
    createdById?: string;
    isPublic?: boolean;
  }): Promise<EvaluationTemplate[]> => {
    const response = await api.get('/templates', { params });
    return response.data;
  },

  getById: async (id: string): Promise<EvaluationTemplate> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  create: async (data: CreateEvaluationTemplate): Promise<EvaluationTemplate> => {
    const response = await api.post('/templates', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEvaluationTemplate): Promise<EvaluationTemplate> => {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  duplicate: async (id: string, name: string): Promise<EvaluationTemplate> => {
    const response = await api.post(`/templates/${id}/duplicate`, { name });
    return response.data;
  },
};