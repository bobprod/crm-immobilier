/**
 * Service API pour la gestion des prospects/clients
 * Architecture DDD - Module Business/Prospects
 */

import apiClient, { PaginatedResponse, PaginationParams } from './api-client';

/**
 * Interfaces de types pour les prospects
 */
export interface Prospect {
  id: string;
  userId: string;
  agencyId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: 'buyer' | 'seller' | 'renter' | 'landlord' | 'investor' | 'other';
  currency: string;
  preferences?: Record<string, any>;
  source?: string;
  status: 'active' | 'inactive' | 'converted' | 'lost' | 'archived';
  score: number; // Score de qualification 0-100
  prospectType?: string; // requete_location, requete_achat, mandat_location, mandat_vente, promoteur
  subType?: string; // Type de bien recherché ou à vendre
  searchCriteria?: Record<string, any>; // Critères de recherche structurés
  mandatInfo?: Record<string, any>; // Informations mandat si applicable
  profiling?: Record<string, any>; // Profiling enrichi du prospect
  timeline?: string; // Timeline souhaitée
  budget?: Record<string, any>; // Budget min/max
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProspectData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: string;
  currency?: string;
  preferences?: Record<string, any>;
  source?: string;
  status?: string;
  prospectType?: string;
  subType?: string;
  searchCriteria?: Record<string, any>;
  mandatInfo?: Record<string, any>;
  profiling?: Record<string, any>;
  timeline?: string;
  budget?: Record<string, any>;
  notes?: string;
}

export interface UpdateProspectData extends Partial<CreateProspectData> {}

export interface ProspectFilters {
  type?: string;
  status?: string;
  source?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  prospectType?: string;
  subType?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export interface ProspectStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  averageScore: number;
  conversionRate: number;
  activeProspects: number;
  newThisMonth: number;
  convertedThisMonth: number;
}

export interface ProspectInteraction {
  id: string;
  prospectId: string;
  userId: string;
  date: string;
  channel: 'phone' | 'email' | 'whatsapp' | 'sms' | 'meeting' | 'visit' | 'other';
  type: 'call' | 'email' | 'visit' | 'offer' | 'negotiation' | 'feedback' | 'other';
  subject?: string;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  propertyShown?: string;
  feedback?: Record<string, any>;
  createdAt: string;
}

export interface ProspectPreference {
  id: string;
  prospectId: string;
  category: string;
  liked?: any[];
  disliked?: any[];
  priority: number;
  notes?: string;
  updatedAt: string;
}

export interface ContactValidation {
  id: string;
  userId: string;
  contactType: 'email' | 'phone' | 'address';
  contactValue: string;
  isValid: boolean;
  score: number;
  validationMethod?: string;
  reason?: string;
  isSpam: boolean;
  isDisposable: boolean;
  isCatchAll: boolean;
  provider?: string;
  metadata?: Record<string, any>;
  prospectId?: string;
  leadId?: string;
  verifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service API pour la gestion des prospects/clients
 */
class ProspectsAPIService {
  /**
   * Récupérer tous les prospects de l'utilisateur connecté
   */
  async getMyProspects(params?: PaginationParams & ProspectFilters): Promise<PaginatedResponse<Prospect>> {
    return apiClient.get<PaginatedResponse<Prospect>>('/prospects', { params });
  }

  /**
   * Récupérer un prospect par son ID
   */
  async getProspectById(id: string): Promise<Prospect> {
    return apiClient.get<Prospect>(`/prospects/${id}`);
  }

  /**
   * Créer un nouveau prospect
   */
  async createProspect(data: CreateProspectData): Promise<Prospect> {
    return apiClient.post<Prospect>('/prospects', data);
  }

  /**
   * Mettre à jour un prospect
   */
  async updateProspect(id: string, data: UpdateProspectData): Promise<Prospect> {
    return apiClient.patch<Prospect>(`/prospects/${id}`, data);
  }

  /**
   * Supprimer un prospect
   */
  async deleteProspect(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/prospects/${id}`);
  }

  /**
   * Rechercher des prospects avec filtres
   */
  async searchProspects(filters: ProspectFilters, params?: PaginationParams): Promise<PaginatedResponse<Prospect>> {
    return apiClient.get<PaginatedResponse<Prospect>>('/prospects/search', {
      params: { ...filters, ...params }
    });
  }

  /**
   * Récupérer les statistiques des prospects
   */
  async getProspectStats(): Promise<ProspectStats> {
    return apiClient.get<ProspectStats>('/prospects/stats');
  }

  /**
   * Récupérer les interactions d'un prospect
   */
  async getProspectInteractions(prospectId: string, params?: PaginationParams): Promise<PaginatedResponse<ProspectInteraction>> {
    return apiClient.get<PaginatedResponse<ProspectInteraction>>(`/prospects/${prospectId}/interactions`, { params });
  }

  /**
   * Créer une interaction avec un prospect
   */
  async createInteraction(prospectId: string, data: Omit<ProspectInteraction, 'id' | 'prospectId' | 'userId' | 'createdAt'>): Promise<ProspectInteraction> {
    return apiClient.post<ProspectInteraction>(`/prospects/${prospectId}/interactions`, data);
  }

  /**
   * Récupérer les préférences d'un prospect
   */
  async getProspectPreferences(prospectId: string): Promise<ProspectPreference[]> {
    return apiClient.get<ProspectPreference[]>(`/prospects/${prospectId}/preferences`);
  }

  /**
   * Mettre à jour les préférences d'un prospect
   */
  async updateProspectPreferences(prospectId: string, preferences: Omit<ProspectPreference, 'id' | 'prospectId' | 'updatedAt'>[]): Promise<ProspectPreference[]> {
    return apiClient.put<ProspectPreference[]>(`/prospects/${prospectId}/preferences`, { preferences });
  }

  /**
   * Récupérer les matches IA pour un prospect
   */
  async getProspectMatches(prospectId: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(`/prospects/${prospectId}/matches`, { params });
  }

  /**
   * Valider les coordonnées d'un prospect
   */
  async validateProspectContacts(prospectId: string): Promise<ContactValidation[]> {
    return apiClient.post<ContactValidation[]>(`/prospects/${prospectId}/validate-contacts`);
  }

  /**
   * Qualifier un prospect (IA)
   */
  async qualifyProspect(prospectId: string): Promise<{
    score: number;
    qualification: string;
    recommendations: string[];
    factors: Record<string, any>;
  }> {
    return apiClient.post(`/prospects/${prospectId}/qualify`);
  }

  /**
   * Convertir un prospect en client
   */
  async convertProspect(id: string, data: { type: string; notes?: string }): Promise<Prospect> {
    return apiClient.post<Prospect>(`/prospects/${id}/convert`, data);
  }

  /**
   * Archiver un prospect
   */
  async archiveProspect(id: string, reason?: string): Promise<Prospect> {
    return apiClient.post<Prospect>(`/prospects/${id}/archive`, { reason });
  }

  /**
   * Réactiver un prospect archivé
   */
  async reactivateProspect(id: string): Promise<Prospect> {
    return apiClient.post<Prospect>(`/prospects/${id}/reactivate`);
  }

  /**
   * Récupérer les prospects par type
   */
  async getProspectsByType(type: string, params?: PaginationParams): Promise<PaginatedResponse<Prospect>> {
    return apiClient.get<PaginatedResponse<Prospect>>(`/prospects/type/${type}`, { params });
  }

  /**
   * Récupérer les prospects par statut
   */
  async getProspectsByStatus(status: string, params?: PaginationParams): Promise<PaginatedResponse<Prospect>> {
    return apiClient.get<PaginatedResponse<Prospect>>(`/prospects/status/${status}`, { params });
  }

  /**
   * Récupérer les prospects à rappeler
   */
  async getProspectsToCall(date?: string): Promise<Prospect[]> {
    return apiClient.get<Prospect[]>('/prospects/to-call', {
      params: { date }
    });
  }

  /**
   * Récupérer les prospects sans activité récente
   */
  async getInactiveProspects(days: number = 30): Promise<Prospect[]> {
    return apiClient.get<Prospect[]>('/prospects/inactive', {
      params: { days }
    });
  }

  /**
   * Récupérer les prospects avec des rendez-vous à venir
   */
  async getProspectsWithUpcomingAppointments(): Promise<Prospect[]> {
    return apiClient.get<Prospect[]>('/prospects/with-appointments');
  }

  /**
   * Récupérer les prospects par source
   */
  async getProspectsBySource(source: string, params?: PaginationParams): Promise<PaginatedResponse<Prospect>> {
    return apiClient.get<PaginatedResponse<Prospect>>(`/prospects/source/${source}`, { params });
  }

  /**
   * Exporter les données des prospects
   */
  async exportProspectsData(format: 'csv' | 'excel' | 'pdf', filters?: ProspectFilters): Promise<Blob> {
    return apiClient.get<Blob>('/prospects/export', {
      params: { format, ...filters },
      responseType: 'blob',
    });
  }

  /**
   * Get paginated prospects with cursor-based pagination
   */
  async getPaginated(cursor?: string | null, limit = 20, filters?: any) {
    const response = await apiClient.get('/prospects/paginated', {
      params: { cursor, limit, ...filters },
    });
    return response.data;
  }

  /**
   * Get trashed prospects
   */
  async getTrashed(): Promise<Prospect[]> {
    return apiClient.get<Prospect[]>('/prospects/trashed');
  }

  /**
   * Restore a prospect from trash
   */
  async restore(id: string): Promise<Prospect> {
    return apiClient.patch<Prospect>(`/prospects/${id}/restore`);
  }

  /**
   * Permanently delete a prospect
   */
  async permanentDelete(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/prospects/${id}/permanent`);
  }

  /**
   * Search prospects
   */
  async search(query: string): Promise<Prospect[]> {
    return apiClient.get<Prospect[]>('/prospects/search', {
      params: { q: query },
    });
  }

  /**
   * Get prospect statistics
   */
  async getStats(): Promise<ProspectStats> {
    return apiClient.get<ProspectStats>('/prospects/stats');
  }

  /**
   * Export prospects to CSV
   */
  async exportCSV(filters?: any): Promise<Blob> {
    const response = await apiClient.get('/prospects/export/csv', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Importer des prospects depuis un fichier
   */
  async importProspects(file: File): Promise<{
    imported: number;
    errors: any[];
    warnings: any[];
  }> {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient.post<{
      imported: number;
      errors: any[];
      warnings: any[];
    }>('/prospects/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Récupérer les documents d'un prospect
   */
  async getProspectDocuments(prospectId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/prospects/${prospectId}/documents`);
  }

  /**
   * Récupérer les rendez-vous d'un prospect
   */
  async getProspectAppointments(prospectId: string, params?: PaginationParams): Promise<PaginatedResponse<any>> {
    return apiClient.get<PaginatedResponse<any>>(`/prospects/${prospectId}/appointments`, { params });
  }

  /**
   * Récupérer les campagnes associées à un prospect
   */
  async getProspectCampaigns(prospectId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/prospects/${prospectId}/campaigns`);
  }

  /**
   * Fusionner deux prospects (en cas de doublon)
   */
  async mergeProspects(primaryId: string, secondaryId: string, data: { keepData: string[] }): Promise<Prospect> {
    return apiClient.post<Prospect>(`/prospects/${primaryId}/merge/${secondaryId}`, data);
  }
}

// Export d'une instance unique
const prospectsAPI = new ProspectsAPIService();

export default prospectsAPI;
