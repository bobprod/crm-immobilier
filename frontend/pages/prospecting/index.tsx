import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Redirection: /prospecting → /dashboard
 *
 * L'ancienne interface avec tabs horizontaux a été remplacée par
 * une nouvelle navigation avec sidebar. Cette page redirige vers
 * le nouveau dashboard.
 *
 * Phase 2: UX/UI Restructuring
 */

export default function ProspectingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new dashboard with sidebar navigation
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  );
}
