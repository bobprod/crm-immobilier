/**
 * Client API principal pour communiquer avec le backend NestJS
 * Architecture professionnelle avec intercepteurs, gestion d'erreurs et typage
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuration de base
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Interface pour la configuration des requêtes
 */
interface ApiRequestConfig extends AxiosRequestConfig {
  requiresAuth?: boolean;
  retryCount?: number;
}

/**
 * Interface pour les réponses paginées
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Interface pour les paramètres de pagination
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

/**
 * Interface pour les réponses d'erreur standardisées
 */
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  timestamp?: string;
}

/**
 * Client API principal
 */
class ApiClient implements Pick<AxiosInstance, 'get' | 'post' | 'put' | 'patch' | 'delete'> {
  public instance: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configuration des intercepteurs de requêtes et réponses
   */
  private setupInterceptors(): void {
    // Intercepteur de requête
    this.instance.interceptors.request.use(
      (config) => {
        // Ajouter le token d'authentification si disponible
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log de la requête en développement
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log de la réponse en développement
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${response.status} ${response.config.url}`);
        }

        return response;
      },
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as ApiRequestConfig & { _retry?: boolean };

        // Gestion spécifique des erreurs 401 (Non autorisé)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          if (this.isRefreshing) {
            // Attendre que le rafraîchissement soit terminé
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(() => {
              return this.instance(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          try {
            this.isRefreshing = true;
            await this.refreshToken();

            // Réessayer la requête originale
            return this.instance(originalRequest);
          } catch (refreshError) {
            // Échec du refresh : déconnecter l'utilisateur
            this.clearAuthData();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
            this.processFailedQueue();
          }
        }

        // Gestion des autres erreurs
        return this.handleError(error);
      }
    );
  }

  /**
   * Traiter la file d'attente des requêtes échouées
   */
  private processFailedQueue(): void {
    this.failedQueue.forEach(({ resolve }) => {
      resolve();
    });
    this.failedQueue = [];
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: AxiosError<ApiError>): Promise<never> {
    const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
    const errorCode = error.response?.data?.code;
    const status = error.response?.status;

    // Log d'erreur en développement
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error] ${status}: ${errorMessage}`, error);
    }

    // Créer une erreur personnalisée
    const customError = new Error(errorMessage) as Error & {
      status?: number;
      code?: string;
      details?: any
    };

    customError.status = status;
    customError.code = errorCode;
    customError.details = error.response?.data?.details;

    return Promise.reject(customError);
  }

  /**
   * Obtenir le token d'accès depuis localStorage
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * Obtenir le token de rafraîchissement depuis localStorage
   */
  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  /**
   * Rafraîchir le token d'accès
   */
  private async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.instance.post('/auth/refresh', { refreshToken });
      const { accessToken } = response.data;

      localStorage.setItem('access_token', accessToken);
    } catch (error) {
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Effacer les données d'authentification
   */
  private clearAuthData(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Méthodes HTTP génériques
   */
  async get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await this.instance.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    const response = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    const response = await this.instance.delete(url, config);
    return response.data;
  }

  /**
   * Télécharger des fichiers
   */
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: ApiRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      } : undefined,
    };

    return this.post<T>(url, formData, config);
  }

  /**
   * Télécharger des fichiers multiples
   */
  async uploadMultiple<T>(url: string, files: File[], onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const config: ApiRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      } : undefined,
    };

    return this.post<T>(url, formData, config);
  }

  /**
   * Télécharger un fichier
   */
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Export d'une instance unique
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient };
