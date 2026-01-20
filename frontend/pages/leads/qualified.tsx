import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Leads Qualifiés
 *
 * Affiche la liste des leads déjà qualifiés et leur statut.
 *
 * Phase 2: UX/UI Restructuring
 */

const QualifiedLeadsPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Leads Qualifiés"
        breadcrumbs={[
          { label: 'Leads', href: '/leads' },
          { label: 'Qualifiés' },
        ]}
      >
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⭐</div>
              <div>
                <h3 className="font-semibold text-gray-900">Leads Qualifiés</h3>
                <p className="text-sm text-gray-600">
                  Leads validés et prêts pour le suivi commercial.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Leads Qualifiés</h2>
            <p className="text-gray-600">
              Liste des prospects validés et qualifiés par votre équipe.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              À implémenter: Table des leads qualifiés, filtres, actions de suivi, export.
            </p>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default QualifiedLeadsPage;
