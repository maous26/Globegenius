import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Loader2, Eye, EyeOff } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Admin password - In production, this should be in environment variables
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@globegenius.com';

  // Check if admin is already authenticated (stored in sessionStorage)
  useEffect(() => {
    const adminAuth = sessionStorage.getItem('adminAuthenticated');
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
    }
  }, []);

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
          <p className="text-slate-400">Vérification des permissions...</p>
        </motion.div>
      </div>
    );
  }

  // Rediriger si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.email === ADMIN_EMAIL || 
                  user?.role === 'admin' ||
                  user?.permissions?.includes('admin');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md w-full text-center"
        >
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Accès non autorisé</h2>
          <p className="text-slate-400 mb-6">
            Vous n'avez pas les permissions administrateur nécessaires pour accéder à cette page.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.history.back()}
              className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
            >
              Retour
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 btn-glow py-3 rounded-xl font-semibold"
            >
              Tableau de bord
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin password verification
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('adminAuthenticated', 'true');
      setError('');
    } else {
      setError('Mot de passe administrateur incorrect');
      setAdminPassword('');
    }
  };

  // Admin logout function
  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAdminAuthenticated(false);
    setAdminPassword('');
  };

  // Auto-logout after session timeout (1 hour)
  useEffect(() => {
    if (isAdminAuthenticated) {
      const timeout = setTimeout(() => {
        handleAdminLogout();
      }, 3600000); // 1 hour

      return () => clearTimeout(timeout);
    }
  }, [isAdminAuthenticated]);

  // If admin user but not authenticated with admin password
  if (isAdmin && !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Console d'Administration</h2>
            <p className="text-slate-400">
              Veuillez entrer le mot de passe administrateur pour continuer
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe administrateur
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Entrez le mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full btn-glow py-3 rounded-xl font-semibold"
            >
              Accéder à la console
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="text-slate-400 hover:text-slate-300 text-sm"
            >
              Retour au tableau de bord
            </button>
          </div>

          <div className="mt-4 p-3 bg-slate-800/30 rounded-xl text-xs text-slate-500">
            <p><strong>Mot de passe par défaut:</strong> admin123</p>
            <p className="mt-1">⚠️ Changez ce mot de passe en production</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
