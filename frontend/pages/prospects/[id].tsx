import { useRouter } from 'next/router';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Layout from '../../src/modules/core/layout/components/Layout';
import ProspectCard from '@/modules/business/prospects/components/ProspectCard';
import { useAuth } from '@/modules/core/auth';
import { useEffect } from 'react';

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
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>ID prospect manquant</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/prospects')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux prospects
          </Button>
        </div>

        {/* Prospect Card Component */}
        <ProspectCard prospectId={id} />
      </div>
    </Layout>
  );
}
