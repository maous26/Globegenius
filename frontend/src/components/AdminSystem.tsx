import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Server, 
  Activity, 
  Database, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Monitor, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useSystemMonitoring, useSystemLogs, useSystemBackups } from '../hooks/useAdminData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminSystem: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'performance' | 'logs' | 'backups' | 'settings'>('overview');
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  
  const { systemInfo, performance, isLoading, error } = useSystemMonitoring();
  const systemLogs = useSystemLogs({ level: logFilter });
  const systemBackups = useSystemBackups();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner text-purple-400" />
        <p className="text-slate-400 ml-4">Chargement des données système...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-red-400 mb-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>Erreur lors du chargement des données système</p>
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

  const system = systemInfo.data;
  const perf = performance.data;

  const sections = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Monitor },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'logs', label: 'Logs', icon: Eye },
    { id: 'backups', label: 'Sauvegardes', icon: Database },
    { id: 'settings', label: 'Configuration', icon: Settings }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeSection === section.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'glass-card hover:bg-purple-600/20'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* System Overview */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Status */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-semibold">État du système</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Statut général</span>
                <div className={`flex items-center gap-2 ${getStatusColor(system.status)}`}>
                  {React.createElement(getStatusIcon(system.status), { className: "w-4 h-4" })}
                  <span className="capitalize">{system.status}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Uptime</span>
                <span className="text-green-400 font-mono">{system.uptime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Version</span>
                <span className="text-slate-300">{system.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Dernière MAJ</span>
                <span className="text-slate-400">
                  {format(new Date(system.lastUpdate), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold">Ressources</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>CPU</span>
                  <span className="font-mono">{system.cpu}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${system.cpu > 80 ? 'bg-red-400' : system.cpu > 60 ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${system.cpu}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Mémoire</span>
                  <span className="font-mono">{system.memory}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${system.memory > 80 ? 'bg-red-400' : system.memory > 60 ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${system.memory}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Disque</span>
                  <span className="font-mono">{system.disk}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${system.disk > 80 ? 'bg-red-400' : system.disk > 60 ? 'bg-yellow-400' : 'bg-green-400'}`}
                    style={{ width: `${system.disk}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* API Status */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wifi className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold">API Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Requêtes/min</span>
                <span className="text-green-400 font-mono">{system.requests}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Erreurs</span>
                <span className={`font-mono ${system.errors > 10 ? 'text-red-400' : 'text-green-400'}`}>
                  {system.errors}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Temps de réponse</span>
                <span className="text-blue-400 font-mono">{system.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Taux d'erreur</span>
                <span className={`font-mono ${system.errorRate > 1 ? 'text-red-400' : 'text-green-400'}`}>
                  {system.errorRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {activeSection === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart Placeholder */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Métriques de performance</h3>
            <div className="h-64 bg-slate-800 rounded-lg flex items-center justify-center">
              <div className="text-slate-400 text-center">
                <Activity className="w-12 h-12 mx-auto mb-2" />
                <p>Graphique de performance</p>
                <p className="text-sm">(Chart.js à intégrer)</p>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Statistiques détaillées</h3>
            <div className="space-y-4">
              {perf?.metrics?.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium">{metric.name}</p>
                    <p className="text-sm text-slate-400">{metric.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-lg">{metric.value}</p>
                    <div className={`flex items-center gap-1 text-sm ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {metric.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* System Logs */}
      {activeSection === 'logs' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Logs système</h3>
            <div className="flex items-center gap-4">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value as any)}
                className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
              >
                <option value="all">Tous les logs</option>
                <option value="error">Erreurs</option>
                <option value="warning">Avertissements</option>
                <option value="info">Informations</option>
              </select>
              <button className="btn-glow p-2 rounded-lg">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {systemLogs.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner text-purple-400" />
              </div>
            ) : (
              systemLogs.data?.map((log, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.level === 'error' ? 'bg-red-400' : 
                    log.level === 'warning' ? 'bg-yellow-400' : 
                    'bg-green-400'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.level.toUpperCase()}</span>
                      <span className="text-slate-400 text-sm">
                        {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                      </span>
                    </div>
                    <p className="text-sm">{log.message}</p>
                    {log.source && (
                      <p className="text-xs text-slate-500 mt-1">Source: {log.source}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backups */}
      {activeSection === 'backups' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Sauvegardes</h3>
            <button className="btn-glow px-4 py-2 rounded-lg">
              <Download className="w-4 h-4 mr-2" />
              Nouvelle sauvegarde
            </button>
          </div>
          
          <div className="space-y-4">
            {systemBackups.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="loading-spinner text-purple-400" />
              </div>
            ) : (
              systemBackups.data?.map((backup, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="font-medium">{backup.name}</p>
                      <p className="text-sm text-slate-400">
                        {format(new Date(backup.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">{backup.size}</span>
                    <div className={`w-2 h-2 rounded-full ${
                      backup.status === 'success' ? 'bg-green-400' : 
                      backup.status === 'failed' ? 'bg-red-400' : 
                      'bg-yellow-400'
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Settings */}
      {activeSection === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Configuration générale</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mode maintenance</label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>Activer le mode maintenance</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notifications</label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Notifications email</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Niveau de log</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2">
                  <option>DEBUG</option>
                  <option>INFO</option>
                  <option>WARNING</option>
                  <option>ERROR</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold mb-4">Sécurité</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Authentification 2FA</label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  <span>Exiger 2FA pour les admins</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Délai d'expiration de session</label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2">
                  <option>30 minutes</option>
                  <option>1 heure</option>
                  <option>4 heures</option>
                  <option>8 heures</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Taux limite API</label>
                <input 
                  type="number" 
                  defaultValue={1000}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystem;
