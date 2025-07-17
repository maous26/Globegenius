import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Settings, 
  Route,
  Activity,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Import modular components
import AdminDashboard from '../components/AdminDashboard';
import AdminUsers from '../components/AdminUsers';
import AdminRoutes from '../components/AdminRoutes';
import AdminAnalytics from '../components/AdminAnalytics';
import AdminSystem from '../components/AdminSystem';
import AdminErrorBoundary from '../components/AdminErrorBoundary';

type AdminTab = 'dashboard' | 'users' | 'routes' | 'analytics' | 'system';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'routes', label: 'Routes', icon: Route },
    { id: 'analytics', label: 'Analyses', icon: Activity },
    { id: 'system', label: 'Système', icon: Database },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'routes':
        return <AdminRoutes />;
      case 'analytics':
        return <AdminAnalytics />;
      case 'system':
        return <AdminSystem />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Console d'Administration
            </h1>
            <p className="text-slate-300">
              Bienvenue, {user?.email} | Gestion complète de GlobeGenius
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg backdrop-blur-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as AdminTab)}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200
                      ${activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-[600px]"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </AdminErrorBoundary>
  );
};

export default AdminPage;
