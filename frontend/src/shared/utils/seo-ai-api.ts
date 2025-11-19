import apiClient from './backend-api';

/**
 * API Client pour le module SEO AI
 */
export const seoAiAPI = {
  /**
   * Optimiser automatiquement un bien pour le SEO
   */
  optimizeProperty: async (propertyId: string) => {
    const response = await apiClient.post(`/seo-ai/optimize/${propertyId}`);
    return response.data;
  },

  /**
   * Récupérer les données SEO d'un bien
   */
  getPropertySeo: async (propertyId: string) => {
    const response = await apiClient.get(`/seo-ai/property/${propertyId}`);
    return response.data;
  },

  /**
   * Générer un alt text pour une image
   */
  generateAltText: async (propertyId: string, imageUrl: string, imageIndex: number) => {
    const response = await apiClient.post('/seo-ai/generate/alt-text', {
      propertyId,
      imageUrl,
      imageIndex,
    });
    return response.data;
  },

  /**
   * Optimiser plusieurs biens en batch
   */
  optimizeBatch: async (propertyIds: string[]) => {
    const response = await apiClient.post('/seo-ai/optimize/batch', {
      propertyIds,
    });
    return response.data;
  },
};

export default seoAiAPI;
