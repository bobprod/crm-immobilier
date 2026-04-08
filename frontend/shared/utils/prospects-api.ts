/**
 * Service API pour la gestion des prospects/clients
 * Architecture DDD - Module Business/Prospects
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
  async getMyProspects(
    params?: PaginationParams & ProspectFilters
  ): Promise<PaginatedResponse<Prospect>> {
    const response = await apiClient.get<PaginatedResponse<Prospect>>('/prospects', { params });
    return response.data;
  }

  /**
   * Récupérer un prospect par son ID
   */
  async getProspectById(id: string): Promise<Prospect> {
    const response = await apiClient.get<Prospect>(`/prospects/${id}`);
    return response.data;
  }

  /**
   * Créer un nouveau prospect
   */
  async createProspect(data: CreateProspectData): Promise<Prospect> {
    const response = await apiClient.post<Prospect>('/prospects', data);
    return response.data;
  }

  /**
   * Mettre à jour un prospect
   */
  async updateProspect(id: string, data: UpdateProspectData): Promise<Prospect> {
    const response = await apiClient.patch<Prospect>(`/prospects/${id}`, data);
    return response.data;
  }

  /**
   * Supprimer un prospect
   */
  async deleteProspect(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/prospects/${id}`);
    return response.data;
  }

  /**
   * Rechercher des prospects avec filtres
   */
  async searchProspects(
    filters: ProspectFilters,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Prospect>> {
    const response = await apiClient.get<PaginatedResponse<Prospect>>('/prospects/search', {
      params: { ...filters, ...params },
    });
    return response.data;
  }

  /**
   * Récupérer les statistiques des prospects
   */
  async getProspectStats(): Promise<ProspectStats> {
    const response = await apiClient.get<ProspectStats>('/prospects/stats');
    return response.data;
  }

  /**
   * Récupérer les interactions d'un prospect
   */
  async getProspectInteractions(
    prospectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<ProspectInteraction>> {
    const response = await apiClient.get<PaginatedResponse<ProspectInteraction>>(
      `/prospects/${prospectId}/interactions`,
      { params }
    );
    return response.data;
  }

  /**
   * Créer une interaction avec un prospect
   */
  async createInteraction(
    prospectId: string,
    data: Omit<ProspectInteraction, 'id' | 'prospectId' | 'userId' | 'createdAt'>
  ): Promise<ProspectInteraction> {
    const response = await apiClient.post<ProspectInteraction>(
      `/prospects/${prospectId}/interactions`,
      data
    );
    return response.data;
  }

  /**
   * Récupérer les préférences d'un prospect
   */
  async getProspectPreferences(prospectId: string): Promise<ProspectPreference[]> {
    const response = await apiClient.get<ProspectPreference[]>(
      `/prospects/${prospectId}/preferences`
    );
    return response.data;
  }

  /**
   * Mettre à jour les préférences d'un prospect
   */
  async updateProspectPreferences(
    prospectId: string,
    preferences: Omit<ProspectPreference, 'id' | 'prospectId' | 'updatedAt'>[]
  ): Promise<ProspectPreference[]> {
    const response = await apiClient.put<ProspectPreference[]>(
      `/prospects/${prospectId}/preferences`,
      { preferences }
    );
    return response.data;
  }

  /**
   * Récupérer les matches IA pour un prospect
   */
  async getProspectMatches(
    prospectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/prospects/${prospectId}/matches`,
      { params }
    );
    return response.data;
  }

  /**
   * Valider les coordonnées d'un prospect
   */
  async validateProspectContacts(prospectId: string): Promise<ContactValidation[]> {
    const response = await apiClient.post<ContactValidation[]>(
      `/prospects/${prospectId}/validate-contacts`
    );
    return response.data;
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
    const response = await apiClient.post(`/prospects/${prospectId}/qualify`);
    return response.data;
  }

  /**
   * Convertir un prospect en client
   */
  async convertProspect(id: string, data: { type: string; notes?: string }): Promise<Prospect> {
    const response = await apiClient.post<Prospect>(`/prospects/${id}/convert`, data);
    return response.data;
  }

  /**
   * Archiver un prospect
   */
  async archiveProspect(id: string, reason?: string): Promise<Prospect> {
    const response = await apiClient.post<Prospect>(`/prospects/${id}/archive`, { reason });
    return response.data;
  }

  /**
   * Réactiver un prospect archivé
   */
  async reactivateProspect(id: string): Promise<Prospect> {
    const response = await apiClient.post<Prospect>(`/prospects/${id}/reactivate`);
    return response.data;
  }

  /**
   * Récupérer les prospects par type
   */
  async getProspectsByType(
    type: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Prospect>> {
    const response = await apiClient.get<PaginatedResponse<Prospect>>(`/prospects/type/${type}`, {
      params,
    });
    return response.data;
  }

  /**
   * Récupérer les prospects par statut
   */
  async getProspectsByStatus(
    status: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Prospect>> {
    const response = await apiClient.get<PaginatedResponse<Prospect>>(
      `/prospects/status/${status}`,
      { params }
    );
    return response.data;
  }

  /**
   * Récupérer les prospects à rappeler
   */
  async getProspectsToCall(date?: string): Promise<Prospect[]> {
    const response = await apiClient.get<Prospect[]>('/prospects/to-call', {
      params: { date },
    });
    return response.data;
  }

  /**
   * Récupérer les prospects sans activité récente
   */
  async getInactiveProspects(days: number = 30): Promise<Prospect[]> {
    const response = await apiClient.get<Prospect[]>('/prospects/inactive', {
      params: { days },
    });
    return response.data;
  }

  /**
   * Récupérer les prospects avec des rendez-vous à venir
   */
  async getProspectsWithUpcomingAppointments(): Promise<Prospect[]> {
    const response = await apiClient.get<Prospect[]>('/prospects/with-appointments');
    return response.data;
  }

  /**
   * Récupérer les prospects par source
   */
  async getProspectsBySource(
    source: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<Prospect>> {
    const response = await apiClient.get<PaginatedResponse<Prospect>>(
      `/prospects/source/${source}`,
      { params }
    );
    return response.data;
  }

  /**
   * Exporter les données des prospects
   */
  async exportProspectsData(
    format: 'csv' | 'excel' | 'pdf',
    filters?: ProspectFilters
  ): Promise<Blob> {
    const response = await apiClient.get<Blob>('/prospects/export', {
      params: { format, ...filters },
      responseType: 'blob',
    });
    return response.data;
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
    const response = await apiClient.get<Prospect[]>('/prospects/trashed');
    return response.data;
  }

  /**
   * Restore a prospect from trash
   */
  async restore(id: string): Promise<Prospect> {
    const response = await apiClient.patch<Prospect>(`/prospects/${id}/restore`);
    return response.data;
  }

  /**
   * Permanently delete a prospect
   */
  async permanentDelete(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/prospects/${id}/permanent`);
    return response.data;
  }

  /**
   * Search prospects
   */
  async search(query: string): Promise<Prospect[]> {
    const response = await apiClient.get<Prospect[]>('/prospects/search', {
      params: { q: query },
    });
    return response.data;
  }

  /**
   * Get prospect statistics
   */
  async getStats(): Promise<ProspectStats> {
    const response = await apiClient.get<ProspectStats>('/prospects/stats');
    return response.data;
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

    const response = await apiClient.post<{
      imported: number;
      errors: any[];
      warnings: any[];
    }>('/prospects/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Récupérer les documents d'un prospect
   */
  async getProspectDocuments(prospectId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/prospects/${prospectId}/documents`);
    return response.data;
  }

  /**
   * Récupérer les rendez-vous d'un prospect
   */
  async getProspectAppointments(
    prospectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    const response = await apiClient.get<PaginatedResponse<any>>(
      `/prospects/${prospectId}/appointments`,
      { params }
    );
    return response.data;
  }

  /**
   * Récupérer les campagnes associées à un prospect
   */
  async getProspectCampaigns(prospectId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/prospects/${prospectId}/campaigns`);
    return response.data;
  }

  /**
   * Fusionner deux prospects (en cas de doublon)
   */
  async mergeProspects(
    primaryId: string,
    secondaryId: string,
    data: { keepData: string[] }
  ): Promise<Prospect> {
    const response = await apiClient.post<Prospect>(
      `/prospects/${primaryId}/merge/${secondaryId}`,
      data
    );
    return response.data;
  }

  /**
   * Uploader l'avatar d'un prospect
   */
  async uploadAvatar(id: string, file: File): Promise<{ avatarUrl: string; prospect: Prospect }> {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await apiClient.post<{ avatarUrl: string; prospect: Prospect }>(
      `/prospects/${id}/avatar`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }
}

// Export d'une instance unique
const prospectsAPI = new ProspectsAPIService();

export default prospectsAPI;
