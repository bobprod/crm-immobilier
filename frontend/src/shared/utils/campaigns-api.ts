import apiClient from './backend-api';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'mixed';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience: string[];
  message: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateCampaignDTO {
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'mixed';
  targetAudience: string[];
  message: string;
  scheduledAt?: string;
  templateId?: string;
}

interface CampaignStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
}

interface CampaignLead {
  id: string;
  prospectId: string;
  status: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  convertedAt?: string;
}

export const campaignsAPI = {
  /**
   * Créer une nouvelle campagne
   */
  create: async (campaignData: CreateCampaignDTO): Promise<Campaign> => {
    const response = await apiClient.post('/campaigns', campaignData);
    return response.data;
  },

  /**
   * Liste toutes les campagnes avec filtres optionnels
   */
  list: async (filters?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ campaigns: Campaign[]; total: number }> => {
    const response = await apiClient.get('/campaigns', { params: filters });
    return response.data;
  },

  /**
   * Obtenir une campagne par ID
   */
  getById: async (id: string): Promise<Campaign> => {
    const response = await apiClient.get(`/campaigns/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour une campagne
   */
  update: async (
    id: string,
    updates: Partial<CreateCampaignDTO>
  ): Promise<Campaign> => {
    const response = await apiClient.patch(`/campaigns/${id}`, updates);
    return response.data;
  },

  /**
   * Supprimer une campagne
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/campaigns/${id}`);
  },

  /**
   * Obtenir les statistiques d'une campagne
   */
  getStats: async (id: string): Promise<CampaignStats> => {
    const response = await apiClient.get(`/campaigns/${id}/stats`);
    return response.data;
  },

  /**
   * Obtenir les leads d'une campagne
   */
  getLeads: async (id: string): Promise<CampaignLead[]> => {
    const response = await apiClient.get(`/campaigns/${id}/leads`);
    return response.data;
  },

  /**
   * Convertir un lead de campagne en prospect
   */
  convertLead: async (campaignId: string, leadId: string): Promise<any> => {
    const response = await apiClient.post(
      `/campaigns/${campaignId}/leads/${leadId}/convert`
    );
    return response.data;
  },

  /**
   * Démarrer une campagne
   */
  start: async (id: string): Promise<Campaign> => {
    const response = await apiClient.post(`/campaigns/${id}/start`);
    return response.data;
  },

  /**
   * Mettre en pause une campagne
   */
  pause: async (id: string): Promise<Campaign> => {
    const response = await apiClient.post(`/campaigns/${id}/pause`);
    return response.data;
  },

  /**
   * Reprendre une campagne
   */
  resume: async (id: string): Promise<Campaign> => {
    const response = await apiClient.post(`/campaigns/${id}/resume`);
    return response.data;
  },

  /**
   * Terminer une campagne
   */
  complete: async (id: string): Promise<Campaign> => {
    const response = await apiClient.post(`/campaigns/${id}/complete`);
    return response.data;
  },

  /**
   * Dupliquer une campagne
   */
  duplicate: async (id: string, newName: string): Promise<Campaign> => {
    const response = await apiClient.post(`/campaigns/${id}/duplicate`, {
      name: newName,
    });
    return response.data;
  },

  /**
   * Tester une campagne avec un échantillon
   */
  test: async (id: string, testEmails: string[]): Promise<void> => {
    await apiClient.post(`/campaigns/${id}/test`, { testEmails });
  },
};

export default campaignsAPI;
