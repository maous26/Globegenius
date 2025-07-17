import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adminService from '../services/adminService';
import { toast } from 'react-hot-toast';

// Hook pour les statistiques du dashboard
export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard-stats'],
    queryFn: async () => {
      const response = await adminService.getDashboardStats();
      return response;
    },
    refetchInterval: 30000, // Actualiser toutes les 30 secondes
  });
};

// Hook pour les utilisateurs avec pagination
export const useAdminUsers = (params: {
  page?: number;
  limit?: number;
  filter?: string;
  search?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const response = await adminService.getUsers(params);
      return response;
    },
    placeholderData: (previousData) => previousData,
  });
};

// Hook pour les routes
export const useAdminRoutes = (params: {
  filter?: string;
  search?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'routes', params],
    queryFn: async () => {
      const response = await adminService.getRoutes(params);
      return response;
    },
  });
};

// Hook pour les analytiques
export const useAdminAnalytics = (params: {
  period?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin', 'analytics', params],
    queryFn: async () => {
      const response = await adminService.getAnalytics(params);
      return response;
    },
  });
};

// Hook pour les informations système
export const useAdminSystemInfo = () => {
  return useQuery({
    queryKey: ['admin', 'system'],
    queryFn: async () => {
      const response = await adminService.getSystemInfo();
      return response;
    },
    refetchInterval: 5000, // Actualiser toutes les 5 secondes
  });
};

// Hook pour le monitoring système détaillé
export const useSystemMonitoring = () => {
  const systemInfo = useAdminSystemInfo();
  
  const performance = useQuery({
    queryKey: ['admin', 'system', 'performance'],
    queryFn: async () => {
      const response = await adminService.getSystemPerformance();
      return response.data;
    },
    refetchInterval: 10000, // Actualiser toutes les 10 secondes
  });

  return {
    systemInfo,
    performance,
    isLoading: systemInfo.isLoading || performance.isLoading,
    error: systemInfo.error || performance.error
  };
};

// Hook pour les logs système
export const useSystemLogs = (options: { level?: 'all' | 'error' | 'warning' | 'info' } = {}) => {
  return useQuery({
    queryKey: ['admin', 'system', 'logs', options.level],
    queryFn: async () => {
      const response = await adminService.getSystemLogs(options);
      return response.data;
    },
    refetchInterval: 5000, // Actualiser toutes les 5 secondes
  });
};

// Hook pour les sauvegardes
export const useSystemBackups = () => {
  return useQuery({
    queryKey: ['admin', 'system', 'backups'],
    queryFn: async () => {
      const response = await adminService.getSystemBackups();
      return response.data;
    },
  });
};

// Hook pour les mutations admin
export const useAdminMutations = () => {
  const queryClient = useQueryClient();

  const suspendUser = useMutation({
    mutationFn: (userId: string) => adminService.suspendUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Utilisateur suspendu avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la suspension:', error);
      toast.error('Erreur lors de la suspension de l\'utilisateur');
    },
  });

  const activateUser = useMutation({
    mutationFn: (userId: string) => adminService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Utilisateur activé avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de l\'activation:', error);
      toast.error('Erreur lors de l\'activation de l\'utilisateur');
    },
  });

  const updateRoute = useMutation({
    mutationFn: ({ routeId, data }: { routeId: string; data: any }) =>
      adminService.updateRoute(routeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'routes'] });
      toast.success('Route mise à jour avec succès');
    },
    onError: (error) => {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour de la route');
    },
  });

  return {
    suspendUser,
    activateUser,
    updateRoute,
  };
};

// Hook pour les données en temps réel
export const useAdminRealTimeData = () => {
  const queryClient = useQueryClient();

  const startRealTimeUpdates = () => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'system'] });
    }, 30000); // Actualiser toutes les 30 secondes

    return () => clearInterval(interval);
  };

  return { startRealTimeUpdates };
};

// Hook pour les données combinées du dashboard
export const useAdminDashboard = () => {
  const dashboardStats = useAdminDashboardStats();
  const systemInfo = useAdminSystemInfo();
  const mutations = useAdminMutations();
  const realTime = useAdminRealTimeData();

  return {
    dashboardStats,
    systemInfo,
    mutations,
    realTime,
    isLoading: dashboardStats.isLoading || systemInfo.isLoading,
    error: dashboardStats.error || systemInfo.error
  };
};
