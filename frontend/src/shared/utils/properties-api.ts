import apiClient from './backend-api';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  category?: 'sale' | 'rent';
  status: PropertyStatus;
  price: number;
  currency?: string;
  // Use 'area' to match backend Prisma schema (surface is alias for backward compat)
  area?: number;
  surface?: number; // @deprecated - use area
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  city?: string;
  delegation?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  features?: string[];
  priority?: PropertyPriority;
  tags?: string[];
  assignedTo?: string;
  isFeatured?: boolean;
  notes?: string;
  ownerId?: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  netPrice?: number;
  fees?: number;
  feesPercentage?: number;
  viewsCount?: number;
  reference?: string;
  deletedAt?: string; // Soft delete timestamp
  createdAt: string;
  updatedAt: string;
}

// Type definitions aligned with backend
export type PropertyType =
  | 'house'
  | 'apartment'
  | 'villa'
  | 'studio'
  | 'land'
  | 'commercial'
  | 'office'
  | 'terrain'
  | 'appartement'
  | 'maison';
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'pending';
export type PropertyPriority = 'low' | 'medium' | 'high' | 'urgent';

// Helper to get surface/area value (handles both field names)
export const getPropertyArea = (property: Property): number | undefined => {
  return property.area ?? property.surface;
};

export interface CreatePropertyDTO {
  title: string;
  description?: string;
  type: PropertyType;
  category?: 'sale' | 'rent';
  price: number;
  currency?: string;
  area?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  city?: string;
  delegation?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
  features?: string[];
  priority?: PropertyPriority;
  tags?: string[];
  assignedTo?: string;
  isFeatured?: boolean;
  notes?: string;
  ownerId?: string;
  netPrice?: number;
  fees?: number;
  feesPercentage?: number;
}

export interface PropertyFilters {
  type?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  // Aliases for backward compatibility
  minSurface?: number;
  maxSurface?: number;
  city?: string;
  rooms?: number;
  bedrooms?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const propertiesAPI = {
  /**
   * Créer un nouveau bien immobilier
   */
  create: async (propertyData: CreatePropertyDTO): Promise<Property> => {
    // Filter out unsupported fields (rooms is not supported by backend)
    const { rooms, ...backendCompatibleData } = propertyData;
    const response = await apiClient.post('/properties', backendCompatibleData);
    return response.data;
  },

  /**
   * Liste tous les biens avec filtres
   */
  list: async (filters?: PropertyFilters): Promise<{ properties: Property[]; total: number }> => {
    const response = await apiClient.get('/properties', { params: filters });
    return response.data;
  },

  /**
   * Obtenir un bien par ID
   */
  getById: async (id: string): Promise<Property> => {
    const response = await apiClient.get(`/properties/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un bien
   */
  update: async (id: string, updates: Partial<CreatePropertyDTO>): Promise<Property> => {
    // Filtrer le champ 'rooms' non supporté par le backend
    const { rooms, ...backendCompatibleData } = updates;
    const response = await apiClient.put(`/properties/${id}`, backendCompatibleData);
    return response.data;
  },

  /**
   * Supprimer un bien
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },

  /**
   * Synchroniser un bien avec WordPress
   */
  syncWordPress: async (id: string, wpSyncId?: string): Promise<any> => {
    const response = await apiClient.put(`/properties/${id}/sync-wordpress`, { wpSyncId });
    return response.data;
  },

  /**
   * Upload des images pour un bien
   */
  uploadImages: async (id: string, images: File[]): Promise<string[]> => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await apiClient.post(`/properties/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.urls;
  },

  /**
   * Supprimer une image d'un bien
   */
  deleteImage: async (id: string, imageUrl: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}/images`, {
      data: { imageUrl },
    });
  },

  /**
   * Changer le statut d'un bien
   */
  updateStatus: async (
    id: string,
    status: 'available' | 'reserved' | 'sold' | 'rented'
  ): Promise<Property> => {
    const response = await apiClient.patch(`/properties/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Recherche avancée de biens
   */
  search: async (criteria: any): Promise<Property[]> => {
    const response = await apiClient.post('/properties/search', criteria);
    return response.data;
  },

  /**
   * Obtenir les biens similaires
   */
  getSimilar: async (id: string, limit = 5): Promise<Property[]> => {
    const response = await apiClient.get(`/properties/${id}/similar`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Obtenir les biens à proximité
   */
  getNearby: async (latitude: number, longitude: number, radiusKm = 5): Promise<Property[]> => {
    const response = await apiClient.get('/properties/nearby', {
      params: { latitude, longitude, radiusKm },
    });
    return response.data;
  },

  /**
   * Obtenir les statistiques des biens
   */
  getStats: async (): Promise<any> => {
    const response = await apiClient.get('/properties/stats');
    return response.data;
  },

  /**
   * Exporter les biens en CSV
   */
  exportCSV: async (filters?: PropertyFilters): Promise<Blob> => {
    const response = await apiClient.get('/properties/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Importer des biens depuis un CSV
   */
  importCSV: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/properties/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Mise à jour en masse de la priorité
   */
  bulkUpdatePriority: async (
    ids: string[],
    priority: PropertyPriority
  ): Promise<{ updated: number }> => {
    const response = await apiClient.patch('/properties/bulk/priority', { ids, priority });
    return response.data;
  },

  /**
   * Mise à jour en masse du statut
   */
  bulkUpdateStatus: async (ids: string[], status: PropertyStatus): Promise<{ updated: number }> => {
    const response = await apiClient.patch('/properties/bulk/status', { ids, status });
    return response.data;
  },

  /**
   * Assignation en masse
   */
  bulkAssign: async (ids: string[], assignedTo: string): Promise<{ updated: number }> => {
    const response = await apiClient.patch('/properties/bulk/assign', { ids, assignedTo });
    return response.data;
  },

  /**
   * Suppression en masse
   */
  bulkDelete: async (ids: string[]): Promise<{ deleted: number }> => {
    const response = await apiClient.post('/properties/bulk/delete', { ids });
    return response.data;
  },

  // ============================================
  // FEATURED & ASSIGNED
  // ============================================

  /**
   * Obtenir les biens en vedette
   */
  getFeatured: async (): Promise<Property[]> => {
    const response = await apiClient.get('/properties/featured');
    return response.data;
  },

  /**
   * Obtenir les biens assignés à un utilisateur
   */
  getAssigned: async (userId: string): Promise<Property[]> => {
    const response = await apiClient.get(`/properties/assigned/${userId}`);
    return response.data;
  },

  // ============================================
  // NEW: SOFT DELETE & HISTORY
  // ============================================

  /**
   * Get all trashed (soft-deleted) properties
   */
  getTrashed: async (): Promise<Property[]> => {
    const response = await apiClient.get('/properties/trashed');
    return response.data;
  },

  /**
   * Restore a soft-deleted property
   */
  restore: async (id: string): Promise<Property> => {
    const response = await apiClient.post(`/properties/${id}/restore`);
    return response.data;
  },

  /**
   * Permanently delete a property (cannot be undone)
   */
  permanentDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}/permanent`);
  },

  /**
   * Get property change history
   */
  getHistory: async (id: string, limit = 50): Promise<any[]> => {
    const response = await apiClient.get(`/properties/${id}/history`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get user activity across all properties
   */
  getUserActivity: async (userId: string, limit = 50): Promise<any[]> => {
    const response = await apiClient.get(`/properties/user/${userId}/activity`, {
      params: { limit },
    });
    return response.data;
  },

  // ============================================
  // NEW: CURSOR-BASED PAGINATION
  // ============================================

  /**
   * Get paginated properties with cursor-based pagination for infinite scroll
   */
  getPaginated: async (
    cursor?: string,
    limit = 20,
    filters?: PropertyFilters
  ): Promise<{
    items: Property[];
    nextCursor: string | null;
    hasNextPage: boolean;
    total: number;
  }> => {
    const params: any = { limit, ...filters };
    if (cursor) {
      params.cursor = cursor;
    }
    const response = await apiClient.get('/properties/paginated', { params });
    return response.data;
  },

  /**
   * Find nearby properties by geolocation (with distance sorting)
   */
  findNearby: async (
    lat: number,
    lng: number,
    radius = 5
  ): Promise<Array<Property & { distance: number }>> => {
    const response = await apiClient.get('/properties/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },
};

export default propertiesAPI;
