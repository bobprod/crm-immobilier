import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Historique des Prospections
 *
 * Affiche l'historique complet des campagnes et actions de prospection.
 *
 * Phase 2: UX/UI Restructuring
 */

const HistoryPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Historique"
        breadcrumbs={[
          { label: 'Prospection', href: '/prospection' },
          { label: 'Historique' },
        ]}
      >
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🕐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Historique des Prospections</h2>
            <p className="text-gray-600">
              Cette section affichera l'historique complet de vos campagnes et actions de prospection.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              À implémenter: Liste chronologique des campagnes, filtres par date, export des historiques.
            </p>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default HistoryPage;
