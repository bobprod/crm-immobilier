import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProspectingDashboard } from '@/modules/business/prospecting/components/ProspectingDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Prospection Dashboard Page
 *
 * Page principale pour la prospection avec tabs:
 * - Mes Campagnes
 * - Prospection IA
 * - Leads
 * - Historique
 *
 * Phase 2: UX/UI Restructuring
 */

const ProspectionPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <MainLayout
                title="Prospection"
                breadcrumbs={[
                    { label: 'Prospection' },
                ]}
            >
                <ProspectingDashboard />
            </MainLayout>
        </ProtectedRoute>
    );
};

export default ProspectionPage;
