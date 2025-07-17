import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Log to error reporting service like Sentry, LogRocket, etc.
      console.error('Production error in admin console:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-2xl w-full">
            <div className="text-center mb-6">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                Oops! Une erreur s'est produite
              </h1>
              <p className="text-slate-400 text-lg">
                Une erreur inattendue s'est produite dans la console d'administration.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                <h3 className="text-red-400 font-semibold mb-2">Détails de l'erreur (Mode développement)</h3>
                <pre className="text-sm text-red-300 overflow-x-auto">
                  {this.state.error.message}
                </pre>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-red-400 cursor-pointer hover:text-red-300">
                      Stack trace
                    </summary>
                    <pre className="text-xs text-red-300 mt-2 overflow-x-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all duration-200 font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Réessayer
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all duration-200 font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                Recharger la page
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-all duration-200 font-medium"
              >
                <Home className="w-5 h-5" />
                Retour à l'accueil
              </button>
            </div>

            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <h3 className="text-slate-300 font-medium mb-2">Que faire maintenant ?</h3>
              <ul className="text-sm text-slate-400 space-y-1">
                <li>• Cliquez sur "Réessayer" pour tenter de continuer</li>
                <li>• Cliquez sur "Recharger la page" si le problème persiste</li>
                <li>• Contactez le support technique si l'erreur continue</li>
                <li>• Vérifiez votre connexion internet</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
