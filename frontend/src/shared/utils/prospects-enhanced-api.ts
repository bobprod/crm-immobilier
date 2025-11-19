import apiClient from './backend-api';

export const prospectsEnhancedAPI = {
  createProspectEnhanced: async (data: any) => {
    const response = await apiClient.post('/prospects-enhanced', data);
    return response.data;
  },

  getProspectFull: async (id: string) => {
    const response = await apiClient.get(`/prospects-enhanced/${id}/full`);
    return response.data;
  },

  addInteraction: async (prospectId: string, data: any) => {
    const response = await apiClient.post(
      `/prospects-enhanced/${prospectId}/interactions`,
      data
    );
    return response.data;
  },

  setPreference: async (prospectId: string, data: any) => {
    const response = await apiClient.post(
      `/prospects-enhanced/${prospectId}/preferences`,
      data
    );
    return response.data;
  },

  getPreferences: async (prospectId: string) => {
    const response = await apiClient.get(
      `/prospects-enhanced/${prospectId}/preferences`
    );
    return response.data;
  },

  recordPropertyShown: async (prospectId: string, data: any) => {
    const response = await apiClient.post(
      `/prospects-enhanced/${prospectId}/properties-shown`,
      data
    );
    return response.data;
  },

  changeStage: async (prospectId: string, stage: string) => {
    const response = await apiClient.put(
      `/prospects-enhanced/${prospectId}/stage`,
      { stage }
    );
    return response.data;
  },

  getProspectsByType: async (type: string) => {
    const response = await apiClient.get(
      `/prospects-enhanced/by-type/${type}`
    );
    return response.data;
  },

  getActionsToday: async () => {
    const response = await apiClient.get('/prospects-enhanced/actions/today');
    return response.data;
  },

  getStatsByType: async () => {
    const response = await apiClient.get('/prospects-enhanced/stats/by-type');
    return response.data;
  },

  smartSearch: async (criteria: any) => {
    const response = await apiClient.post(
      '/prospects-enhanced/search',
      criteria
    );
    return response.data;
  },

  getRecommendedProperties: async (prospectId: string, limit = 10) => {
    const response = await apiClient.get(
      `/prospects-enhanced/${prospectId}/recommended-properties`,
      { params: { limit } }
    );
    return response.data;
  },

  checkPropertyMatch: async (prospectId: string, propertyId: string) => {
    const response = await apiClient.post(
      `/prospects-enhanced/${prospectId}/match/${propertyId}`
    );
    return response.data;
  },
};
