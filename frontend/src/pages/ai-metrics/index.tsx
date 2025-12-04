import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  Brain,
  DollarSign,
  Zap,
  TrendingUp,
  BarChart3,
  History,
  Target,
  Loader2,
  RefreshCw,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Filter,
  Activity,
  PieChart,
  Lightbulb,
  Trophy,
} from 'lucide-react';
import { apiClient } from '@/shared/utils/api-client-backend';

// ============================================
// TYPES - LLM Cost Tracking
// ============================================

interface GlobalStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  totalConversions: number;
  byProvider: ProviderStats[];
  byModel: ModelStats[];
}

interface ProviderStats {
  provider: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface ModelStats {
  model: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface ROIData {
  totalCost: number;
  conversions: number;
  roi: number;
  avgCostPerConversion: number;
}

// ============================================
// TYPES - Prospecting Analytics
// ============================================

interface ProspectingOverview {
  period: { from: string; to: string };
  totals: {
    rawItemsScraped: number;
    leadsCreated: number;
    leadsValid: number;
    leadsSuspicious: number;
    leadsSpam: number;
    matchesCreated: number;
    leadsContacted: number;
    leadsQualified: number;
    leadsConverted: number;
  };
  rates: {
    leadConversionRate: number;
    spamRate: number;
    contactRate: number;
    qualificationRate: number;
    conversionRate: number;
  };
  averages: {
    avgSeriousnessScore: number;
    avgMatchScore: number;
    avgLeadsPerCampaign: number;
  };
}

interface SourceStats {
  source: string;
  leadsCreated: number;
  leadsValid: number;
  leadsSpam: number;
  spamRate: number;
  leadsConverted: number;
  conversionRate: number;
  avgSeriousnessScore: number;
  avgMatchScore: number;
}

interface CampaignStats {
  campaignId: string;
  campaignName: string;
  campaignType: string;
  status: string;
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
  avgMatchScore: number;
}

interface QualityMetrics {
  aiAccuracy: {
    validLeads: { total: number; contacted: number; rejected: number; pending: number; accuracyRate: number };
    spamLeads: { total: number; recovered: number; ignored: number; accuracyRate: number };
    suspiciousLeads: { total: number; validated: number; rejected: number; pending: number };
  };
  matchingAccuracy: {
    highScoreMatches: { total: number; converted: number; conversionRate: number };
    mediumScoreMatches: { total: number; converted: number; conversionRate: number };
    lowScoreMatches: { total: number; converted: number; conversionRate: number };
  };
}

interface InsightItem {
  type: 'warning' | 'success' | 'info';
  category: string;
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}

interface TopPerformers {
  topCampaigns: Array<{ campaignId: string; campaignName: string; leadsCreated: number; leadsConverted: number; conversionRate: number }>;
  topSources: Array<{ source: string; leadsCreated: number; leadsConverted: number; conversionRate: number }>;
  topCities: Array<{ city: string; leadsCreated: number; leadsConverted: number; conversionRate: number }>;
}

export default function AiMetricsDashboard() {
  const [activeTab, setActiveTab] = useState('prospecting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  // LLM Cost Tracking State
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [roi, setRoi] = useState<ROIData | null>(null);

  // Prospecting Analytics State
  const [overview, setOverview] = useState<ProspectingOverview | null>(null);
  const [sources, setSources] = useState<SourceStats[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformers | null>(null);

  useEffect(() => {
    loadAllData();
  }, [days]);

  const getDateRange = () => {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return { from, to };
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { from, to } = getDateRange();

      const [
        statsRes,
        roiRes,
        overviewRes,
        sourcesRes,
        campaignsRes,
        qualityRes,
        insightsRes,
        topPerformersRes,
      ] = await Promise.all([
        apiClient.get('/ai-metrics/stats'),
        apiClient.get('/ai-metrics/roi'),
        apiClient.get(`/ai-metrics/prospecting/overview?from=${from}&to=${to}`),
        apiClient.get(`/ai-metrics/prospecting/by-source?from=${from}&to=${to}`),
        apiClient.get(`/ai-metrics/prospecting/by-campaign?from=${from}&to=${to}`),
        apiClient.get(`/ai-metrics/prospecting/quality?from=${from}&to=${to}`),
        apiClient.get(`/ai-metrics/prospecting/insights?from=${from}&to=${to}`),
        apiClient.get(`/ai-metrics/prospecting/top-performers?from=${from}&to=${to}`),
      ]);

      setStats(statsRes.data);
      setRoi(roiRes.data);
      setOverview(overviewRes.data);
      setSources(sourcesRes.data?.sources || []);
      setCampaigns(campaignsRes.data?.campaigns || []);
      setQuality(qualityRes.data);
      setInsights(insightsRes.data?.insights || []);
      setTopPerformers(topPerformersRes.data);
    } catch (err: any) {
      console.error('Erreur chargement métriques IA:', err);
      setError('Impossible de charger les métriques IA');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const { from, to } = getDateRange();
    window.open(`/api/ai-metrics/prospecting/export?from=${from}&to=${to}`, '_blank');
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (num: number) => new Intl.NumberFormat('fr-FR').format(num);
  const formatCost = (cost: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(cost);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Métriques IA
          </h1>
          <p className="text-gray-600 mt-1">
            Analytics de prospection et suivi des coûts IA
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded-md px-3 py-2"
          >
            <option value={7}>7 derniers jours</option>
            <option value={30}>30 derniers jours</option>
            <option value={90}>90 derniers jours</option>
          </select>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={loadAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <Button onClick={loadAllData} className="mt-2" variant="outline" size="sm">
            Réessayer
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prospecting" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Prospection IA
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Coûts LLM
          </TabsTrigger>
        </TabsList>

        {/* ============================================ */}
        {/* TAB: Prospecting Analytics */}
        {/* ============================================ */}
        <TabsContent value="prospecting" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Leads Créés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(overview?.totals.leadsCreated || 0)}</div>
                <p className="text-xs text-gray-500">{formatNumber(overview?.totals.leadsValid || 0)} valides</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(overview?.totals.matchesCreated || 0)}</div>
                <p className="text-xs text-gray-500">Score moy: {overview?.averages.avgMatchScore || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Taux Conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPercent(overview?.rates.leadConversionRate || 0)}
                </div>
                <p className="text-xs text-gray-500">{formatNumber(overview?.totals.leadsConverted || 0)} convertis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Taux Spam
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatPercent(overview?.rates.spamRate || 0)}
                </div>
                <p className="text-xs text-gray-500">{formatNumber(overview?.totals.leadsSpam || 0)} spam</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-500" />
                  Score Sérieux
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.averages.avgSeriousnessScore || 0}</div>
                <p className="text-xs text-gray-500">Moyenne /100</p>
              </CardContent>
            </Card>
          </div>

          {/* Insights Section */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Insights & Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'warning'
                          ? 'bg-yellow-50 border-yellow-200'
                          : insight.type === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {insight.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                        {insight.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                        {insight.type === 'info' && <Info className="h-5 w-5 text-blue-600 mt-0.5" />}
                        <div className="flex-1">
                          <p className="font-medium">{insight.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          {insight.recommendation && (
                            <p className="text-sm font-medium mt-2 text-gray-800">
                              💡 {insight.recommendation}
                            </p>
                          )}
                        </div>
                        {insight.metric !== undefined && (
                          <div className="text-2xl font-bold">{insight.metric}%</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Performers */}
          {topPerformers && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.topSources.map((source, index) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium capitalize">{source.source}</span>
                        </div>
                        <span className="text-green-600 font-bold">{formatPercent(source.conversionRate)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Campagnes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.topCampaigns.map((campaign, index) => (
                      <div key={campaign.campaignId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium truncate max-w-[150px]">{campaign.campaignName}</span>
                        </div>
                        <span className="text-green-600 font-bold">{formatPercent(campaign.conversionRate)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Top Villes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.topCities.map((city, index) => (
                      <div key={city.city} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium">{city.city}</span>
                        </div>
                        <span className="text-green-600 font-bold">{formatPercent(city.conversionRate)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Accuracy */}
          {quality && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Précision de l'IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Validation des Leads</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span>Leads Valides</span>
                          <span className="font-bold text-green-600">
                            {formatPercent(quality.aiAccuracy.validLeads.accuracyRate)} précision
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {quality.aiAccuracy.validLeads.contacted} contactés / {quality.aiAccuracy.validLeads.rejected} rejetés
                        </div>
                      </div>
                      <div className="p-4 bg-red-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span>Détection Spam</span>
                          <span className="font-bold text-red-600">
                            {formatPercent(quality.aiAccuracy.spamLeads.accuracyRate)} précision
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {quality.aiAccuracy.spamLeads.ignored} ignorés / {quality.aiAccuracy.spamLeads.recovered} récupérés
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-4">Performance du Matching</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">Score 80+</span>
                          <span className="text-xs text-gray-500 ml-2">({quality.matchingAccuracy.highScoreMatches.total} matches)</span>
                        </div>
                        <span className="font-bold text-green-600">
                          {formatPercent(quality.matchingAccuracy.highScoreMatches.conversionRate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">Score 60-79</span>
                          <span className="text-xs text-gray-500 ml-2">({quality.matchingAccuracy.mediumScoreMatches.total} matches)</span>
                        </div>
                        <span className="font-bold text-yellow-600">
                          {formatPercent(quality.matchingAccuracy.mediumScoreMatches.conversionRate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">Score 50-59</span>
                          <span className="text-xs text-gray-500 ml-2">({quality.matchingAccuracy.lowScoreMatches.total} matches)</span>
                        </div>
                        <span className="font-bold text-orange-600">
                          {formatPercent(quality.matchingAccuracy.lowScoreMatches.conversionRate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sources Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Performance par Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sources.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Source</th>
                        <th className="text-right py-2 px-3">Leads</th>
                        <th className="text-right py-2 px-3">Spam %</th>
                        <th className="text-right py-2 px-3">Convertis</th>
                        <th className="text-right py-2 px-3">Conv. %</th>
                        <th className="text-right py-2 px-3">Score Moy.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((source) => (
                        <tr key={source.source} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium capitalize">{source.source}</td>
                          <td className="text-right py-2 px-3">{formatNumber(source.leadsCreated)}</td>
                          <td className="text-right py-2 px-3">
                            <span className={source.spamRate > 30 ? 'text-red-600' : 'text-green-600'}>
                              {formatPercent(source.spamRate)}
                            </span>
                          </td>
                          <td className="text-right py-2 px-3">{formatNumber(source.leadsConverted)}</td>
                          <td className="text-right py-2 px-3">
                            <span className="font-bold text-green-600">{formatPercent(source.conversionRate)}</span>
                          </td>
                          <td className="text-right py-2 px-3">{source.avgMatchScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Campaigns Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance par Campagne
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Campagne</th>
                        <th className="text-left py-2 px-3">Type</th>
                        <th className="text-left py-2 px-3">Statut</th>
                        <th className="text-right py-2 px-3">Leads</th>
                        <th className="text-right py-2 px-3">Convertis</th>
                        <th className="text-right py-2 px-3">Conv. %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.campaignId} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{campaign.campaignName}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              campaign.campaignType === 'mandat' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {campaign.campaignType}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                              campaign.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="text-right py-2 px-3">{formatNumber(campaign.leadsCreated)}</td>
                          <td className="text-right py-2 px-3">{formatNumber(campaign.leadsConverted)}</td>
                          <td className="text-right py-2 px-3">
                            <span className="font-bold text-green-600">{formatPercent(campaign.conversionRate)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune campagne trouvée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================ */}
        {/* TAB: LLM Cost Tracking */}
        {/* ============================================ */}
        <TabsContent value="costs" className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Total Requêtes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(stats?.totalRequests || 0)}</div>
                <p className="text-xs text-gray-500 mt-1">Appels API LLM</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(stats?.totalTokens || 0)}</div>
                <p className="text-xs text-gray-500 mt-1">Tokens consommés</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Coût Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCost(stats?.totalCost || 0)}</div>
                <p className="text-xs text-gray-500 mt-1">Dépenses API</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  ROI
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{(roi?.roi || 0).toFixed(2)}x</div>
                <p className="text-xs text-gray-500 mt-1">{roi?.conversions || 0} conversions</p>
              </CardContent>
            </Card>
          </div>

          {/* ROI Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Retour sur Investissement (ROI)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Coût Total</p>
                  <p className="text-2xl font-bold text-red-600">{formatCost(roi?.totalCost || 0)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Coût par Conversion</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCost(roi?.avgCostPerConversion || 0)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">ROI</p>
                  <p className="text-2xl font-bold text-green-600">{(roi?.roi || 0).toFixed(2)}x</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage by Provider & Model */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage par Provider</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.byProvider && stats.byProvider.length > 0 ? (
                  <div className="space-y-4">
                    {stats.byProvider.map((provider) => (
                      <div key={provider.provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{provider.provider}</p>
                          <p className="text-sm text-gray-500">{formatNumber(provider.requests)} requêtes</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCost(provider.cost)}</p>
                          <p className="text-sm text-gray-500">{formatNumber(provider.tokens)} tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage par Modèle</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.byModel && stats.byModel.length > 0 ? (
                  <div className="space-y-4">
                    {stats.byModel.map((model) => (
                      <div key={model.model} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{model.model}</p>
                          <p className="text-sm text-gray-500">{formatNumber(model.requests)} requêtes</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCost(model.cost)}</p>
                          <p className="text-sm text-gray-500">{formatNumber(model.tokens)} tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
