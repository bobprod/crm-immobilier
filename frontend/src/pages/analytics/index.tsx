import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { TrendingUp, Users, Home, DollarSign, AlertCircle } from 'lucide-react';
import { apiClient } from '@/shared/utils/api-client-backend';

interface Analytics {
  totalProspects: number;
  totalProperties: number;
  totalRevenue: number;
  conversionRate: number;
  prospectsByStatus: Record<string, number>;
  propertiesByType: Record<string, number>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalProspects: 0,
    totalProperties: 0,
    totalRevenue: 0,
    conversionRate: 0,
    prospectsByStatus: {},
    propertiesByType: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const response = await apiClient.get('/analytics/dashboard');
      setAnalytics(response.data || {
        totalProspects: 0,
        totalProperties: 0,
        totalRevenue: 0,
        conversionRate: 0,
        prospectsByStatus: {},
        propertiesByType: {}
      });
    } catch (error: any) {
      console.error('Erreur chargement analytics:', error);
      setError('Impossible de charger les analytics. Les données par défaut sont affichées.');
      // Keep default values already set in state
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Chargement des analytics...</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics & Statistiques</h1>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-800">{error}</p>
            <button
              onClick={loadAnalytics}
              className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* KPIs Principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Prospects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalProspects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="h-4 w-4" />
              Total Biens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalProperties}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenu Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {analytics.totalRevenue.toLocaleString()} €
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Taux de Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Prospects par Statut */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Prospects par Statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.prospectsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biens par Type */}
      <Card>
        <CardHeader>
          <CardTitle>Biens par Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.propertiesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize">{type}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
