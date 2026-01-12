import React from 'react';
import { MainLayout } from '@/shared/components/layout';

/**
 * Page ROI (Return on Investment)
 *
 * Calcul et visualisation du retour sur investissement des actions de prospection.
 *
 * Phase 2: UX/UI Restructuring
 */

const ROIPage: React.FC = () => {
  return (
    <MainLayout
      title="ROI"
      breadcrumbs={[
        { label: 'Analytics', href: '/analytics' },
        { label: 'ROI' },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-2">💰 Retour sur Investissement</h2>
          <p className="text-yellow-100">
            Mesurez la rentabilité de vos investissements en prospection.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyse ROI</h2>
          <p className="text-gray-600 mb-4">
            Calcul automatique du retour sur investissement de vos campagnes.
          </p>
          <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
            <li>• Investissement total par campagne</li>
            <li>• Revenus générés</li>
            <li>• ROI en pourcentage</li>
            <li>• Projection sur 3, 6, 12 mois</li>
            <li>• Comparaison avec objectifs</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default ROIPage;
