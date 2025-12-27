import apiClient from '@/shared/utils/backend-api';

export interface Match {
  id: string;
  propertyId: string;
  prospectId: string;
  score: number;
  reasons: {
    pros: string[];
    cons: string[];
  };
  status: 'pending' | 'accepted' | 'rejected' | 'contacted';
  createdAt: string;
  properties?: any;
  prospects?: any;
}

export interface MatchFilters {
  status?: string;
  minScore?: number;
}

const matchingService = {
  generateMatches: async () => {
    const response = await apiClient.post('/matching/generate');
    return response.data;
  },

  findAll: async (filters?: MatchFilters) => {
    const response = await apiClient.get<Match[]>('/matching', { params: filters });
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.put(`/matching/${id}/status`, { status });
    return response.data;
  },

  performAction: async (id: string, action: string) => {
    const response = await apiClient.post(`/matching/${id}/action`, { action });
    return response.data;
  },

  getInteractions: async () => {
    const response = await apiClient.get('/matching/interactions');
    return response.data;
  },
};

export default matchingService;
