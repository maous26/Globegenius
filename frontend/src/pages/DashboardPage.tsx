import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingDown, 
  Bell, 
  Plane, 
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Globe,
  Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { alertService, metricsService } from '../services/api';
import { toast } from 'react-hot-toast';

interface Alert {
  id: string;
  route: string;
  price: number;
  originalPrice: number;
  discount: number;
  savings: number;
  departureDate: string;
  returnDate: string;
  airline: string;
  expiresAt: string;
  sentAt: string;
  isOpened: boolean;
  isClicked: boolean;
}

interface Stats {
  summary: {
    totalAlerts: number;
    openedAlerts: number;
    clickedAlerts: number;
    conversions: number;
    openRate: string;
    clickRate: string;
    avgDiscount: string;
    totalSavings: string;
  };
  topRoutes: Array<{
    route: string;
    alertCount: number;
    avgDiscount: string;
  }>;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('active');

  // Requête pour récupérer les alertes
  const { 
    data: alertsData, 
    isLoading: alertsLoading,
    refetch: refetchAlerts 
  } = useQuery({
    queryKey: ['alerts', filterStatus],
    queryFn: () => alertService.getAlerts({ 
      status: filterStatus === 'all' ? undefined : filterStatus,
      limit: 50 
    }),
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });

  // Requête pour les statistiques
  const { data: statsData } = useQuery({
    queryKey: ['alertStats'],
    queryFn: () => alertService.getStats(),
  });

  // Requête pour les métriques temps réel
  const { data: metricsData } = useQuery({
    queryKey: ['realtimeMetrics'],
    queryFn: () => metricsService.getRealtime(),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const alerts = alertsData?.data?.alerts || [];
  const stats = statsData?.data as Stats;

  // Marquer une alerte comme ouverte
  const handleAlertOpen = async (alert: Alert) => {
    if (!alert.isOpened) {
      try {
        await alertService.markAsOpened(alert.id);
        refetchAlerts();
      } catch (error) {
        console.error('Erreur marquage alerte:', error);
      }
    }
    setSelectedAlert(alert);
  };

  // Gérer le clic sur le bouton de réservation
  const handleBookingClick = async (alert: Alert) => {
    try {
      const response = await alertService.markAsClicked(alert.id);
      const bookingUrl = response.data.bookingUrl;
      
      // Ouvrir dans un nouvel onglet
      window.open(bookingUrl, '_blank');
      
      toast.success('Redirection vers la réservation...');
      refetchAlerts();
    } catch (error) {
      toast.error('Erreur lors de la redirection');
    }
  };

  // Envoyer un feedback
  const handleFeedback = async (alertId: string, useful: boolean) => {
    try {
      await alertService.submitFeedback(alertId, { useful });
      toast.success(useful ? 'Merci pour votre feedback positif !' : 'Merci, nous améliorerons nos suggestions');
      setSelectedAlert(null);
    } catch (error) {
      toast.error('Erreur envoi feedback');
    }
  };

  // Indicateur de nouvelles alertes
  const newAlertsCount = alerts.filter(a => !a.isOpened).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="w-8 h-8 text-purple-400" />
              Tableau de bord
            </h1>
            {newAlertsCount > 0 && (
              <div className="flex items-center gap-2 bg-green-500/20 border border-green-500 rounded-full px-4 py-2">
                <Bell className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">
                  {newAlertsCount} nouvelle{newAlertsCount > 1 ? 's' : ''} alerte{newAlertsCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <p className="text-slate-400">
            Bonjour {user?.email}, voici vos alertes de voyage personnalisées
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-600/20 rounded-xl">
                  <TrendingDown className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-2xl font-bold">{stats.summary.avgDiscount}%</span>
              </div>
              <h3 className="text-sm text-slate-400">Réduction moyenne</h3>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-600/20 rounded-xl">
                  <Sparkles className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-2xl font-bold">{stats.summary.totalSavings}€</span>
              </div>
              <h3 className="text-sm text-slate-400">Économies totales</h3>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-600/20 rounded-xl">
                  <Bell className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-2xl font-bold">{stats.summary.totalAlerts}</span>
              </div>
              <h3 className="text-sm text-slate-400">Alertes reçues</h3>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-pink-600/20 rounded-xl">
                  <Zap className="w-6 h-6 text-pink-400" />
                </div>
                <span className="text-2xl font-bold">{stats.summary.clickRate}%</span>
              </div>
              <h3 className="text-sm text-slate-400">Taux de clic</h3>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-xl transition ${
              filterStatus === 'active'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Alertes actives
          </button>
          <button
            onClick={() => setFilterStatus('expired')}
            className={`px-4 py-2 rounded-xl transition ${
              filterStatus === 'expired'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Expirées
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl transition ${
              filterStatus === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
            }`}
          >
            Toutes
          </button>
        </motion.div>

        {/* Alerts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {alertsLoading ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4" />
              <p className="text-slate-400">Chargement des alertes...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune alerte pour le moment</h3>
              <p className="text-slate-400">
                Nous surveillons les prix 24h/24. Vous recevrez une notification dès qu'un deal exceptionnel sera détecté !
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
                onClick={() => handleAlertOpen(alert)}
                className={`glass-card p-6 cursor-pointer transition-all ${
                  !alert.isOpened ? 'border-green-500/50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      {!alert.isOpened && (
                        <span className="pulse-dot text-green-400" />
                      )}
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Plane className="w-5 h-5 text-purple-400" />
                        {alert.route}
                      </h3>
                      <span className="badge badge-error">
                        -{alert.discount}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Prix</span>
                        <p className="font-semibold text-lg">
                          {alert.price}€
                          <span className="text-sm text-slate-500 line-through ml-2">
                            {alert.originalPrice}€
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Dates</span>
                        <p className="font-medium">
                          {format(new Date(alert.departureDate), 'dd MMM', { locale: fr })} - 
                          {format(new Date(alert.returnDate), 'dd MMM', { locale: fr })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Compagnie</span>
                        <p className="font-medium">{alert.airline}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Expire</span>
                        <p className="font-medium text-orange-400">
                          {formatDistanceToNow(new Date(alert.expiresAt), { 
                            addSuffix: true,
                            locale: fr 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-6 h-6 text-slate-400 ml-4" />
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Alert Detail Modal */}
        <AnimatePresence>
          {selectedAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setSelectedAlert(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Détails de l'offre</h2>
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="p-2 hover:bg-slate-800 rounded-xl transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Route et prix */}
                  <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-3xl font-bold">{selectedAlert.route}</h3>
                      <span className="text-4xl font-bold text-green-400">
                        {selectedAlert.price}€
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="badge badge-success">
                        Économisez {selectedAlert.savings}€
                      </span>
                      <span className="badge badge-error">
                        -{selectedAlert.discount}%
                      </span>
                    </div>
                  </div>

                  {/* Détails du vol */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Calendar className="w-4 h-4" />
                        <span>Dates du voyage</span>
                      </div>
                      <p className="font-semibold">
                        {format(new Date(selectedAlert.departureDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                      <p className="text-sm text-slate-400">au</p>
                      <p className="font-semibold">
                        {format(new Date(selectedAlert.returnDate), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Plane className="w-4 h-4" />
                        <span>Compagnie</span>
                      </div>
                      <p className="font-semibold text-lg">{selectedAlert.airline}</p>
                      <p className="text-sm text-slate-400 mt-2">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Expire {formatDistanceToNow(new Date(selectedAlert.expiresAt), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleBookingClick(selectedAlert)}
                      className="flex-1 btn-glow py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      Réserver maintenant
                    </button>
                  </div>

                  {/* Feedback */}
                  <div className="border-t border-slate-800 pt-6">
                    <p className="text-sm text-slate-400 mb-3">Cette alerte vous a-t-elle été utile ?</p>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleFeedback(selectedAlert.id, true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500 rounded-xl transition"
                      >
                        <Check className="w-4 h-4" />
                        Oui, très utile
                      </button>
                      <button
                        onClick={() => handleFeedback(selectedAlert.id, false)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
                      >
                        <X className="w-4 h-4" />
                        Pas intéressé
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardPage;