import apiClient from './backend-api';

export const aiMetricsAPI = {
  // Tracker utilisation agent
  trackUsage: async (data: {
    prospectId?: string;
    propertyId?: string;
    agentType: 'prospection' | 'matching' | 'nurturing' | 'closing' | 'analysis';
    actionType: string;
    inputTokens?: number;
    outputTokens?: number;
    resultType?: string;
    resultValue?: number;
    metadata?: any;
  }) => {
    const response = await apiClient.post('/ai-metrics/track-usage', data);
    return response.data;
  },

  // Tracker conversion
  trackConversion: async (data: {
    prospectId?: string;
    propertyId?: string;
    eventType: string;
    eventValue: number;
    commission?: number;
    aiAssisted: boolean;
    assistingAgents?: string[];
  }) => {
    const response = await apiClient.post('/ai-metrics/track-conversion', data);
    return response.data;
  },

  // ROI mensuel
  getMonthlyROI: async () => {
    const response = await apiClient.get('/ai-metrics/monthly-roi');
    return response.data;
  },

  // Performances agents
  getAgentPerformance: async (agentType?: string) => {
    const response = await apiClient.get('/ai-metrics/agent-performance', {
      params: { agentType },
    });
    return response.data;
  },

  // Facturation
  getBilling: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/ai-metrics/billing', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // Dashboard complet
  getDashboard: async () => {
    const response = await apiClient.get('/ai-metrics/dashboard');
    return response.data;
  },

  // Comparer modèles
  compareModels: async () => {
    const response = await apiClient.get('/ai-metrics/compare-models');
    return response.data;
  },
};
