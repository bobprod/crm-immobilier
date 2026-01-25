import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
// Import direct du composant refactorisé
import { ProspectingDashboardRefactored } from '@/modules/business/prospecting/components/ProspectingDashboardRefactored';

/**
 * Page Prospection - Version Refactorisée
 *
 * Navigation simplifiée à 3 onglets:
 * - Prospection IA
 * - Campagnes
 * - Pipeline & Leads
 */
export default function ProspectionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ProspectingDashboardRefactored language="fr" />;
}
