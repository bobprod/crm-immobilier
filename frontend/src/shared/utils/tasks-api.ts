import apiClient from './backend-api';

export const tasksAPI = {
  create: async (data: any) => {
    const response = await apiClient.post('/tasks', data);
    return response.data;
  },

  getAll: async (filters?: any) => {
    const response = await apiClient.get('/tasks', { params: filters });
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await apiClient.get(`/tasks/${id}`);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/tasks/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.put(`/tasks/${id}/complete`);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get('/tasks/stats');
    return response.data;
  },

  getToday: async () => {
    const response = await apiClient.get('/tasks/today');
    return response.data;
  },

  getOverdue: async () => {
    const response = await apiClient.get('/tasks/overdue');
    return response.data;
  },
};
