import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import apiClient from '@/shared/utils/backend-api';
import {
  Activity,
  TrendingUp,
  Target,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
  realTimeEvents: any[];
  eventsByPlatform: Record<string, number>;
  eventsByType: Record<string, number>;
  conversionRate: number;
  topEvents: Array<{ eventName: string; count: number; conversionRate: number }>;
  platformPerformance: Array<{
    platform: string;
    totalEvents: number;
    successfulEvents: number;
    failedEvents: number;
    deliveryRate: number;
  }>;
  timeline: Array<{ timestamp: Date; count: number }>;
  period: string;
}

export default function TrackingAnalyticsDashboard() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, [autoRefresh, period]);

  const loadDashboard = async () => {
    try {
      const response = await apiClient.get(`/marketing-tracking/analytics/dashboard`, {
        params: { period },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Impossible de charger les données analytics
          </CardContent>
        </Card>
      </div>
    );
  }

  const platformColors: Record<string, string> = {
    facebook: 'bg-blue-500',
    meta: 'bg-blue-500',
    google_analytics: 'bg-orange-500',
    google_ads: 'bg-green-500',
    google_tag_manager: 'bg-purple-500',
    tiktok: 'bg-black',
    linkedin: 'bg-blue-600',
    snapchat: 'bg-yellow-400',
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/marketing-dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Hub Marketing
            </Button>
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Analytics Tracking Temps Réel
          </h1>
          <p className="text-gray-600 mt-2">
            Suivi et analyse des événements de tracking en temps réel
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dernières 24h</SelectItem>
              <SelectItem value="week">7 derniers jours</SelectItem>
              <SelectItem value="month">30 derniers jours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button size="sm" onClick={loadDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Événements Totaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.values(dashboardData.eventsByPlatform).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Période : {period === 'day' ? '24h' : period === 'week' ? '7j' : '30j'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taux de Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {dashboardData.conversionRate.toFixed(2)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Lead, Purchase, Schedule, etc.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Plateformes Actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.keys(dashboardData.eventsByPlatform).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Object.keys(dashboardData.eventsByPlatform).join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Dernière Mise à Jour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{new Date().toLocaleTimeString('fr-FR')}</div>
            <p className="text-xs text-gray-500 mt-1">
              {autoRefresh ? 'Auto-refresh actif (30s)' : 'Manuel'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">
            <Clock className="h-4 w-4 mr-2" />
            Temps Réel
          </TabsTrigger>
          <TabsTrigger value="platforms">
            <PieChart className="h-4 w-4 mr-2" />
            Par Plateforme
          </TabsTrigger>
          <TabsTrigger value="events">
            <BarChart3 className="h-4 w-4 mr-2" />
            Par Type d'Événement
          </TabsTrigger>
          <TabsTrigger value="performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <LineChart className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Real-time Events */}
        <TabsContent value="realtime">
          <Card>
            <CardHeader>
              <CardTitle>Derniers Événements (10 plus récents)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.realTimeEvents.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Aucun événement récent</p>
                ) : (
                  dashboardData.realTimeEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge className={platformColors[event.platform] || 'bg-gray-500'}>
                            {event.platform}
                          </Badge>
                          <span className="font-semibold">{event.eventName}</span>
                          {event.conversionProbability && (
                            <Badge variant="outline" className="text-xs">
                              Conv: {(event.conversionProbability * 100).toFixed(0)}%
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(event.timestamp).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      {event.leadScore && (
                        <div className="text-right">
                          <div className="text-sm font-medium">Score Lead</div>
                          <div className="text-lg font-bold text-blue-600">
                            {event.leadScore}/100
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Platform */}
        <TabsContent value="platforms">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Événements par Plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(dashboardData.eventsByPlatform).map(([platform, count]) => {
                    const total = Object.values(dashboardData.eventsByPlatform).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percentage = ((count / total) * 100).toFixed(1);
                    return (
                      <div key={platform} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{platform}</span>
                          <span className="text-sm text-gray-600">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${platformColors[platform] || 'bg-gray-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 5 Événements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topEvents.map((event, index) => (
                    <div key={event.eventName} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{event.eventName}</div>
                        <div className="text-sm text-gray-600">
                          {event.count} événements · Conv: {event.conversionRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Event Type */}
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Type d'Événement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(dashboardData.eventsByType).map(([eventName, count]) => (
                  <Card key={eventName}>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{count}</div>
                        <div className="text-sm text-gray-600 mt-2">{eventName}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Performance */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance par Plateforme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboardData.platformPerformance.map((platform) => (
                  <div key={platform.platform} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Badge className={platformColors[platform.platform] || 'bg-gray-500'}>
                          {platform.platform}
                        </Badge>
                        <span className="font-semibold">{platform.totalEvents} événements</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Taux de livraison</div>
                        <div className="text-2xl font-bold text-green-600">
                          {platform.deliveryRate.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="text-xl font-bold">{platform.totalEvents}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Succès</div>
                        <div className="text-xl font-bold text-green-600">
                          {platform.successfulEvents}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Échecs</div>
                        <div className="text-xl font-bold text-red-600">
                          {platform.failedEvents}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-3 flex overflow-hidden">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(platform.successfulEvents / platform.totalEvents) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(platform.failedEvents / platform.totalEvents) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline des Événements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.timeline.map((point, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-gray-600">
                      {new Date(point.timestamp).toLocaleString('fr-FR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="bg-blue-500 h-8 rounded"
                          style={{
                            width: `${(point.count / Math.max(...dashboardData.timeline.map((p) => p.count))) * 100}%`,
                            minWidth: '2px',
                          }}
                        />
                        <span className="text-sm font-medium">{point.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
