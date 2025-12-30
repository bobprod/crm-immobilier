import apiClient from './backend-api';

// ========== OWNER TYPES ==========

export interface Owner {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country: string;
  taxId?: string;
  idCard?: string;
  notes?: string;
  metadata?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  properties?: any[];
  mandates?: any[];
  invoices?: any[];
  _count?: {
    properties: number;
    mandates: number;
    invoices: number;
  };
}

export interface CreateOwnerDTO {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  taxId?: string;
  idCard?: string;
  notes?: string;
  metadata?: any;
  isActive?: boolean;
}

export interface UpdateOwnerDTO extends Partial<CreateOwnerDTO> {}

export interface OwnerFilters {
  search?: string;
  isActive?: boolean;
  city?: string;
}

// ========== STATS TYPES ==========

export interface OwnerStats {
  total: number;
  active: number;
  inactive: number;
  withProperties: number;
  withActiveMandates: number;
  topCities: Array<{
    city: string;
    count: number;
  }>;
  recentlyAdded: number;
}

// ========== API ==========

export const ownersAPI = {
  // ============================================
  // CRUD DE BASE
  // ============================================

  /**
   * Créer un nouveau propriétaire
   */
  create: async (data: CreateOwnerDTO): Promise<Owner> => {
    const response = await apiClient.post('/owners', data);
    return response.data;
  },

  /**
   * Liste tous les propriétaires avec filtres
   */
  list: async (filters?: OwnerFilters): Promise<Owner[]> => {
    const response = await apiClient.get('/owners', { params: filters });
    return response.data;
  },

  /**
   * Obtenir un propriétaire par ID
   */
  getById: async (id: string): Promise<Owner> => {
    const response = await apiClient.get(`/owners/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un propriétaire
   */
  update: async (id: string, data: UpdateOwnerDTO): Promise<Owner> => {
    const response = await apiClient.put(`/owners/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un propriétaire
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/owners/${id}`);
  },

  // ============================================
  // VUES SPÉCIALES
  // ============================================

  /**
   * Obtenir les statistiques des propriétaires
   */
  getStats: async (): Promise<OwnerStats> => {
    const response = await apiClient.get('/owners/stats');
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getOwnerFullName = (owner: Owner): string => {
  return `${owner.firstName} ${owner.lastName}`;
};

export const getOwnerInitials = (owner: Owner): string => {
  return `${owner.firstName.charAt(0)}${owner.lastName.charAt(0)}`.toUpperCase();
};

export const formatOwnerContact = (owner: Owner): string => {
  const parts: string[] = [];
  if (owner.email) parts.push(owner.email);
  if (owner.phone) parts.push(owner.phone);
  return parts.join(' • ');
};

export const formatOwnerAddress = (owner: Owner): string => {
  const parts: string[] = [];
  if (owner.address) parts.push(owner.address);
  if (owner.city) parts.push(owner.city);
  if (owner.zipCode) parts.push(owner.zipCode);
  if (owner.country && owner.country !== 'Tunisie') parts.push(owner.country);
  return parts.join(', ');
};

export const getOwnerStatusLabel = (owner: Owner): string => {
  return owner.isActive ? 'Actif' : 'Inactif';
};

export const getOwnerStatusColor = (owner: Owner): string => {
  return owner.isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';
};

export const hasOwnerCompleteContact = (owner: Owner): boolean => {
  return !!(owner.email || owner.phone);
};

export const hasOwnerCompleteAddress = (owner: Owner): boolean => {
  return !!(owner.address && owner.city);
};

export const getOwnerCompletionScore = (owner: Owner): number => {
  let score = 0;
  const fields = [
    owner.firstName,
    owner.lastName,
    owner.email,
    owner.phone,
    owner.address,
    owner.city,
    owner.zipCode,
    owner.taxId,
    owner.idCard,
  ];

  fields.forEach(field => {
    if (field) score += 100 / fields.length;
  });

  return Math.round(score);
};

export const getOwnerPropertyCount = (owner: Owner): number => {
  return owner._count?.properties || 0;
};

export const getOwnerMandateCount = (owner: Owner): number => {
  return owner._count?.mandates || 0;
};

export const isOwnerComplete = (owner: Owner): boolean => {
  return !!(
    owner.firstName &&
    owner.lastName &&
    (owner.email || owner.phone) &&
    owner.address &&
    owner.city
  );
};

export const searchOwners = (owners: Owner[], query: string): Owner[] => {
  const lowerQuery = query.toLowerCase();
  return owners.filter(owner => {
    const fullName = getOwnerFullName(owner).toLowerCase();
    const email = owner.email?.toLowerCase() || '';
    const phone = owner.phone?.toLowerCase() || '';
    const city = owner.city?.toLowerCase() || '';

    return (
      fullName.includes(lowerQuery) ||
      email.includes(lowerQuery) ||
      phone.includes(lowerQuery) ||
      city.includes(lowerQuery)
    );
  });
};

export const sortOwners = (
  owners: Owner[],
  sortBy: 'name' | 'city' | 'createdAt' | 'properties',
  order: 'asc' | 'desc' = 'asc'
): Owner[] => {
  const sorted = [...owners].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = getOwnerFullName(a).localeCompare(getOwnerFullName(b));
        break;
      case 'city':
        comparison = (a.city || '').localeCompare(b.city || '');
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'properties':
        comparison = getOwnerPropertyCount(a) - getOwnerPropertyCount(b);
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
};

export default ownersAPI;
