import apiClient from './backend-api';

// ========== ENUMS & TYPES ==========

export enum MandateType {
  SIMPLE = 'simple',
  EXCLUSIVE = 'exclusive',
  SEMI_EXCLUSIVE = 'semi_exclusive',
}

export enum MandateCategory {
  SALE = 'sale',
  RENTAL = 'rental',
}

export enum MandateStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

// ========== MANDATE TYPES ==========

export interface Mandate {
  id: string;
  userId: string;
  ownerId: string;
  propertyId?: string;
  reference: string;
  type: MandateType;
  category: MandateCategory;
  status: MandateStatus;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
  commission: number;
  commissionType: string;
  exclusivityBonus?: number;
  terms?: string;
  notes?: string;
  documentUrl?: string;
  signedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Relations
  owner?: any;
  property?: any;
  transactions?: any[];
  // Prisma count fields
  _count?: {
    transactions?: number;
  };
}

export interface CreateMandateDTO {
  ownerId: string;
  propertyId?: string;
  reference: string;
  type: MandateType;
  category: MandateCategory;
  startDate: string;
  endDate: string;
  price: number;
  currency?: string;
  commission: number;
  commissionType?: string;
  exclusivityBonus?: number;
  terms?: string;
  notes?: string;
  documentUrl?: string;
  signedAt?: string;
  metadata?: any;
}

export interface UpdateMandateDTO extends Partial<CreateMandateDTO> {
  status?: MandateStatus;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface MandateFilters {
  status?: string;
  type?: string;
  category?: string;
  ownerId?: string;
  propertyId?: string;
  expiringInDays?: number;
}

// ========== STATS TYPES ==========

export interface MandateStats {
  total: number;
  active: number;
  expired: number;
  expiringThisMonth: number;
  byType: Array<{
    type: string;
    count: number;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  totalCommissionValue: number;
  averageCommission: number;
}

// ========== API ==========

export const mandatesAPI = {
  // ============================================
  // CRUD DE BASE
  // ============================================

  /**
   * Créer un nouveau mandat
   */
  create: async (data: CreateMandateDTO): Promise<Mandate> => {
    const response = await apiClient.post('/mandates', data);
    return response.data;
  },

  /**
   * Liste tous les mandats avec filtres
   */
  list: async (filters?: MandateFilters): Promise<Mandate[]> => {
    const response = await apiClient.get('/mandates', { params: filters });
    return response.data;
  },

  /**
   * Obtenir un mandat par ID
   */
  getById: async (id: string): Promise<Mandate> => {
    const response = await apiClient.get(`/mandates/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un mandat
   */
  update: async (id: string, data: UpdateMandateDTO): Promise<Mandate> => {
    const response = await apiClient.put(`/mandates/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un mandat
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/mandates/${id}`);
  },

  // ============================================
  // ACTIONS SPÉCIFIQUES
  // ============================================

  /**
   * Annuler un mandat
   */
  cancel: async (id: string, reason: string): Promise<Mandate> => {
    const response = await apiClient.patch(`/mandates/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Vérifier et mettre à jour les mandats expirés
   */
  checkExpired: async (): Promise<{ updated: number }> => {
    const response = await apiClient.get('/mandates/check-expired');
    return response.data;
  },

  // ============================================
  // VUES SPÉCIALES
  // ============================================

  /**
   * Obtenir les statistiques des mandats
   */
  getStats: async (): Promise<MandateStats> => {
    const response = await apiClient.get('/mandates/stats');
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getMandateTypeLabel = (type: MandateType): string => {
  const labels: Record<MandateType, string> = {
    [MandateType.SIMPLE]: 'Simple',
    [MandateType.EXCLUSIVE]: 'Exclusif',
    [MandateType.SEMI_EXCLUSIVE]: 'Semi-exclusif',
  };
  return labels[type] || type;
};

export const getMandateCategoryLabel = (category: MandateCategory): string => {
  const labels: Record<MandateCategory, string> = {
    [MandateCategory.SALE]: 'Vente',
    [MandateCategory.RENTAL]: 'Location',
  };
  return labels[category] || category;
};

export const getMandateStatusLabel = (status: MandateStatus): string => {
  const labels: Record<MandateStatus, string> = {
    [MandateStatus.ACTIVE]: 'Actif',
    [MandateStatus.EXPIRED]: 'Expiré',
    [MandateStatus.CANCELLED]: 'Annulé',
    [MandateStatus.COMPLETED]: 'Terminé',
  };
  return labels[status] || status;
};

export const getMandateStatusColor = (status: MandateStatus): string => {
  const colors: Record<MandateStatus, string> = {
    [MandateStatus.ACTIVE]: 'bg-green-100 text-green-800',
    [MandateStatus.EXPIRED]: 'bg-red-100 text-red-800',
    [MandateStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
    [MandateStatus.COMPLETED]: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getMandateTypeColor = (type: MandateType): string => {
  const colors: Record<MandateType, string> = {
    [MandateType.SIMPLE]: 'bg-blue-100 text-blue-800',
    [MandateType.EXCLUSIVE]: 'bg-purple-100 text-purple-800',
    [MandateType.SEMI_EXCLUSIVE]: 'bg-indigo-100 text-indigo-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const formatMandatePrice = (amount: number, currency: string = 'TND'): string => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatMandateCommission = (mandate: Mandate): string => {
  if (mandate.commissionType === 'percentage') {
    return `${mandate.commission}%`;
  }
  return formatMandatePrice(mandate.commission, mandate.currency);
};

export const calculateMandateCommissionValue = (mandate: Mandate): number => {
  if (mandate.commissionType === 'percentage') {
    return (mandate.price * mandate.commission) / 100;
  }
  return mandate.commission;
};

export const isMandateExpired = (mandate: Mandate): boolean => {
  if (mandate.status === MandateStatus.EXPIRED) return true;
  const endDate = new Date(mandate.endDate);
  const now = new Date();
  return endDate < now;
};

export const isMandateExpiringSoon = (mandate: Mandate, daysThreshold: number = 30): boolean => {
  if (mandate.status !== MandateStatus.ACTIVE) return false;
  const endDate = new Date(mandate.endDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= daysThreshold;
};

export const getMandateDaysRemaining = (mandate: Mandate): number => {
  const endDate = new Date(mandate.endDate);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const getMandateDuration = (mandate: Mandate): number => {
  const startDate = new Date(mandate.startDate);
  const endDate = new Date(mandate.endDate);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const formatMandateDateRange = (mandate: Mandate): string => {
  const startDate = new Date(mandate.startDate).toLocaleDateString('fr-FR');
  const endDate = new Date(mandate.endDate).toLocaleDateString('fr-FR');
  return `${startDate} - ${endDate}`;
};

export default mandatesAPI;
