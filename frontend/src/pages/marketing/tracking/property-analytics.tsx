import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';

interface PropertyStat {
  propertyId: string;
  propertyData: {
    title: string;
    price: number;
    city: string;
    type: string;
    category: 'sale' | 'rent';
  };
  impressions: number;
  totalTimeSpent: number;
  averageTimeSpent: number;
  buttonClicks: number;
  leads: number;
  clickThroughRate: number;
  conversionRate: number;
}

interface GlobalStats {
  period: string;
  totalImpressions: number;
  totalButtonClicks: number;
  totalLeads: number;
  totalTimeSpent: number;
  averageTimeSpent: number;
  uniquePropertiesViewed: number;
  globalClickThroughRate: number;
  globalConversionRate: number;
}

interface ButtonStats {
  buttonType: string;
  clicks: number;
  uniqueProperties: number;
  percentage: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const BUTTON_TYPE_LABELS: Record<string, string> = {
  contact: 'Contact',
  call: 'Appel',
  email: 'Email',
  view_details: 'Voir détails',
  download: 'Télécharger',
  share: 'Partager',
  save: 'Favoris',
  schedule_visit: 'Visite',
  calculator: 'Simulateur',
  gallery: 'Galerie',
  other: 'Autre',
};

export default function PropertyAnalyticsPage() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [loading, setLoading] = useState(false);

  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [topByViews, setTopByViews] = useState<PropertyStat[]>([]);
  const [topByConversion, setTopByConversion] = useState<PropertyStat[]>([]);
  const [topByTimeSpent, setTopByTimeSpent] = useState<PropertyStat[]>([]);
  const [topByEngagement, setTopByEngagement] = useState<PropertyStat[]>([]);
  const [buttonStats, setButtonStats] = useState<ButtonStats[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [globalRes, topPropsRes, buttonsRes] = await Promise.all([
        apiClient.get(`/marketing-tracking/property-analytics/global-stats?period=${period}`),
        apiClient.get(`/marketing-tracking/property-analytics/top-properties?period=${period}&limit=10`),
        apiClient.get(`/marketing-tracking/property-analytics/buttons-stats?period=${period}`),
      ]);

      setGlobalStats(globalRes.data);
      setTopByViews(topPropsRes.data.topByViews || []);
      setTopByConversion(topPropsRes.data.topByConversion || []);
      setTopByTimeSpent(topPropsRes.data.topByTimeSpent || []);
      setTopByEngagement(topPropsRes.data.topByEngagement || []);
      setButtonStats(buttonsRes.data.buttonTypes || []);
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Biens Immobiliers</h1>
          <p className="text-muted-foreground mt-1">
            Analysez la performance de vos biens sur les pages vitrines
          </p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Dernières 24h</SelectItem>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs Globaux */}
      {globalStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalImpressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {globalStats.uniquePropertiesViewed} biens uniques
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(globalStats.averageTimeSpent)}</div>
              <p className="text-xs text-muted-foreground mt-1">par bien</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taux de Clic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.globalClickThroughRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {globalStats.totalButtonClicks} clics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {globalStats.globalConversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{globalStats.totalLeads} leads</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="top-views" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="top-views">Top Vues</TabsTrigger>
          <TabsTrigger value="top-conversion">Top Conversion</TabsTrigger>
          <TabsTrigger value="top-time">Temps Passé</TabsTrigger>
          <TabsTrigger value="top-engagement">Engagement</TabsTrigger>
          <TabsTrigger value="buttons">Boutons</TabsTrigger>
        </TabsList>

        {/* TAB 1: Top par Vues */}
        <TabsContent value="top-views" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 - Biens les Plus Vus</CardTitle>
              <CardDescription>
                Classement des biens par nombre d'impressions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topByViews.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topByViews}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="propertyData.title"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) =>
                          name === 'impressions' ? [value, 'Vues'] : [value, name]
                        }
                      />
                      <Bar dataKey="impressions" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold">#</th>
                          <th className="text-left p-3 font-semibold">Bien</th>
                          <th className="text-right p-3 font-semibold">Vues</th>
                          <th className="text-right p-3 font-semibold">Clics</th>
                          <th className="text-right p-3 font-semibold">Leads</th>
                          <th className="text-right p-3 font-semibold">Conv. %</th>
                          <th className="text-center p-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topByViews.map((property, index) => (
                          <tr key={property.propertyId} className="border-b last:border-b-0">
                            <td className="p-3 font-bold text-gray-500">#{index + 1}</td>
                            <td className="p-3">
                              <div className="font-medium">{property.propertyData.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {property.propertyData.city} • {formatCurrency(property.propertyData.price)}
                              </div>
                            </td>
                            <td className="text-right p-3 font-semibold">{property.impressions}</td>
                            <td className="text-right p-3">{property.buttonClicks}</td>
                            <td className="text-right p-3 text-green-600 font-semibold">
                              {property.leads}
                            </td>
                            <td className="text-right p-3">
                              <Badge variant={property.conversionRate > 5 ? 'default' : 'secondary'}>
                                {property.conversionRate.toFixed(1)}%
                              </Badge>
                            </td>
                            <td className="text-center p-3">
                              <Link href={`/marketing/tracking/property-heatmap/${property.propertyId}`}>
                                <Button size="sm" variant="outline">
                                  Heatmap
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée disponible pour cette période
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Top par Conversion */}
        <TabsContent value="top-conversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 - Meilleur Taux de Conversion</CardTitle>
              <CardDescription>
                Biens qui génèrent le plus de leads par vue (minimum 5 vues)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topByConversion.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topByConversion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="propertyData.title"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'conversionRate') return [value.toFixed(2) + '%', 'Taux Conv.'];
                          return [value, name];
                        }}
                      />
                      <Bar dataKey="conversionRate" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold">#</th>
                          <th className="text-left p-3 font-semibold">Bien</th>
                          <th className="text-right p-3 font-semibold">Vues</th>
                          <th className="text-right p-3 font-semibold">Leads</th>
                          <th className="text-right p-3 font-semibold">Conversion %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topByConversion.map((property, index) => (
                          <tr key={property.propertyId} className="border-b last:border-b-0">
                            <td className="p-3 font-bold text-green-600">#{index + 1}</td>
                            <td className="p-3">
                              <div className="font-medium">{property.propertyData.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {property.propertyData.city}
                              </div>
                            </td>
                            <td className="text-right p-3">{property.impressions}</td>
                            <td className="text-right p-3 font-semibold">{property.leads}</td>
                            <td className="text-right p-3">
                              <div className="text-xl font-bold text-green-600">
                                {property.conversionRate.toFixed(1)}%
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée de conversion disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Temps Passé */}
        <TabsContent value="top-time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 - Temps Moyen Passé</CardTitle>
              <CardDescription>
                Biens qui retiennent le plus l'attention des visiteurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topByTimeSpent.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topByTimeSpent}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="propertyData.title"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => formatDuration(value)}
                        labelFormatter={(label) => `${label}`}
                      />
                      <Bar dataKey="averageTimeSpent" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold">#</th>
                          <th className="text-left p-3 font-semibold">Bien</th>
                          <th className="text-right p-3 font-semibold">Vues</th>
                          <th className="text-right p-3 font-semibold">Temps Moyen</th>
                          <th className="text-right p-3 font-semibold">Temps Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topByTimeSpent.map((property, index) => (
                          <tr key={property.propertyId} className="border-b last:border-b-0">
                            <td className="p-3 font-bold text-orange-600">#{index + 1}</td>
                            <td className="p-3">
                              <div className="font-medium">{property.propertyData.title}</div>
                            </td>
                            <td className="text-right p-3">{property.impressions}</td>
                            <td className="text-right p-3 font-semibold text-lg">
                              {formatDuration(property.averageTimeSpent)}
                            </td>
                            <td className="text-right p-3 text-muted-foreground">
                              {formatDuration(property.totalTimeSpent)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée de temps disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Engagement */}
        <TabsContent value="top-engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 - Meilleur Engagement</CardTitle>
              <CardDescription>
                Biens avec le meilleur taux de clic (CTR)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topByEngagement.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3 font-semibold">#</th>
                        <th className="text-left p-3 font-semibold">Bien</th>
                        <th className="text-right p-3 font-semibold">Vues</th>
                        <th className="text-right p-3 font-semibold">Clics</th>
                        <th className="text-right p-3 font-semibold">CTR %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topByEngagement.map((property, index) => (
                        <tr key={property.propertyId} className="border-b last:border-b-0">
                          <td className="p-3 font-bold text-purple-600">#{index + 1}</td>
                          <td className="p-3">
                            <div className="font-medium">{property.propertyData.title}</div>
                          </td>
                          <td className="text-right p-3">{property.impressions}</td>
                          <td className="text-right p-3 font-semibold">{property.buttonClicks}</td>
                          <td className="text-right p-3">
                            <div className="text-xl font-bold text-purple-600">
                              {property.clickThroughRate.toFixed(1)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée d'engagement disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Boutons */}
        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des Boutons</CardTitle>
              <CardDescription>
                Analyse des clics par type de bouton sur tous les biens
              </CardDescription>
            </CardHeader>
            <CardContent>
              {buttonStats.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={buttonStats}
                          dataKey="clicks"
                          nameKey="buttonType"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) =>
                            `${BUTTON_TYPE_LABELS[entry.buttonType] || entry.buttonType}: ${entry.percentage.toFixed(1)}%`
                          }
                        >
                          {buttonStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-right p-3 font-semibold">Clics</th>
                          <th className="text-right p-3 font-semibold">Biens</th>
                          <th className="text-right p-3 font-semibold">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {buttonStats.map((stat, index) => (
                          <tr key={stat.buttonType} className="border-b last:border-b-0">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">
                                  {BUTTON_TYPE_LABELS[stat.buttonType] || stat.buttonType}
                                </span>
                              </div>
                            </td>
                            <td className="text-right p-3 font-semibold">{stat.clicks}</td>
                            <td className="text-right p-3 text-muted-foreground">
                              {stat.uniqueProperties}
                            </td>
                            <td className="text-right p-3">
                              <Badge>{stat.percentage.toFixed(1)}%</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée de boutons disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
