import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { PlanificationModule } from '@/modules/business/planification/components/PlanificationModule';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Rendez-vous
 */
export default function AppointmentsPage() {
    return (
        <ProtectedRoute>
            <MainLayout
                title="Rendez-vous"
                breadcrumbs={[
                    { label: 'Planification', href: '/planification' },
                    { label: 'Rendez-vous' },
                ]}
            >
                <PlanificationModule activeTab="appointments" />
            </MainLayout>
        </ProtectedRoute>
    );
}
