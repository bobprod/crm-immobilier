import apiClient from './backend-api';

// Property data included in match results
export interface MatchProperty {
  id: string;
  title: string;
  type: string;
  category: string;
  price: number;
  currency: string;
  city?: string;
  address?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  status: string;
}

// Prospect data included in match results
export interface MatchProspect {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: string;
  status: string;
  score: number;
  budget?: {
    min?: number;
    max?: number;
  };
  preferences?: Record<string, any>;
}

export interface MatchingResult {
  id: string;
  prospectId: string;
  propertyId: string;
  score: number;
  reasons: string[];
  status?: string;
  createdAt: string;
  updatedAt?: string;
  // Relations included from backend
  properties?: MatchProperty;
  prospects?: MatchProspect;
  // Aliases for findMatchesForProspect/Property results
  property?: MatchProperty;
  prospect?: MatchProspect;
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

  // Générer tous les matchings automatiquement (persiste en base)
  generateAllMatches: async (): Promise<MatchingResult[]> => {
    const response = await apiClient.post('/matching/generate');
    return response.data;
  },

  // Mettre à jour le statut d'un match
  updateMatchStatus: async (id: string, status: string): Promise<MatchingResult> => {
    const response = await apiClient.put(`/matching/${id}/status`, { status });
    return response.data;
  },

  // Effectuer une action sur un match (ex: créer RDV)
  performAction: async (id: string, action: any): Promise<any> => {
    const response = await apiClient.post(`/matching/${id}/action`, action);
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
