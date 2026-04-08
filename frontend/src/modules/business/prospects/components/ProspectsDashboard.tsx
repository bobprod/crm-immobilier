import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/shared/utils/backend-api';

interface ProspectsDashboardProps {
  language?: 'fr' | 'en';
}

type TabType = 'prospects' | 'mandates';

/**
 * Module Prospects - Dashboard avec tabs Prospects et Mandats
 */
export const ProspectsDashboard: React.FC<ProspectsDashboardProps> = ({ language = 'fr' }) => {
  const [activeTab, setActiveTab] = useState<TabType>('prospects');
  const [prospects, setProspects] = useState<any[]>([]);
  const [mandates, setMandates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'prospects') {
        const [response, statsResponse] = await Promise.all([
          apiClient.get('/prospects'),
          apiClient.get('/prospects/stats'),
        ]);
        const data = response.data;
        setProspects(Array.isArray(data) ? data : data.data || []);
        setStats(statsResponse.data);
      } else {
        const response = await apiClient.get('/mandates');
        const data = response.data;
        setMandates(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'prospects', label: 'Prospects', icon: '👤' },
    { id: 'mandates', label: 'Mandats', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Prospects & Mandats
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Gérez vos prospects et mandats immobiliers
              </p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
              <span className="text-xl">+</span>
              Nouveau
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b shadow-sm sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
            <button onClick={() => setError(null)} className="ml-3 underline">
              Fermer
            </button>
          </div>
        )}

        {/* Prospects Tab */}
        {activeTab === 'prospects' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">
                      {stats?.total ?? prospects.length}
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Actifs</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {stats?.active ?? prospects.filter((p: any) => p.status === 'active').length}
                    </p>
                  </div>
                  <div className="text-4xl">✓</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Qualifiés</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {stats?.qualified ??
                        prospects.filter((p: any) => p.status === 'qualified').length}
                    </p>
                  </div>
                  <div className="text-4xl">⭐</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Convertis</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {stats?.converted ??
                        prospects.filter((p: any) => p.status === 'converted').length}
                    </p>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
              </div>
            </div>

            {/* Prospects list or empty state */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement...</p>
              </div>
            ) : prospects.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun prospect</h2>
                <p className="text-gray-500 text-lg mb-6">
                  Créez votre premier prospect pour commencer
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold">
                  Ajouter un prospect
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prospects.map((p: any) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">
                        {p.firstName} {p.lastName}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{p.email}</p>
                    {p.phone && <p className="text-sm text-gray-500">📞 {p.phone}</p>}
                    {p.score !== undefined && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full">
                          <div
                            className="h-2 bg-orange-500 rounded-full"
                            style={{ width: `${Math.min(p.score, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{p.score}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mandates Tab */}
        {activeTab === 'mandates' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{mandates.length}</p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Actifs</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {mandates.filter((m: any) => m.status === 'active').length}
                    </p>
                  </div>
                  <div className="text-4xl">✓</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">En cours</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {mandates.filter((m: any) => m.status === 'pending').length}
                    </p>
                  </div>
                  <div className="text-4xl">⏳</div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Expirés</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      {mandates.filter((m: any) => m.status === 'expired').length}
                    </p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Chargement...</p>
              </div>
            ) : mandates.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun mandat</h2>
                <p className="text-gray-500 text-lg mb-6">
                  Créez votre premier mandat pour commencer
                </p>
                <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold">
                  Ajouter un mandat
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mandates.map((m: any) => (
                  <div
                    key={m.id}
                    className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {m.title || m.reference || m.id}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {m.status}
                      </span>
                    </div>
                    {m.price && (
                      <p className="text-sm font-bold text-orange-600">
                        {new Intl.NumberFormat('fr-TN', {
                          style: 'currency',
                          currency: m.currency || 'TND',
                          minimumFractionDigits: 0,
                        }).format(m.price)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Loading indicator */}
      {loading && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl px-5 py-4 flex items-center gap-4 z-50">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-200 border-t-orange-600"></div>
          <span className="text-sm font-medium text-gray-700">Chargement...</span>
        </div>
      )}
    </div>
  );
};

export default ProspectsDashboard;
