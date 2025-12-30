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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { ArrowLeft, BarChart3, TrendingUp, DollarSign, Zap } from 'lucide-react';

/**
 * AI Usage Analytics Page
 *
 * Tous les rôles peuvent voir leur usage personnel
 * ADMIN: Peut voir l'usage de toute l'agence
 * SUPER_ADMIN: Peut voir l'usage de toutes les agences
 */

interface UsageByProvider {
  provider: string;
  credits: number;
  cost: number;
  requests: number;
  percentage: number;
}

interface UsageByModule {
  module: string;
  credits: number;
  cost: number;
  percentage: number;
}

export default function AIUsagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');
  const [totalCredits, setTotalCredits] = useState(3240);
  const [totalCost, setTotalCost] = useState(45.3);
  const [usageByProvider, setUsageByProvider] = useState<UsageByProvider[]>([]);
  const [usageByModule, setUsageByModule] = useState<UsageByModule[]>([]);

  useEffect(() => {
    fetchUsageData();
  }, [period]);

  const fetchUsageData = async () => {
    try {
      // TODO: Remplacer par vrai appel API
      // const response = await fetch(`/api/ai-billing/usage?period=${period}`);
      // const data = await response.json();

      // Données de démo
      setUsageByProvider([
        {
          provider: 'Claude 3.5 Sonnet',
          credits: 1458,
          cost: 20.4,
          requests: 234,
          percentage: 45,
        },
        {
          provider: 'GPT-4 Turbo',
          credits: 972,
          cost: 13.6,
          requests: 156,
          percentage: 30,
        },
        {
          provider: 'Gemini Pro',
          credits: 486,
          cost: 6.8,
          requests: 89,
          percentage: 15,
        },
        {
          provider: 'DeepSeek',
          credits: 324,
          cost: 4.5,
          requests: 145,
          percentage: 10,
        },
      ]);

      setUsageByModule([
        {
          module: 'AI Chat Assistant',
          credits: 1037,
          cost: 14.5,
          percentage: 32,
        },
        {
          module: 'Email AI Response',
          credits: 810,
          cost: 11.3,
          percentage: 25,
        },
        {
          module: 'Smart Forms',
          credits: 648,
          cost: 9.1,
          percentage: 20,
        },
        {
          module: 'Semantic Search',
          credits: 486,
          cost: 6.8,
          percentage: 15,
        },
        {
          module: 'Auto Reports',
          credits: 259,
          cost: 3.6,
          percentage: 8,
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching usage:', error);
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

  return (
    <>
      <Head>
        <title>Consommation IA - Analytics</title>
      </Head>

      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/settings/ai-billing')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Consommation IA</h1>
              <p className="text-muted-foreground">
                Analysez votre utilisation des services IA
              </p>
            </div>
          </div>

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="90days">90 derniers jours</SelectItem>
              <SelectItem value="1year">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Crédits Consommés
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Sur la période sélectionnée
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Économie de $12 avec BYOK
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requêtes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">624</div>
              <p className="text-xs text-muted-foreground">
                +12% vs période précédente
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Usage by Provider */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Consommation par Provider
            </CardTitle>
            <CardDescription>
              Répartition de l'usage par fournisseur d'IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Crédits</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">Requêtes</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageByProvider.map((item) => (
                  <TableRow key={item.provider}>
                    <TableCell className="font-medium">{item.provider}</TableCell>
                    <TableCell className="text-right">
                      {item.credits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{item.requests}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{item.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Usage by Module */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Consommation par Module
            </CardTitle>
            <CardDescription>
              Répartition de l'usage par module fonctionnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-right">Crédits</TableHead>
                  <TableHead className="text-right">Coût</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageByModule.map((item) => (
                  <TableRow key={item.module}>
                    <TableCell className="font-medium">{item.module}</TableCell>
                    <TableCell className="text-right">
                      {item.credits.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-20 bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{item.percentage}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommandations d'optimisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Badge variant="secondary">💡</Badge>
                <p className="text-sm">
                  <strong>DeepSeek</strong> offre un excellent rapport qualité/prix pour les tâches de génération de texte simple.
                  Économies potentielles: $8/mois
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="secondary">💡</Badge>
                <p className="text-sm">
                  Utilisez <strong>BYOK</strong> (vos propres clés API) pour économiser jusqu'à 30% sur les coûts.
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <Badge variant="secondary">💡</Badge>
                <p className="text-sm">
                  Activez le <strong>cache sémantique</strong> pour réduire les requêtes redondantes de 25%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
