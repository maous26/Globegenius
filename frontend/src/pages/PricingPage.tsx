import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Zap, Crown, Sparkles, ArrowRight } from 'lucide-react';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Gratuit',
      price: '0€',
      period: 'toujours',
      description: 'Parfait pour découvrir GlobeGenius',
      features: [
        'Jusqu\'à 3 alertes actives',
        'Notifications par email',
        'Historique 30 jours',
        'Support communautaire',
      ],
      cta: 'Commencer gratuitement',
      popular: false,
      color: 'slate',
    },
    {
      name: 'Essentiel',
      price: '9€',
      period: 'par mois',
      description: 'Pour les voyageurs réguliers',
      features: [
        'Jusqu\'à 15 alertes actives',
        'Notifications push',
        'Historique 90 jours',
        'Filtres avancés',
        'Support prioritaire',
      ],
      cta: 'Essayer gratuitement',
      popular: false,
      color: 'purple',
    },
    {
      name: 'Premium',
      price: '19€',
      period: 'par mois',
      description: 'Pour les voyageurs passionnés',
      features: [
        'Alertes illimitées',
        'Détection ML avancée',
        'Historique complet',
        'Intégrations API',
        'Support 24/7',
        'Rapport personnalisé',
      ],
      cta: 'Démarrer Premium',
      popular: true,
      color: 'gradient',
    },
    {
      name: 'Premium+',
      price: '39€',
      period: 'par mois',
      description: 'Pour les professionnels du voyage',
      features: [
        'Tout Premium inclus',
        'Accès API complet',
        'Données en temps réel',
        'Manager dédié',
        'Formation personnalisée',
        'SLA garantis',
      ],
      cta: 'Contacter l\'équipe',
      popular: false,
      color: 'gold',
    },
  ];

  const getCardClasses = (plan: any) => {
    if (plan.popular) {
      return 'glass-card p-8 relative border-2 border-purple-500 bg-gradient-to-b from-purple-900/20 to-purple-800/10';
    }
    return 'glass-card p-8 relative';
  };

  const getButtonClasses = (plan: any) => {
    if (plan.popular) {
      return 'w-full py-4 btn-glow rounded-lg font-semibold';
    }
    return 'w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold transition';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Crown className="w-10 h-10 text-purple-400" />
            Tarifs
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins de voyage
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={getCardClasses(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    Plus populaire
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-slate-400 ml-2">/{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={getButtonClasses(plan)}>
                {plan.cta}
                {plan.popular && <ArrowRight className="w-5 h-5 ml-2 inline" />}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Features Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold mb-8 text-center">
            Comparaison détaillée des fonctionnalités
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-4">Fonctionnalité</th>
                  <th className="text-center py-4">Gratuit</th>
                  <th className="text-center py-4">Essentiel</th>
                  <th className="text-center py-4">Premium</th>
                  <th className="text-center py-4">Premium+</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800">
                  <td className="py-4">Nombre d'alertes</td>
                  <td className="text-center py-4">3</td>
                  <td className="text-center py-4">15</td>
                  <td className="text-center py-4">Illimité</td>
                  <td className="text-center py-4">Illimité</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-4">Détection ML</td>
                  <td className="text-center py-4">Basique</td>
                  <td className="text-center py-4">Avancée</td>
                  <td className="text-center py-4">Premium</td>
                  <td className="text-center py-4">Premium+</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-4">Accès API</td>
                  <td className="text-center py-4">-</td>
                  <td className="text-center py-4">-</td>
                  <td className="text-center py-4">Limité</td>
                  <td className="text-center py-4">Complet</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-4">Support</td>
                  <td className="text-center py-4">Communautaire</td>
                  <td className="text-center py-4">Prioritaire</td>
                  <td className="text-center py-4">24/7</td>
                  <td className="text-center py-4">Dédié</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold mb-4">Questions fréquentes</h2>
          <p className="text-slate-400 mb-8">
            Vous avez des questions ? Consultez notre FAQ ou contactez-nous
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition">
              Voir la FAQ
            </button>
            <button className="px-6 py-3 btn-glow rounded-lg">
              Nous contacter
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PricingPage;
