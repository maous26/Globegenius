import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, 
  Zap, 
  Shield, 
  TrendingDown, 
  Bell, 
  Sparkles,
  ChevronRight,
  Check,
  Star,
  Users,
  Globe
} from 'lucide-react';
import CountUp from 'react-countup';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [currentDealIndex, setCurrentDealIndex] = useState(0);

  // Exemples de deals pour l'animation
  const exampleDeals = [
    { route: 'Paris → New York', price: 287, discount: 72, airline: 'Air France' },
    { route: 'Paris → Tokyo', price: 412, discount: 68, airline: 'ANA' },
    { route: 'Lyon → Barcelone', price: 39, discount: 81, airline: 'Vueling' },
    { route: 'Nice → Londres', price: 52, discount: 74, airline: 'EasyJet' },
    { route: 'Paris → Dubai', price: 198, discount: 65, airline: 'Emirates' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDealIndex((prev) => (prev + 1) % exampleDeals.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Alertes Ultra-Rapides",
      description: "Détection en temps réel des erreurs de prix avant qu'elles disparaissent"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "IA Avancée",
      description: "Machine Learning pour identifier les vraies opportunités avec 95% de précision"
    },
    {
      icon: <TrendingDown className="w-6 h-6" />,
      title: "Économies Garanties",
      description: "En moyenne 2 800€ économisés par an sur vos voyages"
    }
  ];

  const testimonials = [
    {
      name: "Sophie L.",
      role: "Voyageuse fréquente",
      content: "J'ai économisé 1 200€ sur mon vol Paris-Bali grâce à une alerte GlobeGenius !",
      rating: 5,
      savings: "1 200€"
    },
    {
      name: "Marc D.",
      role: "Business traveler",
      content: "Les alertes sont instantanées. J'ai pu réserver un Paris-NYC à 250€ au lieu de 900€.",
      rating: 5,
      savings: "650€"
    },
    {
      name: "Léa M.",
      role: "Digital nomad",
      content: "GlobeGenius a transformé ma façon de voyager. Je pars 3x plus souvent pour le même budget !",
      rating: 5,
      savings: "3 400€/an"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-purple-400" />
              <span className="text-2xl font-bold">GlobeGenius</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link to="/pricing" className="hover:text-purple-400 transition">
                Tarifs
              </Link>
              <Link to="/login" className="hover:text-purple-400 transition">
                Connexion
              </Link>
              <Link 
                to="/register" 
                className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-full transition transform hover:scale-105"
              >
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-purple-600/20 border border-purple-500 rounded-full px-4 py-2 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm">Économisez jusqu'à 90% sur vos vols</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Vous cherchez le meilleur prix?<br />
              C'est lui qui vous trouve
            </h1>
 
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              L'IA qui détecte automatiquement les vols à prix cassés 
              et vous alerte <span className="text-purple-400 font-semibold">avant tout le monde</span>
            </p>

            {/* Deal Animation */}
            <div className="mb-10 h-20">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentDealIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500 rounded-xl p-4 inline-block"
                >
                  <div className="flex items-center space-x-4">
                    <Plane className="w-6 h-6 text-green-400" />
                    <span className="text-lg">
                      🔥 <strong>{exampleDeals[currentDealIndex].route}</strong> à seulement{' '}
                      <span className="text-2xl font-bold text-green-400">
                        {exampleDeals[currentDealIndex].price}€
                      </span>{' '}
                      <span className="text-sm text-slate-400 line-through">
                        ({Math.round(exampleDeals[currentDealIndex].price / (1 - exampleDeals[currentDealIndex].discount / 100))}€)
                      </span>
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{exampleDeals[currentDealIndex].discount}%
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* CTA Form */}
            <div className="max-w-md mx-auto">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = `/register?email=${encodeURIComponent(email)}`;
                }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  required
                  className="flex-1 px-6 py-4 rounded-full bg-slate-800/50 border border-slate-700 focus:border-purple-500 focus:outline-none transition"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-semibold transition transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>Mes alertes ultra-rapides</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </form>
              <p className="text-sm text-slate-400 mt-4">
                ✓ 7 jours gratuits • ✓ Sans engagement • ✓ Annulation à tout moment
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-slate-800/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-slate-800/50 rounded-2xl p-8 backdrop-blur"
            >
              <div className="text-4xl font-bold text-purple-400 mb-2">
                <CountUp end={50000} />+
              </div>
              <div className="text-slate-300">Voyageurs malins</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-slate-800/50 rounded-2xl p-8 backdrop-blur"
            >
              <div className="text-4xl font-bold text-green-400 mb-2">
                <CountUp end={2800} duration={2.5} prefix="€" separator=" " />
              </div>
              <div className="text-slate-300">Économies moyennes/an</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-slate-800/50 rounded-2xl p-8 backdrop-blur"
            >
              <div className="text-4xl font-bold text-pink-400 mb-2">
                <CountUp end={95} duration={2.5} suffix="%" />
              </div>
              <div className="text-slate-300">Précision IA</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              L'IA qui révolutionne vos voyages
            </h2>
            <p className="text-xl text-slate-300">
              Technologie de pointe pour des économies maximales
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-800/50 to-purple-800/20 p-8 rounded-2xl backdrop-blur border border-purple-500/20 hover:border-purple-500/40 transition"
              >
                <div className="bg-purple-600/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-6 bg-slate-800/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ils ont déjà économisé des milliers d'euros
            </h2>
            <p className="text-xl text-slate-300">
              Rejoignez la communauté des voyageurs malins
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-slate-800/50 p-8 rounded-2xl backdrop-blur"
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-lg mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                  </div>
                  <div className="bg-green-600/20 border border-green-500 rounded-full px-4 py-2">
                    <span className="text-green-400 font-bold">{testimonial.savings}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-12 backdrop-blur border border-purple-500/30"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à voyager plus pour moins cher ?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Commencez maintenant et recevez votre première alerte dans les 2 heures
            </p>
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-full font-semibold text-lg transition transform hover:scale-105"
            >
              <Bell className="w-5 h-5" />
              <span>Activer mes alertes gratuitement</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-slate-400">
              <span className="flex items-center"><Check className="w-4 h-4 text-green-400 mr-1" /> 7 jours gratuits</span>
              <span className="flex items-center"><Check className="w-4 h-4 text-green-400 mr-1" /> Sans carte bancaire</span>
              <span className="flex items-center"><Check className="w-4 h-4 text-green-400 mr-1" /> Annulation facile</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Globe className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-bold">GlobeGenius</span>
            </div>
            <div className="text-sm text-slate-400">
              © 2025 GlobeGenius. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;