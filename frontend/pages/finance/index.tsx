import Layout from '../../src/modules/core/layout/components/Layout';
import { FinanceManager } from '../../src/modules/business/finance/components/FinanceManager';

export default function FinancePage() {
  return (
    <Layout>
      <FinanceManager />
    </Layout>
  );
}
