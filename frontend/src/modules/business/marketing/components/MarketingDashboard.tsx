import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  TrendingUp,
  Target,
  BarChart3,
  Search,
  Brain,
  Megaphone,
  Mail,
  MessageSquare,
  Phone,
  Activity,
  MousePointerClick,
  Flame,
  GitBranch,
  FlaskConical,
  LineChart,
  Settings,
  Users,
  Home,
  Globe,
  Eye,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ExternalLink,
  Plus,
  RefreshCw,
  Store,
  Send,
} from 'lucide-react';
import {
  marketingAPI,
  type MarketingOverview,
  type CampaignSummary,
} from '@/shared/utils/marketing-api';

type TabType = 'overview' | 'campaigns' | 'analytics' | 'seo' | 'intelligence';

// ==================== KPI CARD ====================
const KpiCard = ({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}) => (
  <Card
    className={`cursor-pointer hover:shadow-md transition-all group ${onClick ? 'hover:border-blue-300' : ''}`}
    onClick={onClick}
  >
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} transition-transform group-hover:scale-110`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ==================== MODULE LINK CARD ====================
const ModuleLinkCard = ({
  title,
  description,
  icon: Icon,
  path,
  color,
  badge,
}: {
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  badge?: string;
}) => {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(path)}
      className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group w-full"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
            {badge && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>
    </button>
  );
};

// ==================== MAIN COMPONENT ====================
export const MarketingDashboard: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const data = await marketingAPI.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Error loading marketing overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await marketingAPI.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  }, []);

  const loadAiData = useCallback(async () => {
    try {
      const [suggestions, anomalyData] = await Promise.all([
        marketingAPI.getAiSuggestions(),
        marketingAPI.getAnomalies(),
      ]);
      setAiSuggestions(suggestions);
      setAnomalies(anomalyData);
    } catch (err) {
      console.error('Error loading AI data:', err);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (activeTab === 'campaigns' && campaigns.length === 0) loadCampaigns();
    if (activeTab === 'intelligence') loadAiData();
  }, [activeTab, campaigns.length, loadCampaigns, loadAiData]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  const stats = overview || {
    campaigns: { total: 0, active: 0, draft: 0, completed: 0 },
    tracking: { totalEvents: 0, conversionRate: 0, activePlatforms: 0 },
    seo: { optimizedCount: 0, averageScore: 0, totalProperties: 0 },
    prospects: { total: 0, fromMarketing: 0, conversionRate: 0 },
  };

  const getStatusColor = (status: string) => {
    const m: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    return m[status] || m.draft;
  };

  const getTypeIcon = (type: string) => {
    const m: Record<string, any> = {
      email: Mail,
      sms: MessageSquare,
      whatsapp: Phone,
      mixed: Megaphone,
    };
    const Icon = m[type] || Mail;
    return <Icon className="h-4 w-4" />;
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-500">Chargement du hub marketing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            Hub Marketing
          </h1>
          <p className="text-gray-500 mt-1 ml-14">
            Campagnes, analytiques, SEO et intelligence artificielle — connectés à votre écosystème
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadOverview}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Actualiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push('/settings?tab=tracking')}>
            <Settings className="h-4 w-4 mr-1.5" /> Paramètres
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-white border">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Target className="h-4 w-4" /> Campagnes
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <Activity className="h-4 w-4" /> Analytiques
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5">
            <Search className="h-4 w-4" /> SEO
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="gap-1.5">
            <Brain className="h-4 w-4" /> Intelligence IA
          </TabsTrigger>
        </TabsList>

        {/* ==================== VUE D'ENSEMBLE ==================== */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* KPIs Globaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Campagnes actives"
              value={stats.campaigns.active}
              icon={Target}
              color="bg-blue-500"
              subtitle={`${stats.campaigns.total} au total`}
              onClick={() => handleTabChange('campaigns')}
            />
            <KpiCard
              label="Événements trackés"
              value={stats.tracking.totalEvents}
              icon={Activity}
              color="bg-emerald-500"
              subtitle={`${stats.tracking.activePlatforms} plateformes`}
              onClick={() => handleTabChange('analytics')}
            />
            <KpiCard
              label="Taux de conversion"
              value={`${stats.tracking.conversionRate}%`}
              icon={TrendingUp}
              color="bg-purple-500"
            />
            <KpiCard
              label="Prospects marketing"
              value={stats.prospects.fromMarketing}
              icon={Users}
              color="bg-orange-500"
              subtitle={`sur ${stats.prospects.total} prospects`}
              onClick={() => router.push('/prospects')}
            />
          </div>

          {/* Accès rapides inter-modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actions Marketing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" /> Actions rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  className="justify-start h-auto py-3 px-4"
                  variant="outline"
                  onClick={() => router.push('/marketing/campaigns/new')}
                >
                  <Plus className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm">Nouvelle campagne</span>
                </Button>
                <Button
                  className="justify-start h-auto py-3 px-4"
                  variant="outline"
                  onClick={() => router.push('/marketing/tracking/realtime')}
                >
                  <Activity className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm">Tracking temps réel</span>
                </Button>
                <Button
                  className="justify-start h-auto py-3 px-4"
                  variant="outline"
                  onClick={() => router.push('/seo-ai')}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  <span className="text-sm">Optimiser SEO</span>
                </Button>
                <Button
                  className="justify-start h-auto py-3 px-4"
                  variant="outline"
                  onClick={() => router.push('/marketing/tracking/analytics')}
                >
                  <LineChart className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="text-sm">Analytics détaillés</span>
                </Button>
              </CardContent>
            </Card>

            {/* Connexion inter-modules */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-blue-500" /> Modules connectés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ModuleLinkCard
                  title="Vitrine & Site web"
                  description="Gérez vos pages, collectez des leads depuis votre vitrine"
                  icon={Store}
                  path="/vitrine"
                  color="bg-indigo-500"
                  badge="Tracking"
                />
                <ModuleLinkCard
                  title="Prospects"
                  description="Pipeline commercial alimenté par vos campagnes"
                  icon={Users}
                  path="/prospects"
                  color="bg-emerald-500"
                  badge={`${stats.prospects.total}`}
                />
                <ModuleLinkCard
                  title="Communications"
                  description="Email, SMS, WhatsApp — canaux de diffusion"
                  icon={Send}
                  path="/communications"
                  color="bg-sky-500"
                />
                <ModuleLinkCard
                  title="Propriétés"
                  description="Biens immobiliers à promouvoir"
                  icon={Home}
                  path="/biens"
                  color="bg-amber-500"
                />
              </CardContent>
            </Card>
          </div>

          {/* Statut des campagnes + Outils */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pipeline Campagnes */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pipeline campagnes</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/marketing/campaigns')}
                >
                  Voir tout <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    {
                      label: 'Brouillons',
                      count: stats.campaigns.draft,
                      color: 'bg-gray-100 text-gray-700 border-gray-200',
                    },
                    {
                      label: 'Actives',
                      count: stats.campaigns.active,
                      color: 'bg-green-50 text-green-700 border-green-200',
                    },
                    {
                      label: 'Terminées',
                      count: stats.campaigns.completed,
                      color: 'bg-blue-50 text-blue-700 border-blue-200',
                    },
                    {
                      label: 'Total',
                      count: stats.campaigns.total,
                      color: 'bg-purple-50 text-purple-700 border-purple-200',
                    },
                  ].map((s) => (
                    <div key={s.label} className={`p-4 rounded-lg border text-center ${s.color}`}>
                      <p className="text-2xl font-bold">{s.count}</p>
                      <p className="text-xs font-medium mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                {stats.campaigns.total === 0 && (
                  <div className="mt-4 p-6 bg-gray-50 rounded-lg text-center">
                    <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-3">Aucune campagne créée</p>
                    <Button size="sm" onClick={() => router.push('/marketing/campaigns/new')}>
                      <Plus className="h-4 w-4 mr-1.5" /> Première campagne
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paramètres & Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-gray-500" /> Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button
                  onClick={() => router.push('/settings?tab=tracking')}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition text-left"
                >
                  <Globe className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Pixels & Tracking</p>
                    <p className="text-xs text-gray-400">Meta, Google, TikTok...</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/settings?tab=communications')}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition text-left"
                >
                  <Send className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Canaux de diffusion</p>
                    <p className="text-xs text-gray-400">Email, WhatsApp, SMS</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/settings?tab=api-keys')}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition text-left"
                >
                  <Brain className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">IA & Automatisation</p>
                    <p className="text-xs text-gray-400">Clés API, orchestrateur</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/settings?tab=llm')}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition text-left"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Config IA Marketing</p>
                    <p className="text-xs text-gray-400">Modèles LLM, providers</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== CAMPAGNES ==================== */}
        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total"
              value={stats.campaigns.total}
              icon={Target}
              color="bg-blue-500"
            />
            <KpiCard
              label="Actives"
              value={stats.campaigns.active}
              icon={CheckCircle2}
              color="bg-green-500"
            />
            <KpiCard
              label="Brouillons"
              value={stats.campaigns.draft}
              icon={Clock}
              color="bg-gray-400"
            />
            <KpiCard
              label="Terminées"
              value={stats.campaigns.completed}
              icon={CheckCircle2}
              color="bg-indigo-500"
            />
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Dernières campagnes</h3>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => router.push('/marketing/campaigns/new')}>
                <Plus className="h-4 w-4 mr-1.5" /> Nouvelle campagne
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push('/marketing/campaigns')}
              >
                Voir tout <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucune campagne</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Créez votre première campagne multi-canal
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => router.push('/marketing/campaigns/new')}>
                    <Plus className="h-4 w-4 mr-1.5" /> Créer une campagne
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/prospects')}>
                    <Users className="h-4 w-4 mr-1.5" /> Voir les prospects
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {campaigns.slice(0, 5).map((c) => (
                <Card
                  key={c.id}
                  className="hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/marketing/campaigns/${c.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">{getTypeIcon(c.type)}</div>
                        <div>
                          <h4 className="font-medium text-sm">{c.name}</h4>
                          <p className="text-xs text-gray-500">
                            {c.type.toUpperCase()} ·{' '}
                            {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Liens vers les canaux de communication */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm text-blue-900 mb-3 flex items-center gap-2">
                <Send className="h-4 w-4" /> Canaux de diffusion connectés
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => router.push('/communications')}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100 hover:border-blue-300 transition text-left"
                >
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-gray-400">Templates & envois</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/communication/whatsapp')}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100 hover:border-green-300 transition text-left"
                >
                  <Phone className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-gray-400">Conversations & campagnes</p>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/communications')}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-100 hover:border-purple-300 transition text-left"
                >
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">SMS</p>
                    <p className="text-xs text-gray-400">Messages directs</p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== ANALYTIQUES ==================== */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="Événements totaux"
              value={stats.tracking.totalEvents}
              icon={Activity}
              color="bg-blue-500"
            />
            <KpiCard
              label="Taux de conversion"
              value={`${stats.tracking.conversionRate}%`}
              icon={TrendingUp}
              color="bg-green-500"
            />
            <KpiCard
              label="Plateformes actives"
              value={stats.tracking.activePlatforms}
              icon={Globe}
              color="bg-purple-500"
            />
            <KpiCard
              label="Prospects générés"
              value={stats.prospects.fromMarketing}
              icon={Users}
              color="bg-orange-500"
            />
          </div>

          {/* Outils d'analytiques */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Outils d'analytiques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <ModuleLinkCard
                title="Analytics temps réel"
                description="Événements en direct, conversions, performance par plateforme"
                icon={LineChart}
                path="/marketing/tracking/analytics"
                color="bg-blue-500"
              />
              <ModuleLinkCard
                title="Tracking en direct"
                description="WebSocket live — événements en temps réel"
                icon={Activity}
                path="/marketing/tracking/realtime"
                color="bg-emerald-500"
                badge="Live"
              />
              <ModuleLinkCard
                title="Heatmaps"
                description="Visualisez les clics, scrolls et mouvements de souris"
                icon={Flame}
                path="/marketing/tracking/heatmap"
                color="bg-orange-500"
              />
              <ModuleLinkCard
                title="Attribution multi-touch"
                description="Parcours de conversion et crédit par point de contact"
                icon={GitBranch}
                path="/marketing/tracking/attribution"
                color="bg-purple-500"
              />
              <ModuleLinkCard
                title="Tests A/B"
                description="Comparez les configurations et optimisez les conversions"
                icon={FlaskConical}
                path="/marketing/tracking/ab-tests"
                color="bg-pink-500"
              />
              <ModuleLinkCard
                title="Analytics par propriété"
                description="Performance marketing de chaque bien immobilier"
                icon={Home}
                path="/marketing/tracking/property-analytics"
                color="bg-indigo-500"
              />
            </div>
          </div>

          {/* Lien vers Analytics global */}
          <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">
                    Analytics & Dashboard global
                  </h4>
                  <p className="text-xs text-gray-500">
                    Vue d'ensemble, funnel de conversion, performance, ROI
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => router.push('/analytics')}>
                Ouvrir <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </CardContent>
          </Card>

          {/* Lien vers Configuration pixels */}
          <Card className="border-dashed">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Configurer les pixels de tracking
                  </p>
                  <p className="text-xs text-gray-400">
                    Meta Pixel, Google Analytics, GTM, Google Ads, TikTok...
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings?tab=tracking')}
              >
                Paramètres <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SEO ==================== */}
        <TabsContent value="seo" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="Propriétés"
              value={stats.seo.totalProperties}
              icon={Home}
              color="bg-blue-500"
            />
            <KpiCard
              label="Optimisées"
              value={stats.seo.optimizedCount}
              icon={CheckCircle2}
              color="bg-green-500"
              subtitle={
                stats.seo.totalProperties > 0
                  ? `${Math.round((stats.seo.optimizedCount / stats.seo.totalProperties) * 100)}%`
                  : '0%'
              }
            />
            <KpiCard
              label="Score moyen"
              value={`${Math.round(stats.seo.averageScore)}/100`}
              icon={TrendingUp}
              color="bg-purple-500"
            />
            <KpiCard
              label="À optimiser"
              value={stats.seo.totalProperties - stats.seo.optimizedCount}
              icon={Eye}
              color="bg-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SEO AI Tool */}
            <Card className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border-violet-200">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-10 w-10 text-violet-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">Optimisation SEO par IA</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Améliorez automatiquement le référencement de vos biens avec l'intelligence
                  artificielle
                </p>
                <Button
                  onClick={() => router.push('/seo-ai')}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> Ouvrir l'outil SEO AI
                </Button>
              </CardContent>
            </Card>

            {/* Connexions SEO */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">SEO & Modules connectés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ModuleLinkCard
                  title="Vitrine & Pages web"
                  description="Vos pages publiques optimisées pour le référencement"
                  icon={Store}
                  path="/vitrine"
                  color="bg-indigo-500"
                />
                <ModuleLinkCard
                  title="Propriétés"
                  description="Biens immobiliers à référencer et promouvoir"
                  icon={Home}
                  path="/biens"
                  color="bg-amber-500"
                />
                <ModuleLinkCard
                  title="Google Search Console"
                  description="Vérification et suivi des performances de recherche"
                  icon={Globe}
                  path="/settings?tab=tracking"
                  color="bg-green-500"
                  badge="Config"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== INTELLIGENCE IA ==================== */}
        <TabsContent value="intelligence" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <KpiCard
              label="Suggestions IA"
              value={aiSuggestions.length}
              icon={Sparkles}
              color="bg-purple-500"
            />
            <KpiCard
              label="Anomalies"
              value={anomalies.length}
              icon={AlertTriangle}
              color={anomalies.length > 0 ? 'bg-red-500' : 'bg-green-500'}
            />
            <KpiCard
              label="Campagnes auto"
              value={stats.campaigns.active}
              icon={Zap}
              color="bg-amber-500"
            />
            <KpiCard label="Score confiance" value="—" icon={Brain} color="bg-indigo-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Suggestions IA */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" /> Suggestions IA
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/settings?tab=llm')}>
                  Config <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {aiSuggestions.length === 0 ? (
                  <div className="py-8 text-center">
                    <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune suggestion pour le moment</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Les suggestions apparaîtront au fur et à mesure de la collecte de données
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiSuggestions.slice(0, 5).map((s: any, i: number) => (
                      <div
                        key={s.id || i}
                        className="p-3 bg-purple-50 rounded-lg border border-purple-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {s.type} — {s.platform}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((s.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{s.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anomalies */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" /> Anomalies détectées
                </CardTitle>
              </CardHeader>
              <CardContent>
                {anomalies.length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune anomalie détectée</p>
                    <p className="text-xs text-gray-400 mt-1">Tout fonctionne normalement</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalies.slice(0, 5).map((a: any, i: number) => (
                      <div
                        key={a.id || i}
                        className="p-3 bg-red-50 rounded-lg border border-red-100"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{a.description}</span>
                          <Badge
                            className={
                              a.severity === 'critical'
                                ? 'bg-red-500'
                                : a.severity === 'high'
                                  ? 'bg-orange-500'
                                  : 'bg-yellow-500'
                            }
                          >
                            {a.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">
                          Métrique: {a.metric} — Attendu: {a.expectedValue} / Actuel:{' '}
                          {a.actualValue}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Outils IA connectés */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
            <CardContent className="p-5">
              <h4 className="font-semibold text-sm text-purple-900 mb-3">
                Outils IA & Business Intelligence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <ModuleLinkCard
                  title="IA Marketing"
                  description="Configuration ML et automatisation"
                  icon={Brain}
                  path="/marketing/tracking"
                  color="bg-purple-500"
                />
                <ModuleLinkCard
                  title="SEO AI"
                  description="Optimisation automatique du référencement"
                  icon={Sparkles}
                  path="/seo-ai"
                  color="bg-violet-500"
                />
                <ModuleLinkCard
                  title="Prospection IA"
                  description="Génération de leads intelligente"
                  icon={Users}
                  path="/prospection-ia"
                  color="bg-emerald-500"
                />
                <ModuleLinkCard
                  title="Orchestrateur IA"
                  description="Configuration des providers LLM"
                  icon={Settings}
                  path="/settings?tab=api-keys"
                  color="bg-indigo-500"
                  badge="Config"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketingDashboard;
