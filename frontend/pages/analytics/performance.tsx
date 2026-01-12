import React from 'react';
import { MainLayout } from '@/shared/components/layout';

/**
 * Page Performance des Campagnes
 *
 * Analyse détaillée des performances de vos campagnes de prospection.
 *
 * Phase 2: UX/UI Restructuring
 */

const PerformancePage: React.FC = () => {
  return (
    <MainLayout
      title="Performance Campagnes"
      breadcrumbs={[
        { label: 'Analytics', href: '/analytics' },
        { label: 'Performance' },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-2">📊 Performance des Campagnes</h2>
          <p className="text-green-100">
            Analysez l'efficacité de vos campagnes et optimisez votre stratégie.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics de Performance</h2>
          <p className="text-gray-600 mb-4">
            Tableaux de bord et métriques pour évaluer vos campagnes.
          </p>
          <ul className="text-sm text-gray-600 text-left max-w-md mx-auto space-y-2">
            <li>• Taux de conversion par campagne</li>
            <li>• Coût par lead (CPL)</li>
            <li>• Temps moyen de qualification</li>
            <li>• Sources les plus performantes</li>
            <li>• Comparaison période à période</li>
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default PerformancePage;
