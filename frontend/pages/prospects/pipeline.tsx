import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { ProspectKanbanPipeline } from '@/modules/business/prospects/components/ProspectKanbanPipeline';

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
        <ProspectKanbanPipeline onAddProspect={() => router.push('/prospects/new')} />
      </div>
    </MainLayout>
  );
}
