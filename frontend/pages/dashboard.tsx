import React from 'react';
import { MainLayout } from '@/shared/components/layout';
import { useProspecting } from '@/shared/hooks/useProspecting';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

/**
 * Dashboard Principal - Nouvelle Architecture
 *
 * Page d'accueil principale du CRM utilisant la nouvelle Sidebar navigation.
 * Remplace l'ancien système de tabs horizontaux par une navigation hiérarchique.
 *
 * Phase 2: UX/UI Restructuring
 */

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'purple' | 'green' | 'blue' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-3xl ${colorClasses[color]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { globalStats, loading } = useProspecting();

  return (
    <ProtectedRoute>
    <MainLayout
      title="Tableau de Bord"
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Bienvenue sur votre CRM Immobilier 🏠</h2>
          <p className="text-purple-100">
            Gérez vos leads, prospections et campagnes depuis une interface moderne et intuitive.
          </p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Leads"
              value={globalStats?.total || 0}
              icon="👥"
              color="purple"
            />
            <StatCard
              title="Leads Convertis"
              value={globalStats?.converted || 0}
              icon="✅"
              color="green"
            />
            <StatCard
              title="Taux de Conversion"
              value={`${(globalStats?.conversionRate || 0).toFixed(1)}%`}
              icon="📈"
              color="blue"
            />
            <StatCard
              title="Score Moyen"
              value={`${(globalStats?.avgScore || 0).toFixed(0)}%`}
              icon="⭐"
              color="yellow"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AI Prospection Card */}
          <a
            href="/prospection/new"
            className="block p-6 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-lg text-white hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">🤖</div>
              <div>
                <div className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs font-semibold mb-1">
                  ⭐ RECOMMANDÉ
                </div>
                <h3 className="font-bold text-xl">Prospection IA</h3>
              </div>
            </div>
            <p className="text-purple-100 text-sm mb-3">
              Trouvez des leads qualifiés automatiquement avec l'intelligence artificielle.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold opacity-90 group-hover:opacity-100">
              Lancer une prospection
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </a>

          {/* Campaigns Card */}
          <a
            href="/prospection/campaigns"
            className="block p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">📋</div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Mes Campagnes</h3>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Gérez et suivez vos campagnes de prospection en cours.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:text-purple-700">
              Voir les campagnes
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </a>

          {/* Leads Validation Card */}
          <a
            href="/leads/validate"
            className="block p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">✓</div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Leads à Valider</h3>
                <span className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">
                  12 nouveaux
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Validez et qualifiez vos nouveaux leads.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:text-purple-700">
              Valider maintenant
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </a>

          {/* Analytics Card */}
          <a
            href="/analytics/funnel"
            className="block p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">📊</div>
              <div>
                <h3 className="font-bold text-xl text-gray-900">Analytics</h3>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-3">
              Analysez vos performances et votre funnel de conversion.
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 group-hover:text-purple-700">
              Voir les stats
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </a>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">Nouvelle Interface Navigation</h3>
              <p className="text-gray-700 text-sm mb-3">
                Utilisez la sidebar à gauche pour naviguer entre les différentes sections :
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• <strong>Prospection</strong> - Créez et gérez vos campagnes</li>
                <li>• <strong>Leads</strong> - Validez et suivez vos prospects</li>
                <li>• <strong>Analytics</strong> - Analysez vos performances</li>
                <li>• <strong>Paramètres</strong> - Configurez vos clés API et options</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
};

export default DashboardPage;
