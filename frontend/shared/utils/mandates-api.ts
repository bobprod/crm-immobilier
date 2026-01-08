/**
 * Service API pour la gestion des mandats immobiliers
 * Architecture DDD - Module Business/Mandates
 */

import apiClient from './backend-api';

/**
 * Interfaces de types pour les mandats
 */
export interface Mandate {
  id: string;
  userId: string;
  reference: string;
  type: 'exclusive' | 'simple' | 'semi_exclusive';
  category: 'sale' | 'rental';
  ownerId: string;
  propertyId?: string;
  startDate: string;
  endDate: string;
  commission: number;
  commissionType: 'percentage' | 'fixed';
  exclusivityBonus?: number;
  terms?: string;
  status: 'active' | 'expired' | 'completed' | 'cancelled';
  cancelledAt?: string;
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  property?: {
    id: string;
    title: string;
    reference?: string;
    price?: number;
    city?: string;
  };
  _count?: {
    transactions: number;
  };
}

export interface CreateMandateData {
  reference: string;
  type: 'exclusive' | 'simple' | 'semi_exclusive';
  category: 'sale' | 'rental';
  ownerId: string;
  propertyId?: string;
  startDate: string;
  endDate: string;
  commission: number;
  commissionType: 'percentage' | 'fixed';
  exclusivityBonus?: number;
  terms?: string;
  notes?: string;
}

export interface UpdateMandateData extends Partial<CreateMandateData> {
  status?: 'active' | 'expired' | 'completed' | 'cancelled';
  notes?: string;
}

export interface MandateFilters {
  status?: string;
  type?: string;
  category?: string;
  ownerId?: string;
  propertyId?: string;
  expiringInDays?: number;
}

export interface MandateStats {
  total: number;
  active: number;
  expired: number;
  exclusive: number;
  expiringSoon: number;
}

/**
 * API Client pour les mandats
 */
export const mandatesAPI = {
  /**
   * Liste tous les mandats avec filtres optionnels
   */
  list: async (filters?: MandateFilters): Promise<Mandate[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const query = params.toString();
    const url = `/api/business/mandates${query ? `?${query}` : ''}`;
    const response = await apiClient.get<Mandate[]>(url);
    return response.data;
  },

  /**
   * Récupère un mandat par son ID
   */
  getById: async (id: string): Promise<Mandate> => {
    const response = await apiClient.get<Mandate>(`/api/business/mandates/${id}`);
    return response.data;
  },

  /**
   * Crée un nouveau mandat
   */
  create: async (data: CreateMandateData): Promise<Mandate> => {
    const response = await apiClient.post<Mandate>('/api/business/mandates', data);
    return response.data;
  },

  /**
   * Met à jour un mandat existant
   */
  update: async (id: string, data: UpdateMandateData): Promise<Mandate> => {
    const response = await apiClient.patch<Mandate>(`/api/business/mandates/${id}`, data);
    return response.data;
  },

  /**
   * Supprime un mandat
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/business/mandates/${id}`);
  },

  /**
   * Annule un mandat
   */
  cancel: async (id: string, reason: string): Promise<Mandate> => {
    const response = await apiClient.post<Mandate>(`/api/business/mandates/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Récupère les statistiques des mandats
   */
  getStats: async (): Promise<MandateStats> => {
    const response = await apiClient.get<MandateStats>('/api/business/mandates/stats');
    return response.data;
  },

  /**
   * Vérifie les mandats expirés
   */
  checkExpired: async (): Promise<Mandate[]> => {
    const response = await apiClient.post<Mandate[]>('/api/business/mandates/check-expired', {});
    return response.data;
  },
};
