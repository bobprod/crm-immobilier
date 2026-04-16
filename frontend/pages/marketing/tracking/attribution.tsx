import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/shared/utils/api-client-backend';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'position_based';

interface AttributionResult {
  platform: string;
  credit: number;
  touchpoints: number;
}

interface ModelComparison {
  model: string;
  attribution: AttributionResult[];
}

interface PlatformROI {
  platform: string;
  totalCredit: number;
  totalValue: number;
  touchpoints: number;
  averageValue: number;
}

interface TouchPoint {
  platform: string;
  eventName: string;
  timestamp: string;
  sessionId: string;
}

interface Conversion {
  sessionId: string;
  timestamp: string;
  value: number;
  eventName: string;
}

const COLORS = {
  meta: '#1877F2',
  google_tag_manager: '#F4B400',
  google_analytics: '#E37400',
  google_ads: '#4285F4',
  tiktok: '#000000',
  linkedin: '#0A66C2',
  snapchat: '#FFFC00',
};

const MODEL_LABELS = {
  first_touch: 'First Touch',
  last_touch: 'Last Touch',
  linear: 'Linéaire',
  time_decay: 'Time Decay',
  position_based: 'Position-Based (U-Shaped)',
};

const MODEL_DESCRIPTIONS = {
  first_touch: '100% de crédit au premier point de contact',
  last_touch: '100% de crédit au dernier point de contact',
  linear: 'Crédit égal réparti sur tous les points de contact',
  time_decay: 'Plus de crédit aux interactions récentes (demi-vie 7j)',
  position_based: '40% premier, 40% dernier, 20% réparti au milieu',
};

export default function AttributionPage() {
  const [selectedModel, setSelectedModel] = useState<AttributionModel>('linear');
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [selectedConversion, setSelectedConversion] = useState<Conversion | null>(null);
  const [journey, setJourney] = useState<TouchPoint[]>([]);
  const [attribution, setAttribution] = useState<AttributionResult[]>([]);
  const [modelComparison, setModelComparison] = useState<ModelComparison[]>([]);
  const [platformROI, setPlatformROI] = useState<PlatformROI[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les conversions
  useEffect(() => {
    loadConversions();
  }, []);

  // Charger l'attribution et la comparaison quand une conversion est sélectionnée
  useEffect(() => {
    if (selectedConversion) {
      loadAttribution();
      loadModelComparison();
      loadJourney();
    }
  }, [selectedConversion, selectedModel]);

  // Charger le ROI par plateforme
  useEffect(() => {
    loadPlatformROI();
  }, [selectedModel]);

  const loadConversions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/marketing-tracking/conversions');
      setConversions(response.data);
      if (response.data.length > 0) {
        setSelectedConversion(response.data[0]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des conversions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttribution = async () => {
    if (!selectedConversion) return;

    try {
      const response = await apiClient.get(
        `/marketing-tracking/attribution/calculate?sessionId=${selectedConversion.sessionId}&model=${selectedModel}`
      );
      setAttribution(response.data);
    } catch (error) {
      console.error("Erreur lors du calcul de l'attribution:", error);
    }
  };

  const loadModelComparison = async () => {
    if (!selectedConversion) return;

    try {
      const response = await apiClient.get(
        `/marketing-tracking/attribution/compare?sessionId=${selectedConversion.sessionId}`
      );
      setModelComparison(response.data);
    } catch (error) {
      console.error('Erreur lors de la comparaison des modèles:', error);
    }
  };

  const loadJourney = async () => {
    if (!selectedConversion) return;

    try {
      const response = await apiClient.get(
        `/marketing-tracking/attribution/journey?sessionId=${selectedConversion.sessionId}`
      );
      setJourney(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du parcours:', error);
    }
  };

  const loadPlatformROI = async () => {
    try {
      const response = await apiClient.get(
        `/marketing-tracking/attribution/roi?model=${selectedModel}`
      );
      setPlatformROI(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement du ROI:', error);
    }
  };

  const getPlatformColor = (platform: string) => {
    return COLORS[platform as keyof typeof COLORS] || '#6B7280';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Préparer les données pour le graphique de comparaison des modèles
  const comparisonChartData = modelComparison.map((comparison) => {
    const data: any = {
      model: MODEL_LABELS[comparison.model as AttributionModel] || comparison.model,
    };
    comparison.attribution.forEach((attr) => {
      data[attr.platform] = attr.credit;
    });
    return data;
  });

  // Extraire toutes les plateformes uniques pour le graphique
  const allPlatforms = Array.from(
    new Set(modelComparison.flatMap((comp) => comp.attribution.map((attr) => attr.platform)))
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/marketing-dashboard">
            <Button variant="ghost" size="sm" className="mb-2 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Hub Marketing
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Attribution Multi-Touch</h1>
          <p className="text-muted-foreground mt-1">
            Analysez le parcours complet du lead et attribuez le crédit à chaque point de contact
          </p>
        </div>
        <Select
          value={selectedModel}
          onValueChange={(value) => setSelectedModel(value as AttributionModel)}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Modèle d'attribution" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MODEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description du modèle sélectionné */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5">
              ℹ️
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">{MODEL_LABELS[selectedModel]}</h3>
              <p className="text-blue-800 text-sm">{MODEL_DESCRIPTIONS[selectedModel]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="journey" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="journey">Parcours Utilisateur</TabsTrigger>
          <TabsTrigger value="attribution">Attribution Actuelle</TabsTrigger>
          <TabsTrigger value="comparison">Comparaison Modèles</TabsTrigger>
          <TabsTrigger value="roi">ROI par Plateforme</TabsTrigger>
        </TabsList>

        {/* TAB 1: Parcours Utilisateur */}
        <TabsContent value="journey" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Conversions Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conversions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Conversion Sélectionnée</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedConversion ? selectedConversion.eventName : 'Aucune'}
                </div>
                {selectedConversion && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(selectedConversion.value)}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Points de Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journey.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Sélecteur de conversion */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une Conversion</CardTitle>
              <CardDescription>
                Choisissez une conversion pour visualiser son parcours complet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {conversions.map((conversion) => (
                  <div
                    key={conversion.sessionId}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedConversion?.sessionId === conversion.sessionId
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedConversion(conversion)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{conversion.eventName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(conversion.timestamp)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {formatCurrency(conversion.value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Session: {conversion.sessionId.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visualisation du parcours */}
          {journey.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Parcours de Conversion</CardTitle>
                <CardDescription>
                  Timeline des points de contact jusqu'à la conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Ligne de timeline */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300" />

                  <div className="space-y-6">
                    {journey.map((touchpoint, index) => (
                      <div key={index} className="relative flex items-start gap-4 pl-2">
                        {/* Point sur la timeline */}
                        <div
                          className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
                          style={{ backgroundColor: getPlatformColor(touchpoint.platform) }}
                        >
                          {index + 1}
                        </div>

                        {/* Carte de l'événement */}
                        <div className="flex-1 bg-white border rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              style={{
                                backgroundColor: getPlatformColor(touchpoint.platform),
                                color: 'white',
                              }}
                            >
                              {touchpoint.platform}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(touchpoint.timestamp)}
                            </span>
                          </div>
                          <div className="font-semibold">{touchpoint.eventName}</div>
                          {index === 0 && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              Premier Contact
                            </Badge>
                          )}
                          {index === journey.length - 1 && (
                            <Badge
                              variant="outline"
                              className="mt-2 text-xs bg-green-50 text-green-700 border-green-300"
                            >
                              Conversion
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: Attribution Actuelle */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attribution - {MODEL_LABELS[selectedModel]}</CardTitle>
              <CardDescription>
                Répartition du crédit selon le modèle {MODEL_LABELS[selectedModel].toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attribution.length > 0 ? (
                <div className="space-y-4">
                  {/* Graphique en camembert */}
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={attribution}
                        dataKey="credit"
                        nameKey="platform"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.platform}: ${entry.credit.toFixed(1)}%`}
                      >
                        {attribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getPlatformColor(entry.platform)} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Tableau détaillé */}
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold">Plateforme</th>
                          <th className="text-right p-3 font-semibold">Crédit (%)</th>
                          <th className="text-right p-3 font-semibold">Points de Contact</th>
                          <th className="text-right p-3 font-semibold">Crédit / Point</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attribution
                          .sort((a, b) => b.credit - a.credit)
                          .map((result, index) => (
                            <tr key={index} className="border-b last:border-b-0">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getPlatformColor(result.platform) }}
                                  />
                                  <span className="font-medium">{result.platform}</span>
                                </div>
                              </td>
                              <td className="text-right p-3 font-semibold text-lg">
                                {result.credit.toFixed(2)}%
                              </td>
                              <td className="text-right p-3">{result.touchpoints}</td>
                              <td className="text-right p-3 text-muted-foreground">
                                {(result.credit / result.touchpoints).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sélectionnez une conversion pour voir l'attribution
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Comparaison des Modèles */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des Modèles d'Attribution</CardTitle>
              <CardDescription>
                Comparez comment chaque modèle répartit le crédit entre les plateformes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comparisonChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comparisonChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis label={{ value: 'Crédit (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {allPlatforms.map((platform) => (
                      <Bar
                        key={platform}
                        dataKey={platform}
                        fill={getPlatformColor(platform)}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Sélectionnez une conversion pour comparer les modèles
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tableau de comparaison détaillé */}
          {modelComparison.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Détails par Modèle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelComparison.map((comparison) => (
                    <div key={comparison.model} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">
                        {MODEL_LABELS[comparison.model as AttributionModel] || comparison.model}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {comparison.attribution.map((attr, index) => (
                          <div key={index} className="bg-gray-50 rounded p-3">
                            <div className="text-xs text-muted-foreground mb-1">
                              {attr.platform}
                            </div>
                            <div className="text-xl font-bold">{attr.credit.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {attr.touchpoints} touchpoint{attr.touchpoints > 1 ? 's' : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 4: ROI par Plateforme */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI par Plateforme - {MODEL_LABELS[selectedModel]}</CardTitle>
              <CardDescription>
                Valeur générée par chaque plateforme selon l'attribution{' '}
                {MODEL_LABELS[selectedModel].toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {platformROI.length > 0 ? (
                <>
                  {/* Graphique ROI */}
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={platformROI}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar dataKey="totalValue" fill="#10B981" name="Valeur Totale" />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Tableau ROI */}
                  <div className="border rounded-lg overflow-hidden mt-6">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-3 font-semibold">Plateforme</th>
                          <th className="text-right p-3 font-semibold">Crédit Total</th>
                          <th className="text-right p-3 font-semibold">Valeur Totale</th>
                          <th className="text-right p-3 font-semibold">Touchpoints</th>
                          <th className="text-right p-3 font-semibold">Valeur Moyenne</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformROI
                          .sort((a, b) => b.totalValue - a.totalValue)
                          .map((platform, index) => (
                            <tr key={index} className="border-b last:border-b-0">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: getPlatformColor(platform.platform) }}
                                  />
                                  <span className="font-medium">{platform.platform}</span>
                                </div>
                              </td>
                              <td className="text-right p-3 text-muted-foreground">
                                {platform.totalCredit.toFixed(2)}
                              </td>
                              <td className="text-right p-3 font-semibold text-green-600 text-lg">
                                {formatCurrency(platform.totalValue)}
                              </td>
                              <td className="text-right p-3">{platform.touchpoints}</td>
                              <td className="text-right p-3 font-medium">
                                {formatCurrency(platform.averageValue)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2">
                        <tr>
                          <td className="p-3 font-bold">TOTAL</td>
                          <td className="text-right p-3 font-bold">
                            {platformROI.reduce((sum, p) => sum + p.totalCredit, 0).toFixed(2)}
                          </td>
                          <td className="text-right p-3 font-bold text-green-600 text-lg">
                            {formatCurrency(platformROI.reduce((sum, p) => sum + p.totalValue, 0))}
                          </td>
                          <td className="text-right p-3 font-bold">
                            {platformROI.reduce((sum, p) => sum + p.touchpoints, 0)}
                          </td>
                          <td className="text-right p-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune donnée de ROI disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
