import apiClient from './backend-api';

// Réexporter les types depuis le client principal
export type {
  VitrineConfig,
  PublicProperty,
  PublicAgent,
  SubmitLeadData,
  PropertyFilters,
} from './public-vitrine-api';

/**
 * API Client authentifié pour le dashboard Vitrine (SaaS)
 */
export const vitrineAPI = {
  // Configuration
  getConfig: async () => {
    const response = await apiClient.get('/vitrine/config');
    return response.data;
  },

  updateConfig: async (config: any) => {
    const response = await apiClient.put('/vitrine/config', config);
    return response.data;
  },

  toggleVitrine: async (isActive: boolean) => {
    const response = await apiClient.post('/vitrine/config/toggle', { isActive });
    return response.data;
  },

  // Gestion biens publiés
  publishProperty: async (propertyId: string, isFeatured = false, order = 0) => {
    const response = await apiClient.post(`/vitrine/properties/${propertyId}/publish`, {
      isFeatured,
      order,
    });
    return response.data;
  },

  unpublishProperty: async (propertyId: string) => {
    const response = await apiClient.delete(`/vitrine/properties/${propertyId}/unpublish`);
    return response.data;
  },

  getPublishedProperties: async () => {
    const response = await apiClient.get('/vitrine/published-properties');
    return response.data;
  },

  // Analytics
  getAnalytics: async (days = 30) => {
    const response = await apiClient.get('/vitrine/analytics', {
      params: { days },
    });
    return response.data;
  },

  // Leads
  getVitrineLeads: async () => {
    const response = await apiClient.get('/vitrine/public-leads');
    return response.data;
  },

  // Agents
  getAgentProfiles: async () => {
    const response = await apiClient.get('/vitrine/agents');
    return response.data;
  },

  upsertAgentProfile: async (data: any) => {
    const response = await apiClient.post('/vitrine/agents', data);
    return response.data;
  },

  deleteAgentProfile: async (agentId: string) => {
    const response = await apiClient.delete(`/vitrine/agents/${agentId}`);
    return response.data;
  },
};

export default vitrineAPI;
