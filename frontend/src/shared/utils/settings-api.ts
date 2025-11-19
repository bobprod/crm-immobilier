import apiClient from './backend-api';

export const settingsAPI = {
  // Récupérer tous les paramètres
  getAllSettings: async () => {
    const response = await apiClient.get('/settings');
    return response.data;
  },

  // Récupérer les paramètres d'une section
  getSectionSettings: async (section: string) => {
    const response = await apiClient.get(`/settings/${section}`);
    return response.data;
  },

  // Récupérer un paramètre spécifique
  getSetting: async (section: string, key: string) => {
    const response = await apiClient.get(`/settings/${section}/${key}`);
    return response.data;
  },

  // Définir un paramètre
  setSetting: async (
    section: string,
    key: string,
    value: any,
    encrypted = false,
    description?: string
  ) => {
    const response = await apiClient.post(`/settings/${section}/${key}`, {
      value,
      encrypted,
      description,
    });
    return response.data;
  },

  // Mettre à jour plusieurs paramètres
  updateSectionSettings: async (
    section: string,
    settings: Array<{ key: string; value: any; encrypted?: boolean }>
  ) => {
    const response = await apiClient.post(`/settings/${section}/bulk`, {
      settings,
    });
    return response.data;
  },

  // Supprimer un paramètre
  deleteSetting: async (section: string, key: string) => {
    const response = await apiClient.delete(`/settings/${section}/${key}`);
    return response.data;
  },

  // Supprimer une section
  deleteSection: async (section: string) => {
    const response = await apiClient.delete(`/settings/${section}`);
    return response.data;
  },

  // Tester une connexion
  testConnection: async (section: string) => {
    const response = await apiClient.post(`/settings/${section}/test`);
    return response.data;
  },

  // Configuration Pica AI
  getPicaAIConfig: async () => {
    const response = await apiClient.get('/settings/pica-ai/config');
    return response.data;
  },
};
