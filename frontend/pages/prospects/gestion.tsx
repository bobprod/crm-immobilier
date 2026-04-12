import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { MainLayout } from '@/shared/components/layout';
import ProspectManagementConnected from '@/modules/business/prospects/components/ProspectManagementConnected';
import { Users, KanbanSquare, TrendingUp } from 'lucide-react';

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
    <MainLayout title="Prospects" breadcrumbs={[{ label: 'Prospects' }]}>
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-0 -mb-px">
            <Link href="/prospects">
              <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                <Users className="h-4 w-4" />
                Liste
              </button>
            </Link>
            <Link href="/prospects/pipeline">
              <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                <KanbanSquare className="h-4 w-4" />
                Pipeline
              </button>
            </Link>
            <button
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-purple-600 text-purple-600"
            >
              <TrendingUp className="h-4 w-4" />
              Gestion
            </button>
          </nav>
        </div>
        <ProspectManagementConnected language="fr" currency="TND" />
      </div>
    </MainLayout>
  );
}
