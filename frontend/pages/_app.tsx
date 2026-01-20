import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/modules/core/auth/components/AuthProvider';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }
  // Check if path starts with public route patterns
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route + '/'));
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isPublic = isPublicRoute(router.pathname);

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log vers votre service de monitoring (Sentry, LogRocket, etc.)
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <AuthProvider>
        {isPublic ? (
          <Component {...pageProps} />
        ) : (
          <ProtectedRoute>
            <Component {...pageProps} />
          </ProtectedRoute>
        )}
      </AuthProvider>
    </ErrorBoundary>
  );
}
