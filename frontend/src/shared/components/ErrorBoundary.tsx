import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - Composant global pour capturer et gérer les erreurs React
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 *
 * Avec fallback personnalisé:
 * ```tsx
 * <ErrorBoundary
 *   fallback={(error, errorInfo, reset) => (
 *     <CustomErrorView error={error} onReset={reset} />
 *   )}
 * >
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Appeler le callback onError si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Mettre à jour l'état avec les détails de l'erreur
    this.setState({
      errorInfo,
    });

    // En production, vous pourriez envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = process.env.NODE_ENV !== 'production' } = this.props;

    if (hasError && error) {
      // Si un fallback custom est fourni, l'utiliser
      if (fallback && errorInfo) {
        return fallback(error, errorInfo, this.resetError);
      }

      // Sinon, afficher l'UI par défaut
      return <DefaultErrorUI error={error} errorInfo={errorInfo} onReset={this.resetError} showDetails={showDetails} />;
    }

    return children;
  }
}

interface DefaultErrorUIProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  showDetails: boolean;
}

function DefaultErrorUI({ error, errorInfo, onReset, showDetails }: DefaultErrorUIProps) {
  const [showStack, setShowStack] = React.useState(false);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        {/* Icon et titre */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Oups ! Une erreur est survenue
            </h1>
            <p className="text-gray-600 mt-1">
              Quelque chose s'est mal passé lors du chargement de cette page.
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-sm font-mono text-red-800">
            {error.message || 'Une erreur inattendue s\'est produite'}
          </p>
        </div>

        {/* Détails de l'erreur (dev uniquement) */}
        {showDetails && (
          <div className="mb-6">
            <button
              onClick={() => setShowStack(!showStack)}
              className="text-sm text-gray-600 hover:text-gray-900 underline mb-2"
            >
              {showStack ? 'Masquer' : 'Afficher'} les détails techniques
            </button>

            {showStack && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 overflow-auto max-h-96">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Stack Trace:</h3>
                  <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>

                {errorInfo?.componentStack && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Component Stack:</h3>
                    <pre className="text-xs font-mono text-gray-600 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onReset}
            className="flex items-center gap-2"
            variant="default"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Recharger la page
          </Button>
        </div>

        {/* Conseils */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            💡 <strong>Que faire ?</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Essayez de recharger la page</li>
            <li>Vérifiez votre connexion internet</li>
            <li>Si le problème persiste, contactez le support technique</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook pour réinitialiser l'ErrorBoundary depuis les composants enfants
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const resetError = useErrorBoundaryReset();
 *
 *   return <button onClick={resetError}>Reset</button>
 * }
 * ```
 */
export function useErrorBoundaryReset() {
  const [, setKey] = React.useState(0);
  return React.useCallback(() => setKey((k) => k + 1), []);
}

/**
 * ErrorBoundary spécialisée pour les routes/pages
 */
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Page Error:', error, errorInfo);
        // Envoyer à votre service de monitoring
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * ErrorBoundary pour les sections/composants
 */
export function SectionErrorBoundary({
  children,
  fallbackMessage = "Une erreur est survenue dans cette section"
}: {
  children: ReactNode;
  fallbackMessage?: string;
}) {
  return (
    <ErrorBoundary
      fallback={(error, errorInfo, reset) => (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">
                {fallbackMessage}
              </h3>
              <p className="text-sm text-red-700 mb-3">
                {error.message}
              </p>
              <Button onClick={reset} size="sm" variant="outline">
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
