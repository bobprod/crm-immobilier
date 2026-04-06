import { useRouter } from 'next/router';
import ProspectCard from '@/modules/business/prospects/components/ProspectCard';
import { useAuth } from '@/modules/core/auth';
import { useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout';

export default function ProspectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!id || typeof id !== 'string') {
    return (
      <MainLayout
        title="Prospect"
        breadcrumbs={[{ label: 'Prospects', href: '/prospects' }, { label: '...' }]}
      >
        <div className="flex items-center justify-center h-64 text-gray-500">
          ID prospect manquant
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Détail prospect"
      breadcrumbs={[{ label: 'Prospects', href: '/prospects' }, { label: 'Détail' }]}
    >
      <ProspectCard prospectId={id} />
    </MainLayout>
  );
}
