import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Activity,
  Zap,
  Calendar,
  BarChart3,
  Info
} from 'lucide-react';

interface CreditBalance {
  balance: number;
  consumed: number;
  quotaMonthly?: number;
  quotaDaily?: number;
  isAgency: boolean;
  usagePercentage?: number;
  alertThreshold?: number;
  alertSent: boolean;
}

interface UsageHistory {
  id: string;
  actionCode: string;
  actionName: string;
  creditsUsed: number;
  provider?: string;
  model?: string;
  createdAt: string;
}

interface StatsByAction {
  actionCode: string;
  actionName: string;
  totalCredits: number;
  count: number;
}

export default function AICreditsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [history, setHistory] = useState<UsageHistory[]>([]);
  const [statsByAction, setStatsByAction] = useState<StatsByAction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Load balance
      const balanceRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-billing/credits/balance`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData);
      }

      // Load history
      const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-billing/usage/history?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.data || []);
      }

      // Load stats by action
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-billing/usage/stats/by-action`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatsByAction(statsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = balance?.usagePercentage || 0;
  const isLowBalance = balance && balance.alertThreshold && balance.balance <= balance.alertThreshold;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Coins className="h-8 w-8 text-yellow-600" />
            Mes Crédits AI
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez et suivez votre consommation de crédits IA
          </p>
        </div>

        {/* Alert si seuil atteint */}
        {isLowBalance && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Attention :</strong> Votre solde ({balance.balance} crédits) est en dessous du seuil d'alerte
              ({balance.alertThreshold} crédits). Pensez à recharger vos crédits.
            </AlertDescription>
          </Alert>
        )}

        {/* Cartes de stats principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Solde actuel */}
          <Card className={isLowBalance ? 'border-orange-200' : ''}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Solde Actuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Coins className="h-8 w-8 text-yellow-600" />
                {balance?.balance?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {balance?.isAgency ? 'Pool agence' : 'Crédits personnels'}
              </p>
            </CardContent>
          </Card>

          {/* Crédits consommés */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Consommés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-8 w-8 text-blue-600" />
                {balance?.consumed?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Depuis le dernier reset
              </p>
            </CardContent>
          </Card>

          {/* Quota mensuel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Quota Mensuel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-8 w-8 text-green-600" />
                {balance?.quotaMonthly?.toLocaleString() || 'Illimité'}
              </div>
              {balance?.quotaMonthly && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Utilisation</span>
                    <span>{usagePercentage}%</span>
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Grid layout : Stats par action + Historique */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stats par action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Top Actions
              </CardTitle>
              <CardDescription>
                Consommation par type d'action IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsByAction.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune consommation enregistrée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statsByAction.slice(0, 5).map((stat) => (
                    <div key={stat.actionCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{stat.actionName}</p>
                        <p className="text-xs text-gray-500">{stat.count} utilisations</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-mono">
                          {stat.totalCredits} cr.
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Historique récent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Historique Récent
              </CardTitle>
              <CardDescription>
                10 dernières utilisations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun historique disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.actionName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.provider && (
                            <Badge variant="outline" className="text-xs">
                              {item.provider}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {item.creditsUsed > 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-mono text-sm font-semibold">
                            {item.creditsUsed}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info box */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Comment fonctionnent les crédits ?</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Chaque action IA consomme un certain nombre de crédits</li>
                  <li>• Vos crédits personnels peuvent être complétés par le pool de votre agence</li>
                  <li>• Le quota mensuel se reset automatiquement chaque mois</li>
                  <li>• Une alerte vous est envoyée quand le seuil minimal est atteint</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
