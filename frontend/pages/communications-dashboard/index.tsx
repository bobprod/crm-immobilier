import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { CommunicationsDashboard } from '@/modules/business/communications/components/CommunicationsDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

export default function CommunicationsDashboardPage() {
    return (
        <ProtectedRoute>
            <MainLayout title="Communications">
                <CommunicationsDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
