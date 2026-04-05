import { MainLayout } from '@/shared/components/layout';
import { TransactionPipeline } from '../../src/modules/business/transactions/components/TransactionPipeline';

export default function TransactionsPage() {
  return (
    <MainLayout title="Transactions" breadcrumbs={[{ label: 'Transactions' }]}>
      <TransactionPipeline />
    </MainLayout>
  );
}
