import apiClient from './backend-api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'agent' | 'user';
}

interface UpdateUserDTO {
  email?: string;
  name?: string;
  role?: string;
  password?: string;
}

export const usersAPI = {
  /**
   * Créer un nouvel utilisateur
   */
  create: async (userData: CreateUserDTO): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  /**
   * Liste tous les utilisateurs avec filtres optionnels
   */
  list: async (filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> => {
    const response = await apiClient.get('/users', { params: filters });
    return response.data;
  },

  /**
   * Obtenir un utilisateur par ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Mettre à jour un utilisateur
   */
  update: async (id: string, updates: UpdateUserDTO): Promise<User> => {
    const response = await apiClient.patch(`/users/${id}`, updates);
    return response.data;
  },

  /**
   * Supprimer un utilisateur
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  /**
   * Obtenir le profil détaillé d'un utilisateur
   */
  getProfile: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/users/${id}/profile`);
    return response.data;
  },

  /**
   * Obtenir les statistiques d'un utilisateur
   */
  getStats: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/users/${id}/stats`);
    return response.data;
  },

  /**
   * Changer le mot de passe d'un utilisateur
   */
  changePassword: async (
    id: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.post(`/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
  },
};

export default usersAPI;
