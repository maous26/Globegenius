import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Bell, 
  DollarSign, 
  Activity, 
  BarChart, 
  PieChart,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAdminAnalytics } from '../hooks/useAdminData';
import AdminChart from './AdminChart';

const AdminAnalytics: React.FC = () => {
  const [period, setPeriod] = useState('7d');
  
  const { 
    data: analyticsData, 
    isLoading, 
    error,
    refetch
  } = useAdminAnalytics({ period });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner text-purple-400" />
        <p className="text-slate-400 ml-4">Chargement des analytiques...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-red-400 mb-4">
          <p>Erreur lors du chargement des analytiques</p>
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

  const analytics = analyticsData || {
    engagement: {
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      unsubscribeRate: 0,
    },
    apiUsage: {
      thisMonth: 0,
      limit: 100000,
      dailyAverage: 0,
      projectedMonth: 0,
    },
    subscriptions: {
      free: { count: 0, percentage: 0 },
      basic: { count: 0, percentage: 0 },
      premium: { count: 0, percentage: 0 },
      premiumPlus: { count: 0, percentage: 0 },
    },
    trends: {
      userGrowth: [],
      revenueGrowth: [],
    },
  };

  // Generate chart data
  const generateUserGrowthData = () => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'];
    const data = analytics.trends.userGrowth.length > 0 
      ? analytics.trends.userGrowth.map(item => item.value)
      : [120, 190, 300, 500, 200, 300, 450];
    
    return {
      labels,
      datasets: [
        {
          label: 'Nouveaux utilisateurs',
          data,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const generateRevenueData = () => {
    const labels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'];
    const data = analytics.trends.revenueGrowth.length > 0 
      ? analytics.trends.revenueGrowth.map(item => item.value)
      : [1200, 1900, 3000, 5000, 2000, 3000, 4500];
    
    return {
      labels,
      datasets: [
        {
          label: 'Revenus (€)',
          data,
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1,
        },
      ],
    };
  };

  const generateSubscriptionData = () => {
    return {
      labels: ['Gratuit', 'Basic', 'Premium', 'Premium+'],
      datasets: [
        {
          data: [
            analytics.subscriptions.free.count,
            analytics.subscriptions.basic.count,
            analytics.subscriptions.premium.count,
            analytics.subscriptions.premiumPlus.count,
          ],
          backgroundColor: [
            'rgba(100, 116, 139, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)',
          ],
          borderColor: [
            'rgb(100, 116, 139)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(236, 72, 153)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Analytiques avancées</h3>
          <div className="flex items-center gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="24h">24 heures</option>
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition">
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500 rounded-xl transition"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Croissance utilisateurs
          </h3>
          <div className="text-3xl font-bold text-green-400 mb-2">
            +{analytics.engagement?.openRate || 0}%
          </div>
          <p className="text-slate-400">Ce mois vs mois précédent</p>
          <div className="mt-4 text-sm text-slate-500">
            Tendance positive
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-400" />
            Performance alertes
          </h3>
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {analytics.engagement?.conversionRate || 0}%
          </div>
          <p className="text-slate-400">Taux de conversion</p>
          <div className="mt-4 text-sm text-slate-500">
            Conversions ce mois
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            ARPU
          </h3>
          <div className="text-3xl font-bold text-green-400 mb-2">
            {analytics.apiUsage?.dailyAverage || 0}€
          </div>
          <p className="text-slate-400">Revenu par utilisateur</p>
          <div className="mt-4 text-sm text-slate-500">
            MRR en croissance
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-purple-400" />
            Répartition des abonnements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-slate-400 rounded"></div>
                <span>Gratuit</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  {analytics.subscriptions?.free.count || 0}
                </span>
                <span className="text-sm text-slate-500">
                  {analytics.subscriptions?.free.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span>Basic (9,99€/mois)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-blue-400">
                  {analytics.subscriptions?.basic.count || 0}
                </span>
                <span className="text-sm text-slate-500">
                  {analytics.subscriptions?.basic.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-400 rounded"></div>
                <span>Premium (19,99€/mois)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-purple-400">
                  {analytics.subscriptions?.premium.count || 0}
                </span>
                <span className="text-sm text-slate-500">
                  {analytics.subscriptions?.premium.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-pink-400 rounded"></div>
                <span>Premium+ (29,99€/mois)</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-pink-400">
                  {analytics.subscriptions?.premiumPlus.count || 0}
                </span>
                <span className="text-sm text-slate-500">
                  {analytics.subscriptions?.premiumPlus.percentage || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            Métriques d'engagement
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taux d'ouverture</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${analytics.engagement?.openRate || 0}%` }}
                  />
                </div>
                <span className="text-green-400 font-semibold">
                  {analytics.engagement?.openRate || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taux de clic</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analytics.engagement?.clickRate || 0}%` }}
                  />
                </div>
                <span className="text-blue-400 font-semibold">
                  {analytics.engagement?.clickRate || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taux de conversion</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${(analytics.engagement?.conversionRate || 0) * 10}%` }}
                  />
                </div>
                <span className="text-purple-400 font-semibold">
                  {analytics.engagement?.conversionRate || 0}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Taux de désabonnement</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-800 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${analytics.engagement?.unsubscribeRate || 0}%` }}
                  />
                </div>
                <span className="text-red-400 font-semibold">
                  {analytics.engagement?.unsubscribeRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Usage Analytics */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Utilisation API - Limite mensuelle
        </h3>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400">Consommation mensuelle</span>
            <span className="text-lg font-semibold">
              {analytics.apiUsage?.thisMonth?.toLocaleString() || 0} / {analytics.apiUsage?.limit?.toLocaleString() || 0}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ${
                (analytics.apiUsage?.thisMonth / analytics.apiUsage?.limit) * 100 > 90 ? 'bg-red-500' :
                (analytics.apiUsage?.thisMonth / analytics.apiUsage?.limit) * 100 > 75 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${(analytics.apiUsage?.thisMonth / analytics.apiUsage?.limit) * 100 || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-slate-500">0</span>
            <span className="text-sm text-slate-500">
              {analytics.apiUsage?.limit?.toLocaleString() || 0} calls
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400">Appels restants</div>
            <div className="text-xl font-bold text-green-400">
              {((analytics.apiUsage?.limit || 0) - (analytics.apiUsage?.thisMonth || 0)).toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400">Moyenne journalière</div>
            <div className="text-xl font-bold text-blue-400">
              {analytics.apiUsage?.dailyAverage?.toLocaleString() || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400">Projection fin mois</div>
            <div className="text-xl font-bold text-purple-400">
              {analytics.apiUsage?.projectedMonth?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Croissance des utilisateurs
          </h3>
          <AdminChart 
            type="line" 
            data={generateUserGrowthData()}
            height={250}
          />
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Évolution des revenus
          </h3>
          <AdminChart 
            type="bar" 
            data={generateRevenueData()}
            height={250}
          />
        </div>
      </div>

      {/* Subscription distribution chart */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-400" />
          Répartition des abonnements
        </h3>
        <div className="max-w-md mx-auto">
          <AdminChart 
            type="doughnut" 
            data={generateSubscriptionData()}
            height={300}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAnalytics;
