import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authAPI, { type User } from '@/shared/utils/auth-api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Utiliser la méthode isAuthenticated de authAPI pour vérifier la présence du token
      if (authAPI.isAuthenticated()) {
        try {
          // Utiliser authAPI.getProfile pour récupérer les infos utilisateur
          const userData = await authAPI.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Auth check failed:', error);
          // For testing purposes, use stored user data if API call fails
          const storedUser = authAPI.getStoredUser();
          console.log('Auth check failed, stored user:', storedUser);
          if (storedUser) {
            console.log('Using stored user data for testing');
            setUser(storedUser);
          } else {
            console.log('No stored user, clearing auth data');
            authAPI.clearAuthData(); // Nettoyer les données si la vérification échoue
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  const register = async (email: string, password: string, firstName: string, lastName?: string) => {
    try {
      const response = await authAPI.register({ email, password, firstName, lastName });
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}


export default AuthProvider;

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
