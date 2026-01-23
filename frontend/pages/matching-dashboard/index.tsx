import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { MatchingDashboard } from '@/modules/business/matching/components/MatchingDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

export default function MatchingDashboardPage() {
    return (
        <ProtectedRoute>
            <MainLayout title="Matching">
                <MatchingDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
