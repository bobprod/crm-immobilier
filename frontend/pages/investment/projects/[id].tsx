import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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
  ArrowLeft,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  Building2,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * Investment Project Detail Page
 */

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProjectDetail();
    }
  }, [id]);

  const fetchProjectDetail = async () => {
    try {
      const response = await apiClient.get(`/investment-intelligence/projects/${id}`);
      const data = response.data?.project ?? response.data;
      // Replace broken /api/placeholder images with a safe fallback
      if (data?.images) {
        data.images = data.images.map((img: string) =>
          img.startsWith('/api/placeholder') ? '/placeholder.svg' : img
        );
      }
      setProject(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching project:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Projet non trouvé</h2>
          <Button className="mt-4" onClick={() => router.push('/investment')}>
            Retour au dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getRecommendationBadge = (rec: string) => {
    const config: Record<string, { variant: 'default' | 'destructive' | 'secondary'; icon: any }> = {
      BUY: { variant: 'default', icon: CheckCircle },
      HOLD: { variant: 'secondary', icon: AlertTriangle },
      PASS: { variant: 'destructive', icon: XCircle },
    };

    const { variant, icon: Icon } = config[rec] || config.HOLD;
    return (
      <Badge variant={variant} className="text-lg px-4 py-1">
        <Icon className="h-4 w-4 mr-2" />
        {rec}
      </Badge>
    );
  };

  return (
    <>
      <Head>
        <title>{project.title} - Détail Projet</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/investment/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
              <div className="flex items-center text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {project.address}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getRecommendationBadge(project.analysis.recommendation)}
            <Badge variant="secondary">Score: {project.analysis.overallScore}/100</Badge>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Prix Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.totalPrice.toLocaleString('fr-FR')} {project.currency}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket min: {project.minTicket} {project.currency}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Rendement Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{project.netYield}%</div>
              <p className="text-xs text-muted-foreground">
                Brut: {project.grossYield}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Durée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.durationMonths} mois</div>
              <p className="text-xs text-muted-foreground">
                {new Date(project.startDate).toLocaleDateString('fr-FR')} -{' '}
                {new Date(project.endDate).toLocaleDateString('fr-FR')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Financement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.fundingProgress}%</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-primary rounded-full h-2"
                  style={{ width: `${project.fundingProgress}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="analysis">Analyse IA</TabsTrigger>
            <TabsTrigger value="financials">Détails Financiers</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Type de bien</p>
                    <p className="font-medium">{project.propertyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Localisation</p>
                    <p className="font-medium">
                      {project.city}, {project.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="font-medium capitalize">{project.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Statut</p>
                    <Badge>{project.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recommandation IA</span>
                  {getRecommendationBadge(project.analysis.recommendation)}
                </CardTitle>
                <CardDescription>{project.analysis.recommendationReason}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Localisation</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 rounded-full h-2"
                          style={{ width: `${project.analysis.locationScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{project.analysis.locationScore}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rendement</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 rounded-full h-2"
                          style={{ width: `${project.analysis.yieldScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{project.analysis.yieldScore}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Risque</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                        <div
                          className="bg-orange-600 rounded-full h-2"
                          style={{ width: `${project.analysis.riskScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{project.analysis.riskScore}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Liquidité</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-secondary rounded-full h-2 mr-2">
                        <div
                          className="bg-purple-600 rounded-full h-2"
                          style={{ width: `${project.analysis.liquidityScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{project.analysis.liquidityScore}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-green-600 mb-2">Forces</h4>
                    <ul className="space-y-1 text-sm">
                      {project.analysis.strengths.map((s: string, i: number) => (
                        <li key={i}>✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-2">Faiblesses</h4>
                    <ul className="space-y-1 text-sm">
                      {project.analysis.weaknesses.map((w: string, i: number) => (
                        <li key={i}>⚠ {w}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Opportunités</h4>
                    <ul className="space-y-1 text-sm">
                      {project.analysis.opportunities.map((o: string, i: number) => (
                        <li key={i}>→ {o}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">Menaces</h4>
                    <ul className="space-y-1 text-sm">
                      {project.analysis.threats.map((t: string, i: number) => (
                        <li key={i}>⚡ {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Détails Financiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Prix total</p>
                      <p className="text-xl font-bold">
                        {project.totalPrice.toLocaleString('fr-FR')} {project.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket minimum</p>
                      <p className="text-xl font-bold">
                        {project.minTicket.toLocaleString('fr-FR')} {project.currency}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rendement cible</p>
                      <p className="text-xl font-bold text-green-600">{project.targetYield}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Aucun document disponible pour ce projet.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
