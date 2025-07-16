import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Globe, Shield, Eye, Palette } from 'lucide-react';

const PreferencesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-purple-400" />
            Préférences
          </h1>
          <p className="text-slate-400">
            Personnalisez votre expérience GlobeGenius
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Alertes par email</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>Notifications push</span>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span>Résumé hebdomadaire</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            </div>
          </motion.div>

          {/* Confidentialité */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Confidentialité
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Données publiques</span>
                <input type="checkbox" className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span>Analytics</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>Partage de données</span>
                <input type="checkbox" className="toggle" />
              </div>
            </div>
          </motion.div>

          {/* Affichage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-400" />
              Affichage
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Langue</label>
                <select className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <option>Français</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2">Devise</label>
                <select className="w-full p-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <option>EUR (€)</option>
                  <option>USD ($)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Thème */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-pink-400" />
              Thème
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Mode sombre</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>Animations</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>Effets visuels</span>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex justify-end gap-4"
        >
          <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
            Annuler
          </button>
          <button className="px-6 py-3 btn-glow rounded-lg">
            Enregistrer
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default PreferencesPage;
