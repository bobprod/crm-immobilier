import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
} from '@mui/material';
// Simple local shim for Grid2 to avoid mismatched MUI typing across versions
const Grid2: any = (props: any) => <div {...props} />;
import {
  Email,
  Sms,
  WhatsApp,
  CloudUpload,
  CheckCircle,
  Error,
  Delete,
  Refresh,
  Info,
} from '@mui/icons-material';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * 🔌 Page de configuration des intégrations API
 *
 * Permet à chaque utilisateur de configurer ses propres clés API pour:
 * - Resend (Email)
 * - SendGrid (Email)
 * - Twilio (SMS + WhatsApp)
 * - Firebase (Push Notifications)
 */

interface IntegrationConfig {
  id?: string;
  provider: 'resend' | 'sendgrid' | 'twilio' | 'firebase';
  label?: string;
  isActive: boolean;
  monthlyQuota?: number;
  currentUsage?: number;
  lastTestedAt?: string;
  lastTestStatus?: 'success' | 'failed';
  lastTestError?: string;
  hasConfig: boolean;
}

interface FormData {
  // Resend
  resendApiKey?: string;

  // SendGrid
  sendgridApiKey?: string;

  // Twilio
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  twilioWhatsappNumber?: string;

  // Firebase
  firebaseServerKey?: string;
  firebaseProjectId?: string;

  // Meta
  label?: string;
  monthlyQuota?: number;
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  // Form data pour chaque provider
  const [resendForm, setResendForm] = useState<FormData>({});
  const [sendgridForm, setSendgridForm] = useState<FormData>({});
  const [twilioForm, setTwilioForm] = useState<FormData>({});
  const [firebaseForm, setFirebaseForm] = useState<FormData>({});

  const providers = [
    { id: 'resend', name: 'Resend', icon: <Email />, color: '#000000' },
    { id: 'sendgrid', name: 'SendGrid', icon: <Email />, color: '#1A82E2' },
    { id: 'twilio', name: 'Twilio', icon: <Sms />, color: '#F22F46' },
    { id: 'firebase', name: 'Firebase', icon: <CloudUpload />, color: '#FFA000' },
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/integrations');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegration = (provider: string): IntegrationConfig | undefined => {
    return integrations.find((i) => i.provider === provider);
  };

  const handleSave = async (provider: string, formData: FormData) => {
    try {
      setSaving(true);
      setMessage(null);

      const integration = getIntegration(provider);
      const url = integration ? `/integrations/${provider}` : '/integrations';

      const method = integration ? 'PUT' : 'POST';

      const payload: any = {
        config: {},
        label: formData.label,
        monthlyQuota: formData.monthlyQuota,
      };

      // Construire la config selon le provider
      if (provider === 'resend') {
        payload.config.resendApiKey = formData.resendApiKey;
      } else if (provider === 'sendgrid') {
        payload.config.sendgridApiKey = formData.sendgridApiKey;
      } else if (provider === 'twilio') {
        payload.config.twilioAccountSid = formData.twilioAccountSid;
        payload.config.twilioAuthToken = formData.twilioAuthToken;
        payload.config.twilioPhoneNumber = formData.twilioPhoneNumber;
        payload.config.twilioWhatsappNumber = formData.twilioWhatsappNumber;
      } else if (provider === 'firebase') {
        payload.config.firebaseServerKey = formData.firebaseServerKey;
        payload.config.firebaseProjectId = formData.firebaseProjectId;
      }

      if (!integration) {
        payload.provider = provider;
      }

      const response = await (method === 'PUT'
        ? apiClient.put(url, payload)
        : apiClient.post(url, payload));

      if (response.status === 200 || response.status === 201) {
        setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès!' });
        await loadIntegrations();
      } else {
        const errorData = response.data;
        setMessage({ type: 'error', text: errorData?.message || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (provider: string) => {
    try {
      setTesting(true);
      setMessage(null);

      const response = await apiClient.post(`/integrations/${provider}/test`);
      const result = response.data;

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Test réussi!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Test échoué' });
      }

      await loadIntegrations();
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du test' });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (provider: string) => {
    try {
      await apiClient.delete(`/integrations/${provider}`);
      setMessage({ type: 'success', text: 'Intégration supprimée' });
      await loadIntegrations();
      setDeleteDialog(null);

      // Clear form
      if (provider === 'resend') setResendForm({});
      else if (provider === 'sendgrid') setSendgridForm({});
      else if (provider === 'twilio') setTwilioForm({});
      else if (provider === 'firebase') setFirebaseForm({});
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' });
    }
  };

  const handleToggleActive = async (provider: string, isActive: boolean) => {
    try {
      await apiClient.put(`/integrations/${provider}`, { isActive });
      await loadIntegrations();
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const renderResendForm = () => {
    const integration = getIntegration('resend');

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
        <Card>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Email sx={{ fontSize: 40, color: '#000' }} />
                <Box>
                  <Typography variant="h5">Resend</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Email moderne - Gratuit jusqu'à 3,000 emails/mois
                  </Typography>
                </Box>
              </Box>
              {integration && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={integration.isActive}
                      onChange={(e) => handleToggleActive('resend', e.target.checked)}
                    />
                  }
                  label="Actif"
                />
              )}
            </Box>

            {integration && integration.lastTestStatus && (
              <Alert
                severity={integration.lastTestStatus === 'success' ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                {integration.lastTestStatus === 'success'
                  ? `✅ Testé avec succès le ${new Date(integration.lastTestedAt!).toLocaleString()}`
                  : `❌ Test échoué: ${integration.lastTestError}`}
              </Alert>
            )}

            <Grid2 container spacing={2}>
              <Grid2 xs={12}>
                <TextField
                  fullWidth
                  label="API Key Resend"
                  type="password"
                  value={resendForm.resendApiKey || ''}
                  onChange={(e) => setResendForm({ ...resendForm, resendApiKey: e.target.value })}
                  placeholder="re_123456789..."
                  helperText="Obtenez votre clé sur https://resend.com/api-keys"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Label (optionnel)"
                  value={resendForm.label || ''}
                  onChange={(e) => setResendForm({ ...resendForm, label: e.target.value })}
                  placeholder="Ex: Mon compte Resend"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quota mensuel (optionnel)"
                  type="number"
                  value={resendForm.monthlyQuota || ''}
                  onChange={(e) =>
                    setResendForm({ ...resendForm, monthlyQuota: parseInt(e.target.value) })
                  }
                  placeholder="3000"
                  helperText="Limite d'emails par mois"
                />
              </Grid2>

              {integration && integration.monthlyQuota && (
                <Grid2 xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Usage ce mois: {integration.currentUsage} / {integration.monthlyQuota}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(
                        ((integration.currentUsage || 0) / integration.monthlyQuota) * 100,
                        100
                      )}
                      sx={{ mt: 1 }}
                    />
                  </Paper>
                </Grid2>
              )}
            </Grid2>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleSave('resend', resendForm)}
                disabled={!resendForm.resendApiKey || saving}
              >
                {integration ? 'Mettre à jour' : 'Sauvegarder'}
              </Button>

              {integration && integration.hasConfig && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => handleTest('resend')}
                    disabled={testing}
                  >
                    Tester la connexion
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialog('resend')}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                📚 Guide: Créez un compte sur{' '}
                <a href="https://resend.com" target="_blank" rel="noopener">
                  resend.com
                </a>
                , puis allez dans API Keys pour générer une nouvelle clé.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderSendGridForm = () => {
    const integration = getIntegration('sendgrid');

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
        <Card>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Email sx={{ fontSize: 40, color: '#1A82E2' }} />
                <Box>
                  <Typography variant="h5">SendGrid</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Email classique - Gratuit jusqu'à 100 emails/jour
                  </Typography>
                </Box>
              </Box>
              {integration && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={integration.isActive}
                      onChange={(e) => handleToggleActive('sendgrid', e.target.checked)}
                    />
                  }
                  label="Actif"
                />
              )}
            </Box>

            {integration && integration.lastTestStatus && (
              <Alert
                severity={integration.lastTestStatus === 'success' ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                {integration.lastTestStatus === 'success'
                  ? `✅ Testé avec succès le ${new Date(integration.lastTestedAt!).toLocaleString()}`
                  : `❌ Test échoué: ${integration.lastTestError}`}
              </Alert>
            )}

            <Grid2 container spacing={2}>
              <Grid2 xs={12}>
                <TextField
                  fullWidth
                  label="API Key SendGrid"
                  type="password"
                  value={sendgridForm.sendgridApiKey || ''}
                  onChange={(e) =>
                    setSendgridForm({ ...sendgridForm, sendgridApiKey: e.target.value })
                  }
                  placeholder="SG.123456789..."
                  helperText="Obtenez votre clé sur https://app.sendgrid.com/settings/api_keys"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Label (optionnel)"
                  value={sendgridForm.label || ''}
                  onChange={(e) => setSendgridForm({ ...sendgridForm, label: e.target.value })}
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quota mensuel (optionnel)"
                  type="number"
                  value={sendgridForm.monthlyQuota || ''}
                  onChange={(e) =>
                    setSendgridForm({ ...sendgridForm, monthlyQuota: parseInt(e.target.value) })
                  }
                />
              </Grid2>
            </Grid2>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleSave('sendgrid', sendgridForm)}
                disabled={!sendgridForm.sendgridApiKey || saving}
              >
                {integration ? 'Mettre à jour' : 'Sauvegarder'}
              </Button>

              {integration && integration.hasConfig && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => handleTest('sendgrid')}
                    disabled={testing}
                  >
                    Tester la connexion
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialog('sendgrid')}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderTwilioForm = () => {
    const integration = getIntegration('twilio');

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
        <Card>
          <CardContent>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Sms sx={{ fontSize: 40, color: '#F22F46' }} />
                <Box>
                  <Typography variant="h5">Twilio</Typography>
                  <Typography variant="caption" color="text.secondary">
                    SMS + WhatsApp - $15 crédit gratuit
                  </Typography>
                </Box>
              </Box>
              {integration && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={integration.isActive}
                      onChange={(e) => handleToggleActive('twilio', e.target.checked)}
                    />
                  }
                  label="Actif"
                />
              )}
            </Box>

            {integration && integration.lastTestStatus && (
              <Alert
                severity={integration.lastTestStatus === 'success' ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                {integration.lastTestStatus === 'success'
                  ? `✅ Testé avec succès le ${new Date(integration.lastTestedAt!).toLocaleString()}`
                  : `❌ Test échoué: ${integration.lastTestError}`}
              </Alert>
            )}

            <Grid2 container spacing={2}>
              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account SID"
                  value={twilioForm.twilioAccountSid || ''}
                  onChange={(e) =>
                    setTwilioForm({ ...twilioForm, twilioAccountSid: e.target.value })
                  }
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxx"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Auth Token"
                  type="password"
                  value={twilioForm.twilioAuthToken || ''}
                  onChange={(e) =>
                    setTwilioForm({ ...twilioForm, twilioAuthToken: e.target.value })
                  }
                  placeholder="your_auth_token"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Numéro de téléphone (SMS)"
                  value={twilioForm.twilioPhoneNumber || ''}
                  onChange={(e) =>
                    setTwilioForm({ ...twilioForm, twilioPhoneNumber: e.target.value })
                  }
                  placeholder="+33612345678"
                  helperText="Format E.164"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Numéro WhatsApp (optionnel)"
                  value={twilioForm.twilioWhatsappNumber || ''}
                  onChange={(e) =>
                    setTwilioForm({ ...twilioForm, twilioWhatsappNumber: e.target.value })
                  }
                  placeholder="whatsapp:+33612345678"
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Label (optionnel)"
                  value={twilioForm.label || ''}
                  onChange={(e) => setTwilioForm({ ...twilioForm, label: e.target.value })}
                />
              </Grid2>

              <Grid2 xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quota mensuel (optionnel)"
                  type="number"
                  value={twilioForm.monthlyQuota || ''}
                  onChange={(e) =>
                    setTwilioForm({ ...twilioForm, monthlyQuota: parseInt(e.target.value) })
                  }
                />
              </Grid2>
            </Grid2>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleSave('twilio', twilioForm)}
                disabled={!twilioForm.twilioAccountSid || !twilioForm.twilioAuthToken || saving}
              >
                {integration ? 'Mettre à jour' : 'Sauvegarder'}
              </Button>

              {integration && integration.hasConfig && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() => handleTest('twilio')}
                    disabled={testing}
                  >
                    Tester la connexion
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => setDeleteDialog('twilio')}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                📚 Guide: Créez un compte sur{' '}
                <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener">
                  twilio.com
                </a>
                , puis allez dans Console pour récupérer Account SID et Auth Token.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderFirebaseForm = () => {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 3 }}>
        <Card>
          <CardContent>
            <Alert severity="warning">
              <Typography variant="body2">
                🚧 Firebase Push Notifications - En cours de développement
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          🔌 Intégrations API
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configurez vos propres clés API pour Email, SMS, et WhatsApp
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          {providers.map((provider, index) => {
            const integration = getIntegration(provider.id);
            return (
              <Tab
                key={provider.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {provider.name}
                    {integration && integration.hasConfig && (
                      <Chip
                        size="small"
                        icon={
                          integration.lastTestStatus === 'success' ? <CheckCircle /> : <Error />
                        }
                        label={integration.isActive ? 'Actif' : 'Inactif'}
                        color={integration.isActive ? 'success' : 'default'}
                      />
                    )}
                  </Box>
                }
              />
            );
          })}
        </Tabs>
      </Box>

      {activeTab === 0 && renderResendForm()}
      {activeTab === 1 && renderSendGridForm()}
      {activeTab === 2 && renderTwilioForm()}
      {activeTab === 3 && renderFirebaseForm()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog !== null} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer cette intégration ?</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteDialog && handleDelete(deleteDialog)}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
