import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';
import { ArrowLeft, Eye, Clock, MousePointer, TrendingUp } from 'lucide-react';

interface PropertyStats {
  propertyId: string;
  found: boolean;
  propertyData: {
    title: string;
    price: number;
    city: string;
    type: string;
    category: string;
  };
  stats: {
    impressions: number;
    totalTimeSpent: number;
    averageTimeSpent: number;
    buttonClicks: number;
    leads: number;
    clickThroughRate: number;
    conversionRate: number;
  };
  buttonClicksByType: Array<{
    buttonType: string;
    clicks: number;
    percentage: number;
  }>;
  timeline: Array<{
    date: string;
    impressions: number;
    clicks: number;
    leads: number;
  }>;
}

interface HeatmapData {
  propertyId: string;
  totalEvents: number;
  heatmapData: Array<{
    x: number;
    y: number;
    value: number;
  }>;
  filters: {
    type?: string;
    deviceType?: string;
  };
}

const BUTTON_TYPE_LABELS: Record<string, string> = {
  contact: 'Contact',
  call: 'Appel',
  email: 'Email',
  view_details: 'Voir détails',
  download: 'Télécharger',
  share: 'Partager',
  save: 'Favoris',
  schedule_visit: 'Visite',
  calculator: 'Simulateur',
  gallery: 'Galerie',
  other: 'Autre',
};

export default function PropertyHeatmapPage() {
  const router = useRouter();
  const { propertyId } = router.query;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PropertyStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [heatmapType, setHeatmapType] = useState<'click' | 'move' | 'scroll'>('click');
  const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet' | 'all'>('all');

  useEffect(() => {
    if (propertyId && typeof propertyId === 'string') {
      loadPropertyData();
    }
  }, [propertyId]);

  useEffect(() => {
    if (propertyId && typeof propertyId === 'string') {
      loadHeatmapData();
    }
  }, [propertyId, heatmapType, deviceType]);

  useEffect(() => {
    if (heatmapData && canvasRef.current) {
      drawHeatmap();
    }
  }, [heatmapData]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/marketing-tracking/property-analytics/property/${propertyId}/stats`,
      );
      setStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHeatmapData = async () => {
    try {
      const deviceParam = deviceType === 'all' ? '' : `&deviceType=${deviceType}`;
      const response = await apiClient.get(
        `/marketing-tracking/heatmap/property/${propertyId}?type=${heatmapType}${deviceParam}`,
      );
      setHeatmapData(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de la heatmap:', error);
    }
  };

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmapData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Définir la taille du canvas
    canvas.width = 1200;
    canvas.height = 800;

    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille de repères
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Trouver la valeur max pour normaliser
    const maxValue = Math.max(...heatmapData.heatmapData.map((d) => d.value), 1);

    // Dessiner la heatmap
    heatmapData.heatmapData.forEach((point) => {
      const intensity = point.value / maxValue;
      const radius = 30 + intensity * 20; // Rayon varie de 30 à 50

      // Gradient radial
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);

      // Couleurs du chaud au froid
      const alpha = Math.min(intensity * 0.7, 0.7);
      if (intensity > 0.7) {
        gradient.addColorStop(0, `rgba(220, 38, 38, ${alpha})`); // Rouge
        gradient.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.5})`); // Orange
        gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
      } else if (intensity > 0.4) {
        gradient.addColorStop(0, `rgba(249, 115, 22, ${alpha})`); // Orange
        gradient.addColorStop(0.5, `rgba(251, 191, 36, ${alpha * 0.5})`); // Jaune
        gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
      } else {
        gradient.addColorStop(0, `rgba(34, 197, 94, ${alpha})`); // Vert
        gradient.addColorStop(0.5, `rgba(59, 130, 246, ${alpha * 0.5})`); // Bleu
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Légende
    ctx.fillStyle = '#000000';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${heatmapData.totalEvents} événements`, 10, 30);
    ctx.fillText(`Type: ${heatmapType}`, 10, 50);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  if (loading || !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!stats.found) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">Aucune donnée trouvée</h2>
              <p className="text-muted-foreground mb-4">
                Ce bien n'a pas encore été vu par des visiteurs.
              </p>
              <Link href="/marketing/tracking/property-analytics">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/marketing/tracking/property-analytics">
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{stats.propertyData.title}</h1>
          <p className="text-muted-foreground mt-1">
            {stats.propertyData.city} • {formatCurrency(stats.propertyData.price)} •{' '}
            <Badge variant="outline">{stats.propertyData.type}</Badge>
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.impressions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Temps Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(stats.stats.averageTimeSpent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-purple-600" />
              Clics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.stats.buttonClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              CTR: {stats.stats.clickThroughRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.stats.leads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Conv: {stats.stats.conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Heatmap des Interactions</CardTitle>
              <CardDescription>
                Visualisation des zones d'interaction sur la carte du bien
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={heatmapType}
                onValueChange={(value) => setHeatmapType(value as any)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="click">Clics</SelectItem>
                  <SelectItem value="move">Mouvements</SelectItem>
                  <SelectItem value="scroll">Scroll</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={deviceType}
                onValueChange={(value) => setDeviceType(value as any)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablette</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <canvas
              ref={canvasRef}
              className="w-full h-auto border bg-white rounded shadow-sm"
              style={{ maxHeight: '600px' }}
            />
          </div>

          {heatmapData && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {heatmapData.totalEvents} événements enregistrés • Type: {heatmapType}
              {heatmapData.filters.deviceType && ` • Device: ${heatmapData.filters.deviceType}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats boutons */}
      {stats.buttonClicksByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clics par Type de Bouton</CardTitle>
            <CardDescription>
              Répartition des clics sur les différents boutons de ce bien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {stats.buttonClicksByType.map((button) => (
                <div key={button.buttonType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {BUTTON_TYPE_LABELS[button.buttonType] || button.buttonType}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {button.clicks} clic{button.clicks > 1 ? 's' : ''}
                    </div>
                  </div>
                  <Badge>{button.percentage.toFixed(1)}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
