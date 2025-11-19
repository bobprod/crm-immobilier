import axios from 'axios';

// API Client for backend communication
const backendApiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

backendApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

backendApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    backendApiClient.post('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    backendApiClient.post('/auth/register', { email, password, name }),
};

export const propertiesAPI = {
  getAll: (filters?: any) =>
    backendApiClient.get('/properties', { params: filters }),
  getById: (id: string) =>
    backendApiClient.get(`/properties/${id}`),
  create: (data: any) =>
    backendApiClient.post('/properties', data),
  update: (id: string, data: any) =>
    backendApiClient.put(`/properties/${id}`, data),
  delete: (id: string) =>
    backendApiClient.delete(`/properties/${id}`),
  syncWordPress: (id: string) =>
    backendApiClient.put(`/properties/${id}/sync-wordpress`),
};

export const prospectsAPI = {
  getAll: (filters?: any) =>
    backendApiClient.get('/prospects', { params: filters }),
  getById: (id: string) =>
    backendApiClient.get(`/prospects/${id}`),
  create: (data: any) =>
    backendApiClient.post('/prospects', data),
  update: (id: string, data: any) =>
    backendApiClient.put(`/prospects/${id}`, data),
  delete: (id: string) =>
    backendApiClient.delete(`/prospects/${id}`),
  addInteraction: (id: string, data: any) =>
    backendApiClient.post(`/prospects/${id}/interactions`, data),
  getInteractions: (id: string) =>
    backendApiClient.get(`/prospects/${id}/interactions`),
};

export const dashboardAPI = {
  getStats: () =>
    backendApiClient.get('/dashboard/stats'),
  getRecentActivities: () =>
    backendApiClient.get('/dashboard/activities'),
};

export const matchingAPI = {
  getMatches: (filters?: any) =>
    backendApiClient.get('/matching', { params: filters }),
  getMatchById: (id: string) =>
    backendApiClient.get(`/matching/${id}`),
};

export const campaignsAPI = {
  getAll: () =>
    backendApiClient.get('/campaigns'),
  getById: (id: string) =>
    backendApiClient.get(`/campaigns/${id}`),
  create: (data: any) =>
    backendApiClient.post('/campaigns', data),
  update: (id: string, data: any) =>
    backendApiClient.put(`/campaigns/${id}`, data),
  delete: (id: string) =>
    backendApiClient.delete(`/campaigns/${id}`),
};

// Helper methods for components
const apiClientHelpers = {
  getDashboardStats: async () => {
    const response = await backendApiClient.get('/dashboard/stats');
    return response.data;
  },
  getIntegrations: async () => {
    const response = await backendApiClient.get('/integrations');
    return response.data;
  },
  getAIProviders: async () => {
    const response = await backendApiClient.get('/integrations/ai-providers');
    return response.data;
  },
  updateIntegration: async (type: string, data: any) => {
    const response = await backendApiClient.put(`/integrations/${type}`, data);
    return response.data;
  },
  updateAIProvider: async (provider: string, data: any) => {
    const response = await backendApiClient.put(`/integrations/ai-providers/${provider}`, data);
    return response.data;
  },
};

export const apiClient = Object.assign(backendApiClient, apiClientHelpers);
