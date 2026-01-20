import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { AiProspectionPanel } from '@/modules/business/prospecting/components/AiProspectionPanel';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Nouvelle Prospection Page
 *
 * Page dédiée pour lancer une nouvelle prospection IA
 * Utilise le nouveau MainLayout avec Sidebar
 *
 * Phase 2: UX/UI Restructuring
 */

const NewProspectionPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Nouvelle Prospection IA"
        breadcrumbs={[
          { label: 'Prospection', href: '/prospection' },
          { label: 'Nouvelle Prospection' },
        ]}
      >
        <AiProspectionPanel />
      </MainLayout>
    </ProtectedRoute>
  );
};

export default NewProspectionPage;
