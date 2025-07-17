import api from './api';

interface AdminDashboardStats {
  users: {
    total: number;
    active: number;
    growth: number;
    byPlan: {
      free: number;
      basic: number;
      premium: number;
      premiumPlus: number;
    };
  };
  alerts: {
    total: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    arpu: number;
  };
  routes: {
    total: number;
    active: number;
    tier1: number;
    tier2: number;
    tier3: number;
    topPerforming: Array<{
      origin: string;
      destination: string;
      volume: number;
      alertCount: number;
      successRate: number;
    }>;
  };
  system: {
    uptime: number;
    cpu: number;
    memory: number;
    errors: number;
    apiCalls: {
      total: number;
      thisMonth: number;
      limit: number;
    };
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: string;
  createdAt: string;
  lastLogin: string;
  alertsCount: number;
  totalSpent: number;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  tier: string;
  avgVolume: number;
  scanFrequency: number;
  isActive: boolean;
  lastScan: string;
  alertCount: number;
  successRate: number;
  priority: string;
}

interface Analytics {
  engagement: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
    unsubscribeRate: number;
  };
  apiUsage: {
    thisMonth: number;
    limit: number;
    dailyAverage: number;
    projectedMonth: number;
  };
  subscriptions: {
    free: { count: number; percentage: number };
    basic: { count: number; percentage: number };
    premium: { count: number; percentage: number };
    premiumPlus: { count: number; percentage: number };
  };
  trends: {
    userGrowth: Array<{ date: string; value: number }>;
    revenueGrowth: Array<{ date: string; value: number }>;
  };
}

interface SystemInfo {
  status: 'healthy' | 'warning' | 'error';
  uptime: string;
  version: string;
  lastUpdate: string;
  cpu: number;
  memory: number;
  disk: number;
  requests: number;
  errors: number;
  responseTime: number;
  errorRate: number;
}

interface SystemPerformance {
  metrics: Array<{
    name: string;
    description: string;
    value: string;
    trend: 'up' | 'down';
    change: string;
  }>;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  source?: string;
}

interface SystemBackup {
  id: string;
  name: string;
  date: string;
  size: string;
  status: 'success' | 'failed' | 'pending';
}

export const adminService = {
  // Dashboard statistics
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await api.get('/admin/dashboard-stats');
    return response.data.data;
  },

  // User management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    filter?: string;
    search?: string;
  }) {
    const response = await api.get('/admin/users', { params });
    return response.data.data;
  },

  async suspendUser(userId: string) {
    const response = await api.post(`/admin/users/${userId}/suspend`);
    return response.data;
  },

  async activateUser(userId: string) {
    const response = await api.post(`/admin/users/${userId}/activate`);
    return response.data;
  },

  // Routes management
  async getRoutes(params?: {
    filter?: string;
    search?: string;
  }) {
    const response = await api.get('/admin/routes', { params });
    return response.data.data;
  },

  async updateRoute(routeId: string, data: {
    tier?: string;
    scanFrequency?: number;
    priority?: string;
    isActive?: boolean;
  }) {
    const response = await api.put(`/admin/routes/${routeId}`, data);
    return response.data;
  },

  // Analytics
  async getAnalytics(params?: {
    period?: string;
  }): Promise<Analytics> {
    const response = await api.get('/admin/analytics', { params });
    return response.data.data;
  },

  // System monitoring
  async getSystemInfo(): Promise<SystemInfo> {
    const response = await api.get('/admin/system');
    return response.data.data;
  },

  async getSystemPerformance() {
    const response = await api.get('/admin/system/performance');
    return response.data;
  },

  async getSystemLogs(options: { level?: 'all' | 'error' | 'warning' | 'info' } = {}) {
    const response = await api.get('/admin/system/logs', { params: options });
    return response.data;
  },

  async getSystemBackups() {
    const response = await api.get('/admin/system/backups');
    return response.data;
  },

  // Export functions
  async exportUserData(format: 'csv' | 'json' = 'csv') {
    const response = await api.get(`/admin/users/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportAnalytics(format: 'csv' | 'json' = 'csv') {
    const response = await api.get(`/admin/analytics/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Real-time monitoring
  async subscribeToMetrics(callback: (data: any) => void) {
    // Implementation for WebSocket or Server-Sent Events
    // This would be used for real-time dashboard updates
    console.log('Real-time metrics subscription would be implemented here');
  }
};

export default adminService;
