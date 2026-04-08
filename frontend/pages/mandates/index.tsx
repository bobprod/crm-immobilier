import { MainLayout } from '@/shared/components/layout';
import { MandateList } from '../../src/modules/business/mandates/components/MandateList';

export default function MandatesPage() {
  return (
    <MainLayout title="Mandats" breadcrumbs={[{ label: 'Mandats' }]}>
      <MandateList />
    </MainLayout>
  );
}
