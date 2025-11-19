import apiClient from './backend-api';

export const analyticsAPI = {
  getDashboard: async () => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data;
  },

  getProspectsStats: async () => {
    const response = await apiClient.get('/analytics/prospects');
    return response.data;
  },

  getPropertiesStats: async () => {
    const response = await apiClient.get('/analytics/properties');
    return response.data;
  },

  getCommunicationsStats: async () => {
    const response = await apiClient.get('/analytics/communications');
    return response.data;
  },

  getAppointmentsStats: async () => {
    const response = await apiClient.get('/analytics/appointments');
    return response.data;
  },

  getTasksStats: async () => {
    const response = await apiClient.get('/analytics/tasks');
    return response.data;
  },

  getActivity: async (limit = 10) => {
    const response = await apiClient.get('/analytics/activity', {
      params: { limit },
    });
    return response.data;
  },

  getTrends: async (period: 'week' | 'month' | 'year' = 'month') => {
    const response = await apiClient.get('/analytics/trends', {
      params: { period },
    });
    return response.data;
  },

  getKPIs: async () => {
    const response = await apiClient.get('/analytics/kpis');
    return response.data;
  },
};
