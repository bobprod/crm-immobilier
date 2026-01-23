import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { TrendingUp, Users, Home, DollarSign } from 'lucide-react';
import { apiClient } from '@/src/shared/utils/api-client-backend';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';

type TabKey = 'overview' | 'funnel' | 'performance' | 'roi';

interface Analytics {
  totalProspects?: number;
  totalProperties?: number;
  totalRevenue?: number;
  conversionRate?: number;
  prospectsByStatus?: Record<string, number>;
  propertiesByType?: Record<string, number>;
}

interface ProspectsStats {
  conversionFunnel?: Record<string, number>;
  [key: string]: any;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isReady, setIsReady] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState<Analytics>({});
  const [prospectsStats, setProspectsStats] = useState<ProspectsStats | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [roi, setRoi] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for router to be ready
  useEffect(() => {
    if (!router.isReady) return;

    const tab = (router.query.tab as TabKey) || 'overview';
    setActiveTab(tab);
    setIsReady(true);
  }, [router.isReady, router.query.tab]);

  // Load overview data on mount
  useEffect(() => {
    if (isReady) {
      loadOverview();
    }
  }, [isReady]);

  // Load data per tab
  useEffect(() => {
    if (!isReady) return;

    if (activeTab === 'funnel' && !prospectsStats) {
      loadFunnel();
    } else if (activeTab === 'performance' && !performance) {
      loadPerformance();
    } else if (activeTab === 'roi' && !roi) {
      loadRoi();
    }
  }, [activeTab, isReady]);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/dashboard');
      setAnalytics(response.data || {});
    } catch (err: any) {
      console.error('Erreur chargement overview:', err);
      if (err.response?.status === 401) {
        setError('Authentification requise.');
      } else if (err.response?.status === 403) {
        setError("Vous n'êtes pas membre d'une agence.");
      } else {
        setError("Impossible de charger l'overview.");
      }
      setAnalytics({});
    } finally {
      setLoading(false);
    }
  };

  const loadFunnel = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/prospects');
      setProspectsStats(response.data || {});
    } catch (err: any) {
      console.error('Erreur chargement funnel:', err);
      if (err.response?.status === 401) {
        setError('Authentification requise.');
      } else if (err.response?.status === 403) {
        setError("Vous n'êtes pas membre d'une agence.");
      } else {
        setError('Impossible de charger le funnel.');
      }
      setProspectsStats({});
    } finally {
      setLoading(false);
    }
  };

  const loadPerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/trends', { params: { period: 'month' } });
      setPerformance(response.data || {});
    } catch (err: any) {
      console.error('Erreur chargement performance:', err);
      if (err.response?.status === 401) {
        setError('Authentification requise.');
      } else if (err.response?.status === 403) {
        setError("Vous n'êtes pas membre d'une agence.");
      } else {
        setError('Impossible de charger la performance.');
      }
      setPerformance({});
    } finally {
      setLoading(false);
    }
  };

  const loadRoi = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/analytics/kpis');
      setRoi(response.data || {});
    } catch (err: any) {
      console.error('Erreur chargement ROI:', err);
      if (err.response?.status === 401) {
        setError('Authentification requise.');
      } else if (err.response?.status === 403) {
        setError("Vous n'êtes pas membre d'une agence.");
      } else {
        setError('Impossible de charger le ROI.');
      }
      setRoi({});
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    const tab = newTab as TabKey;
    setActiveTab(tab);
    router.push(`/analytics?tab=${tab}`, undefined, { shallow: true });
  };

  // Wait for router to be ready
  if (!isReady) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout
        title="Analytics"
        breadcrumbs={[
          { label: 'Analytics' },
        ]}
      >
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-6">Analytics & Dashboard</h1>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="funnel">Funnel de conversion</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="roi">ROI</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="mt-4">
                {error && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-yellow-800">{error}</p>
                    <Button onClick={loadOverview} className="mt-2" variant="outline">
                      Réessayer
                    </Button>
                  </div>
                )}

                {loading && Object.keys(analytics).length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Users className="h-4 w-4" /> Total Prospects
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{analytics.totalProspects ?? 0}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Home className="h-4 w-4" /> Total Biens
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{analytics.totalProperties ?? 0}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Revenu Total
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">
                            {(analytics.totalRevenue ?? 0).toLocaleString()} €
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Taux de Conversion
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{analytics.conversionRate ?? 0}%</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Prospects par Statut</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {Object.entries(analytics.prospectsByStatus ?? {}).length > 0 ? (
                              Object.entries(analytics.prospectsByStatus ?? {}).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                  <span className="capitalize">{status}</span>
                                  <span className="font-bold">{count}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">Aucune donnée disponible</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Biens par Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {Object.entries(analytics.propertiesByType ?? {}).length > 0 ? (
                              Object.entries(analytics.propertiesByType ?? {}).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                  <span className="capitalize">{type}</span>
                                  <span className="font-bold">{count}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">Aucune donnée disponible</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Funnel Tab */}
            <TabsContent value="funnel">
              <div className="mt-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
                  <h2 className="text-xl font-bold mb-2">Tunnel de Conversion</h2>
                  <p className="text-blue-100">
                    Visualisez votre pipeline de conversion et identifiez les opportunités d'optimisation.
                  </p>
                </div>

                {loading && !prospectsStats ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Étapes du funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {prospectsStats && Object.keys(prospectsStats.conversionFunnel ?? {}).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(prospectsStats.conversionFunnel ?? {}).map(([step, value]) => (
                            <div key={step} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="capitalize font-medium">{step}</span>
                              <span className="font-bold text-lg">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">Aucune donnée disponible pour le funnel.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance">
              <div className="mt-4">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white mb-6">
                  <h2 className="text-xl font-bold mb-2">Performance des Campagnes</h2>
                  <p className="text-green-100">
                    Analysez l'efficacité de vos campagnes et optimisez votre stratégie.
                  </p>
                </div>

                {loading && !performance ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tendances</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {performance && Object.keys(performance).length > 0 ? (
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                          {JSON.stringify(performance, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">📈</div>
                          <p className="text-gray-500">Aucune donnée de performance disponible.</p>
                          <ul className="text-sm text-gray-600 text-left max-w-md mx-auto mt-4 space-y-2">
                            <li>• Taux de conversion par campagne</li>
                            <li>• Coût par lead (CPL)</li>
                            <li>• Temps moyen de qualification</li>
                            <li>• Sources les plus performantes</li>
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* ROI Tab */}
            <TabsContent value="roi">
              <div className="mt-4">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 text-white mb-6">
                  <h2 className="text-xl font-bold mb-2">Retour sur Investissement</h2>
                  <p className="text-yellow-100">
                    Mesurez la rentabilité de vos investissements en prospection.
                  </p>
                </div>

                {loading && !roi ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>KPIs & ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {roi && Object.keys(roi).length > 0 ? (
                        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
                          {JSON.stringify(roi, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">💰</div>
                          <p className="text-gray-500">Aucune donnée ROI disponible.</p>
                          <ul className="text-sm text-gray-600 text-left max-w-md mx-auto mt-4 space-y-2">
                            <li>• Investissement total par campagne</li>
                            <li>• Revenus générés</li>
                            <li>• ROI en pourcentage</li>
                            <li>• Projection sur 3, 6, 12 mois</li>
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
