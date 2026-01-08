/**
 * Service API pour la gestion des biens immobiliers
 * Architecture DDD - Module Business/Properties
 */

import apiClient from './backend-api';

// Types de pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Interfaces de types pour les biens immobiliers
 */

// Type aliases for property attributes
export type PropertyType = 'apartment' | 'house' | 'villa' | 'studio' | 'land' | 'commercial' | 'office' | 'garage' | 'other';
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'pending' | 'draft' | 'archived';
export type PropertyPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PropertyCategory = 'sale' | 'rent' | 'vacation_rental';

export interface Property {
  id: string;
  userId: string;
  agencyId?: string;
  reference?: string;
  title: string;
  description?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  owner?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  ownerId?: string;
  netPrice?: number;
  fees?: number;
  feesPercentage?: number;
  type: PropertyType;
  category: PropertyCategory;
  price: number;
  currency: string;
  address?: string;
  city?: string;
  delegation?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
  features?: Record<string, any>;
  status: PropertyStatus;
  viewsCount: number;
  prospectType?: string;
  subType?: string;
  searchCriteria?: Record<string, any>;
  mandatInfo?: Record<string, any>;
  profiling?: Record<string, any>;
  timeline?: string;
  budget?: Record<string, any>;
  wpSyncId?: string;
  wpSyncedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyData {
  title: string;
  type: string;
  category: string;
  price: number;
  currency?: string;
  description?: string;
  priority?: string;
  address?: string;
  city?: string;
  delegation?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  images?: string[];
  features?: Record<string, any>;
  status?: string;
  prospectType?: string;
  subType?: string;
  searchCriteria?: Record<string, any>;
  mandatInfo?: Record<string, any>;
  profiling?: Record<string, any>;
  timeline?: string;
  budget?: Record<string, any>;
}

export interface UpdatePropertyData extends Partial<CreatePropertyData> { }

export interface PropertyFilters {
  type?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  delegation?: string;
  search?: string;
  prospectType?: string;
  subType?: string;
}

export interface PropertyStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byCity: Record<string, number>;
  averagePrice: number;
  totalViews: number;
}

/**
 * Service API pour la gestion des biens immobiliers
 */
class PropertiesAPIService {
  /**
   * Récupérer tous les biens de l'utilisateur connecté
   */
  async getMyProperties(params?: PaginationParams & PropertyFilters): Promise<PaginatedResponse<Property>> {
    const response = await apiClient.get<PaginatedResponse<Property>>('/properties', { params });
    return response.data;
  }

  /**
   * Alias pour getMyProperties (utilisé dans les composants)
   */
  async list(params?: PaginationParams & PropertyFilters): Promise<PaginatedResponse<Property>> {
    return this.getMyProperties(params);
  }

  /**
   * Récupérer un bien par son ID
   */
  async getPropertyById(id: string): Promise<Property> {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  }

  /**
   * Compatibility alias: getById
   */
  async getById(id: string): Promise<Property> {
    return this.getPropertyById(id);
  }

  /**
   * Créer un nouveau bien
   */
  async createProperty(data: CreatePropertyData): Promise<Property> {
    const response = await apiClient.post<Property>('/properties', data);
    return response.data;
  }

  /**
   * Alias pour createProperty (utilisé dans les composants)
   */
  async create(data: CreatePropertyData): Promise<Property> {
    return this.createProperty(data);
  }

  /**
   * Mettre à jour un bien
   */
  async updateProperty(id: string, data: UpdatePropertyData): Promise<Property> {
    const response = await apiClient.patch<Property>(`/properties/${id}`, data);
    return response.data;
  }

  /**
   * Alias pour updateProperty (utilisé dans les composants)
   */
  async update(id: string, data: UpdatePropertyData): Promise<Property> {
    return this.updateProperty(id, data);
  }

  /**
   * Supprimer un bien
   */
  async deleteProperty(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/properties/${id}`);
    return response.data;
  }

  /**
   * Alias pour deleteProperty (utilisé dans les composants)
   */
  async delete(id: string): Promise<{ message: string }> {
    return this.deleteProperty(id);
  }

  /**
   * Supprimer plusieurs biens en masse
   */
  async bulkDelete(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await apiClient.post<{ message: string; deletedCount: number }>('/properties/bulk-delete', { ids });
    return response.data;
  }

  /**
   * Mettre à jour la priorité pour plusieurs biens
   */
  async bulkUpdatePriority(ids: string[], priority: string): Promise<{ message: string; updatedCount: number }> {
    const response = await apiClient.post<{ message: string; updatedCount: number }>('/properties/bulk-update-priority', { ids, priority });
    return response.data;
  }

  /**
   * Mettre à jour le statut pour plusieurs biens
   */
  async bulkUpdateStatus(ids: string[], status: string): Promise<{ message: string; updatedCount: number }> {
    const response = await apiClient.post<{ message: string; updatedCount: number }>('/properties/bulk-update-status', { ids, status });
    return response.data;
  }

  /**
   * Rechercher des biens avec filtres
   */
  async searchProperties(filters: PropertyFilters, params?: PaginationParams): Promise<PaginatedResponse<Property>> {
    const response = await apiClient.get<PaginatedResponse<Property>>('/properties/search', {
      params: { ...filters, ...params }
    });
    return response.data;
  }

  /**
   * Récupérer les biens publiés (vitrine)
   */
  async getPublishedProperties(params?: PaginationParams): Promise<PaginatedResponse<Property>> {
    const response = await apiClient.get<PaginatedResponse<Property>>('/properties/published', { params });
    return response.data;
  }

  /**
   * Publier un bien (rendre visible sur la vitrine)
   */
  async publishProperty(id: string, isFeatured: boolean = false): Promise<Property> {
    const response = await apiClient.post<Property>(`/properties/${id}/publish`, { isFeatured });
    return response.data;
  }

  /**
   * Dépublier un bien
   */
  async unpublishProperty(id: string): Promise<Property> {
    const response = await apiClient.post<Property>(`/properties/${id}/unpublish`);
    return response.data;
  }

  /**
   * Récupérer les statistiques des biens
   */
  async getPropertyStats(): Promise<PropertyStats> {
    const response = await apiClient.get<PropertyStats>('/properties/stats');
    return response.data;
  }

  /**
   * Télécharger des images pour un bien
   */
  async uploadPropertyImages(id: string, images: File[]): Promise<Property> {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await apiClient.post<Property>(`/properties/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Supprimer une image d'un bien
   */
  async deletePropertyImage(id: string, imageUrl: string): Promise<Property> {
    const response = await apiClient.delete<Property>(`/properties/${id}/images`, {
      data: { imageUrl }
    });
    return response.data;
  }

  /**
   * Générer une description IA pour un bien
   */
  async generatePropertyDescription(id: string): Promise<{ description: string }> {
    const response = await apiClient.post<{ description: string }>(`/properties/${id}/generate-description`);
    return response.data;
  }

  /**
   * Optimiser le SEO d'un bien
   */
  async optimizePropertySEO(id: string): Promise<{
    title: string;
    description: string;
    keywords: string[];
    slug: string;
  }> {
    const response = await apiClient.post(`/properties/${id}/optimize-seo`);
    return response.data;
  }

  /**
   * Récupérer les biens similaires
   */
  async getSimilarProperties(id: string, limit: number = 5): Promise<Property[]> {
    const response = await apiClient.get<Property[]>(`/properties/${id}/similar`, {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Récupérer les biens favoris
   */
  async getFavoriteProperties(): Promise<Property[]> {
    const response = await apiClient.get<Property[]>('/properties/favorites');
    return response.data;
  }

  /**
   * Ajouter un bien aux favoris
   */
  async addToFavorites(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/properties/${id}/favorite`);
    return response.data;
  }

  /**
   * Retirer un bien des favoris
   */
  async removeFromFavorites(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/properties/${id}/favorite`);
    return response.data;
  }

  /**
   * Récupérer les biens récemment vus
   */
  async getRecentlyViewed(limit: number = 10): Promise<Property[]> {
    const response = await apiClient.get<Property[]>('/properties/recently-viewed', {
      params: { limit }
    });
    return response.data;
  }

  /**
   * Marquer un bien comme vu
   */
  async markAsViewed(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/properties/${id}/view`);
    return response.data;
  }

  /**
   * Exporter les données d'un bien
   */
  async exportPropertyData(id: string, format: 'pdf' | 'excel' | 'word'): Promise<Blob> {
    const response = await apiClient.get<Blob>(`/properties/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Récupérer les documents associés à un bien
   */
  async getPropertyDocuments(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/properties/${id}/documents`);
    return response.data;
  }

  /**
   * Récupérer les rendez-vous associés à un bien
   */
  async getPropertyAppointments(id: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(`/properties/${id}/appointments`, { params });
    return response.data;
  }

  /**
   * Compatibility: cursor-based pagination helper used by some hooks/components
   */
  async getPaginated(
    cursor?: string,
    limit: number = 20,
    filters?: PropertyFilters
  ): Promise<{ items: Property[]; nextCursor?: string; hasNextPage: boolean; total: number }> {
    const page = cursor ? parseInt(cursor, 10) : 1;
    const params = { page, limit, ...(filters || {}) } as any;
    const response = await this.getMyProperties(params);
    const items = response.data;
    const total = response.meta.total;
    const hasNextPage = response.meta.page < response.meta.totalPages;
    const nextCursor = hasNextPage ? String(response.meta.page + 1) : undefined;
    return { items, nextCursor, hasNextPage, total };
  }

  /**
   * Trashed / restore compatibility methods
   */
  async getTrashed(): Promise<Property[]> {
    const response = await apiClient.get<Property[]>('/properties/trashed');
    return response.data;
  }

  async restore(id: string): Promise<Property> {
    const response = await apiClient.post<Property>(`/properties/${id}/restore`);
    return response.data;
  }

  async permanentDelete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/properties/${id}/permanent`);
    return response.data;
  }

  /**
   * Récupérer les prospects intéressés par un bien
   */
  async getPropertyInterestedProspects(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/properties/${id}/interested-prospects`);
    return response.data;
  }

  /**
   * Récupérer les matches IA pour un bien
   */
  async getPropertyMatches(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/properties/${id}/matches`);
    return response.data;
  }

  /**
   * Récupérer les analyses de prix pour un bien
   */
  async getPropertyPriceAnalysis(id: string): Promise<{
    currentPrice: number;
    estimatedPrice: number;
    priceRange: { min: number; max: number };
    confidence: number;
    factors: string[];
    similarProperties: Property[];
  }> {
    const response = await apiClient.get(`/properties/${id}/price-analysis`);
    return response.data;
  }
}

// Export d'une instance unique
const propertiesAPI = new PropertiesAPIService();

export default propertiesAPI;
