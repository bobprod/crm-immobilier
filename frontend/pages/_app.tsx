import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/modules/core/auth/components/AuthProvider';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log vers votre service de monitoring (Sentry, LogRocket, etc.)
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
