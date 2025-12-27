import apiClient from './backend-api';

export interface MatchingResult {
  id: string;
  prospectId: string;
  propertyId: string;
  score: number;
  reasons: string[];
  createdAt: string;
}

export interface MatchingStats {
  total: number;
  excellent: number;
  good: number;
  average: number;
  avgScore: number;
}

export interface MatchingFilters {
  minScore?: number;
  propertyType?: string;
  location?: string;
}

export const matchingAPI = {
  // Obtenir tous les matchings
  getAllMatches: async (): Promise<MatchingResult[]> => {
    const response = await apiClient.get('/matching');
    return response.data;
  },

  // Obtenir matchings d'un prospect
  getProspectMatches: async (prospectId: string): Promise<MatchingResult[]> => {
    const response = await apiClient.get(`/matching/prospect/${prospectId}`);
    return response.data;
  },

  // Obtenir matchings d'une propriété
  getPropertyMatches: async (propertyId: string): Promise<MatchingResult[]> => {
    const response = await apiClient.get(`/matching/property/${propertyId}`);
    return response.data;
  },

  // Créer un matching manuel
  createMatch: async (prospectId: string, propertyId: string): Promise<MatchingResult> => {
    const response = await apiClient.post('/matching', { prospectId, propertyId });
    return response.data;
  },

  // Obtenir les stats de matching
  getStats: async (): Promise<MatchingStats> => {
    const response = await apiClient.get('/matching/stats');
    return response.data;
  },

  // Supprimer un matching
  deleteMatch: async (id: string): Promise<void> => {
    await apiClient.delete(`/matching/${id}`);
  },

  // Trouver des matchings pour un prospect avec filtres
  findMatches: async (prospectId: string, filters?: MatchingFilters): Promise<MatchingResult[]> => {
    const response = await apiClient.post(`/matching/find/${prospectId}`, filters);
    return response.data;
  },

  // Trouver des matchings pour une propriété avec filtres
  findMatchesForProperty: async (
    propertyId: string,
    filters?: MatchingFilters
  ): Promise<MatchingResult[]> => {
    const response = await apiClient.post(`/matching/find-property/${propertyId}`, filters);
    return response.data;
  },
};
