/**
 * Service API pour la gestion des mandats immobiliers
 * Architecture DDD - Module Business/Mandates
 */

import apiClient from './api-client';

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
    return apiClient.get<Mandate[]>(url);
  },

  /**
   * Récupère un mandat par son ID
   */
  getById: async (id: string): Promise<Mandate> => {
    return apiClient.get<Mandate>(`/api/business/mandates/${id}`);
  },

  /**
   * Crée un nouveau mandat
   */
  create: async (data: CreateMandateData): Promise<Mandate> => {
    return apiClient.post<Mandate>('/api/business/mandates', data);
  },

  /**
   * Met à jour un mandat existant
   */
  update: async (id: string, data: UpdateMandateData): Promise<Mandate> => {
    return apiClient.patch<Mandate>(`/api/business/mandates/${id}`, data);
  },

  /**
   * Supprime un mandat
   */
  delete: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/business/mandates/${id}`);
  },

  /**
   * Annule un mandat
   */
  cancel: async (id: string, reason: string): Promise<Mandate> => {
    return apiClient.post<Mandate>(`/api/business/mandates/${id}/cancel`, { reason });
  },

  /**
   * Récupère les statistiques des mandats
   */
  getStats: async (): Promise<MandateStats> => {
    return apiClient.get<MandateStats>('/api/business/mandates/stats');
  },

  /**
   * Vérifie les mandats expirés
   */
  checkExpired: async (): Promise<Mandate[]> => {
    return apiClient.post<Mandate[]>('/api/business/mandates/check-expired', {});
  },
};
