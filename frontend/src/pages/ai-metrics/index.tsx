import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Divider,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Timeline,
  Psychology,
  Speed,
  AttachMoney,
  People,
  Home,
  CalendarMonth,
  Warning,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { aiMetricsAPI } from '@/src/shared/utils/ai-metrics-api';
import type {
  UnifiedDashboard,
  TimeSeriesDataPoint,
  AIMetricsQueryParams,
} from '@/src/shared/types/ai-metrics.types';

// Lightweight local Grid shim to avoid MUI Grid typing incompatibilities in this build environment.
// It maps Grid usage to simple Box wrappers while keeping xs/sm/md props available (ignored for layout).
type ShimGridProps = {
  container?: boolean;
  item?: boolean;
  xs?: number | string;
  sm?: number | string;
  md?: number | string;
  spacing?: number;
  sx?: any;
  children?: React.ReactNode;
  [key: string]: any;
};

const Grid: React.FC<ShimGridProps> = ({ children, sx }) => <Box sx={sx}>{children}</Box>;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AiMetricsDashboard() {
  const [dashboard, setDashboard] = useState<UnifiedDashboard | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [tabValue, setTabValue] = useState(0);

  const getDateRange = (): AIMetricsQueryParams => {
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date();

    switch (timeRange) {
      case '24h':
        fromDate.setDate(fromDate.getDate() - 1);
        break;
      case '7d':
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(fromDate.getDate() - 30);
        break;
      case '90d':
        fromDate.setDate(fromDate.getDate() - 90);
        break;
    }

    return { from: fromDate.toISOString().split('T')[0], to };
  };

  useEffect(() => {
    loadDashboard();
  }, [timeRange]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = getDateRange();

      const [dashboardData, timeSeriesData] = await Promise.all([
        aiMetricsAPI.getUnifiedDashboard(params),
        aiMetricsAPI.getTimeSeries({ ...params, granularity: timeRange === '24h' ? 'day' : timeRange === '7d' ? 'day' : 'week' }),
      ]);

      setDashboard(dashboardData);
      setTimeSeries(timeSeriesData);
    } catch (err: any) {
      console.error('Erreur chargement AI Metrics:', err);
      setError(err.message || 'Erreur lors du chargement des metriques IA');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  if (loading) {
    return (
      <MainLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !dashboard) {
    return (
      <MainLayout>
        <Alert severity="error" sx={{ m: 3 }}>
          {error || 'Donnees indisponibles'}
        </Alert>
      </MainLayout>
    );
  }

  const { prospecting, salesFunnel, crmMatching, properties, roi, alerts } = dashboard;

  // Lightweight metrics aggregation used by the UI (fallbacks to avoid undefined during build)
  const metrics = {
    totalPredictions: (prospecting && (prospecting.totalLeadsProcessed ?? 0)) as number,
    accuracyRate: (crmMatching && (crmMatching.avgScore ?? 0)) as number,
    averageConfidence: ((crmMatching && (crmMatching.avgScore ?? 0)) as number) / 100,
    accuracyTrend: timeSeries.map((t) => ({ date: t.date, accuracy: t.avgMatchScore ?? 0 })),
  } as {
    totalPredictions: number;
    accuracyRate: number;
    averageConfidence: number;
    accuracyTrend: { date: string; accuracy: number }[];
  };

  // Prepare funnel data
  const funnelData = [
    { name: 'Leads', value: salesFunnel.leadsGenerated, fill: '#8884d8' },
    { name: 'Qualifies', value: salesFunnel.leadsQualified, fill: '#83a6ed' },
    { name: 'Prospects', value: salesFunnel.prospectsCreated, fill: '#8dd1e1' },
    { name: 'RDVs', value: salesFunnel.appointmentsScheduled, fill: '#82ca9d' },
    { name: 'Visites', value: salesFunnel.visitsCompleted, fill: '#a4de6c' },
    { name: 'Offres', value: salesFunnel.offersMade, fill: '#d0ed57' },
    { name: 'Contrats', value: salesFunnel.contractsSigned, fill: '#ffc658' },
  ];

  // Matching distribution
  const matchingData = [
    { name: 'Excellent (80+)', value: crmMatching.excellentMatches, fill: '#00C49F' },
    { name: 'Bon (60-79)', value: crmMatching.goodMatches, fill: '#0088FE' },
    { name: 'Moyen (40-59)', value: crmMatching.averageMatches, fill: '#FFBB28' },
    { name: 'Faible (<40)', value: crmMatching.poorMatches, fill: '#FF8042' },
  ];

  // ROI by module
  const roiModuleData = [
    { name: 'Prospecting', cost: roi.costByModule.prospecting },
    { name: 'Matching', cost: roi.costByModule.matching },
    { name: 'Validation', cost: roi.costByModule.validation },
    { name: 'Autre', cost: roi.costByModule.other },
  ];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            AI Metrics - Dashboard Unifie
          </Typography>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Periode</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Periode"
              size="small"
            >
              <MenuItem value="24h">Dernieres 24h</MenuItem>
              <MenuItem value="7d">7 derniers jours</MenuItem>
              <MenuItem value="30d">30 derniers jours</MenuItem>
              <MenuItem value="90d">90 derniers jours</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                severity={alert.type === 'warning' ? 'warning' : alert.type === 'success' ? 'success' : 'info'}
                icon={alert.type === 'warning' ? <Warning /> : alert.type === 'success' ? <CheckCircle /> : <Info />}
                sx={{ mb: 1 }}
              >
                {alert.message} - <strong>{alert.metric}: {alert.value.toFixed(1)}</strong>
              </Alert>
            ))}
          </Box>
        )}

        {/* KPI Cards (replaced Grid with responsive CSS grid Box) */}
        <Box sx={{ mb: 3, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(4,1fr)' } }}>
          <Box>
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
          </Box>

          <Box>
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
                  <TrendingUp sx={{ fontSize: 40, color: prospecting.conversionRate >= 10 ? 'success.main' : 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
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
                  <Speed sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" variant="body2">ROI Global IA</Typography>
                    <Typography variant="h4" color={roi.overallROI >= 0 ? 'success.main' : 'error.main'}>
                      {roi.overallROI >= 0 ? '+' : ''}{formatPercent(roi.overallROI)}
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(roi.totalRevenue)} revenus
                    </Typography>
                  </Box>
                  <AttachMoney sx={{ fontSize: 40, color: roi.overallROI >= 0 ? 'success.main' : 'error.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Charts */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Accuracy Trend */}
            <Grid xs={12} md={8}>
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
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Matching Distribution */}
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Distribution des Scores de Matching</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={matchingData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {matchingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Score-Conversion Correlation */}
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Correlation Score / Conversion</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={crmMatching.scoreConversionCorrelation}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="scoreRange" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="matches" fill="#8884d8" name="Matches" />
                      <Bar yAxisId="right" dataKey="conversionRate" fill="#82ca9d" name="Taux Conv. (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Matching KPIs */}
            <Grid xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>KPIs Matching</Typography>
                  <Grid container spacing={2}>
                    <Grid xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                        <Typography variant="h4">{crmMatching.excellentMatches}</Typography>
                        <Typography variant="body2">Excellents (80+)</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                        <Typography variant="h4">{crmMatching.goodMatches}</Typography>
                        <Typography variant="body2">Bons (60-79)</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                        <Typography variant="h4">{formatPercent(crmMatching.matchToVisitRate)}</Typography>
                        <Typography variant="body2">Match → Visite</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light' }}>
                        <Typography variant="h4">{crmMatching.avgScore.toFixed(0)}</Typography>
                        <Typography variant="body2">Score Moyen</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Properties by Status */}
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Proprietes par Statut</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={properties.byStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ status, percentage }) => `${status}: ${percentage.toFixed(0)}%`}
                      >
                        {properties.byStatus.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Properties by Type */}
            <Grid xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Proprietes par Type</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={properties.byType}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Nombre" />
                      <Bar yAxisId="right" dataKey="avgPrice" fill="#82ca9d" name="Prix Moyen (TND)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Properties KPIs */}
            <Grid xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>KPIs Proprietes</Typography>
                  <Grid container spacing={2}>
                    <Grid xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">{properties.totalProperties}</Typography>
                        <Typography variant="body2">Total</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">{properties.propertiesWithMatches}</Typography>
                        <Typography variant="body2">Avec Matches</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">{properties.featuredProperties}</Typography>
                        <Typography variant="body2">En Vedette</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">{formatPercent(properties.soldRentedRate)}</Typography>
                        <Typography variant="body2">Vendues/Louees</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">{formatCurrency(properties.avgPrice)}</Typography>
                        <Typography variant="body2">Prix Moyen</Typography>
                      </Paper>
                    </Grid>
                    <Grid xs={6} md={2}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h4">{properties.avgDaysOnMarket}</Typography>
                        <Typography variant="body2">Jours sur Marche</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {/* ROI Overview */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Couts IA par Module</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={roiModuleData.filter(d => d.cost > 0)}
                        dataKey="cost"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {roiModuleData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Cost per metrics */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Cout par Unite</Typography>
                  <Box sx={{ mt: 3 }}>
                    {[
                      { label: 'Cout par Lead', value: roi.costPerLead, icon: <People /> },
                      { label: 'Cout par Prospect', value: roi.costPerProspect, icon: <People /> },
                      { label: 'Cout par Conversion', value: roi.costPerConversion, icon: <CheckCircle /> },
                      { label: 'Revenu Moy. par Conversion', value: roi.avgRevenuePerConversion, icon: <AttachMoney />, isRevenue: true },
                    ].map((item, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {item.icon}
                          <Typography>{item.label}</Typography>
                        </Box>
                        <Typography variant="h6" color={item.isRevenue ? 'success.main' : 'text.primary'}>
                          {formatCurrency(item.value)}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Global ROI Summary */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: roi.overallROI >= 0 ? 'success.light' : 'error.light' }}>
                <CardContent>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">Cout Total IA</Typography>
                      <Typography variant="h3">{formatCurrency(roi.totalAICost)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">Revenus Generes</Typography>
                      <Typography variant="h3">{formatCurrency(roi.totalRevenue)}</Typography>
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="h6">ROI Global</Typography>
                      <Typography variant="h2" color={roi.overallROI >= 0 ? 'success.dark' : 'error.dark'}>
                        {roi.overallROI >= 0 ? '+' : ''}{formatPercent(roi.overallROI)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </MainLayout>
  );
}
