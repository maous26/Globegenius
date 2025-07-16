// Validation utilities
export const validators = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password strength
   */
  password: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Validate required field
   */
  required: (value: any): boolean => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  },

  /**
   * Validate minimum length
   */
  minLength: (value: string, min: number): boolean => {
    return value.length >= min;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value: string, max: number): boolean => {
    return value.length <= max;
  },

  /**
   * Validate phone number (French format)
   */
  phone: (phone: string): boolean => {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate URL
   */
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  date: (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0] === date;
  },

  /**
   * Validate that date is in the future
   */
  futureDate: (date: string): boolean => {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate > today;
  },

  /**
   * Validate airport code (3 letters)
   */
  airportCode: (code: string): boolean => {
    const airportRegex = /^[A-Z]{3}$/;
    return airportRegex.test(code);
  },

  /**
   * Validate numeric value
   */
  numeric: (value: string): boolean => {
    return !isNaN(Number(value)) && isFinite(Number(value));
  },

  /**
   * Validate positive number
   */
  positiveNumber: (value: string | number): boolean => {
    const num = typeof value === 'string' ? Number(value) : value;
    return !isNaN(num) && num > 0;
  },

  /**
   * Validate range
   */
  range: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },
};

/**
 * Form validation helper
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ((value: any) => boolean | { isValid: boolean; errors: string[] })[]>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  
  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const fieldErrors: string[] = [];
    
    fieldRules.forEach(rule => {
      const result = rule(data[field]);
      
      if (typeof result === 'boolean') {
        if (!result) {
          fieldErrors.push(`Le champ ${field} est invalide`);
        }
      } else {
        if (!result.isValid) {
          fieldErrors.push(...result.errors);
        }
      }
    });
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize input string
 */
export const sanitize = {
  /**
   * Remove HTML tags
   */
  html: (input: string): string => {
    return input.replace(/<[^>]*>/g, '');
  },

  /**
   * Trim whitespace
   */
  trim: (input: string): string => {
    return input.trim();
  },

  /**
   * Remove special characters (keep alphanumeric and spaces)
   */
  alphanumeric: (input: string): string => {
    return input.replace(/[^a-zA-Z0-9\s]/g, '');
  },

  /**
   * Normalize phone number
   */
  phone: (phone: string): string => {
    return phone.replace(/[\s.-]/g, '');
  },

  /**
   * Normalize email
   */
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },
};
