import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  MapPin,
  Building2,
  AlertCircle,
  Plus,
  BarChart3,
  Download,
} from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * Investment Intelligence Dashboard
 *
 * Vue d'ensemble des projets d'investissement immobilier
 * Rôles: ADMIN, SUPER_ADMIN (accès complet)
 *        AGENT (lecture seule)
 */

interface InvestmentStats {
  totalProjects: number;
  activeProjects: number;
  totalInvested: number;
  avgROI: number;
  topCity: string;
  bestPerforming: string;
}

export default function InvestmentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InvestmentStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/investment-intelligence/projects');
      const projects = response.data?.projects ?? [];

      setRecentProjects(projects.slice(0, 5));

      const active = projects.filter((p: any) => p.status === 'active').length;
      const totalInvested = projects.reduce((sum: number, p: any) => sum + (p.totalPrice ?? 0), 0);
      const avgROI = projects.length
        ? projects.reduce((sum: number, p: any) => sum + (p.netYield ?? 0), 0) / projects.length
        : 0;
      const cityMap: Record<string, number> = {};
      projects.forEach((p: any) => { if (p.city) cityMap[p.city] = (cityMap[p.city] ?? 0) + 1; });
      const topCity = Object.entries(cityMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
      const best = projects.reduce((a: any, b: any) => ((a?.netYield ?? 0) > (b?.netYield ?? 0) ? a : b), null);

      setStats({
        totalProjects: projects.length,
        activeProjects: active,
        totalInvested,
        avgROI: parseFloat(avgROI.toFixed(1)),
        topCity,
        bestPerforming: best?.title ?? '-',
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      bricks: { label: 'Bricks', variant: 'default' },
      homunity: { label: 'Homunity', variant: 'secondary' },
      generic: { label: 'URL', variant: 'outline' },
    };

    const config = sourceConfig[source] || sourceConfig.generic;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      active: 'default',
      completed: 'secondary',
      draft: 'outline',
    };

    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <MainLayout title="Investissement">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <ProtectedRoute>
      <MainLayout
        title="Investissement"
        breadcrumbs={[
          { label: 'Investissement' },
        ]}
      >
        <Head>
          <title>Investment Intelligence - Dashboard</title>
        </Head>

        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center">
                <Building2 className="h-8 w-8 mr-3" />
                Investment Intelligence
              </h1>
              <p className="text-muted-foreground mt-1">
                Analyse et comparaison de projets d'investissement immobilier
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.push('/investment/compare')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Comparer
              </Button>
              <Button onClick={() => router.push('/investment/import')}>
                <Plus className="h-4 w-4 mr-2" />
                Importer un projet
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeProjects} actifs
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
                  {stats?.totalInvested.toLocaleString('fr-FR')} €
                </div>
                <p className="text-xs text-muted-foreground">
                  Répartis sur {stats?.totalProjects} projets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI Moyen</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgROI}%</div>
                <p className="text-xs text-green-600">+0.5% vs dernier trimestre</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ville Top</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.topCity}</div>
                <p className="text-xs text-muted-foreground">8 projets actifs</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Projets Récents</CardTitle>
                  <CardDescription>
                    Derniers projets importés et analysés
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/investment/projects')}
                >
                  Voir tous les projets
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/investment/projects/${project.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{project.title}</h3>
                        {getSourceBadge(project.source)}
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {project.city}, {project.country}
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {project.totalPrice.toLocaleString('fr-FR')} €
                        </span>
                        <span className="flex items-center text-green-600">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {project.netYield}% ROI
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium mb-1">
                        Financement: {project.fundingProgress}%
                      </div>
                      <div className="w-32 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${project.fundingProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="cursor-pointer" onClick={() => router.push('/investment/import')}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Importer un projet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Importez depuis Bricks, Homunity ou une URL personnalisée
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="cursor-pointer" onClick={() => router.push('/investment/compare')}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Comparer des projets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Analysez et comparez jusqu'à 5 projets simultanément
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="cursor-pointer" onClick={() => router.push('/investment/alerts')}>
              <Card className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Alertes opportunités
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Recevez des alertes sur les meilleures opportunités
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Best Performing */}
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
                  <h3 className="text-lg font-semibold">{stats?.bestPerforming}</h3>
                  <p className="text-sm text-muted-foreground">Paris, France</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">9.2%</div>
                  <p className="text-sm text-muted-foreground">Rendement net</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
