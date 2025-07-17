import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api, { authService } from '../services/api';
import { authStorage } from '../utils/storage';

interface User {
  id: string;
  email: string;
  departureAirport?: string;
  status: 'free' | 'essential' | 'premium' | 'premium_plus';
  emailVerified: boolean;
  preferences?: any;
  role?: 'admin' | 'user';
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departureAirport?: string;
  acceptTerms: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Vérifier l'authentification au chargement
  const checkAuth = useCallback(async () => {
    try {
      const token = authStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Vérifier le token auprès de l'API
      const response = await authService.getProfile();
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      authStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Intercepteur pour gérer le refresh token automatique
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => {
        // Vérifier si un nouveau token est fourni
        const newToken = response.headers['x-new-token'];
        if (newToken) {
          authStorage.setTokens({ accessToken: newToken });
        }
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Tenter de rafraîchir le token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await authService.refreshToken(refreshToken);
              const { accessToken } = response.data.data;
              authStorage.setTokens({ accessToken });
              
              // Réessayer la requête originale
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // Échec du refresh, déconnecter l'utilisateur
            authStorage.clearTokens();
            setUser(null);
            navigate('/login');
            toast.error('Session expirée, veuillez vous reconnecter');
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      const { user, accessToken, refreshToken } = response.data.data;
      setUser(user);
      authStorage.setTokens({ accessToken, refreshToken });
      
      toast.success('Connexion réussie !');
      
      // Rediriger vers le tableau de bord
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur de connexion';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      
      const { user, accessToken, refreshToken } = response.data.data;
      setUser(user);
      authStorage.setTokens({ accessToken, refreshToken });
      
      toast.success('Inscription réussie ! Bienvenue sur GlobeGenius 🎉');
      toast('Vérifiez votre email pour activer votre compte', { icon: '📧' });
      
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authStorage.clearTokens();
      setUser(null);
      navigate('/');
      toast.success('Déconnexion réussie');
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};