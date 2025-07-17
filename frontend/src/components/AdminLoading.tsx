import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Database, Server, Users, BarChart3 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 
      className={`animate-spin text-purple-400 ${sizeClasses[size]} ${className}`}
    />
  );
};

interface AdminLoadingProps {
  message?: string;
  type?: 'dashboard' | 'users' | 'routes' | 'analytics' | 'system';
  fullScreen?: boolean;
}

const AdminLoading: React.FC<AdminLoadingProps> = ({ 
  message = 'Chargement...', 
  type = 'dashboard',
  fullScreen = false 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'dashboard':
        return BarChart3;
      case 'users':
        return Users;
      case 'routes':
        return Server;
      case 'analytics':
        return BarChart3;
      case 'system':
        return Database;
      default:
        return BarChart3;
    }
  };

  const getMessages = () => {
    switch (type) {
      case 'dashboard':
        return [
          'Récupération des statistiques...',
          'Chargement des métriques...',
          'Mise à jour des données...',
          'Synchronisation en cours...'
        ];
      case 'users':
        return [
          'Chargement des utilisateurs...',
          'Récupération des profils...',
          'Mise à jour des statuts...',
          'Synchronisation des données...'
        ];
      case 'routes':
        return [
          'Chargement des routes...',
          'Vérification des configurations...',
          'Mise à jour des statuts...',
          'Analyse des performances...'
        ];
      case 'analytics':
        return [
          'Génération des rapports...',
          'Calcul des métriques...',
          'Analyse des tendances...',
          'Compilation des données...'
        ];
      case 'system':
        return [
          'Vérification du système...',
          'Analyse des performances...',
          'Récupération des logs...',
          'Monitoring en cours...'
        ];
      default:
        return ['Chargement...'];
    }
  };

  const [currentMessage, setCurrentMessage] = React.useState(message);
  const messages = getMessages();
  const Icon = getIcon();

  React.useEffect(() => {
    if (messages.length > 1) {
      const interval = setInterval(() => {
        setCurrentMessage(prev => {
          const currentIndex = messages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % messages.length;
          return messages[nextIndex];
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [messages]);

  const content = (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated Icon */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-purple-600/30 border-t-purple-600"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        {/* Loading Message */}
        <div className="text-center space-y-2">
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-lg font-medium text-white"
          >
            {currentMessage}
          </motion.p>
          
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
                className="w-2 h-2 bg-purple-400 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
          />
        </div>

        {/* Tips */}
        <div className="text-center max-w-md">
          <p className="text-sm text-slate-400">
            {type === 'dashboard' && "Mise à jour des données en temps réel..."}
            {type === 'users' && "Synchronisation des profils utilisateurs..."}
            {type === 'routes' && "Vérification des configurations de routes..."}
            {type === 'analytics' && "Génération des rapports d'analyse..."}
            {type === 'system' && "Surveillance des performances système..."}
          </p>
        </div>
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-card max-w-md w-full mx-4">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      {content}
    </div>
  );
};

export default AdminLoading;
