import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';
import { prospectsConversionApi } from '@/shared/utils/prospects-conversion-api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  CalendarToday,
  Person,
  Email,
  Phone,
  Business,
  Assessment,
  History,
  Edit,
  ArrowBack,
} from '@mui/icons-material';

interface ProspectConversionDetail {
  id: string;
  prospectId: string;
  prospectName: string;
  prospectEmail: string;
  prospectPhone: string;
  currentStage: string;
  conversionProbability: number;
  estimatedTimeToConversion: number;
  totalInteractions: number;
  lastInteractionDate: Date;
  firstContactDate: Date;
  assignedAgent: string;
  propertyInterests: string[];
  budget: number;
  timeline: string;
  conversionScore: number;
  aiRecommendations: string[];
  stageHistory: Array<{
    stage: string;
    date: Date;
    duration: number;
  }>;
  interactions: Array<{
    type: string;
    date: Date;
    description: string;
    outcome: string;
  }>;
  nextActions: Array<{
    action: string;
    priority: string;
    dueDate: Date;
  }>;
}

export default function ProspectConversionDetail() {
  const router = useRouter();
  const { prospectId } = router.query;
  const [prospect, setProspect] = useState<ProspectConversionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prospectId) {
      loadProspectDetails();
    }
  }, [prospectId]);

  const loadProspectDetails = async () => {
    try {
      setLoading(true);
      const data = await prospectsConversionApi.getById(prospectId as string);
      setProspect(data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des détails du prospect');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      lead: 'default',
      contacted: 'info',
      qualified: 'primary',
      negotiation: 'warning',
      converted: 'success',
      lost: 'error',
    };
    return colors[stage] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, 'error' | 'warning' | 'default'> = {
      high: 'error',
      medium: 'warning',
      low: 'default',
    };
    return colors[priority.toLowerCase()] || 'default';
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

  if (error || !prospect) {
    return (
      <MainLayout>
        <Alert severity="error">{error || 'Prospect introuvable'}</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/prospects-conversion')}>
            Retour
          </Button>
          <Typography variant="h4" sx={{ flexGrow: 1 }}>
            {prospect.prospectName}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => router.push(`/prospects/${prospect.prospectId}/edit`)}
          >
            Modifier
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Informations Principales */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Informations de Contact
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Email fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Email:
                      </Typography>
                    </Box>
                    <Typography variant="body1">{prospect.prospectEmail}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Phone fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Téléphone:
                      </Typography>
                    </Box>
                    <Typography variant="body1">{prospect.prospectPhone}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Business fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Agent Assigné:
                      </Typography>
                    </Box>
                    <Typography variant="body1">{prospect.assignedAgent}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        Premier Contact:
                      </Typography>
                    </Box>
                    <Typography variant="body1">
                      {new Date(prospect.firstContactDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Recommandations IA */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recommandations IA
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  {prospect.aiRecommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={rec} primaryTypographyProps={{ variant: 'body2' }} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Historique des Interactions */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Historique des Interactions ({prospect.interactions.length})
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  {prospect.interactions.slice(0, 5).map((interaction, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="body2" fontWeight="bold">
                              {interaction.type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(interaction.date).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {interaction.description}
                            </Typography>
                            <Chip label={interaction.outcome} size="small" sx={{ mt: 1 }} />
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar - Métriques et Actions */}
          <Grid item xs={12} md={4}>
            {/* Statut et Probabilité */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Statut de Conversion
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 3 }}>
                  <Chip
                    label={prospect.currentStage}
                    color={getStageColor(prospect.currentStage) as any}
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Probabilité de Conversion
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress
                      variant="determinate"
                      value={prospect.conversionProbability}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {prospect.conversionProbability}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Score de Conversion
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {prospect.conversionScore}/100
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Temps Estimé (jours)
                  </Typography>
                  <Typography variant="h5">{prospect.estimatedTimeToConversion}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Intérêts et Budget */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Critères de Recherche
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Budget
                  </Typography>
                  <Typography variant="h6">{prospect.budget.toLocaleString()} €</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Timeline
                  </Typography>
                  <Typography variant="body1">{prospect.timeline}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Types de Propriétés
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {prospect.propertyInterests.map((interest, index) => (
                      <Chip key={index} label={interest} size="small" />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Prochaines Actions */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Prochaines Actions
                </Typography>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  {prospect.nextActions.map((action, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              label={action.priority}
                              size="small"
                              color={getPriorityColor(action.priority)}
                            />
                            <Typography variant="body2">{action.action}</Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {new Date(action.dueDate).toLocaleDateString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
}
