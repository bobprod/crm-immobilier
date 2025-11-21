import React, { useState, useEffect } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { TrendingUp, Users, Home, DollarSign } from 'lucide-react';
import { apiClient } from '@/src/shared/utils/api-client-backend';

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
    } catch (error) {
      console.error('Erreur chargement analytics:', error);
      setError('Impossible de charger les analytics. Les données par défaut sont affichées.');
      setAnalytics({
        totalProspects: 0,
        totalProperties: 0,
        totalRevenue: 0,
        conversionRate: 0,
        prospectsByStatus: {},
        propertiesByType: {}
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Analytics & Statistiques</h1>

        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">{error}</p>
            <Button onClick={loadAnalytics} className="mt-2" variant="outline">
              Réessayer
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </Layout>
  );
}
