import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { MarketingDashboard } from '@/modules/business/marketing/components/MarketingDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

export default function MarketingDashboardPage() {
    return (
        <ProtectedRoute>
            <MainLayout title="Marketing">
                <MarketingDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
