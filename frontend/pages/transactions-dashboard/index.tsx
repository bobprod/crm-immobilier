import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { TransactionsDashboard } from '@/modules/business/transactions/components/TransactionsDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

export default function TransactionsDashboardPage() {
    return (
        <ProtectedRoute>
            <MainLayout title="Transactions">
                <TransactionsDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
