import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Plane,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  departureAirport: string;
  addParis?: boolean;
  acceptTerms: boolean;
  subscribeNewsletter: boolean;
}

const airports = [
  { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris' },
  { code: 'ORY', name: 'Paris Orly', city: 'Paris' },
  { code: 'NCE', name: 'Nice Côte d\'Azur', city: 'Nice' },
  { code: 'LYS', name: 'Lyon Saint-Exupéry', city: 'Lyon' },
  { code: 'MRS', name: 'Marseille Provence', city: 'Marseille' },
  { code: 'TLS', name: 'Toulouse Blagnac', city: 'Toulouse' },
  { code: 'BOD', name: 'Bordeaux Mérignac', city: 'Bordeaux' },
  { code: 'NTE', name: 'Nantes Atlantique', city: 'Nantes' },
  { code: 'LIL', name: 'Lille Lesquin', city: 'Lille' },
  { code: 'MPL', name: 'Montpellier', city: 'Montpellier' },
];

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger
  } = useForm<RegisterFormData>({
    defaultValues: {
      email: searchParams.get('email') || '',
      password: '',
      confirmPassword: '',
      departureAirport: '',
      acceptTerms: false,
      subscribeNewsletter: true
    }
  });

  const password = watch('password');

  // Indicateurs de force du mot de passe
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password || '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: '', // Optionally prompt for these fields in the UI
        lastName: '',
        departureAirport: data.departureAirport,
        acceptTerms: data.acceptTerms
      });
      
      // Redirection gérée dans le contexte Auth
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de l\'inscription';
      toast.error(message);
    }
  };

  const nextStep = async () => {
    const isValid = await trigger(['email', 'password', 'confirmPassword']);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600 rounded-full filter blur-3xl opacity-20 animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-3 mb-6">
            <Globe className="w-12 h-12 text-purple-400" />
            <span className="text-3xl font-bold">GlobeGenius</span>
          </Link>
          <h1 className="text-2xl font-semibold mb-2">Créez votre compte</h1>
          <p className="text-slate-400">Commencez à économiser sur vos voyages</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-2 w-20 rounded-full transition-colors ${
            currentStep >= 1 ? 'bg-purple-600' : 'bg-slate-700'
          }`} />
          <div className={`h-2 w-20 rounded-full transition-colors ${
            currentStep >= 2 ? 'bg-purple-600' : 'bg-slate-700'
          }`} />
        </div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-card p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              {currentStep === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        {...register('email', {
                          required: 'L\'email est requis',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email invalide'
                          }
                        })}
                        className={`input-primary pl-10 w-full ${
                          errors.email ? 'border-red-500' : ''
                        }`}
                        placeholder="vous@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-2">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('password', {
                          required: 'Le mot de passe est requis',
                          minLength: {
                            value: 8,
                            message: 'Le mot de passe doit contenir au moins 8 caractères'
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'
                          }
                        })}
                        className={`input-primary pl-10 pr-10 w-full ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.password.message}
                      </p>
                    )}
                    
                    {/* Indicateur de force */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < passwordStrength
                                  ? passwordStrength <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                                  : 'bg-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Force: {passwordStrength <= 1 ? 'Faible' : passwordStrength <= 2 ? 'Moyenne' : 'Forte'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirmer mot de passe */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirmPassword', {
                          required: 'Veuillez confirmer votre mot de passe',
                          validate: value => value === password || 'Les mots de passe ne correspondent pas'
                        })}
                        className={`input-primary pl-10 pr-10 w-full ${
                          errors.confirmPassword ? 'border-red-500' : ''
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={nextStep}
                    className="w-full btn-glow py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
                  >
                    Continuer
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Aéroport de départ */}
                  <div>
                    <label htmlFor="departureAirport" className="block text-sm font-medium mb-2">
                      Aéroport de départ principal
                    </label>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        id="departureAirport"
                        {...register('departureAirport', { required: 'Veuillez choisir un aéroport principal' })}
                        className="input-primary pl-10 w-full appearance-none"
                      >
                        <option value="">Sélectionnez un aéroport</option>
                        {airports.map(airport => (
                          <option key={airport.code} value={airport.code}>
                            {airport.city} - {airport.name} ({airport.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="addParis"
                        {...register('addParis')}
                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="addParis" className="text-sm">
                        Ajouter Paris (CDG) pour les vols long-courriers
                      </label>
                    </div>
                    {errors.departureAirport && (
                      <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.departureAirport.message}
                      </p>
                    )}
                  </div>

                  {/* Newsletter */}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      {...register('subscribeNewsletter')}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium">Recevoir les actualités et conseils voyage</span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Recevez nos meilleurs conseils pour économiser sur vos voyages
                      </p>
                    </div>
                  </label>

                  {/* Conditions */}
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      {...register('acceptTerms', {
                        required: 'Vous devez accepter les conditions d\'utilisation'
                      })}
                      className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-600 focus:ring-purple-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium">
                        J'accepte les{' '}
                        <Link to="/terms" className="text-purple-400 hover:text-purple-300">
                          conditions d'utilisation
                        </Link>
                        {' '}et la{' '}
                        <Link to="/privacy" className="text-purple-400 hover:text-purple-300">
                          politique de confidentialité
                        </Link>
                      </span>
                    </div>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.acceptTerms.message}
                    </p>
                  )}

                  {/* Avantages */}
                  <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Vos avantages gratuits
                    </h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        3 alertes par semaine
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        Détection d'erreurs de prix IA
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-400" />
                        7 jours d'essai premium offerts
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
                    >
                      Retour
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading}
                      className="flex-1 btn-glow py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting || isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          Créer mon compte
                          <Check className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Sign in link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center mt-6"
        >
          <p className="text-slate-400">
            Déjà un compte ?{' '}
            <Link
              to="/login"
              className="text-purple-400 hover:text-purple-300 font-semibold transition"
            >
              Connectez-vous
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;