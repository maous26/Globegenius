import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Plane,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity
} from 'lucide-react';
import { useAdminRoutes, useAdminMutations } from '../hooks/useAdminData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RouteConfig {
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

const AdminRoutes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'tier1' | 'tier2' | 'tier3'>('all');
  const [selectedRoute, setSelectedRoute] = useState<RouteConfig | null>(null);
  const [routeFormData, setRouteFormData] = useState({
    tier: '',
    scanFrequency: 0,
    priority: '',
    isActive: true
  });

  const { 
    data: routesData, 
    isLoading, 
    error,
    refetch
  } = useAdminRoutes({
    filter: tierFilter,
    search: searchTerm
  });

  const { updateRoute } = useAdminMutations();

  const handleUpdateRoute = () => {
    if (selectedRoute) {
      updateRoute.mutate({
        routeId: selectedRoute.id,
        data: routeFormData
      });
      setSelectedRoute(null);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tier1': return 'text-green-400 bg-green-400/20';
      case 'tier2': return 'text-yellow-400 bg-yellow-400/20';
      case 'tier3': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner text-purple-400" />
        <p className="text-slate-400 ml-4">Chargement des routes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-red-400 mb-4">
          <p>Erreur lors du chargement des routes</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="btn-glow py-2 px-4 rounded-xl"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { routes, stats } = routesData || { routes: [], stats: {} };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Gestion des routes</h3>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500 rounded-xl transition">
              <Plus className="w-4 h-4" />
              Ajouter route
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500 rounded-xl transition">
              <RefreshCw className="w-4 h-4" />
              Mise à jour auto
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par origine ou destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as any)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les tiers</option>
            <option value="tier1">Tier 1 (15min)</option>
            <option value="tier2">Tier 2 (1h)</option>
            <option value="tier3">Tier 3 (6h)</option>
          </select>
        </div>
      </div>

      {/* Routes Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm text-green-400">Tier 1</span>
          </div>
          <h3 className="text-2xl font-bold">{stats.byTier?.tier1}</h3>
          <p className="text-slate-400">Routes haute fréquence</p>
          <div className="mt-2 text-sm text-slate-500">
            Scan: 15 minutes
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <span className="text-sm text-yellow-400">Tier 2</span>
          </div>
          <h3 className="text-2xl font-bold">{stats.byTier?.tier2}</h3>
          <p className="text-slate-400">Routes moyennes</p>
          <div className="mt-2 text-sm text-slate-500">
            Scan: 1 heure
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-600/20 rounded-xl">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-sm text-red-400">Tier 3</span>
          </div>
          <h3 className="text-2xl font-bold">{stats.byTier?.tier3}</h3>
          <p className="text-slate-400">Routes basse fréquence</p>
          <div className="mt-2 text-sm text-slate-500">
            Scan: 6 heures
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-blue-400">
              {stats.total ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <h3 className="text-2xl font-bold">{stats.active}</h3>
          <p className="text-slate-400">Routes actives</p>
          <div className="mt-2 text-sm text-slate-500">
            sur {stats.total} total
          </div>
        </div>
      </div>

      {/* Routes Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Route</th>
                <th className="text-left py-3 px-4 text-slate-400">Tier</th>
                <th className="text-left py-3 px-4 text-slate-400">Volume</th>
                <th className="text-left py-3 px-4 text-slate-400">Fréquence</th>
                <th className="text-left py-3 px-4 text-slate-400">Alertes</th>
                <th className="text-left py-3 px-4 text-slate-400">Taux succès</th>
                <th className="text-left py-3 px-4 text-slate-400">Statut</th>
                <th className="text-left py-3 px-4 text-slate-400">Dernière scan</th>
                <th className="text-left py-3 px-4 text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((route) => (
                <tr key={route.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Plane className="w-4 h-4 text-purple-400" />
                      <span className="font-medium">{route.origin} → {route.destination}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTierColor(route.tier)}`}>
                      {route.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {route.avgVolume.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {route.scanFrequency}min
                  </td>
                  <td className="py-3 px-4">{route.alertCount}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      route.successRate > 90 ? 'text-green-400 bg-green-400/20' : 
                      route.successRate > 80 ? 'text-yellow-400 bg-yellow-400/20' : 
                      'text-red-400 bg-red-400/20'
                    }`}>
                      {route.successRate}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      route.isActive ? 'text-green-400 bg-green-400/20' : 'text-red-400 bg-red-400/20'
                    }`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {format(new Date(route.lastScan), 'dd/MM HH:mm', { locale: fr })}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedRoute(route);
                          setRouteFormData({
                            tier: route.tier,
                            scanFrequency: route.scanFrequency,
                            priority: route.priority,
                            isActive: route.isActive
                          });
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-red-600/20 rounded-lg transition">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Configuration Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Configuration de la route</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Origine
                </label>
                <input
                  type="text"
                  value={selectedRoute.origin}
                  disabled
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={selectedRoute.destination}
                  disabled
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Tier
                </label>
                <select
                  value={routeFormData.tier}
                  onChange={(e) => setRouteFormData({...routeFormData, tier: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="tier1">Tier 1 (15 min)</option>
                  <option value="tier2">Tier 2 (1 heure)</option>
                  <option value="tier3">Tier 3 (6 heures)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Fréquence de scan (minutes)
                </label>
                <input
                  type="number"
                  value={routeFormData.scanFrequency}
                  onChange={(e) => setRouteFormData({...routeFormData, scanFrequency: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Priorité
                </label>
                <select
                  value={routeFormData.priority}
                  onChange={(e) => setRouteFormData({...routeFormData, priority: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Statut
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={routeFormData.isActive}
                    onChange={(e) => setRouteFormData({...routeFormData, isActive: e.target.checked})}
                    className="w-4 h-4 text-purple-600 bg-slate-800 border-slate-700 rounded focus:ring-purple-500"
                  />
                  <span className="text-slate-400">Route active</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <button 
                onClick={handleUpdateRoute}
                className="px-6 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500 rounded-xl transition"
              >
                Sauvegarder
              </button>
              <button 
                onClick={() => setSelectedRoute(null)}
                className="px-6 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminRoutes;
