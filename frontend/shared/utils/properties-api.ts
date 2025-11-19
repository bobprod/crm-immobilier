/**
 * Service API pour la gestion des biens immobiliers
 * Architecture DDD - Module Business/Properties
 */

import apiClient, { PaginatedResponse, PaginationParams } from './api-client';

/**
 * Interfaces de types pour les biens immobiliers
 */
export interface Property {
  id: string;
  userId: string;
  agencyId?: string;
  reference?: string;
  title: string;
  description?: string;
  type: 'apartment' | 'house' | 'villa' | 'land' | 'commercial' | 'office' | 'garage' | 'other';
  category: 'sale' | 'rent' | 'vacation_rental';
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
  status: 'available' | 'sold' | 'rented' | 'draft' | 'archived';
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

export interface UpdatePropertyData extends Partial<CreatePropertyData> {}

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
    return apiClient.get<PaginatedResponse<Property>>('/properties', { params });
  }

  /**
   * Récupérer un bien par son ID
   */
  async getPropertyById(id: string): Promise<Property> {
    return apiClient.get<Property>(`/properties/${id}`);
  }

  /**
   * Créer un nouveau bien
   */
  async createProperty(data: CreatePropertyData): Promise<Property> {
    return apiClient.post<Property>('/properties', data);
  }

  /**
   * Mettre à jour un bien
   */
  async updateProperty(id: string, data: UpdatePropertyData): Promise<Property> {
    return apiClient.patch<Property>(`/properties/${id}`, data);
  }

  /**
   * Supprimer un bien
   */
  async deleteProperty(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/properties/${id}`);
  }

  /**
   * Rechercher des biens avec filtres
   */
  async searchProperties(filters: PropertyFilters, params?: PaginationParams): Promise<PaginatedResponse<Property>> {
    return apiClient.get<PaginatedResponse<Property>>('/properties/search', {
      params: { ...filters, ...params }
    });
  }

  /**
   * Récupérer les biens publiés (vitrine)
   */
  async getPublishedProperties(params?: PaginationParams): Promise<PaginatedResponse<Property>> {
    return apiClient.get<PaginatedResponse<Property>>('/properties/published', { params });
  }

  /**
   * Publier un bien (rendre visible sur la vitrine)
   */
  async publishProperty(id: string, isFeatured: boolean = false): Promise<Property> {
    return apiClient.post<Property>(`/properties/${id}/publish`, { isFeatured });
  }

  /**
   * Dépublier un bien
   */
  async unpublishProperty(id: string): Promise<Property> {
    return apiClient.post<Property>(`/properties/${id}/unpublish`);
  }

  /**
   * Récupérer les statistiques des biens
   */
  async getPropertyStats(): Promise<PropertyStats> {
    return apiClient.get<PropertyStats>('/properties/stats');
  }

  /**
   * Télécharger des images pour un bien
   */
  async uploadPropertyImages(id: string, images: File[]): Promise<Property> {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    return apiClient.post<Property>(`/properties/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Supprimer une image d'un bien
   */
  async deletePropertyImage(id: string, imageUrl: string): Promise<Property> {
    return apiClient.delete<Property>(`/properties/${id}/images`, {
      data: { imageUrl }
    });
  }

  /**
   * Générer une description IA pour un bien
   */
  async generatePropertyDescription(id: string): Promise<{ description: string }> {
    return apiClient.post<{ description: string }>(`/properties/${id}/generate-description`);
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
    return apiClient.post(`/properties/${id}/optimize-seo`);
  }

  /**
   * Récupérer les biens similaires
   */
  async getSimilarProperties(id: string, limit: number = 5): Promise<Property[]> {
    return apiClient.get<Property[]>(`/properties/${id}/similar`, {
      params: { limit }
    });
  }

  /**
   * Récupérer les biens favoris
   */
  async getFavoriteProperties(): Promise<Property[]> {
    return apiClient.get<Property[]>('/properties/favorites');
  }

  /**
   * Ajouter un bien aux favoris
   */
  async addToFavorites(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/properties/${id}/favorite`);
  }

  /**
   * Retirer un bien des favoris
   */
  async removeFromFavorites(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/properties/${id}/favorite`);
  }

  /**
   * Récupérer les biens récemment vus
   */
  async getRecentlyViewed(limit: number = 10): Promise<Property[]> {
    return apiClient.get<Property[]>('/properties/recently-viewed', {
      params: { limit }
    });
  }

  /**
   * Marquer un bien comme vu
   */
  async markAsViewed(id: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/properties/${id}/view`);
  }

  /**
   * Exporter les données d'un bien
   */
  async exportPropertyData(id: string, format: 'pdf' | 'excel' | 'word'): Promise<Blob> {
    return apiClient.get<Blob>(`/properties/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
  }

  /**
   * Récupérer les documents associés à un bien
   */
  async getPropertyDocuments(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/properties/${id}/documents`);
  }

  /**
   * Récupérer les rendez-vous associés à un bien
   */
  async getPropertyAppointments(id: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(`/properties/${id}/appointments`, { params });
  }

  /**
   * Récupérer les prospects intéressés par un bien
   */
  async getPropertyInterestedProspects(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/properties/${id}/interested-prospects`);
  }

  /**
   * Récupérer les matches IA pour un bien
   */
  async getPropertyMatches(id: string): Promise<any[]> {
    return apiClient.get<any[]>(`/properties/${id}/matches`);
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
    return apiClient.get(`/properties/${id}/price-analysis`);
  }
}

// Export d'une instance unique
const propertiesAPI = new PropertiesAPIService();

export default propertiesAPI;
