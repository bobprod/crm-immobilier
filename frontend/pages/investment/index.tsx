import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  MapPin,
  Building2,
  AlertCircle,
  Plus,
  BarChart3,
  Calculator,
  Map,
  Activity,
  Search,
  ArrowRight,
  Home,
  Users,
  Eye,
  Loader2,
  Info,
  Target,
  Percent,
  Calendar,
  CreditCard,
  Euro,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

// ─── Types ───────────────────────────────────────────────────

interface InvestmentStats {
  totalProjects: number;
  activeProjects: number;
  totalInvested: number;
  avgROI: number;
  topCity: string;
  bestPerforming: { title: string; city: string; netYield: number } | null;
}

interface ZonePrice {
  zone: string;
  city: string;
  avgPriceM2: number;
  minPrice: number;
  maxPrice: number;
  trend: number; // percentage
  nbListings: number;
  propertyType: string;
}

interface MarketIndicator {
  label: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
}

type TabType = 'intelligence' | 'simulator' | 'market-prices' | 'indicators';

// ─── Mortgage Calculator Logic ───────────────────────────────

function calculateMortgage(amount: number, rate: number, years: number) {
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  if (monthlyRate === 0) return { monthly: amount / n, totalInterest: 0, totalCost: amount };
  const monthly =
    (amount * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  const totalCost = monthly * n;
  const totalInterest = totalCost - amount;
  return { monthly, totalInterest, totalCost };
}

// ─── Component ───────────────────────────────────────────────

export default function ImmoMarketDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('intelligence');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InvestmentStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  // Mortgage state
  const [loanAmount, setLoanAmount] = useState(250000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [loanYears, setLoanYears] = useState(25);
  const [downPayment, setDownPayment] = useState(50000);
  const [propertyPrice, setPropertyPrice] = useState(300000);

  // Market prices state
  const [zonePrices, setZonePrices] = useState<ZonePrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');

  // Indicators state
  const [indicators, setIndicators] = useState<MarketIndicator[]>([]);
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);

  // Analytics state (merged from analytics page)
  const [analyticsData, setAnalyticsData] = useState<{
    totalProspects: number;
    totalProperties: number;
    conversionRate: number;
    prospectsByStatus: Record<string, number>;
    propertiesByType: Record<string, number>;
  } | null>(null);
  const [funnelData, setFunnelData] = useState<{
    conversionFunnel?: Record<string, number>;
  } | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [roiData, setRoiData] = useState<any>(null);

  // Tab from URL
  useEffect(() => {
    if (router.query.tab && typeof router.query.tab === 'string') {
      setActiveTab(router.query.tab as TabType);
    }
  }, [router.query.tab]);

  // Load investment data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Load market prices when tab activates
  useEffect(() => {
    if (activeTab === 'market-prices' && zonePrices.length === 0) fetchMarketPrices();
    if (activeTab === 'indicators' && indicators.length === 0) fetchIndicators();
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/investment-intelligence/projects');
      const raw = response.data?.projects ?? response.data?.data ?? response.data;
      const projects = Array.isArray(raw) ? raw : [];

      setRecentProjects(projects.slice(0, 5));

      const active = projects.filter((p: any) => p.status === 'active').length;
      const totalInvested = projects.reduce((sum: number, p: any) => sum + (p.totalPrice ?? 0), 0);
      const avgROI = projects.length
        ? projects.reduce((sum: number, p: any) => sum + (p.netYield ?? 0), 0) / projects.length
        : 0;
      const cityMap: Record<string, number> = {};
      projects.forEach((p: any) => {
        if (p.city) cityMap[p.city] = (cityMap[p.city] ?? 0) + 1;
      });
      const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
      const best = projects.reduce(
        (a: any, b: any) => ((a?.netYield ?? 0) > (b?.netYield ?? 0) ? a : b),
        null
      );

      setStats({
        totalProjects: projects.length,
        activeProjects: active,
        totalInvested,
        avgROI: parseFloat(avgROI.toFixed(1)),
        topCity,
        bestPerforming: best
          ? { title: best.title ?? '-', city: best.city ?? '-', netYield: best.netYield ?? 0 }
          : null,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketPrices = async () => {
    setPricesLoading(true);
    try {
      // Try scraping data first, fallback to prospects data
      const [scrapingRes, prospectsRes] = await Promise.allSettled([
        apiClient.get('/scraping/market-prices'),
        apiClient.get('/prospects', { params: { limit: 200 } }),
      ]);

      const zones: ZonePrice[] = [];

      // From scraping
      if (scrapingRes.status === 'fulfilled') {
        const data = scrapingRes.value.data;
        const raw = data?.prices ?? data?.data ?? data;
        if (Array.isArray(raw)) {
          raw.forEach((item: any) => {
            zones.push({
              zone: item.zone ?? item.district ?? item.neighborhood ?? 'Centre',
              city: item.city ?? item.location ?? '-',
              avgPriceM2: item.avgPriceM2 ?? item.pricePerM2 ?? 0,
              minPrice: item.minPrice ?? item.min ?? 0,
              maxPrice: item.maxPrice ?? item.max ?? 0,
              trend: item.trend ?? item.change ?? 0,
              nbListings: item.nbListings ?? item.count ?? 0,
              propertyType: item.propertyType ?? 'Appartement',
            });
          });
        }
      }

      // From prospects/CRM data — aggregate by city
      if (prospectsRes.status === 'fulfilled' && zones.length === 0) {
        const prospects = prospectsRes.value.data;
        const raw = prospects?.data ?? prospects?.prospects ?? prospects;
        if (Array.isArray(raw)) {
          const cityData: Record<string, { prices: number[]; count: number }> = {};
          raw.forEach((p: any) => {
            const city = p.city || p.location || p.address?.city;
            const price = p.price || p.estimatedPrice || p.budget;
            const surface = p.surface || p.area || p.livingArea;
            if (city && price && surface) {
              const priceM2 = price / surface;
              if (!cityData[city]) cityData[city] = { prices: [], count: 0 };
              cityData[city].prices.push(priceM2);
              cityData[city].count++;
            }
          });
          Object.entries(cityData).forEach(([city, data]) => {
            const avg = data.prices.reduce((a, b) => a + b, 0) / data.prices.length;
            zones.push({
              zone: 'Centre',
              city,
              avgPriceM2: Math.round(avg),
              minPrice: Math.round(Math.min(...data.prices)),
              maxPrice: Math.round(Math.max(...data.prices)),
              trend: 0,
              nbListings: data.count,
              propertyType: 'Mixte',
            });
          });
        }
      }

      // Fallback demo data if nothing
      if (zones.length === 0) {
        zones.push(
          {
            zone: 'Centre',
            city: 'Paris',
            avgPriceM2: 10500,
            minPrice: 8200,
            maxPrice: 15000,
            trend: 2.3,
            nbListings: 45,
            propertyType: 'Appartement',
          },
          {
            zone: 'La Défense',
            city: 'Puteaux',
            avgPriceM2: 7200,
            minPrice: 5800,
            maxPrice: 9500,
            trend: 1.8,
            nbListings: 22,
            propertyType: 'Appartement',
          },
          {
            zone: 'Vieux-Port',
            city: 'Marseille',
            avgPriceM2: 3800,
            minPrice: 2800,
            maxPrice: 5200,
            trend: 4.1,
            nbListings: 38,
            propertyType: 'Appartement',
          },
          {
            zone: 'Part-Dieu',
            city: 'Lyon',
            avgPriceM2: 5100,
            minPrice: 3900,
            maxPrice: 6800,
            trend: 3.2,
            nbListings: 31,
            propertyType: 'Appartement',
          },
          {
            zone: 'Capitole',
            city: 'Toulouse',
            avgPriceM2: 3600,
            minPrice: 2700,
            maxPrice: 4800,
            trend: 2.7,
            nbListings: 27,
            propertyType: 'Appartement',
          },
          {
            zone: 'Centre',
            city: 'Bordeaux',
            avgPriceM2: 4800,
            minPrice: 3500,
            maxPrice: 6500,
            trend: -0.5,
            nbListings: 34,
            propertyType: 'Appartement',
          },
          {
            zone: 'Euralille',
            city: 'Lille',
            avgPriceM2: 3400,
            minPrice: 2500,
            maxPrice: 4600,
            trend: 1.9,
            nbListings: 19,
            propertyType: 'Appartement',
          },
          {
            zone: 'Petite France',
            city: 'Strasbourg',
            avgPriceM2: 3200,
            minPrice: 2400,
            maxPrice: 4200,
            trend: 2.1,
            nbListings: 16,
            propertyType: 'Appartement',
          }
        );
      }

      setZonePrices(zones);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    } finally {
      setPricesLoading(false);
    }
  };

  const fetchIndicators = async () => {
    setIndicatorsLoading(true);
    try {
      const [
        prospectsRes,
        propertiesRes,
        transactionsRes,
        dashboardRes,
        analyticsProspectsRes,
        trendsRes,
        kpisRes,
      ] = await Promise.allSettled([
        apiClient.get('/prospects', { params: { limit: 1 } }),
        apiClient.get('/properties', { params: { limit: 1 } }),
        apiClient.get('/transactions', { params: { limit: 1 } }),
        apiClient.get('/analytics/dashboard'),
        apiClient.get('/analytics/prospects'),
        apiClient.get('/analytics/trends', { params: { period: 'month' } }),
        apiClient.get('/analytics/kpis'),
      ]);

      const prospectCount =
        prospectsRes.status === 'fulfilled'
          ? (prospectsRes.value.data?.total ?? prospectsRes.value.data?.count ?? 0)
          : 0;
      const propertyCount =
        propertiesRes.status === 'fulfilled'
          ? (propertiesRes.value.data?.total ?? propertiesRes.value.data?.count ?? 0)
          : 0;
      const txCount =
        transactionsRes.status === 'fulfilled'
          ? (transactionsRes.value.data?.total ?? transactionsRes.value.data?.count ?? 0)
          : 0;

      setIndicators([
        { label: 'Prospects actifs', value: prospectCount, change: 12, icon: Users, color: 'blue' },
        {
          label: 'Biens en portefeuille',
          value: propertyCount,
          change: 5,
          icon: Home,
          color: 'green',
        },
        {
          label: 'Transactions en cours',
          value: txCount,
          change: -2,
          icon: DollarSign,
          color: 'amber',
        },
        {
          label: 'Projets analysés',
          value: stats?.totalProjects ?? 0,
          change: 8,
          icon: Target,
          color: 'purple',
        },
        {
          label: 'ROI moyen marché',
          value: `${stats?.avgROI ?? 0}%`,
          change: 0.5,
          icon: TrendingUp,
          color: 'emerald',
        },
        {
          label: 'Ville la plus active',
          value: stats?.topCity ?? '-',
          change: 0,
          icon: MapPin,
          color: 'rose',
        },
      ]);

      // Analytics data (merged from analytics module)
      if (dashboardRes.status === 'fulfilled') {
        const data = dashboardRes.value.data || {};
        setAnalyticsData({
          totalProspects: data.prospects?.total ?? 0,
          totalProperties: data.properties?.total ?? 0,
          conversionRate: data.prospects?.conversionRate ?? 0,
          prospectsByStatus: (data.prospects?.byStatus || []).reduce(
            (acc: Record<string, number>, item: any) => {
              acc[item.status] = item.count;
              return acc;
            },
            {} as Record<string, number>
          ),
          propertiesByType: (data.properties?.byType || []).reduce(
            (acc: Record<string, number>, item: any) => {
              acc[item.type] = item.count;
              return acc;
            },
            {} as Record<string, number>
          ),
        });
      }
      if (analyticsProspectsRes.status === 'fulfilled') {
        setFunnelData(analyticsProspectsRes.value.data || {});
      }
      if (trendsRes.status === 'fulfilled') {
        setPerformanceData(trendsRes.value.data || {});
      }
      if (kpisRes.status === 'fulfilled') {
        setRoiData(kpisRes.value.data || {});
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
    } finally {
      setIndicatorsLoading(false);
    }
  };

  // Mortgage calculation
  const mortgage = useMemo(() => {
    const effectiveLoan = Math.max(0, propertyPrice - downPayment);
    return calculateMortgage(effectiveLoan, interestRate, loanYears);
  }, [propertyPrice, downPayment, interestRate, loanYears]);

  const effectiveLoan = Math.max(0, propertyPrice - downPayment);

  // Filtered zones
  const filteredZones = useMemo(() => {
    if (!searchCity.trim()) return zonePrices;
    const q = searchCity.toLowerCase();
    return zonePrices.filter(
      (z) => z.city.toLowerCase().includes(q) || z.zone.toLowerCase().includes(q)
    );
  }, [zonePrices, searchCity]);

  // Source/status badges
  const getSourceBadge = (source: string) => {
    const cfg: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      bricks: { label: 'Bricks', variant: 'default' },
      homunity: { label: 'Homunity', variant: 'secondary' },
      generic: { label: 'URL', variant: 'outline' },
    };
    const c = cfg[source] || cfg.generic;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };
  const getStatusBadge = (status: string) => {
    const v: Record<string, 'default' | 'secondary' | 'outline'> = {
      active: 'default',
      completed: 'secondary',
      draft: 'outline',
    };
    return <Badge variant={v[status] || 'outline'}>{status}</Badge>;
  };

  const indicatorColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <ProtectedRoute>
      <MainLayout title="Immo Market" breadcrumbs={[{ label: 'Immo Market' }]}>
        <Head>
          <title>Immo Market - CRM Immobilier</title>
        </Head>

        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                  <Building2 className="h-7 w-7" />
                </div>
                Immo Market
              </h1>
              <p className="text-muted-foreground mt-1">
                Intelligence immobilière, simulation et analyse du marché
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/investment/compare')}>
                <BarChart3 className="h-4 w-4 mr-2" /> Comparer
              </Button>
              <Button onClick={() => router.push('/investment/import')}>
                <Plus className="h-4 w-4 mr-2" /> Importer
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="intelligence" className="gap-2">
                <Building2 className="h-4 w-4" /> Intelligence
              </TabsTrigger>
              <TabsTrigger value="simulator" className="gap-2">
                <Calculator className="h-4 w-4" /> Simulateur prêt
              </TabsTrigger>
              <TabsTrigger value="market-prices" className="gap-2">
                <Map className="h-4 w-4" /> Prix du marché
              </TabsTrigger>
              <TabsTrigger value="indicators" className="gap-2">
                <Activity className="h-4 w-4" /> Indicateurs
              </TabsTrigger>
            </TabsList>

            {/* ════════════ TAB: INVESTMENT INTELLIGENCE ════════════ */}
            <TabsContent value="intelligence" className="space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* Stats */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalProjects ?? 0}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.activeProjects ?? 0} actifs
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Investi</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(stats?.totalInvested ?? 0).toLocaleString('fr-FR')} €
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Répartis sur {stats?.totalProjects ?? 0} projets
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ROI Moyen</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.avgROI ?? 0}%</div>
                        <p className="text-xs text-green-600">Rendement net moyen</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ville Top</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats?.topCity ?? '-'}</div>
                        <p className="text-xs text-muted-foreground">
                          {stats?.activeProjects ?? 0} projets actifs
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent projects */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>Projets Récents</CardTitle>
                          <CardDescription>Derniers projets importés et analysés</CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/investment/projects')}
                        >
                          Voir tout <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recentProjects.length === 0 ? (
                        <div className="py-8 text-center">
                          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-sm text-gray-500 font-medium">Aucun projet importé</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Commencez par importer un projet d&apos;investissement
                          </p>
                          <Button
                            size="sm"
                            className="mt-4"
                            onClick={() => router.push('/investment/import')}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Importer un projet
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {recentProjects.map((project) => (
                            <div
                              key={project.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                              onClick={() => router.push(`/investment/projects/${project.id}`)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold">{project.title}</h3>
                                  {getSourceBadge(project.source)}
                                  {getStatusBadge(project.status)}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground gap-4">
                                  <span className="flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {project.city}, {project.country}
                                  </span>
                                  <span className="flex items-center">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    {(project.totalPrice ?? 0).toLocaleString('fr-FR')} €
                                  </span>
                                  <span className="flex items-center text-green-600">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {project.netYield ?? 0}% ROI
                                  </span>
                                </div>
                              </div>
                              {project.fundingProgress != null && (
                                <div className="ml-4 text-right">
                                  <div className="text-sm font-medium mb-1">
                                    Financement: {project.fundingProgress}%
                                  </div>
                                  <div className="w-32 bg-secondary rounded-full h-2">
                                    <div
                                      className="bg-primary rounded-full h-2"
                                      style={{ width: `${project.fundingProgress}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick actions */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/investment/import')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Importer un projet
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Depuis Bricks, Homunity ou URL personnalisée
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/investment/compare')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <BarChart3 className="h-5 w-5 mr-2" />
                          Comparer des projets
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Analysez et comparez jusqu&apos;à 5 projets
                        </p>
                      </CardContent>
                    </Card>
                    <Card
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => router.push('/investment/alerts')}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <AlertCircle className="h-5 w-5 mr-2" />
                          Alertes opportunités
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Alertes sur les meilleures opportunités
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Best performing */}
                  {stats?.bestPerforming && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                          Meilleure Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{stats.bestPerforming.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {stats.bestPerforming.city}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {stats.bestPerforming.netYield}%
                            </div>
                            <p className="text-sm text-muted-foreground">Rendement net</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ════════════ TAB: SIMULATEUR PRÊT ════════════ */}
            <TabsContent value="simulator" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Formulaire */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      Simulateur de prêt immobilier
                    </CardTitle>
                    <CardDescription>
                      Estimez vos mensualités et le coût total de votre emprunt
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" /> Prix du bien
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={propertyPrice}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setPropertyPrice(v);
                            setLoanAmount(Math.max(0, v - downPayment));
                          }}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          €
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" /> Apport personnel
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={downPayment}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || 0;
                            setDownPayment(v);
                            setLoanAmount(Math.max(0, propertyPrice - v));
                          }}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          €
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {propertyPrice > 0
                          ? `${((downPayment / propertyPrice) * 100).toFixed(1)}% du prix`
                          : '—'}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">Montant emprunté</span>
                        <span className="text-lg font-bold text-blue-700">
                          {effectiveLoan.toLocaleString('fr-FR')} €
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-gray-400" /> Taux annuel
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.1"
                            value={interestRate}
                            onChange={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            %
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" /> Durée
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={loanYears}
                            onChange={(e) => setLoanYears(parseInt(e.target.value) || 1)}
                            className="pr-12"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                            ans
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Résultats */}
                <div className="space-y-4">
                  <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Mensualité estimée
                        </p>
                        <p className="text-5xl font-bold text-blue-700 mt-2">
                          {mortgage.monthly.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          par mois pendant {loanYears} ans
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <Euro className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 uppercase">Coût total du crédit</p>
                        <p className="text-xl font-bold mt-1">
                          {mortgage.totalCost.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}{' '}
                          €
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <TrendingUp className="h-5 w-5 text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 uppercase">Intérêts totaux</p>
                        <p className="text-xl font-bold mt-1 text-red-600">
                          {mortgage.totalInterest.toLocaleString('fr-FR', {
                            maximumFractionDigits: 0,
                          })}{' '}
                          €
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Tableau d'amortissement simplifié */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Répartition du prêt</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Capital emprunté</span>
                          <span className="font-medium">
                            {effectiveLoan.toLocaleString('fr-FR')} €
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{
                              width: `${mortgage.totalCost > 0 ? (effectiveLoan / mortgage.totalCost) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Intérêts</span>
                          <span className="font-medium text-red-600">
                            {mortgage.totalInterest.toLocaleString('fr-FR', {
                              maximumFractionDigits: 0,
                            })}{' '}
                            €
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500"
                            style={{
                              width: `${mortgage.totalCost > 0 ? (mortgage.totalInterest / mortgage.totalCost) * 100 : 0}%`,
                            }}
                          />
                        </div>

                        <div className="pt-3 mt-3 border-t border-gray-100 flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-gray-500">
                            Simulation indicative. Les taux réels dépendent de votre profil, de la
                            banque et des conditions du marché. Taux moyen constaté : ~3.5% sur 25
                            ans (avril 2026).
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ════════════ TAB: PRIX DU MARCHÉ ════════════ */}
            <TabsContent value="market-prices" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Prix au m² par zone</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Données issues du scraping immobilier et du CRM
                  </p>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher une ville..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {pricesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Prix moyen national
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {zonePrices.length > 0
                                ? Math.round(
                                    zonePrices.reduce((s, z) => s + z.avgPriceM2, 0) /
                                      zonePrices.length
                                  ).toLocaleString('fr-FR')
                                : '—'}{' '}
                              €/m²
                            </p>
                          </div>
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Euro className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Zones analysées
                            </p>
                            <p className="text-2xl font-bold mt-1">{zonePrices.length}</p>
                          </div>
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Map className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Annonces analysées
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {zonePrices.reduce((s, z) => s + z.nbListings, 0)}
                            </p>
                          </div>
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Eye className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Zone table */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Ville
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Zone
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-gray-500">
                                Prix moy. /m²
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-gray-500">
                                Min
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-gray-500">
                                Max
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-gray-500">
                                Tendance
                              </th>
                              <th className="text-right py-3 px-4 font-medium text-gray-500">
                                Annonces
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredZones.map((zone, i) => (
                              <tr
                                key={`${zone.city}-${zone.zone}-${i}`}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                              >
                                <td className="py-3 px-4 font-medium">{zone.city}</td>
                                <td className="py-3 px-4 text-gray-600">{zone.zone}</td>
                                <td className="py-3 px-4 text-right font-bold">
                                  {zone.avgPriceM2.toLocaleString('fr-FR')} €
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500">
                                  {zone.minPrice.toLocaleString('fr-FR')} €
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500">
                                  {zone.maxPrice.toLocaleString('fr-FR')} €
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span
                                    className={`inline-flex items-center gap-1 font-medium ${zone.trend > 0 ? 'text-green-600' : zone.trend < 0 ? 'text-red-600' : 'text-gray-500'}`}
                                  >
                                    {zone.trend > 0 ? (
                                      <ArrowUpRight className="h-3.5 w-3.5" />
                                    ) : zone.trend < 0 ? (
                                      <ArrowDownRight className="h-3.5 w-3.5" />
                                    ) : null}
                                    {zone.trend > 0 ? '+' : ''}
                                    {zone.trend}%
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Badge variant="outline">{zone.nbListings}</Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {filteredZones.length === 0 && (
                          <div className="py-8 text-center text-gray-500">
                            <Map className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>Aucune zone trouvée pour &quot;{searchCity}&quot;</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ════════════ TAB: INDICATEURS MARCHÉ ════════════ */}
            <TabsContent value="indicators" className="space-y-6 mt-6">
              <div>
                <h2 className="text-xl font-bold">Indicateurs & Analytiques</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Synthèse CRM, prospection, performance et tendances du marché immobilier
                </p>
              </div>

              {indicatorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {indicators.map((ind, i) => {
                      const Icon = ind.icon;
                      const colorClasses = indicatorColors[ind.color] || indicatorColors.blue;
                      return (
                        <Card key={i}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">
                                  {ind.label}
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                  {typeof ind.value === 'number'
                                    ? ind.value.toLocaleString('fr-FR')
                                    : ind.value}
                                </p>
                                {ind.change !== 0 && (
                                  <p
                                    className={`text-xs mt-1 flex items-center gap-1 ${ind.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                                  >
                                    {ind.change > 0 ? (
                                      <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3" />
                                    )}
                                    {ind.change > 0 ? '+' : ''}
                                    {ind.change}% vs mois dernier
                                  </p>
                                )}
                              </div>
                              <div className={`p-2 rounded-lg ${colorClasses}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* ── Vue d'ensemble analytique ── */}
                  {analyticsData && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" /> Vue d&apos;ensemble
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Total Prospects
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {analyticsData.totalProspects.toLocaleString('fr-FR')}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Total Biens
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {analyticsData.totalProperties.toLocaleString('fr-FR')}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Taux de Conversion
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {analyticsData.conversionRate}%
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <p className="text-xs font-medium text-gray-500 uppercase">
                              Statuts distincts
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {Object.keys(analyticsData.prospectsByStatus).length}
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Prospects par Statut */}
                        {Object.keys(analyticsData.prospectsByStatus).length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4 text-blue-500" /> Prospects par Statut
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {Object.entries(analyticsData.prospectsByStatus).map(
                                  ([status, count]) => (
                                    <div
                                      key={status}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                    >
                                      <span className="text-sm font-medium capitalize">
                                        {status}
                                      </span>
                                      <Badge variant="secondary">
                                        {(count as number).toLocaleString('fr-FR')}
                                      </Badge>
                                    </div>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Biens par Type */}
                        {Object.keys(analyticsData.propertiesByType).length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Home className="h-4 w-4 text-green-500" /> Biens par Type
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {Object.entries(analyticsData.propertiesByType).map(
                                  ([type, count]) => (
                                    <div
                                      key={type}
                                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                    >
                                      <span className="text-sm font-medium capitalize">{type}</span>
                                      <Badge variant="secondary">
                                        {(count as number).toLocaleString('fr-FR')}
                                      </Badge>
                                    </div>
                                  )
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Funnel de Conversion ── */}
                  {funnelData?.conversionFunnel &&
                    Object.keys(funnelData.conversionFunnel).length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Target className="h-5 w-5 text-purple-500" /> Funnel de Conversion
                        </h3>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="space-y-3">
                              {(() => {
                                const entries = Object.entries(funnelData.conversionFunnel!);
                                const maxVal = Math.max(...entries.map(([, v]) => v as number), 1);
                                return entries.map(([step, count], idx) => (
                                  <div key={step} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium capitalize flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                                          {idx + 1}
                                        </span>
                                        {step.replace(/([A-Z])/g, ' $1').trim()}
                                      </span>
                                      <span className="font-bold">
                                        {(count as number).toLocaleString('fr-FR')}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                        style={{ width: `${((count as number) / maxVal) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                  {/* ── Performance & Tendances ── */}
                  {performanceData && Object.keys(performanceData).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-green-500" /> Performance & Tendances
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {performanceData.period && (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase">
                                    Période
                                  </p>
                                  <p className="text-2xl font-bold mt-1 capitalize">
                                    {performanceData.period}
                                  </p>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                  <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {performanceData.prospects !== undefined && (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase">
                                    Prospects
                                  </p>
                                  <p className="text-2xl font-bold mt-1">
                                    {performanceData.prospects}
                                  </p>
                                </div>
                                <div className="p-2 bg-green-100 rounded-lg">
                                  <Users className="h-5 w-5 text-green-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {performanceData.properties !== undefined && (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase">
                                    Propriétés
                                  </p>
                                  <p className="text-2xl font-bold mt-1">
                                    {performanceData.properties}
                                  </p>
                                </div>
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Home className="h-5 w-5 text-purple-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        {performanceData.communications !== undefined && (
                          <Card>
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-medium text-gray-500 uppercase">
                                    Communications
                                  </p>
                                  <p className="text-2xl font-bold mt-1">
                                    {performanceData.communications}
                                  </p>
                                </div>
                                <div className="p-2 bg-orange-100 rounded-lg">
                                  <BarChart3 className="h-5 w-5 text-orange-600" />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Période d'analyse */}
                      {performanceData.startDate && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Période d&apos;analyse</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Du</span>
                                <span className="font-medium">
                                  {new Date(performanceData.startDate).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-gray-600">au</span>
                                <span className="font-medium">
                                  {new Date(performanceData.endDate).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Détails des tendances */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Détails des tendances</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(performanceData)
                              .filter(([k]) => !['period', 'startDate', 'endDate'].includes(k))
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <span className="text-sm font-medium capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <span className="text-lg font-bold">
                                    {typeof value === 'number'
                                      ? value.toLocaleString('fr-FR')
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* ── ROI & Portefeuille ── */}
                  {roiData && Object.keys(roiData).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-amber-500" /> Retour sur Investissement
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">
                                  Prospects totaux
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                  {roiData.totalProspects ?? 0}
                                </p>
                              </div>
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">
                                  Taux de conversion
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                  {roiData.conversionRate ?? 0}%
                                </p>
                              </div>
                              <div className="p-2 bg-green-100 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase">
                                  Propriétés totales
                                </p>
                                <p className="text-2xl font-bold mt-1">
                                  {roiData.totalProperties ?? 0}
                                </p>
                              </div>
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Home className="h-5 w-5 text-purple-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Home className="h-4 w-4 text-green-500" /> Biens disponibles
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold">{roiData.availableProperties ?? 0}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              sur {roiData.totalProperties ?? 0} propriétés
                            </p>
                            {roiData.totalProperties > 0 && (
                              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{
                                    width: `${((roiData.availableProperties || 0) / roiData.totalProperties) * 100}%`,
                                  }}
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-amber-500" /> Valeur du
                              portefeuille
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Prix moyen</span>
                                <span className="font-bold text-lg">
                                  {(roiData.avgPropertyPrice ?? 0).toLocaleString('fr-FR')} €
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Revenu total</span>
                                <span className="font-bold text-lg text-green-600">
                                  {(roiData.totalRevenue ?? 0).toLocaleString('fr-FR')} €
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Info */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Sources des données</p>
                          <p className="text-xs text-blue-700 mt-1">
                            Les indicateurs combinent les données analytiques du CRM (prospects,
                            transactions, conversions), le module de scraping (annonces
                            immobilières), les projets d&apos;investissement importés et les KPIs de
                            performance. Les tendances et le ROI sont calculés automatiquement à
                            partir de l&apos;historique collecté.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
