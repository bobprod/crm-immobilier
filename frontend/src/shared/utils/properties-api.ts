import apiClient from './backend-api';

interface Property {
  id: string;
  title: string;
  description: string;
  type: 'house' | 'apartment' | 'land' | 'commercial';
  status: 'available' | 'reserved' | 'sold' | 'rented';
  price: number;
  surface: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  address: string;
  city: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  features: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
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
  createdAt: string;
  updatedAt: string;
}

interface CreatePropertyDTO {
  title: string;
  description: string;
  type: 'house' | 'apartment' | 'land' | 'commercial';
  price: number;
  surface: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  address: string;
  city: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  features?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  assignedTo?: string;
  isFeatured?: boolean;
  notes?: string;
  ownerId?: string;
  netPrice?: number;
  fees?: number;
  feesPercentage?: number;
}

interface PropertyFilters {
  type?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
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
    const response = await apiClient.post('/properties', propertyData);
    return response.data;
  },

  /**
   * Liste tous les biens avec filtres
   */
  list: async (
    filters?: PropertyFilters
  ): Promise<{ properties: Property[]; total: number }> => {
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
  update: async (
    id: string,
    updates: Partial<CreatePropertyDTO>
  ): Promise<Property> => {
    const response = await apiClient.patch(`/properties/${id}`, updates);
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
  syncWordPress: async (id: string): Promise<any> => {
    const response = await apiClient.put(`/properties/${id}/sync-wordpress`);
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

    const response = await apiClient.post(
      `/properties/${id}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
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
  getNearby: async (
    latitude: number,
    longitude: number,
    radiusKm = 5
  ): Promise<Property[]> => {
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
};

export default propertiesAPI;
