/**
 * Utilitaires pour la gestion du stockage local avec type safety
 */

// Clés de stockage
const STORAGE_KEYS = {
  AUTH_TOKEN: 'globe_genius_auth_token',
  REFRESH_TOKEN: 'globe_genius_refresh_token',
  USER_PREFERENCES: 'globe_genius_user_prefs',
  THEME: 'globe_genius_theme',
  LANGUAGE: 'globe_genius_language',
  ONBOARDING_COMPLETED: 'globe_genius_onboarding',
  LAST_SYNC: 'globe_genius_last_sync',
} as const;

// Types
interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'fr' | 'en';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  alertSound?: boolean;
}

// Classe de gestion du stockage sécurisé
class SecureStorage {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  /**
   * Vérifier la disponibilité du localStorage
   */
  private checkAvailability(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      console.warn('LocalStorage not available');
      return false;
    }
  }

  /**
   * Encoder une valeur en base64 (obfuscation basique)
   */
  private encode(value: string): string {
    try {
      return btoa(encodeURIComponent(value));
    } catch {
      return value;
    }
  }

  /**
   * Décoder une valeur depuis base64
   */
  private decode(value: string): string {
    try {
      return decodeURIComponent(atob(value));
    } catch {
      return value;
    }
  }

  /**
   * Sauvegarder une valeur
   */
  set(key: string, value: any, encode: boolean = false): void {
    if (!this.isAvailable) return;

    try {
      const serialized = JSON.stringify(value);
      const finalValue = encode ? this.encode(serialized) : serialized;
      localStorage.setItem(key, finalValue);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  /**
   * Récupérer une valeur
   */
  get<T = any>(key: string, decode: boolean = false): T | null {
    if (!this.isAvailable) return null;

    try {
      const value = localStorage.getItem(key);
      if (!value) return null;

      const decodedValue = decode ? this.decode(value) : value;
      return JSON.parse(decodedValue);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Supprimer une valeur
   */
  remove(key: string): void {
    if (!this.isAvailable) return;
    localStorage.removeItem(key);
  }

  /**
   * Vider tout le stockage
   */
  clear(): void {
    if (!this.isAvailable) return;
    localStorage.clear();
  }

  /**
   * Vérifier si une clé existe
   */
  has(key: string): boolean {
    if (!this.isAvailable) return false;
    return localStorage.getItem(key) !== null;
  }
}

// Instance du storage sécurisé
const storage = new SecureStorage();

// Export de l'instance storage pour utilisation externe
export { storage };

// Fonctions spécifiques pour l'authentification
export const authStorage = {
  /**
   * Sauvegarder les tokens d'authentification
   */
  setTokens(tokens: AuthTokens): void {
    storage.set(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken, true);
    if (tokens.refreshToken) {
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken, true);
    }
  },

  /**
   * Récupérer le token d'accès
   */
  getAccessToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.AUTH_TOKEN, true);
  },

  /**
   * Récupérer le refresh token
   */
  getRefreshToken(): string | null {
    return storage.get<string>(STORAGE_KEYS.REFRESH_TOKEN, true);
  },

  /**
   * Supprimer tous les tokens
   */
  clearTokens(): void {
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return storage.has(STORAGE_KEYS.AUTH_TOKEN);
  },
};

// Fonctions pour les préférences utilisateur
export const preferencesStorage = {
  /**
   * Sauvegarder les préférences
   */
  setPreferences(prefs: UserPreferences): void {
    const current = preferencesStorage.getPreferences();
    const updated = { ...current, ...prefs };
    storage.set(STORAGE_KEYS.USER_PREFERENCES, updated);
  },

  /**
   * Récupérer les préférences
   */
  getPreferences(): UserPreferences {
    return storage.get<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES) || {};
  },

  /**
   * Réinitialiser les préférences
   */
  clearPreferences(): void {
    storage.remove(STORAGE_KEYS.USER_PREFERENCES);
  },
};

// Fonctions pour le thème
export const themeStorage = {
  /**
   * Sauvegarder le thème
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    storage.set(STORAGE_KEYS.THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  /**
   * Récupérer le thème
   */
  getTheme(): 'light' | 'dark' | 'auto' {
    return storage.get<'light' | 'dark' | 'auto'>(STORAGE_KEYS.THEME) || 'auto';
  },
};

// Fonctions pour l'onboarding
export const onboardingStorage = {
  /**
   * Marquer l'onboarding comme complété
   */
  markCompleted(): void {
    storage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
  },

  /**
   * Vérifier si l'onboarding est complété
   */
  isCompleted(): boolean {
    return storage.get<boolean>(STORAGE_KEYS.ONBOARDING_COMPLETED) || false;
  },

  /**
   * Réinitialiser l'onboarding
   */
  reset(): void {
    storage.remove(STORAGE_KEYS.ONBOARDING_COMPLETED);
  },
};

// Fonctions pour la synchronisation
export const syncStorage = {
  /**
   * Sauvegarder la dernière synchronisation
   */
  setLastSync(timestamp: string = new Date().toISOString()): void {
    storage.set(STORAGE_KEYS.LAST_SYNC, timestamp);
  },

  /**
   * Récupérer la dernière synchronisation
   */
  getLastSync(): Date | null {
    const timestamp = storage.get<string>(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  },

  /**
   * Vérifier si une synchronisation est nécessaire
   */
  needsSync(intervalMinutes: number = 60): boolean {
    const lastSync = this.getLastSync();
    if (!lastSync) return true;

    const now = new Date();
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);
    return diffMinutes > intervalMinutes;
  },
};

// Fonctions utilitaires globales
export const clearAllStorage = (): void => {
  storage.clear();
};

export const getStorageSize = (): number => {
  if (!storage['isAvailable']) return 0;

  let size = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      size += localStorage[key].length + key.length;
    }
  }
  return size;
};

export const isStorageAvailable = (): boolean => {
  return storage['isAvailable'];
};

// Export des fonctions principales pour compatibilité
export const getStoredToken = (): AuthTokens | null => {
  const accessToken = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();
  
  if (!accessToken) return null;
  
  return {
    accessToken,
    refreshToken: refreshToken || undefined,
  };
};

export const setStoredToken = (tokens: AuthTokens): void => {
  authStorage.setTokens(tokens);
};

export const removeStoredToken = (): void => {
  authStorage.clearTokens();
};

// Session storage pour données temporaires
export const sessionStorage = {
  set(key: string, value: any): void {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('SessionStorage error:', error);
    }
  },

  get<T = any>(key: string): T | null {
    try {
      const value = window.sessionStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('SessionStorage error:', error);
      return null;
    }
  },

  remove(key: string): void {
    window.sessionStorage.removeItem(key);
  },

  clear(): void {
    window.sessionStorage.clear();
  },
};