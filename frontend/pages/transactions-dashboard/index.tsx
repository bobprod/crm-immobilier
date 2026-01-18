import React from 'react';
import Layout from '@/modules/core/layout/components/Layout';
import TransactionsDashboard from '@/modules/business/transactions/components/TransactionsDashboard';

export default function TransactionsDashboardPage() {
    return (
        <Layout>
            <TransactionsDashboard />
        </Layout>
    );
}
