import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Assessment, Psychology, Speed, Timeline } from '@mui/icons-material';

interface AiMetrics {
  totalPredictions: number;
  accuracyRate: number;
  averageConfidence: number;
  totalModelsUsed: number;
  predictionsByModel: Array<{
    model: string;
    count: number;
    accuracy: number;
  }>;
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
  }>;
  predictionDistribution: Array<{
    category: string;
    count: number;
  }>;
  performanceMetrics: {
    avgResponseTime: number;
    successRate: number;
    errorRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AiMetricsDashboard() {
  const [metrics, setMetrics] = useState<AiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      // TODO: Remplacer par l'appel API réel
      const mockData: AiMetrics = {
        totalPredictions: 1547,
        accuracyRate: 87.5,
        averageConfidence: 0.82,
        totalModelsUsed: 4,
        predictionsByModel: [
          { model: 'Conversion Predictor', count: 654, accuracy: 89.2 },
          { model: 'Lead Scorer', count: 432, accuracy: 85.1 },
          { model: 'Churn Predictor', count: 289, accuracy: 88.7 },
          { model: 'Price Estimator', count: 172, accuracy: 86.3 },
        ],
        accuracyTrend: [
          { date: '2024-01', accuracy: 82 },
          { date: '2024-02', accuracy: 84 },
          { date: '2024-03', accuracy: 85 },
          { date: '2024-04', accuracy: 86 },
          { date: '2024-05', accuracy: 87 },
          { date: '2024-06', accuracy: 87.5 },
        ],
        predictionDistribution: [
          { category: 'Haute Confiance', count: 892 },
          { category: 'Moyenne Confiance', count: 456 },
          { category: 'Faible Confiance', count: 199 },
        ],
        performanceMetrics: {
          avgResponseTime: 245,
          successRate: 98.2,
          errorRate: 1.8,
        },
      };
      setMetrics(mockData);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des métriques IA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !metrics) {
    return (
      <MainLayout>
        <Alert severity="error">{error || 'Données indisponibles'}</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">
            <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
            Tableau de Bord IA
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Période</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Période"
            >
              <MenuItem value="24h">Dernières 24h</MenuItem>
              <MenuItem value="7d">7 derniers jours</MenuItem>
              <MenuItem value="30d">30 derniers jours</MenuItem>
              <MenuItem value="90d">90 derniers jours</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Prédictions Totales
                    </Typography>
                    <Typography variant="h4">{metrics.totalPredictions}</Typography>
                  </Box>
                  <Assessment sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Taux de Précision
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {metrics.accuracyRate}%
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Confiance Moyenne
                    </Typography>
                    <Typography variant="h4">
                      {(metrics.averageConfidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  <Psychology sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">
                      Temps de Réponse
                    </Typography>
                    <Typography variant="h4">
                      {metrics.performanceMetrics.avgResponseTime}ms
                    </Typography>
                  </Box>
                  <Speed sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Accuracy Trend */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Évolution de la Précision
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[75, 95]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Précision (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Prediction Distribution */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distribution des Prédictions
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.predictionDistribution}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {metrics.predictionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Model Performance */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance par Modèle IA
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.predictionsByModel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="count"
                      fill="#8884d8"
                      name="Nombre de Prédictions"
                    />
                    <Bar yAxisId="right" dataKey="accuracy" fill="#82ca9d" name="Précision (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
