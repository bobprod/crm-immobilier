import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { SalesFunnel } from '@/modules/business/prospecting/components/SalesFunnel';

/**
 * Page Funnel de Conversion
 *
 * Affiche le tunnel de conversion des prospects avec analytics.
 * Utilise le composant SalesFunnel existant dans le nouveau layout.
 *
 * Phase 2: UX/UI Restructuring
 */

const FunnelPage: React.FC = () => {
  return (
    <MainLayout
      title="Funnel de Conversion"
      breadcrumbs={[
        { label: 'Analytics', href: '/analytics' },
        { label: 'Funnel' },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-2">📊 Tunnel de Conversion</h2>
          <p className="text-blue-100">
            Visualisez votre pipeline de conversion et identifiez les opportunités d'optimisation.
          </p>
        </div>

        <SalesFunnel />
      </div>
    </MainLayout>
  );
};

export default FunnelPage;
