import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import apiClient from '@/shared/utils/backend-api';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Zap,
  Globe,
  Mail,
  Calendar,
  MessageSquare,
  ArrowLeft,
  Database,
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  connected: boolean;
  config: Record<string, string>;
  fields: { key: string; label: string; type: string; placeholder: string }[];
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'Publiez automatiquement vos biens sur votre site WordPress',
      icon: Globe,
      enabled: false,
      connected: false,
      config: { siteUrl: '', username: '', applicationPassword: '' },
      fields: [
        { key: 'siteUrl', label: 'URL du site', type: 'url', placeholder: 'https://votresite.com' },
        { key: 'username', label: "Nom d'utilisateur", type: 'text', placeholder: 'admin' },
        {
          key: 'applicationPassword',
          label: 'Mot de passe application',
          type: 'password',
          placeholder: 'xxxx xxxx xxxx xxxx',
        },
      ],
    },
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Synchronisez vos rendez-vous avec Google Calendar',
      icon: Calendar,
      enabled: false,
      connected: false,
      config: { clientId: '', clientSecret: '' },
      fields: [
        {
          key: 'clientId',
          label: 'Client ID',
          type: 'text',
          placeholder: 'xxxxx.apps.googleusercontent.com',
        },
        {
          key: 'clientSecret',
          label: 'Client Secret',
          type: 'password',
          placeholder: 'GOCSPX-xxxxxxxx',
        },
      ],
    },
    {
      id: 'smtp',
      name: 'Email SMTP',
      description: "Configuration SMTP pour l'envoi d'emails",
      icon: Mail,
      enabled: false,
      connected: false,
      config: { host: '', port: '587', username: '', password: '', from: '' },
      fields: [
        { key: 'host', label: 'Serveur SMTP', type: 'text', placeholder: 'smtp.gmail.com' },
        { key: 'port', label: 'Port', type: 'text', placeholder: '587' },
        {
          key: 'username',
          label: "Nom d'utilisateur",
          type: 'text',
          placeholder: 'email@exemple.com',
        },
        { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
        {
          key: 'from',
          label: 'Email expéditeur',
          type: 'email',
          placeholder: 'noreply@votreagence.com',
        },
      ],
    },
    {
      id: 'twilio',
      name: 'Twilio SMS',
      description: 'Envoyez des SMS à vos prospects',
      icon: MessageSquare,
      enabled: false,
      connected: false,
      config: { accountSid: '', authToken: '', phoneNumber: '' },
      fields: [
        {
          key: 'accountSid',
          label: 'Account SID',
          type: 'text',
          placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxx',
        },
        {
          key: 'authToken',
          label: 'Auth Token',
          type: 'password',
          placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        },
        { key: 'phoneNumber', label: 'Numéro Twilio', type: 'text', placeholder: '+33xxxxxxxxx' },
      ],
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/integrations');
      if (response.data) {
        setIntegrations((prev) =>
          prev.map((int) => ({
            ...int,
            ...(response.data[int.id] || {}),
            config: { ...int.config, ...(response.data[int.id]?.config || {}) },
          }))
        );
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const configData = integrations.reduce(
        (acc, int) => ({
          ...acc,
          [int.id]: { enabled: int.enabled, config: int.config },
        }),
        {}
      );
      await apiClient.post('/settings/integrations/bulk', { settings: configData });
      alert('Configuration sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (integrationId: string) => {
    try {
      setTestingId(integrationId);
      setTestResults((prev) => ({ ...prev, [integrationId]: undefined as any }));
      const response = await apiClient.post(`/settings/integrations/test`, {
        integration: integrationId,
      });
      setTestResults((prev) => ({
        ...prev,
        [integrationId]: { success: response.data.success, message: response.data.message },
      }));
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        [integrationId]: {
          success: false,
          message: error.response?.data?.message || 'Erreur de connexion',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const updateIntegration = (id: string, field: string, value: any) => {
    setIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, [field]: value } : int))
    );
  };

  const updateConfig = (id: string, key: string, value: string) => {
    setIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, config: { ...int.config, [key]: value } } : int))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/settings"
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paramètres
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8" />
          Intégrations
        </h1>
        <p className="text-gray-600 mt-2">
          Connectez vos services externes pour automatiser votre workflow
        </p>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {integrations.map((integration) => {
          const testResult = testResults[integration.id];
          const Icon = integration.icon;

          return (
            <Card key={integration.id} className={integration.enabled ? 'border-green-300' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {integration.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {integration.connected && <Badge className="bg-green-500">Connecté</Badge>}
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) =>
                        updateIntegration(integration.id, 'enabled', checked)
                      }
                    />
                  </div>
                </div>
                <CardDescription>{integration.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Config Fields */}
                {integration.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={integration.config[field.key] || ''}
                      onChange={(e) => updateConfig(integration.id, field.key, e.target.value)}
                    />
                  </div>
                ))}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(integration.id)}
                    disabled={testingId === integration.id}
                  >
                    {testingId === integration.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Test...
                      </>
                    ) : (
                      'Tester la connexion'
                    )}
                  </Button>
                </div>

                {/* Test Result */}
                {testResult && (
                  <Alert
                    className={
                      testResult.success
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                    }
                  >
                    <AlertDescription className="flex items-center gap-2">
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-700">{testResult.message}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-700">{testResult.message}</span>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Sauvegarder la configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
