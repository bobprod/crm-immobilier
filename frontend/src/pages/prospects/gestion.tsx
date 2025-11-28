import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import ProspectManagementConnected from '@/modules/business/prospects/components/ProspectManagementConnected';

export default function ProspectsGestionPage() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProspectManagementConnected
        language="fr"
        currency="TND"
      />
    </div>
  );
}
