import apiClient from './backend-api';

export const prospectingFunnelAPI = {
  // Configurer le funnel
  configureFunnel: async (config: {
    location?: string;
    propertyType?: string[];
    targetType?: string[];
    budgetMin?: number;
    budgetMax?: number;
    sources?: string[];
    minLeadScore?: number;
    maxLeadsPerSource?: number;
    totalTarget?: number;
    useAI?: boolean;
    aiProvider?: string;
  }) => {
    const response = await apiClient.post('/prospecting/funnel/configure', config);
    return response.data;
  },

  // Lancer le scraping
  scrapeMultipleSources: async (campaignId: string, config: any) => {
    const response = await apiClient.post(
      `/prospecting/funnel/${campaignId}/scrape`,
      config,
    );
    return response.data;
  },

  // Enrichir avec AI
  enhanceWithAI: async (campaignId: string, aiProvider: string) => {
    const response = await apiClient.post(
      `/prospecting/funnel/${campaignId}/enhance`,
      { aiProvider },
    );
    return response.data;
  },

  // Qualifier les leads
  qualifyLeads: async (campaignId: string, criteria: any) => {
    const response = await apiClient.post(
      `/prospecting/funnel/${campaignId}/qualify`,
      criteria,
    );
    return response.data;
  },
};
