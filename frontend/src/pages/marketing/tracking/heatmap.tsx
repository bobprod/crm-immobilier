import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import apiClient from '@/shared/utils/backend-api';
import {
  MousePointer,
  Activity,
  Eye,
  TrendingDown,
  Download,
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';

interface HeatmapStats {
  totalClicks: number;
  totalMoves: number;
  totalScrolls: number;
  uniqueSessions: number;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  topClickedElements: Array<{ element: string; clicks: number }>;
}

interface ScrollDepthStats {
  averageScrollDepth: number;
  maxScrollDepth: number;
  scrollReachPercentages: {
    '25%': number;
    '50%': number;
    '75%': number;
    '100%': number;
  };
}

export default function HeatmapPage() {
  const [pages, setPages] = useState<Array<{ url: string; eventsCount: number }>>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [heatmapType, setHeatmapType] = useState<'click' | 'move' | 'scroll'>('click');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [stats, setStats] = useState<HeatmapStats | null>(null);
  const [scrollDepth, setScrollDepth] = useState<ScrollDepthStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      loadHeatmapData();
      loadStats();
      loadScrollDepth();
    }
  }, [selectedPage, heatmapType, deviceType]);

  const loadPages = async () => {
    try {
      const response = await apiClient.get('/marketing-tracking/heatmap/pages');
      setPages(response.data);
      if (response.data.length > 0) {
        setSelectedPage(response.data[0].url);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  };

  const loadHeatmapData = async () => {
    if (!selectedPage) return;

    setLoading(true);
    try {
      const response = await apiClient.get('/marketing-tracking/heatmap/data', {
        params: {
          pageUrl: selectedPage,
          type: heatmapType,
          deviceType,
        },
      });
      setHeatmapData(response.data);
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedPage) return;

    try {
      const response = await apiClient.get('/marketing-tracking/heatmap/stats', {
        params: { pageUrl: selectedPage },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadScrollDepth = async () => {
    if (!selectedPage) return;

    try {
      const response = await apiClient.get('/marketing-tracking/heatmap/scroll-depth', {
        params: { pageUrl: selectedPage },
      });
      setScrollDepth(response.data);
    } catch (error) {
      console.error('Failed to load scroll depth:', error);
    }
  };

  const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MousePointer className="h-8 w-8 text-purple-600" />
          Heatmaps
        </h1>
        <p className="text-gray-600 mt-2">
          Visualisez où vos visiteurs cliquent, déplacent leur souris et scrollent
        </p>
      </div>

      {/* Stats KPIs */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Clics Total</p>
                  <p className="text-3xl font-bold">{stats.totalClicks}</p>
                </div>
                <MousePointer className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mouvements</p>
                  <p className="text-3xl font-bold">{stats.totalMoves}</p>
                </div>
                <Activity className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scrolls</p>
                  <p className="text-3xl font-bold">{stats.totalScrolls}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sessions Uniques</p>
                  <p className="text-3xl font-bold">{stats.uniqueSessions}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Select value={selectedPage || undefined} onValueChange={setSelectedPage}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une page" />
          </SelectTrigger>
          <SelectContent>
            {pages.map((page) => (
              <SelectItem key={page.url} value={page.url}>
                {new URL(page.url).pathname} ({page.eventsCount} events)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={heatmapType} onValueChange={(v: any) => setHeatmapType(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="click">Clics</SelectItem>
            <SelectItem value="move">Mouvements souris</SelectItem>
            <SelectItem value="scroll">Scroll</SelectItem>
          </SelectContent>
        </Select>

        <Select value={deviceType} onValueChange={(v: any) => setDeviceType(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desktop">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Desktop
              </div>
            </SelectItem>
            <SelectItem value="mobile">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile
              </div>
            </SelectItem>
            <SelectItem value="tablet">
              <div className="flex items-center gap-2">
                <Tablet className="h-4 w-4" />
                Tablet
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter PNG
        </Button>
      </div>

      <Tabs defaultValue="heatmap" className="space-y-6">
        <TabsList>
          <TabsTrigger value="heatmap">
            <MousePointer className="h-4 w-4 mr-2" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="scroll-depth">
            <TrendingDown className="h-4 w-4 mr-2" />
            Scroll Depth
          </TabsTrigger>
          <TabsTrigger value="clicks">
            <BarChart3 className="h-4 w-4 mr-2" />
            Top Éléments Cliqués
          </TabsTrigger>
          <TabsTrigger value="devices">
            <Monitor className="h-4 w-4 mr-2" />
            Par Device
          </TabsTrigger>
        </TabsList>

        {/* Heatmap Visualization */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>
                Heatmap {heatmapType === 'click' ? 'Clics' : heatmapType === 'move' ? 'Mouvements' : 'Scroll'} - {deviceType}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-96 flex items-center justify-center">
                  <p className="text-gray-500">Chargement de la heatmap...</p>
                </div>
              ) : heatmapData.length === 0 ? (
                <div className="h-96 flex items-center justify-center">
                  <p className="text-gray-500">Aucune donnée disponible pour cette page</p>
                </div>
              ) : (
                <div className="relative bg-gray-50 rounded-lg p-4">
                  {/* Placeholder for heatmap visualization */}
                  <div className="h-96 bg-white border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                    <div className="text-center">
                      <MousePointer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        {heatmapData.length} points de données collectés
                      </p>
                      <p className="text-sm text-gray-500">
                        Intégrer heatmap.js ou bibliothèque similaire pour visualisation
                      </p>
                      <Button className="mt-4" variant="outline">
                        Voir les données brutes ({heatmapData.length} points)
                      </Button>
                    </div>
                  </div>

                  {/* Data summary */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Points Min</p>
                      <p className="text-xl font-bold">
                        {Math.min(...heatmapData.map((p) => p.value))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Points Max</p>
                      <p className="text-xl font-bold">
                        {Math.max(...heatmapData.map((p) => p.value))}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Points Moyens</p>
                      <p className="text-xl font-bold">
                        {Math.round(
                          heatmapData.reduce((sum, p) => sum + p.value, 0) / heatmapData.length,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scroll Depth */}
        <TabsContent value="scroll-depth">
          {scrollDepth && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profondeur de Scroll</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Profondeur Moyenne</p>
                      <div className="text-5xl font-bold text-blue-600">
                        {scrollDepth.averageScrollDepth}%
                      </div>
                    </div>

                    <div className="text-center border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">Profondeur Max Atteinte</p>
                      <div className="text-3xl font-bold text-green-600">
                        {scrollDepth.maxScrollDepth}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pourcentage d'Atteinte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(scrollDepth.scrollReachPercentages).map(([depth, percentage]) => (
                      <div key={depth}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Scrollé jusqu'à {depth}</span>
                          <span className="text-sm text-gray-600">{percentage}% des visiteurs</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Top Clicked Elements */}
        <TabsContent value="clicks">
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Éléments Cliqués</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topClickedElements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.element}
                        </code>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="outline">{item.clicks} clics</Badge>
                      </div>
                    </div>
                  ))}

                  {stats.topClickedElements.length === 0 && (
                    <p className="text-center text-gray-500 py-8">Aucune donnée de clics disponible</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Device Breakdown */}
        <TabsContent value="devices">
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Device</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.deviceBreakdown.map((device) => {
                    const Icon = deviceIcons[device.deviceType as keyof typeof deviceIcons];
                    const total = stats.deviceBreakdown.reduce((sum, d) => sum + d.count, 0);
                    const percentage = ((device.count / total) * 100).toFixed(1);

                    return (
                      <Card key={device.deviceType}>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            {Icon && <Icon className="h-12 w-12 mx-auto mb-4 text-gray-600" />}
                            <p className="text-sm text-gray-600 capitalize mb-2">
                              {device.deviceType}
                            </p>
                            <p className="text-3xl font-bold">{device.count}</p>
                            <p className="text-sm text-gray-500 mt-2">{percentage}%</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
