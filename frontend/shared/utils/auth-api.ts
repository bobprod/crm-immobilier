ise/**
 * Service API d'authentification
 * Architecture DDD - Module Core/Auth
 */

import * as apiClientModule from './api-client';
const apiClient = apiClientModule.default;
import { PaginatedResponse } from './api-client';

/**
 * Interfaces de types pour l'authentification
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'agent' | 'manager';
  agencyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * Service d'authentification API
 */
class AuthAPIService {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('[AuthAPI] Tentative de connexion avec:', credentials.email);
    let authResponse: AuthResponse;
    try {
      authResponse = await apiClient.post<AuthResponse>('/auth/login', credentials);

      // Sauvegarder les tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', authResponse.accessToken);
        localStorage.setItem('refresh_token', authResponse.refreshToken);
        localStorage.setItem('user', JSON.stringify(authResponse.user));
      }
      console.log('[AuthAPI] Connexion réussie pour', credentials.email);
    } catch (error: any) {
      console.error('[AuthAPI] Erreur de connexion:', error.status, error.message, error.details);
      throw error;
    }
    return authResponse;

  }

  /**
   * Inscription utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Sauvegarder les tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken });

    // Mettre à jour le token
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.accessToken);
    }

    return response;
  }

  /**
   * Obtenir le profil utilisateur connecté
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');

    // Mettre à jour le localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response));
    }

    return response;
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', data);

    // Mettre à jour le localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response));
    }

    return response;
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/forgot-password', data);
  }

  /**
   * Confirmer la réinitialisation du mot de passe
   */
  async resetPassword(data: PasswordResetConfirm): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/auth/reset-password', data);
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  }

  /**
   * Obtenir l'utilisateur depuis le localStorage
   */
  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erreur parsing user:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Obtenir le token d'accès
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * Effacer toutes les données d'authentification
   */
  clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    loginAttempts: number;
    failedLogins: number;
  }> {
    return apiClient.get('/auth/stats');
  }
}

// Export d'une instance unique
const authAPI = new AuthAPIService();

export default authAPI;
