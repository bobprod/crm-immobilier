import apiClient from './backend-api';

export const prospectsAIAPI = {
  // Analyser prospect avec IA
  analyzeProspect: async (prospectId: string, provider = 'openai') => {
    const response = await apiClient.post(
      `/prospects-ai/${prospectId}/analyze`,
      {},
      { params: { provider } }
    );
    return response.data;
  },

  // Générer message personnalisé
  generateMessage: async (
    prospectId: string,
    messageType: 'email' | 'sms' | 'whatsapp',
    context?: string,
    provider = 'openai'
  ) => {
    const response = await apiClient.post(`/prospects-ai/${prospectId}/generate-message`, {
      messageType,
      context,
      provider,
    });
    return response.data;
  },

  // Suggérer prochaines actions
  suggestActions: async (prospectId: string, provider = 'openai') => {
    const response = await apiClient.post(
      `/prospects-ai/${prospectId}/suggest-actions`,
      {},
      { params: { provider } }
    );
    return response.data;
  },

  // Prédire probabilité conversion
  predictConversion: async (prospectId: string, provider = 'openai') => {
    const response = await apiClient.post(
      `/prospects-ai/${prospectId}/predict-conversion`,
      {},
      { params: { provider } }
    );
    return response.data;
  },

  // Extraire préférences de texte
  extractPreferences: async (prospectId: string, text: string, provider = 'openai') => {
    const response = await apiClient.post(`/prospects-ai/${prospectId}/extract-preferences`, {
      text,
      provider,
    });
    return response.data;
  },

  // Générer résumé
  generateSummary: async (prospectId: string, provider = 'openai') => {
    const response = await apiClient.get(`/prospects-ai/${prospectId}/summary`, {
      params: { provider },
    });
    return response.data;
  },

  // Expliquer match
  explainMatch: async (prospectId: string, propertyId: string, provider = 'openai') => {
    const response = await apiClient.post(
      `/prospects-ai/${prospectId}/explain-match/${propertyId}`,
      {},
      { params: { provider } }
    );
    return response.data;
  },

  // Générer email de relance
  generateFollowUp: async (prospectId: string, lastInteraction?: any, provider = 'openai') => {
    const response = await apiClient.post(`/prospects-ai/${prospectId}/generate-follow-up`, {
      lastInteraction,
      provider,
    });
    return response.data;
  },
};
