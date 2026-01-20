import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Page Configuration
 *
 * Paramètres généraux de l'application et de l'agence.
 *
 * Phase 2: UX/UI Restructuring
 */

const ConfigPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <MainLayout
        title="Configuration"
        breadcrumbs={[
          { label: 'Paramètres', href: '/settings' },
          { label: 'Configuration' },
        ]}
      >
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🛠️</div>
            <div>
              <h3 className="font-semibold text-gray-900">Paramètres Généraux</h3>
              <p className="text-sm text-gray-600">
                Configuration de votre agence et préférences utilisateur.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agence Config */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Configuration Agence</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Informations de l'agence</li>
              <li>• Logo et branding</li>
              <li>• Coordonnées de contact</li>
              <li>• Fuseau horaire et langue</li>
            </ul>
          </div>

          {/* User Preferences */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">👤 Préférences Utilisateur</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Thème (clair/sombre)</li>
              <li>• Notifications</li>
              <li>• Langue d'interface</li>
              <li>• Format de date/heure</li>
            </ul>
          </div>

          {/* Scraping Engines */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔍 Moteurs de Scraping</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Cheerio (HTML parser)</li>
              <li>• Puppeteer (Browser automation)</li>
              <li>• Configuration des timeouts</li>
              <li>• Proxies et user-agents</li>
            </ul>
          </div>

          {/* Integrations */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">🔌 Intégrations</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• CRM externes</li>
              <li>• Email marketing</li>
              <li>• Webhooks</li>
              <li>• API externe</li>
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
};

export default ConfigPage;
