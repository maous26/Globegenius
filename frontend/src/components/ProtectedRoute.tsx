import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  requiredStatus?: string[];
  redirectTo?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredStatus,
  redirectTo = '/login',
  children,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Vérifier le statut requis si spécifié
  if (requiredStatus && user && !requiredStatus.includes(user.status)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Accès restreint</h2>
          <p className="text-slate-400 mb-6">
            Cette fonctionnalité nécessite un abonnement{' '}
            {requiredStatus.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ou ')}.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
            >
              Retour
            </button>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="flex-1 btn-glow py-3 rounded-xl font-semibold"
            >
              Voir les plans
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Rendre les enfants ou l'Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;