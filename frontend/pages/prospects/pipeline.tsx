import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { ProspectKanbanPipeline } from '@/modules/business/prospects/components/ProspectKanbanPipeline';
import { Users, KanbanSquare, TrendingUp } from 'lucide-react';

/**
 * Pipeline Kanban page for prospects.
 * Inspired by Bitrix24 CRM deal board and Odoo CRM kanban view.
 *
 * Features incorporated from Bitrix24 & Odoo:
 * - Visual kanban columns per sales stage
 * - Score indicators on each card (Odoo lead scoring)
 * - Next activity indicator (Bitrix24 activity timeline)
 * - Quick "Advance" and "Mark as Lost" actions
 * - Lost Reason modal (Odoo lost reason feature)
 * - Conversion funnel toggle (Odoo analytics)
 */
export default function ProspectsPipelinePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6 h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-0 -mb-px">
            <Link href="/prospects">
              <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                <Users className="h-4 w-4" />
                Liste
              </button>
            </Link>
            <button
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-purple-600 text-purple-600"
            >
              <KanbanSquare className="h-4 w-4" />
              Pipeline
            </button>
            <Link href="/prospects/gestion">
              <button className="flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300">
                <TrendingUp className="h-4 w-4" />
                Gestion
              </button>
            </Link>
          </nav>
        </div>
        <ProspectKanbanPipeline onAddProspect={() => router.push('/prospects/new')} />
      </div>
    </MainLayout>
  );
}
