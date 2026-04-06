import { MainLayout } from '@/shared/components/layout';
import { FinanceManager } from '../../src/modules/business/finance/components/FinanceManager';

export default function FinancePage() {
  return (
    <MainLayout title="Finance" breadcrumbs={[{ label: 'Finance' }]}>
      <FinanceManager />
    </MainLayout>
  );
}
