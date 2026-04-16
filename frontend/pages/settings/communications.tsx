import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { apiClient } from '@/shared/utils/backend-api';
import {
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Server,
  Send,
  Wifi,
  WifiOff,
} from 'lucide-react';

type EmailProvider = 'smtp' | 'resend' | 'sendgrid';

interface CommSettings {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  whatsappApiKey: string;
  whatsappPhoneNumberId: string;
  emailProvider: EmailProvider;
  resendApiKey: string;
  sendgridApiKey: string;
  smtpConfigured: boolean;
  twilioConfigured: boolean;
}

const DEFAULT_SETTINGS: CommSettings = {
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: '',
  smtpPassword: '',
  smtpFrom: '',
  twilioAccountSid: '',
  twilioAuthToken: '',
  twilioPhoneNumber: '',
  whatsappApiKey: '',
  whatsappPhoneNumberId: '',
  emailProvider: 'smtp',
  resendApiKey: '',
  sendgridApiKey: '',
  smtpConfigured: false,
  twilioConfigured: false,
};

export default function CommunicationsSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<CommSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/communications/settings');
      setSettings({ ...DEFAULT_SETTINGS, ...response.data });
    } catch (err: any) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await apiClient.put('/communications/settings', settings);
      setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès' });
      await loadSettings(); // Recharger pour masquer les mots de passe
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Erreur lors de la sauvegarde',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const response = await apiClient.post('/communications/smtp/test-connection');
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Connexion SMTP réussie !' });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Échec de la connexion SMTP' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erreur lors du test SMTP' });
    } finally {
      setTesting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Entrez une adresse email de destination' });
      return;
    }
    setSendingTest(true);
    setMessage(null);
    try {
      const response = await apiClient.post('/communications/smtp/test-email', { to: testEmail });
      if (response.data.success) {
        setMessage({ type: 'success', text: `Email de test envoyé à ${testEmail}` });
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Échec envoi email de test' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: "Erreur lors de l'envoi du test" });
    } finally {
      setSendingTest(false);
    }
  };

  const set = (field: keyof CommSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setMessage(null);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/settings')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="h-6 w-6 text-blue-500" />
              Paramètres Communications
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              SMTP, SMS, WhatsApp — configuration des canaux d'envoi
            </p>
          </div>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
              settings.smtpConfigured
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            {settings.smtpConfigured ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            Email {settings.smtpConfigured ? 'configuré' : 'non configuré'}
          </div>
          <div
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm font-medium ${
              settings.twilioConfigured
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            {settings.twilioConfigured ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            SMS/WhatsApp {settings.twilioConfigured ? 'configuré' : 'non configuré'}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Email Provider Selection */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              Fournisseur d'email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(['smtp', 'resend', 'sendgrid'] as EmailProvider[]).map((provider) => (
                <button
                  key={provider}
                  onClick={() => set('emailProvider', provider)}
                  className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    settings.emailProvider === provider
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {provider === 'smtp'
                    ? 'SMTP personnalisé'
                    : provider === 'resend'
                      ? 'Resend'
                      : 'SendGrid'}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SMTP Configuration */}
        {settings.emailProvider === 'smtp' && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-500" />
                Configuration SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="smtpHost">Hôte SMTP</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    value={settings.smtpHost}
                    onChange={(e) => set('smtpHost', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtpPort">Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    value={settings.smtpPort}
                    onChange={(e) => set('smtpPort', parseInt(e.target.value) || 587)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={settings.smtpSecure}
                  onChange={(e) => set('smtpSecure', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-500"
                />
                <Label htmlFor="smtpSecure" className="cursor-pointer">
                  Connexion sécurisée SSL/TLS (port 465)
                </Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpUser">Utilisateur / Email</Label>
                <Input
                  id="smtpUser"
                  placeholder="votre@email.com"
                  value={settings.smtpUser}
                  onChange={(e) => set('smtpUser', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpPassword">Mot de passe / App Password</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  placeholder="••••••••"
                  value={settings.smtpPassword}
                  onChange={(e) => set('smtpPassword', e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Pour Gmail : utilisez un <em>App Password</em> depuis la sécurité Google.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpFrom">Adresse d'expéditeur</Label>
                <Input
                  id="smtpFrom"
                  placeholder="Immo Agence <noreply@monagence.com>"
                  value={settings.smtpFrom}
                  onChange={(e) => set('smtpFrom', e.target.value)}
                />
              </div>

              {/* Test SMTP */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <p className="text-sm font-medium text-slate-700">Tester la connexion</p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestSmtp}
                    disabled={testing}
                    className="gap-2"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wifi className="h-4 w-4" />
                    )}
                    Tester SMTP
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@test.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    className="gap-2 shrink-0"
                  >
                    {sendingTest ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Envoyer test
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resend Configuration */}
        {settings.emailProvider === 'resend' && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Resend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="resendApiKey">Clé API Resend</Label>
                <Input
                  id="resendApiKey"
                  type="password"
                  placeholder="re_••••••••"
                  value={settings.resendApiKey}
                  onChange={(e) => set('resendApiKey', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpFromResend">Adresse d'expéditeur</Label>
                <Input
                  id="smtpFromResend"
                  placeholder="Immo Agence <noreply@monagence.com>"
                  value={settings.smtpFrom}
                  onChange={(e) => set('smtpFrom', e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                Créez votre clé sur <strong>resend.com/api-keys</strong>. L'adresse d'expéditeur
                doit appartenir à un domaine vérifié.
              </p>
            </CardContent>
          </Card>
        )}

        {/* SendGrid Configuration */}
        {settings.emailProvider === 'sendgrid' && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                SendGrid
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sendgridApiKey">Clé API SendGrid</Label>
                <Input
                  id="sendgridApiKey"
                  type="password"
                  placeholder="SG.••••••••"
                  value={settings.sendgridApiKey}
                  onChange={(e) => set('sendgridApiKey', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="smtpFromSendgrid">Adresse d'expéditeur</Label>
                <Input
                  id="smtpFromSendgrid"
                  placeholder="Immo Agence <noreply@monagence.com>"
                  value={settings.smtpFrom}
                  onChange={(e) => set('smtpFrom', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* SMS Twilio */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              SMS — Twilio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="twilioAccountSid">Account SID</Label>
              <Input
                id="twilioAccountSid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={settings.twilioAccountSid}
                onChange={(e) => set('twilioAccountSid', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twilioAuthToken">Auth Token</Label>
              <Input
                id="twilioAuthToken"
                type="password"
                placeholder="••••••••"
                value={settings.twilioAuthToken}
                onChange={(e) => set('twilioAuthToken', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twilioPhoneNumber">Numéro Twilio</Label>
              <Input
                id="twilioPhoneNumber"
                placeholder="+33600000000"
                value={settings.twilioPhoneNumber}
                onChange={(e) => set('twilioPhoneNumber', e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Trouvez ces informations sur <strong>console.twilio.com</strong>.
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp Business */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-500" />
              WhatsApp Business API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="whatsappApiKey">Token d'accès permanent</Label>
              <Input
                id="whatsappApiKey"
                type="password"
                placeholder="••••••••"
                value={settings.whatsappApiKey}
                onChange={(e) => set('whatsappApiKey', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="whatsappPhoneNumberId">Phone Number ID</Label>
              <Input
                id="whatsappPhoneNumberId"
                placeholder="1234567890"
                value={settings.whatsappPhoneNumberId}
                onChange={(e) => set('whatsappPhoneNumberId', e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Depuis le <strong>Meta Business Manager</strong> → WhatsApp → Configuration.
            </p>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end gap-3 pb-8">
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Sauvegarder
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
