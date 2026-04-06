/**
 * Service API d'authentification
 * Architecture DDD - Module Core/Auth
 */

import { apiClient } from '../../../shared/utils/backend-api';

/**
 * Interfaces de types pour l'authentification
 */
export interface User {
  id: string;
  email: string;
  token?: string;
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
   * Utilise fetch() natif pour éviter les intercepteurs axios
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    console.log('[AuthAPI] Tentative de connexion avec:', credentials.email, 'vers', API_URL);

    let response: Response;
    try {
      response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
    } catch (networkError: any) {
      console.error('[AuthAPI] Erreur réseau:', networkError.message);
      const error: any = new Error(
        'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur ' + API_URL
      );
      error.status = 0;
      error.response = { status: 0, data: { message: error.message } };
      throw error;
    }

    console.log('[AuthAPI] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
      console.error('[AuthAPI] Erreur de connexion:', response.status, errorData);
      const error: any = new Error(errorData.message || `Login failed (${response.status})`);
      error.status = response.status;
      error.response = { status: response.status, data: errorData };
      throw error;
    }

    const authResponse: AuthResponse = await response.json();
    console.log(
      '[AuthAPI] Login response OK, accessToken:',
      authResponse.accessToken?.substring(0, 20) + '...'
    );

    // Vérifier la structure de la réponse
    if (!authResponse.accessToken || !authResponse.refreshToken) {
      console.error('[AuthAPI] Missing tokens in response:', authResponse);
      throw new Error('Invalid response format: missing tokens');
    }

    // Sauvegarder les tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', authResponse.accessToken);
      localStorage.setItem('refresh_token', authResponse.refreshToken);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    }
    console.log('[AuthAPI] Connexion réussie pour', credentials.email);
    return authResponse;
  }

  /**
   * Inscription utilisateur
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Utilisez directement apiClient.post
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    // Sauvegarder les tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.accessToken);
      localStorage.setItem('refresh_token', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }

    return response.data;
  }

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      // Utilisez directement apiClient.post
      await apiClient.post('/auth/logout', {});
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken(): Promise<{ accessToken: string }> {
    const refreshToken =
      typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Utilisez directement apiClient.post
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });

    // Mettre à jour le token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.accessToken);
    }

    return response.data;
  }

  /**
   * Obtenir le profil utilisateur connecté
   */
  async getProfile(): Promise<User> {
    // Utilisez directement apiClient.get
    const response = await apiClient.get<User>('/auth/me');

    // Mettre à jour le localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  }

  /**
   * Mettre à jour le profil
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    // Utilisez directement apiClient.patch
    const response = await apiClient.patch<User>('/auth/profile', data);

    // Mettre à jour le localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  }

  /**
   * Demander une réinitialisation de mot de passe
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  }

  /**
   * Confirmer la réinitialisation du mot de passe
   */
  async resetPassword(data: PasswordResetConfirm): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  }

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
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
    return localStorage.getItem('auth_token');
  }

  /**
   * Effacer toutes les données d'authentification
   */
  clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('auth_token');
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
