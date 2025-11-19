import apiClient from './backend-api';

/**
 * API Client pour le module Vitrine Publique
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
    const response = await apiClient.post('/vitrine/properties/publish', {
      propertyId,
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
    const response = await apiClient.get('/vitrine/properties');
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
    const response = await apiClient.get('/vitrine/leads');
    return response.data;
  },
};

/**
 * API Client pour les endpoints publics
 */
export const publicVitrineAPI = {
  getConfig: async (userId: string) => {
    const response = await apiClient.get('/public/config', {
      params: { userId },
    });
    return response.data;
  },

  getProperties: async (userId: string, filters?: any) => {
    const response = await apiClient.get('/public/properties', {
      params: { userId, ...filters },
    });
    return response.data;
  },

  getProperty: async (userId: string, propertyId: string) => {
    const response = await apiClient.get(`/public/properties/${propertyId}`, {
      params: { userId },
    });
    return response.data;
  },

  getFeaturedProperties: async (userId: string) => {
    const response = await apiClient.get('/public/properties/featured', {
      params: { userId },
    });
    return response.data;
  },

  contact: async (userId: string, data: any) => {
    const response = await apiClient.post('/public/contact', data, {
      params: { userId },
    });
    return response.data;
  },

  visitRequest: async (userId: string, data: any) => {
    const response = await apiClient.post('/public/visit-request', data, {
      params: { userId },
    });
    return response.data;
  },

  estimation: async (userId: string, data: any) => {
    const response = await apiClient.post('/public/estimation', data, {
      params: { userId },
    });
    return response.data;
  },
};

export default vitrineAPI;
