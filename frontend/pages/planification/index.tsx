import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { PlanificationDashboard } from '@/modules/business/planification/components/PlanificationDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Planification - Module Dashboard
 * Mise à jour pour utiliser le nouveau MainLayout (Phase 2)
 */
export default function PlanificationPage() {
    return (
        <ProtectedRoute>
            <MainLayout
                title="Planification"
                breadcrumbs={[
                    { label: 'Planification' },
                ]}
            >
                <PlanificationDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
}
