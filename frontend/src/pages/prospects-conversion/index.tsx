import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Activity, Award } from 'lucide-react';
import {
  getAllConversions,
  getHighRoiProspects,
  ConversionEvent,
  HighRoiProspect,
} from '@/shared/utils/prospects-conversion-api';
import { useRouter } from 'next/router';

export default function ProspectsConversionPage() {
  const router = useRouter();
  const [conversions, setConversions] = useState<ConversionEvent[]>([]);
  const [highRoiProspects, setHighRoiProspects] = useState<HighRoiProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalConversions: 0,
    totalValue: 0,
    avgConversionRate: 0,
    topPerformer: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Charger les conversions
      const conversionsData = await getAllConversions();
      setConversions(conversionsData);

      // Charger les prospects high ROI
      const highRoiData = await getHighRoiProspects({ limit: 10 });
      setHighRoiProspects(highRoiData);

      // Calculer les stats
      const totalValue = conversionsData.reduce((sum, c) => sum + (c.value || 0), 0);
      const avgRate =
        highRoiData.reduce((sum, p) => sum + p.conversionRate, 0) / (highRoiData.length || 1);

      setStats({
        totalConversions: conversionsData.length,
        totalValue,
        avgConversionRate: avgRate,
        topPerformer: highRoiData[0]?.prospectName || 'N/A',
      });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (eventType: string) => {
    const colors: Record<string, string> = {
      lead_created: 'bg-blue-500',
      prospect_qualified: 'bg-green-500',
      property_viewed: 'bg-yellow-500',
      appointment_scheduled: 'bg-purple-500',
      deal_closed: 'bg-emerald-500',
    };
    return colors[eventType] || 'bg-gray-500';
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      lead_created: 'Lead Créé',
      prospect_qualified: 'Qualifié',
      property_viewed: 'Visite Effectuée',
      appointment_scheduled: 'RDV Planifié',
      deal_closed: 'Contrat Signé',
    };
    return labels[eventType] || eventType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tracking des Conversions</h1>
          <p className="text-gray-500">Suivi en temps réel des conversions prospects</p>
        </div>
        <Button onClick={() => router.push('/prospects')}>Retour aux Prospects</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversions Totales</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalValue.toLocaleString()} TND</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 text-green-500" /> +18% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taux de Conversion Moyen</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 text-red-500" /> -2% vs mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{stats.topPerformer}</div>
            <p className="text-xs text-muted-foreground">Meilleur ROI ce mois</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversions Récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Conversions Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversions.slice(0, 10).map((conversion) => (
                <div
                  key={conversion.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/prospects-conversion/${conversion.prospectId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${getEventColor(conversion.eventType)}`}
                    />
                    <div>
                      <p className="font-medium">{getEventLabel(conversion.eventType)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(conversion.timestamp).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  {conversion.value && (
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {conversion.value.toLocaleString()} {conversion.currency}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prospects High ROI */}
        <Card>
          <CardHeader>
            <CardTitle>Prospects High ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highRoiProspects.map((prospect, index) => (
                <div
                  key={prospect.prospectId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/prospects-conversion/${prospect.prospectId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{prospect.prospectName}</p>
                      <p className="text-sm text-gray-500">
                        Taux: {prospect.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {prospect.totalValue.toLocaleString()} TND
                    </p>
                    <p className="text-xs text-gray-500">Score: {prospect.score}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Timeline (TODO: ajouter Recharts) */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline des Conversions (30 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Graphique à implémenter avec Recharts
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
