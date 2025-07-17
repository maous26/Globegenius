import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Settings, 
  LogOut, 
  User,
  Bell,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Vérifier si l'utilisateur est admin
  const isAdmin = user?.email === 'admin@globegenius.com' || 
                  user?.role === 'admin' ||
                  user?.permissions?.includes('admin');

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: Globe },
    { name: 'Préférences', href: '/preferences', icon: Settings },
    ...(isAdmin ? [{ name: 'Administration', href: '/admin', icon: Shield }] : []),
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <Globe className="w-8 h-8 text-purple-400" />
                <span className="text-xl font-bold text-white">GlobeGenius</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                <button className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <Bell className="w-5 h-5" />
                </button>
                
                <div className="ml-3 relative">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-slate-300">{user?.email}</span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-sm font-medium transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700 px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-slate-300 hover:text-white hover:bg-slate-700 w-full text-left px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;