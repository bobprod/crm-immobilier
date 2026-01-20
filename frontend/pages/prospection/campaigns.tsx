import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProspectingDashboard } from '@/modules/business/prospecting/components/ProspectingDashboard';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Mes Campagnes Page
 *
 * Page pour visualiser et gérer les campagnes de prospection
 * Utilise le nouveau MainLayout avec Sidebar
 *
 * Phase 2: UX/UI Restructuring
 */

const CampaignsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Mes Campagnes"
        breadcrumbs={[
          { label: 'Prospection', href: '/prospection' },
          { label: 'Mes Campagnes' },
        ]}
      >
        <ProspectingDashboard />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default CampaignsPage;
