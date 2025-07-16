import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Formatting utilities
export const formatters = {
  /**
   * Format currency
   */
  currency: (amount: number, currency: string = 'EUR'): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  /**
   * Format number with thousand separators
   */
  number: (value: number): string => {
    return new Intl.NumberFormat('fr-FR').format(value);
  },

  /**
   * Format percentage
   */
  percentage: (value: number, decimals: number = 1): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  },

  /**
   * Format date
   */
  date: (date: string | Date, formatString: string = 'dd/MM/yyyy'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatString, { locale: fr });
  },

  /**
   * Format date with time
   */
  dateTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: fr });
  },

  /**
   * Format relative time (e.g., "il y a 2 heures")
   */
  relativeTime: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
  },

  /**
   * Format time duration in minutes to human readable
   */
  duration: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins}min`;
    } else if (mins === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${mins}min`;
    }
  },

  /**
   * Format file size
   */
  fileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * Format phone number for display
   */
  phone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    return phone;
  },

  /**
   * Format text to title case
   */
  titleCase: (text: string): string => {
    return text.replace(/\w\S*/g, (word) => {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    });
  },

  /**
   * Format text to sentence case
   */
  sentenceCase: (text: string): string => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  /**
   * Truncate text with ellipsis
   */
  truncate: (text: string, maxLength: number, suffix: string = '...'): string => {
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  /**
   * Format airport code for display
   */
  airportCode: (code: string): string => {
    return code.toUpperCase();
  },

  /**
   * Format flight number
   */
  flightNumber: (airline: string, number: string): string => {
    return `${airline.toUpperCase()} ${number}`;
  },

  /**
   * Format discount percentage
   */
  discount: (originalPrice: number, discountedPrice: number): string => {
    const discount = ((originalPrice - discountedPrice) / originalPrice) * 100;
    return `${Math.round(discount)}%`;
  },

  /**
   * Format price change
   */
  priceChange: (oldPrice: number, newPrice: number): {
    amount: string;
    percentage: string;
    direction: 'up' | 'down' | 'same';
  } => {
    const change = newPrice - oldPrice;
    const changePercent = (change / oldPrice) * 100;
    
    let direction: 'up' | 'down' | 'same';
    if (change > 0) {
      direction = 'up';
    } else if (change < 0) {
      direction = 'down';
    } else {
      direction = 'same';
    }
    
    return {
      amount: formatters.currency(Math.abs(change)),
      percentage: `${Math.abs(changePercent).toFixed(1)}%`,
      direction,
    };
  },

  /**
   * Format API response status
   */
  apiStatus: (status: number): string => {
    const statusMap: Record<number, string> = {
      200: 'Succès',
      201: 'Créé',
      400: 'Requête invalide',
      401: 'Non autorisé',
      403: 'Interdit',
      404: 'Non trouvé',
      500: 'Erreur serveur',
    };
    
    return statusMap[status] || `Statut ${status}`;
  },

  /**
   * Format user role for display
   */
  userRole: (role: string): string => {
    const roleMap: Record<string, string> = {
      admin: 'Administrateur',
      user: 'Utilisateur',
      premium: 'Premium',
      free: 'Gratuit',
    };
    
    return roleMap[role] || formatters.titleCase(role);
  },

  /**
   * Format subscription status
   */
  subscriptionStatus: (status: string): string => {
    const statusMap: Record<string, string> = {
      active: 'Actif',
      inactive: 'Inactif',
      cancelled: 'Annulé',
      expired: 'Expiré',
      pending: 'En attente',
    };
    
    return statusMap[status] || formatters.titleCase(status);
  },
};
