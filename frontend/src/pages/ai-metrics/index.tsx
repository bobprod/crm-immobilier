import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Brain,
  DollarSign,
  Zap,
  TrendingUp,
  BarChart3,
  History,
  Target,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/shared/utils/api-client-backend';

// Types alignés avec le backend
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

interface HistoryEntry {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface Conversion {
  id: string;
  eventType: string;
  eventName?: string;
  value?: number;
  source?: string;
  timestamp: string;
}

export default function AiMetricsDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [roi, setRoi] = useState<ROIData | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAllData();
  }, [days]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, roiRes, historyRes, conversionsRes] = await Promise.all([
        apiClient.get('/ai-metrics/stats'),
        apiClient.get('/ai-metrics/roi'),
        apiClient.get(`/ai-metrics/history?days=${days}`),
        apiClient.get('/ai-metrics/conversions?limit=10'),
      ]);

      setStats(statsRes.data);
      setRoi(roiRes.data);
      setHistory(historyRes.data || []);
      setConversions(conversionsRes.data || []);
    } catch (err: any) {
      console.error('Erreur chargement métriques IA:', err);
      setError('Impossible de charger les métriques IA');
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(cost);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

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
            Suivi des coûts et performances de l'intelligence artificielle
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
              <Target className="h-4 w-4 text-orange-500" />
              Conversions IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(roi?.conversions || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">Attribuées à l'IA</p>
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
        {/* By Provider */}
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

        {/* By Model */}
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

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique d'Utilisation ({days} jours)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-right py-2 px-3">Requêtes</th>
                    <th className="text-right py-2 px-3">Tokens</th>
                    <th className="text-right py-2 px-3">Coût</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(-10).reverse().map((entry) => (
                    <tr key={entry.date} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                      <td className="text-right py-2 px-3">{formatNumber(entry.requests)}</td>
                      <td className="text-right py-2 px-3">{formatNumber(entry.tokens)}</td>
                      <td className="text-right py-2 px-3">{formatCost(entry.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun historique disponible</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Conversions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversions Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conversions.length > 0 ? (
            <div className="space-y-3">
              {conversions.map((conversion) => (
                <div key={conversion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{conversion.eventName || conversion.eventType}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(conversion.timestamp).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {conversion.value && (
                      <p className="font-bold text-green-600">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'TND' }).format(conversion.value)}
                      </p>
                    )}
                    {conversion.source && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {conversion.source}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune conversion enregistrée</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
