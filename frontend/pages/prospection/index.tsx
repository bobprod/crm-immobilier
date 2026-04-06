import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProspectingDashboardRefactored } from '@/modules/business/prospecting/components/ProspectingDashboardRefactored';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Prospection Dashboard Page — UX/UI v2
 *
 * Tabs principaux :
 * - 🤖 Prospection IA
 * - 📋 Campagnes  (sous-tabs : Actives · En pause · Historique)
 * - 🎯 Pipeline & Leads  (sous-tabs : Tous · Qualifiés · À contacter · Convertis · Spam)
 * - 📊 Analytiques
 */

const ProspectionPage: React.FC = () => {
    return (
        <ProtectedRoute>
            <MainLayout
                title="Prospection Intelligente"
                breadcrumbs={[
                    { label: 'Prospection' },
                ]}
            >
                <ProspectingDashboardRefactored />
            </MainLayout>
        </ProtectedRoute>
    );
};

export default ProspectionPage;

