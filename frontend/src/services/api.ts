import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '../utils/storage';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Debug: Log the API base URL
console.log('🔧 API Base URL:', API_BASE_URL);
console.log('🔧 Environment VITE_API_URL:', import.meta.env.VITE_API_URL);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Debug: Log the full request URL
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log('🚀 Making request to:', fullUrl);
    console.log('🔧 Base URL:', config.baseURL);
    console.log('🔧 Endpoint:', config.url);
    console.log('🔧 Method:', config.method?.toUpperCase());
    
    // Add auth token if available
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error logging for debugging
    console.error('❌ API Error Details:');
    console.error('  Status:', error.response?.status);
    console.error('  URL:', error.config?.url);
    console.error('  Base URL:', error.config?.baseURL);
    console.error('  Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    console.error('  Method:', error.config?.method?.toUpperCase());
    console.error('  Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Clear auth data on 401
      authStorage.clearTokens();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    return api.post('/auth/register', userData);
  },
  
  logout: () => {
    return api.post('/auth/logout');
  },
  
  refreshToken: (refreshToken: string) => {
    return api.post('/auth/refresh', { refreshToken });
  },
  
  getProfile: () => {
    return api.get('/auth/profile');
  },
  
  updateProfile: (profileData: any) => {
    return api.put('/auth/profile', profileData);
  },
  
  forgotPassword: (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token: string, password: string) => {
    return api.post('/auth/reset-password', { token, password });
  },
  
  verifyEmail: (token: string) => {
    return api.post('/auth/verify-email', { token });
  },
  
  resendVerification: (email: string) => {
    return api.post('/auth/resend-verification', { email });
  }
};

// User endpoints
export const userAPI = {
  getUsers: () => {
    return api.get('/users');
  },
  
  getUser: (id: string) => {
    return api.get(`/users/${id}`);
  },
  
  updateUser: (id: string, userData: any) => {
    return api.put(`/users/${id}`, userData);
  },
  
  deleteUser: (id: string) => {
    return api.delete(`/users/${id}`);
  }
};

// Alert endpoints
export const alertAPI = {
  getAlerts: (params?: any) => {
    return api.get('/alerts', { params });
  },
  
  createAlert: (alertData: any) => {
    return api.post('/alerts', alertData);
  },
  
  updateAlert: (id: string, alertData: any) => {
    return api.put(`/alerts/${id}`, alertData);
  },
  
  deleteAlert: (id: string) => {
    return api.delete(`/alerts/${id}`);
  },
  
  getStats: () => {
    return api.get('/alerts/stats');
  },
  
  markAsOpened: (id: string) => {
    return api.put(`/alerts/${id}/opened`);
  },
  
  markAsClicked: (id: string) => {
    return api.put(`/alerts/${id}/clicked`);
  },
  
  submitFeedback: (id: string, feedback: any) => {
    return api.post(`/alerts/${id}/feedback`, feedback);
  }
};

// Metrics endpoints
export const metricsAPI = {
  getMetrics: (params?: any) => {
    return api.get('/metrics', { params });
  },
  
  getDashboardStats: () => {
    return api.get('/metrics/dashboard');
  },
  
  getUserMetrics: (userId: string) => {
    return api.get(`/metrics/users/${userId}`);
  },
  
  getRealtime: () => {
    return api.get('/metrics/realtime');
  }
};

// Admin endpoints
export const adminAPI = {
  getStats: () => {
    return api.get('/admin/stats');
  },
  
  getUsers: () => {
    return api.get('/admin/users');
  },
  
  updateUserStatus: (userId: string, status: string) => {
    return api.put(`/admin/users/${userId}/status`, { status });
  },
  
  getSystemHealth: () => {
    return api.get('/admin/health');
  }
};

// Legacy aliases for backwards compatibility
export const authService = authAPI;
export const userService = userAPI;
export const alertService = alertAPI;
export const metricsService = metricsAPI;
export const adminService = adminAPI;

export default api;