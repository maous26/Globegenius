import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Bell, 
  DollarSign, 
  Zap, 
  ArrowUp, 
  ArrowDown,
  CreditCard,
  Route,
  Target,
  Plane,
  Server,
  Activity,
  AlertCircle
} from 'lucide-react';
import { useAdminDashboard } from '../hooks/useAdminData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminDashboard: React.FC = () => {
  const { dashboardStats, systemInfo, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner text-purple-400" />
        <p className="text-slate-400 ml-4">Chargement des données...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-red-400 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>Erreur lors du chargement des données</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="btn-glow py-2 px-4 rounded-xl"
        >
          Actualiser
        </button>
      </div>
    );
  }

  const stats = dashboardStats.data;
  const system = systemInfo.data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-green-400 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              +{stats?.users.growth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold">{stats?.users.total.toLocaleString()}</h3>
          <p className="text-slate-400">Utilisateurs totaux</p>
          <div className="mt-2 text-sm text-slate-500">
            {stats?.users.active.toLocaleString()} actifs
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <Bell className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm text-slate-400">{stats?.alerts.openRate}%</span>
          </div>
          <h3 className="text-2xl font-bold">{stats?.alerts.total.toLocaleString()}</h3>
          <p className="text-slate-400">Alertes envoyées</p>
          <div className="mt-2 text-sm text-slate-500">
            {stats?.alerts.clicked.toLocaleString()} clics
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm text-green-400 flex items-center">
              <ArrowUp className="w-3 h-3 mr-1" />
              +{stats?.revenue.growth}%
            </span>
          </div>
          <h3 className="text-2xl font-bold">{stats?.revenue.total.toLocaleString()}€</h3>
          <p className="text-slate-400">Revenus totaux</p>
          <div className="mt-2 text-sm text-slate-500">
            MRR: {stats?.revenue.monthly.toLocaleString()}€
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-600/20 rounded-xl">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <span className="text-sm text-orange-400">
              {((stats?.system.apiCalls.thisMonth / stats?.system.apiCalls.limit) * 100).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-bold">{stats?.system.apiCalls.thisMonth.toLocaleString()}</h3>
          <p className="text-slate-400">Appels API ce mois</p>
          <div className="mt-2 text-sm text-slate-500">
            Limite: {stats?.system.apiCalls.limit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Répartition des abonnements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
                <span className="text-slate-400">Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{stats?.users.byPlan.free.toLocaleString()}</span>
                <span className="text-xs text-slate-500">
                  ({((stats?.users.byPlan.free / stats?.users.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-slate-400">Basic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{stats?.users.byPlan.basic.toLocaleString()}</span>
                <span className="text-xs text-slate-500">
                  ({((stats?.users.byPlan.basic / stats?.users.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span className="text-slate-400">Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{stats?.users.byPlan.premium.toLocaleString()}</span>
                <span className="text-xs text-slate-500">
                  ({((stats?.users.byPlan.premium / stats?.users.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                <span className="text-slate-400">Premium+</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{stats?.users.byPlan.premiumPlus.toLocaleString()}</span>
                <span className="text-xs text-slate-500">
                  ({((stats?.users.byPlan.premiumPlus / stats?.users.total) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Route className="w-5 h-5 text-purple-400" />
            Performance des routes
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total routes</span>
              <span className="font-semibold">{stats?.routes.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Actives</span>
              <span className="text-green-400 font-semibold">{stats?.routes.active}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{stats?.routes.tier1}</div>
                <div className="text-xs text-slate-500">Tier 1</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-400">{stats?.routes.tier2}</div>
                <div className="text-xs text-slate-500">Tier 2</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-400">{stats?.routes.tier3}</div>
                <div className="text-xs text-slate-500">Tier 3</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Routes */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Top routes performantes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Route</th>
                <th className="text-left py-3 px-4 text-slate-400">Volume</th>
                <th className="text-left py-3 px-4 text-slate-400">Alertes</th>
                <th className="text-left py-3 px-4 text-slate-400">Taux succès</th>
              </tr>
            </thead>
            <tbody>
              {stats?.routes.topPerforming.map((route, index) => (
                <tr key={index} className="border-b border-slate-800">
                  <td className="py-3 px-4 flex items-center gap-2">
                    <Plane className="w-4 h-4 text-purple-400" />
                    <span className="font-medium">{route.origin} → {route.destination}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {route.volume.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">{route.alertCount.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      route.successRate > 90 ? 'text-green-400 bg-green-400/20' : 
                      route.successRate > 80 ? 'text-yellow-400 bg-yellow-400/20' : 
                      'text-red-400 bg-red-400/20'
                    }`}>
                      {route.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-400" />
            État du système
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Uptime</span>
              <span className="text-green-400 font-semibold">{system?.uptime}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">CPU</span>
                <span className="text-sm">{system?.cpu}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${system?.cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Mémoire</span>
                <span className="text-sm">{system?.memory}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${system?.memory}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Erreurs</span>
              <span className="text-red-400 font-semibold">{system?.errors}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Usage API
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Utilisation mensuelle</span>
                <span className="text-sm">
                  {((stats?.system.apiCalls.thisMonth / stats?.system.apiCalls.limit) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    (stats?.system.apiCalls.thisMonth / stats?.system.apiCalls.limit) * 100 > 90 ? 'bg-red-500' :
                    (stats?.system.apiCalls.thisMonth / stats?.system.apiCalls.limit) * 100 > 75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${(stats?.system.apiCalls.thisMonth / stats?.system.apiCalls.limit) * 100}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Appels ce mois</span>
              <span className="font-semibold">{stats?.system.apiCalls.thisMonth.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Limite mensuelle</span>
              <span className="font-semibold">{stats?.system.apiCalls.limit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Appels totaux</span>
              <span className="font-semibold">{stats?.system.apiCalls.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
