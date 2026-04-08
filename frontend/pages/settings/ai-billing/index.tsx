import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  CreditCard,
  Key,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Settings,
  BarChart3,
  Zap,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * AI Billing Dashboard - Page principale
 *
 * Gestion par rôles:
 * - SUPER_ADMIN: Accès complet (tous les onglets)
 * - ADMIN: Accès agence (crédits, usage, api-keys de l'agence)
 * - AGENT: Lecture seule (voir usage personnel)
 * - USER: Lecture seule limitée
 */

interface UserRole {
  role: 'USER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
  agencyId?: string;
}

export default function AIBillingDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Simuler récupération user (à remplacer par vrai auth)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // TODO: Remplacer par vrai appel API
        const response = await apiClient.get('/auth/me');
        const userData = response.data;
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
        // Fallback pour dev
        setUser({ role: 'ADMIN', agencyId: 'agency-1' });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Permissions par rôle
  const canManageCredits = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canManageApiKeys = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const canViewAllUsage = user?.role === 'SUPER_ADMIN';
  const canConfigurePricing = user?.role === 'SUPER_ADMIN';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous devez être connecté pour accéder à cette page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
     <MainLayout title="Settings" breadcrumbs={[{ label: "Paramètres" }]}>
      <Head>
        <title>AI Billing - Gestion Crédits & Facturation IA</title>
        <meta name="description" content="Gestion des crédits IA, usage et facturation" />
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Billing</h1>
            <p className="text-muted-foreground mt-1">
              Gestion des crédits IA et facturation
            </p>
          </div>
          <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>
            {user.role}
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Crédits Disponibles
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,450</div>
              <p className="text-xs text-muted-foreground">
                +20% vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Consommation ce mois
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,240</div>
              <p className="text-xs text-muted-foreground">
                67% du budget mensuel
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Coût Estimé
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45.30</div>
              <p className="text-xs text-muted-foreground">
                Économie de $12 avec BYOK
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Providers Actifs
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Anthropic, OpenAI, Google, DeepSeek, Mistral
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>

            {canManageCredits && (
              <TabsTrigger value="credits">
                <CreditCard className="h-4 w-4 mr-2" />
                Crédits
              </TabsTrigger>
            )}

            <TabsTrigger value="usage">
              <TrendingUp className="h-4 w-4 mr-2" />
              Consommation
            </TabsTrigger>

            {canManageApiKeys && (
              <TabsTrigger value="api-keys">
                <Key className="h-4 w-4 mr-2" />
                Clés API (BYOK)
              </TabsTrigger>
            )}

            {canConfigurePricing && (
              <TabsTrigger value="pricing">
                <Settings className="h-4 w-4 mr-2" />
                Configuration
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vue d'ensemble</CardTitle>
                <CardDescription>
                  Résumé de votre consommation IA et crédits disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Balance crédits</span>
                    <span className="text-2xl font-bold">12,450 crédits</span>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2"
                      style={{ width: '67%' }}
                    ></div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Top Provider</p>
                      <p className="font-medium">Claude 3.5 Sonnet (45%)</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Top Module</p>
                      <p className="font-medium">AI Chat Assistant (32%)</p>
                    </div>
                  </div>

                  {!canManageCredits && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Mode lecture seule. Contactez votre administrateur pour gérer les crédits.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credits Tab */}
          {canManageCredits && (
            <TabsContent value="credits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Crédits</CardTitle>
                  <CardDescription>
                    Achetez et gérez vos crédits IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => router.push('/settings/ai-billing/credits')}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Voir les détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Consommation IA</CardTitle>
                <CardDescription>
                  Analysez votre utilisation des services IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={() => router.push('/settings/ai-billing/usage')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Voir l'analyse détaillée
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          {canManageApiKeys && (
            <TabsContent value="api-keys" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clés API (BYOK)</CardTitle>
                  <CardDescription>
                    Bring Your Own Keys - Utilisez vos propres clés API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => router.push('/settings/ai-billing/api-keys')}>
                      <Key className="h-4 w-4 mr-2" />
                      Gérer les clés API
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Pricing Tab */}
          {canConfigurePricing && (
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configuration Tarification</CardTitle>
                  <CardDescription>
                    Configuration des tarifs par modèle (SUPER_ADMIN uniquement)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button onClick={() => router.push('/settings/ai-billing/pricing')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurer les tarifs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </MainLayout>
  );
}
