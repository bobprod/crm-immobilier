import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProspectingDashboard } from '@/modules/business/prospecting/components/ProspectingDashboard';

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
        <MainLayout
            title="Prospection"
            breadcrumbs={[
                { label: 'Prospection' },
            ]}
        >
            <ProspectingDashboard />
        </MainLayout>
    );
};

export default ProspectionPage;
