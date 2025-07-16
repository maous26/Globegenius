// Common type definitions for the application

// Authentication types
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: 'admin' | 'user';
  subscription: 'free' | 'essential' | 'premium' | 'premium_plus';
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  lastLogin?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
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
  departureAirport?: string;
  acceptTerms: boolean;
}

// User preferences
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'fr' | 'en';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  alertSound?: boolean;
  departureAirports?: string[];
  maxBudget?: number;
  preferredCurrency?: string;
  notificationFrequency?: 'immediate' | 'daily' | 'weekly';
}

// Alert types
export interface Alert {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  maxPrice: number;
  currency: string;
  status: 'active' | 'paused' | 'triggered' | 'expired';
  createdAt: string;
  updatedAt: string;
  triggeredAt?: string;
  lastChecked?: string;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface AlertPreferences {
  maxAlertsPerDay: number;
  priceDropThreshold: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  discountThreshold: number;
  advancedFilters: {
    maxStops: number;
    preferredAirlines: string[];
    excludedAirlines: string[];
    timePreferences: {
      departureTime: string;
      arrivalTime: string;
    };
  };
}

// Flight types
export interface Flight {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  duration: number;
  stops: number;
  bookingClass: string;
  availableSeats: number;
  deepLink: string;
  validUntil: string;
}

export interface FlightSearch {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  class: 'economy' | 'premium_economy' | 'business' | 'first';
  currency: string;
}

export interface PriceHistory {
  id: string;
  routeId: string;
  price: number;
  currency: string;
  date: string;
  airline: string;
  source: string;
}

// Route types
export interface Route {
  id: string;
  origin: string;
  destination: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  scanFrequency: number;
  lastScan?: string;
  nextScan?: string;
  status: 'active' | 'paused' | 'error';
  avgPrice?: number;
  priceHistory: PriceHistory[];
  volume: number;
  priority: number;
}

// Metrics types
export interface Metrics {
  totalUsers: number;
  activeUsers: number;
  totalAlerts: number;
  activeAlerts: number;
  triggeredAlerts: number;
  avgResponseTime: number;
  apiCalls: number;
  errorRate: number;
}

export interface MetricsData {
  timestamp: string;
  value: number;
  type: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean | string;
  };
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string[]>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// Component types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  sorting?: {
    key: keyof T;
    direction: 'asc' | 'desc';
    onSort: (key: keyof T, direction: 'asc' | 'desc') => void;
  };
  selection?: {
    selected: string[];
    onSelect: (ids: string[]) => void;
  };
}

// Theme types
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    body: string;
    heading: string;
    mono: string;
  };
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'essential' | 'premium' | 'premium_plus';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  features: {
    alertsPerWeek: number | 'unlimited';
    departureAirports: number | 'unlimited';
    destinations: string;
    errorDetection: boolean;
    packageDeals?: boolean;
    smsAlerts?: boolean;
    priority: 'normal' | 'high' | 'very_high' | 'immediate';
    support: 'email' | 'priority' | '24/7';
    personalAgent?: boolean;
  };
  paymentMethod?: {
    type: 'card' | 'paypal';
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'alert' | 'system' | 'promotional';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
  actions?: Array<{
    label: string;
    action: string;
    style: 'primary' | 'secondary' | 'danger';
  }>;
}

// Admin types
export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user';
  subscription: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  lastLogin?: string;
  stats: {
    totalAlerts: number;
    activeAlerts: number;
    apiCalls: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    api: 'up' | 'down';
    scanner: 'up' | 'down';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type ArrayElement<T> = T extends (infer U)[] ? U : never;

export type ValueOf<T> = T[keyof T];

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type NonNullable<T> = T extends null | undefined ? never : T;
