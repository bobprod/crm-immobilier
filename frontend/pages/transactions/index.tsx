import Layout from '../../src/modules/core/layout/components/Layout';
import { TransactionPipeline } from '../../src/modules/business/transactions/components/TransactionPipeline';

export default function TransactionsPage() {
  return (
    <Layout>
      <TransactionPipeline />
    </Layout>
  );
}
