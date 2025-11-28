import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs gracieusement
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.warn('⚠️ Backend non disponible, utilisation des données mock');
      return Promise.reject({
        ...error,
        isBackendDown: true,
        message: 'Backend non disponible',
      });
    }

    if (error.response?.status === 401) {
      // Only redirect if not already on login page, not on home page
      if (typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login') &&
        window.location.pathname !== '/') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (typeof window !== 'undefined') {
        // Just clear tokens if we are on a public page like home
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

// Helper pour gérer les appels avec fallback mock
export const apiCallWithFallback = async <T>(
  apiCall: () => Promise<T>,
  mockData: T
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    if (error.isBackendDown) {
      console.log('📦 Utilisation des données mock');
      return mockData;
    }
    throw error;
  }
};

// Export both named and default
export { apiClient };
export default apiClient;