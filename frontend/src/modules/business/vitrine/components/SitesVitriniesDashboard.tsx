import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '../../../../shared/utils/backend-api';

interface SitesVitriniesDashboardProps {
  language?: 'fr' | 'en';
}

type TabType = 'my-sites' | 'page-builder';

interface VitrineConfig {
  id: string;
  slug: string;
  agencyName: string;
  isActive: boolean;
  primaryColor: string;
  phone: string;
  email: string;
}

interface VitrinePage {
  id: string;
  slug: string;
  title: string;
  isActive: boolean;
  order: number;
}

/**
 * Module Sites Vitrines - Dashboard avec tabs Mes Sites et Page Builder
 */
export const SitesVitriniesDashboard: React.FC<SitesVitriniesDashboardProps> = ({
  language = 'fr',
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('my-sites');
  const [config, setConfig] = useState<VitrineConfig | null>(null);
  const [pages, setPages] = useState<VitrinePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [configRes, pagesRes] = await Promise.allSettled([
        apiClient.get('/vitrine/config'),
        apiClient.get('/vitrine/builder/pages'),
      ]);
      if (configRes.status === 'fulfilled') setConfig(configRes.value.data);
      if (pagesRes.status === 'fulfilled') {
        const d = pagesRes.value.data;
        setPages(Array.isArray(d) ? d : []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'my-sites', label: 'Mes Sites', icon: '🏛️' },
    { id: 'page-builder', label: 'Page Builder', icon: '🔨' },
  ];

  const activePages = pages.filter((p) => p.isActive);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Sites Vitrines</h1>
        <p className="text-gray-600">Créez et gérez vos sites vitrines</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Chargement...</div>}

      {/* Content */}
      {!loading && (
        <div className="space-y-6">
          {/* Mes Sites Tab */}
          {activeTab === 'my-sites' && (
            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total</p>
                      <p className="text-4xl font-bold text-gray-900">{config ? 1 : 0}</p>
                    </div>
                    <span className="text-4xl">🌐</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Actifs</p>
                      <p className="text-4xl font-bold text-gray-900">{config?.isActive ? 1 : 0}</p>
                    </div>
                    <span className="text-4xl">✓</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Pages</p>
                      <p className="text-4xl font-bold text-gray-900">{pages.length}</p>
                    </div>
                    <span className="text-4xl">📄</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Slug</p>
                      <p className="text-lg font-bold text-gray-900 truncate">
                        {config?.slug || '—'}
                      </p>
                    </div>
                    <span className="text-4xl">🔗</span>
                  </div>
                </div>
              </div>

              {/* Site Card or Empty State */}
              {config ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{config.agencyName}</h3>
                      <p className="text-gray-500 text-sm mt-1">/{config.slug}</p>
                      {config.email && <p className="text-gray-500 text-sm">{config.email}</p>}
                      {config.phone && <p className="text-gray-500 text-sm">{config.phone}</p>}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${config.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {config.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => router.push('/vitrine')}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition"
                    >
                      ⚙️ Configuration
                    </button>
                    <button
                      onClick={() => router.push('/vitrine/editeur')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                    >
                      🔨 Page Builder
                    </button>
                    <button
                      onClick={() => router.push('/vitrine/templates')}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition"
                    >
                      🎨 Templates
                    </button>
                    <a
                      href={`/sites/${config.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                    >
                      👁️ Voir le site
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-6xl mb-4 block">🏛️</span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun site créé</h3>
                  <p className="text-gray-600 mb-6">Créez votre premier site vitrine</p>
                  <button
                    onClick={() => router.push('/vitrine')}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition"
                  >
                    + Créer un site
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Page Builder Tab */}
          {activeTab === 'page-builder' && (
            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-teal-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Total pages</p>
                      <p className="text-4xl font-bold text-gray-900">{pages.length}</p>
                    </div>
                    <span className="text-4xl">📄</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Publiées</p>
                      <p className="text-4xl font-bold text-gray-900">{activePages.length}</p>
                    </div>
                    <span className="text-4xl">✓</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Brouillons</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {pages.length - activePages.length}
                      </p>
                    </div>
                    <span className="text-4xl">📝</span>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm mb-1">Config</p>
                      <p className="text-lg font-bold text-gray-900">{config?.agencyName || '—'}</p>
                    </div>
                    <span className="text-4xl">📊</span>
                  </div>
                </div>
              </div>

              {/* Pages List or Empty State */}
              {pages.length > 0 ? (
                <div className="space-y-3">
                  {pages
                    .sort((a, b) => a.order - b.order)
                    .map((page) => (
                      <div
                        key={page.id}
                        className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 text-sm w-8">#{page.order + 1}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900">{page.title}</h4>
                            <p className="text-gray-500 text-sm">/{page.slug}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${page.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                          >
                            {page.isActive ? 'Active' : 'Brouillon'}
                          </span>
                          <button
                            onClick={() => router.push('/vitrine/editeur')}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition"
                          >
                            Éditer
                          </button>
                        </div>
                      </div>
                    ))}
                  <div className="pt-4">
                    <button
                      onClick={() => router.push('/vitrine/editeur')}
                      className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition"
                    >
                      + Créer une page
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <span className="text-6xl mb-4 block">🔨</span>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucune page créée</h3>
                  <p className="text-gray-600 mb-6">
                    Utilisez le Page Builder pour créer vos pages
                  </p>
                  <button
                    onClick={() => router.push('/vitrine/editeur')}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition"
                  >
                    + Créer une page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SitesVitriniesDashboard;
