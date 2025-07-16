// Application constants
export const APP_NAME = 'GlobeGenius';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Service d\'alertes voyage intelligent';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000;

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
  LAST_SYNC: 'lastSync',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PREFERENCES: '/preferences',
  PRICING: '/pricing',
} as const;

// Theme Options
export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Languages
export const LANGUAGES = {
  FRENCH: 'fr',
  ENGLISH: 'en',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  USERS: {
    PROFILE: '/users/profile',
    PASSWORD: '/users/password',
    ACCOUNT: '/users/account',
    SUBSCRIPTION: '/users/subscription',
  },
  ALERTS: {
    LIST: '/alerts',
    PREFERENCES: '/alerts/preferences',
    STATS: '/alerts/stats',
    OPEN: (id: string) => `/alerts/${id}/open`,
    CLICK: (id: string) => `/alerts/${id}/click`,
    FEEDBACK: (id: string) => `/alerts/${id}/feedback`,
  },
  METRICS: {
    REALTIME: '/metrics/realtime',
    HISTORICAL: '/metrics/historical',
    EXPORT: '/metrics/export',
  },
  ADMIN: {
    USERS: '/admin/users',
    ROUTES: '/admin/routes',
    HEALTH: '/admin/health',
    API_USAGE: '/admin/api-usage',
  },
} as const;

// Default Values
export const DEFAULT_PREFERENCES = {
  theme: THEME_OPTIONS.AUTO,
  language: LANGUAGES.FRENCH,
  emailNotifications: true,
  pushNotifications: true,
  alertSound: true,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de réseau. Veuillez vérifier votre connexion.',
  UNAUTHORIZED: 'Session expirée. Veuillez vous reconnecter.',
  FORBIDDEN: 'Accès interdit.',
  NOT_FOUND: 'Ressource non trouvée.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  VALIDATION_ERROR: 'Données invalides.',
  UNKNOWN_ERROR: 'Une erreur inconnue s\'est produite.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie !',
  LOGOUT_SUCCESS: 'Déconnexion réussie !',
  REGISTER_SUCCESS: 'Inscription réussie !',
  PROFILE_UPDATED: 'Profil mis à jour avec succès !',
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès !',
  PREFERENCES_SAVED: 'Préférences sauvegardées !',
} as const;

// Query Keys for React Query
export const QUERY_KEYS = {
  USER_PROFILE: ['user', 'profile'],
  ALERTS: ['alerts'],
  ALERT_PREFERENCES: ['alerts', 'preferences'],
  ALERT_STATS: ['alerts', 'stats'],
  METRICS_REALTIME: ['metrics', 'realtime'],
  METRICS_HISTORICAL: ['metrics', 'historical'],
  ADMIN_USERS: ['admin', 'users'],
  ADMIN_ROUTES: ['admin', 'routes'],
  ADMIN_HEALTH: ['admin', 'health'],
  ADMIN_API_USAGE: ['admin', 'api-usage'],
} as const;

// Animation Variants
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  xs: 475,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920,
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
} as const;
