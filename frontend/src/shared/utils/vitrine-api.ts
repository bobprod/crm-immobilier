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
    const rows = Array.isArray(response.data) ? response.data : [];
    return rows.map((row: any) => ({
      propertyId: row.id,
      isFeatured: !!row.isFeatured,
      publishedOrder: row.publishedOrder ?? 0,
      property: {
        ...row,
      },
    }));
  },

  // Analytics
  getAnalytics: async (days = 30) => {
    const period = days <= 7 ? 'week' : days >= 365 ? 'year' : 'month';
    const response = await apiClient.get('/vitrine/analytics', {
      params: { period },
    });
    const payload = response.data || {};
    const total = payload.total || {};

    return {
      ...payload,
      totalViews: total.pageViews ?? 0,
      totalVisitors: total.visitors ?? 0,
      topProperties: payload.topProperties || [],
    };
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
