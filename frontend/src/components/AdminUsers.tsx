import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Edit, 
  Trash2,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import { useAdminUsers, useAdminMutations } from '../hooks/useAdminData';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminUsers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const { 
    data: usersData, 
    isLoading, 
    error,
    refetch
  } = useAdminUsers({
    page: currentPage,
    limit: 50,
    filter: statusFilter,
    search: searchTerm
  });

  const { suspendUser, activateUser } = useAdminMutations();

  const handleSuspendUser = (userId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) {
      suspendUser.mutate(userId);
    }
  };

  const handleActivateUser = (userId: string) => {
    activateUser.mutate(userId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'inactive': return 'text-yellow-400 bg-yellow-400/20';
      case 'suspended': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-slate-400 bg-slate-400/20';
      case 'basic': return 'text-blue-400 bg-blue-400/20';
      case 'premium': return 'text-purple-400 bg-purple-400/20';
      case 'premium_plus': return 'text-pink-400 bg-pink-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner text-purple-400" />
        <p className="text-slate-400 ml-4">Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="text-red-400 mb-4">
          <p>Erreur lors du chargement des utilisateurs</p>
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

  const { users, pagination } = usersData || { users: [], pagination: {} };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Gestion des utilisateurs</h3>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition">
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500 rounded-xl transition">
              <Plus className="w-4 h-4" />
              Ajouter utilisateur
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="suspended">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Utilisateur</th>
                <th className="text-left py-3 px-4 text-slate-400">Statut</th>
                <th className="text-left py-3 px-4 text-slate-400">Plan</th>
                <th className="text-left py-3 px-4 text-slate-400">Inscription</th>
                <th className="text-left py-3 px-4 text-slate-400">Dernière connexion</th>
                <th className="text-left py-3 px-4 text-slate-400">Alertes</th>
                <th className="text-left py-3 px-4 text-slate-400">Dépenses</th>
                <th className="text-left py-3 px-4 text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-600/20 rounded-full flex items-center justify-center">
                        <span className="text-purple-400 font-semibold text-sm">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.plan)}`}>
                      {user.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {format(new Date(user.lastLogin), 'dd/MM/yyyy', { locale: fr })}
                  </td>
                  <td className="py-3 px-4">{user.alertsCount}</td>
                  <td className="py-3 px-4">{user.totalSpent}€</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition"
                          title="Suspendre"
                        >
                          <UserX className="w-4 h-4 text-red-400" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          className="p-2 hover:bg-green-600/20 rounded-lg transition"
                          title="Activer"
                        >
                          <UserCheck className="w-4 h-4 text-green-400" />
                        </button>
                      )}
                      <button className="p-2 hover:bg-slate-700 rounded-lg transition">
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-400">
              Affichage {((currentPage - 1) * 50) + 1} à {Math.min(currentPage * 50, pagination.totalItems)} sur {pagination.totalItems} utilisateurs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-1 bg-purple-600/20 rounded-lg">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminUsers;
