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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
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
  TrendingUp,
  Sparkles,
  Target,
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

interface TrackingPixel {
  id: string;
  name: string;
  description: string;
  icon: any;
  platform: string;
  enabled: boolean;
  connected: boolean;
  config: Record<string, any>;
  fields: { key: string; label: string; type: string; placeholder: string; helperText?: string }[];
  features?: string[];
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState('communications');
  const [communicationIntegrations, setCommunicationIntegrations] = useState<Integration[]>([
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

  const [trackingPixels, setTrackingPixels] = useState<TrackingPixel[]>([
    {
      id: 'meta_pixel',
      name: 'Meta Pixel',
      description: 'Facebook & Instagram Pixel + Conversion API',
      icon: Target,
      platform: 'facebook',
      enabled: false,
      connected: false,
      config: { pixelId: '', accessToken: '', testEventCode: '' },
      fields: [
        {
          key: 'pixelId',
          label: 'Pixel ID',
          type: 'text',
          placeholder: '123456789012345',
          helperText: 'Trouvé dans Events Manager',
        },
        {
          key: 'accessToken',
          label: 'Conversion API Access Token',
          type: 'password',
          placeholder: 'EAAxxxxxxxxxxxxxx',
          helperText: 'Pour tracking server-side',
        },
        {
          key: 'testEventCode',
          label: 'Test Event Code (optionnel)',
          type: 'text',
          placeholder: 'TEST12345',
          helperText: 'Pour debugging',
        },
      ],
      features: ['PageView', 'ViewContent', 'Lead', 'Contact', 'CompleteRegistration'],
    },
    {
      id: 'google_gtm',
      name: 'Google Tag Manager',
      description: 'Gestionnaire de tags centralisé',
      icon: TrendingUp,
      platform: 'gtm',
      enabled: false,
      connected: false,
      config: { containerId: '', serverContainerUrl: '' },
      fields: [
        {
          key: 'containerId',
          label: 'Container ID',
          type: 'text',
          placeholder: 'GTM-XXXXXXX',
          helperText: 'Trouvé sur tagmanager.google.com',
        },
        {
          key: 'serverContainerUrl',
          label: 'Server Container URL (optionnel)',
          type: 'url',
          placeholder: 'https://gtm-server.votredomaine.com',
          helperText: 'Pour server-side tracking',
        },
      ],
      features: ['Gestion centralisée', 'Preview Mode', 'Versioning'],
    },
    {
      id: 'google_analytics',
      name: 'Google Analytics 4',
      description: 'Analytics et tracking utilisateurs',
      icon: TrendingUp,
      platform: 'ga4',
      enabled: false,
      connected: false,
      config: { measurementId: '', apiSecret: '' },
      fields: [
        {
          key: 'measurementId',
          label: 'Measurement ID',
          type: 'text',
          placeholder: 'G-XXXXXXXXXX',
          helperText: 'Trouvé dans Analytics > Admin > Data Streams',
        },
        {
          key: 'apiSecret',
          label: 'API Secret (optionnel)',
          type: 'password',
          placeholder: 'xxxxxxxxxxxxxxxxxxxx',
          helperText: 'Pour Measurement Protocol server-side',
        },
      ],
      features: ['Enhanced Measurement', 'User-ID Tracking', 'Event Tracking'],
    },
    {
      id: 'google_ads',
      name: 'Google Ads',
      description: 'Suivi des conversions Google Ads',
      icon: TrendingUp,
      platform: 'google_ads',
      enabled: false,
      connected: false,
      config: { conversionId: '', leadLabel: '', purchaseLabel: '' },
      fields: [
        {
          key: 'conversionId',
          label: 'Conversion ID',
          type: 'text',
          placeholder: 'AW-XXXXXXXXXX',
        },
        {
          key: 'leadLabel',
          label: 'Lead Conversion Label',
          type: 'text',
          placeholder: 'xxxxxxxxxxxx',
        },
        {
          key: 'purchaseLabel',
          label: 'Purchase Conversion Label',
          type: 'text',
          placeholder: 'xxxxxxxxxxxx',
        },
      ],
      features: ['Conversion Tracking', 'Enhanced Conversions', 'Remarketing'],
    },
    {
      id: 'tiktok_pixel',
      name: 'TikTok Pixel',
      description: 'TikTok Pixel + Events API',
      icon: Target,
      platform: 'tiktok',
      enabled: false,
      connected: false,
      config: { pixelId: '', accessToken: '' },
      fields: [
        {
          key: 'pixelId',
          label: 'Pixel ID',
          type: 'text',
          placeholder: 'XXXXXXXXXXXXX',
        },
        {
          key: 'accessToken',
          label: 'Access Token (optionnel)',
          type: 'password',
          placeholder: 'xxxxxxxxxxxxxxxxxxxx',
          helperText: 'Pour Events API server-side',
        },
      ],
      features: ['SubmitForm', 'ViewContent', 'CompleteRegistration'],
    },
    {
      id: 'linkedin_insight',
      name: 'LinkedIn Insight Tag',
      description: 'LinkedIn tracking et conversions',
      icon: Target,
      platform: 'linkedin',
      enabled: false,
      connected: false,
      config: { partnerId: '', conversionIdLead: '' },
      fields: [
        {
          key: 'partnerId',
          label: 'Partner ID',
          type: 'text',
          placeholder: '123456',
        },
        {
          key: 'conversionIdLead',
          label: 'Conversion ID (Lead)',
          type: 'text',
          placeholder: '123456',
        },
      ],
      features: ['Lead Generation', 'Website Demographics'],
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
        setCommunicationIntegrations((prev) =>
          prev.map((int) => ({
            ...int,
            ...(response.data[int.id] || {}),
            config: { ...int.config, ...(response.data[int.id]?.config || {}) },
          }))
        );
      }

      // Load tracking pixels config
      try {
        const trackingResponse = await apiClient.get('/marketing-tracking/config');
        if (trackingResponse.data) {
          // Update tracking pixels with saved config
          setTrackingPixels((prev) =>
            prev.map((pixel) => {
              const savedConfig = trackingResponse.data.find((c: any) => c.platform === pixel.platform);
              if (savedConfig) {
                return {
                  ...pixel,
                  enabled: savedConfig.isActive,
                  connected: true,
                  config: { ...pixel.config, ...savedConfig.config },
                };
              }
              return pixel;
            })
          );
        }
      } catch (error) {
        console.log('No tracking config yet');
      }
    } catch (error) {
      console.error('Erreur chargement config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCommunications = async () => {
    try {
      setSaving(true);
      const configData = communicationIntegrations.reduce(
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

  const handleSaveTracking = async () => {
    try {
      setSaving(true);

      // Save each enabled pixel configuration
      for (const pixel of trackingPixels) {
        if (pixel.enabled && Object.values(pixel.config).some(v => v)) {
          try {
            await apiClient.post('/marketing-tracking/config', {
              platform: pixel.platform,
              config: pixel.config,
              isActive: pixel.enabled,
              useServerSide: true,
            });
          } catch (error) {
            console.error(`Erreur sauvegarde ${pixel.name}:`, error);
          }
        }
      }

      alert('Configuration tracking sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde tracking:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (integrationId: string, isTracking = false) => {
    try {
      setTestingId(integrationId);
      setTestResults((prev) => ({ ...prev, [integrationId]: undefined as any }));

      const endpoint = isTracking
        ? `/marketing-tracking/config/${integrationId.replace('_pixel', '').replace('_gtm', '').replace('_analytics', '').replace('_ads', '').replace('_insight', '')}/test`
        : `/settings/integrations/test`;

      const response = await apiClient.post(endpoint, {
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

  const updateCommunicationIntegration = (id: string, field: string, value: any) => {
    setCommunicationIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, [field]: value } : int))
    );
  };

  const updateCommunicationConfig = (id: string, key: string, value: string) => {
    setCommunicationIntegrations((prev) =>
      prev.map((int) => (int.id === id ? { ...int, config: { ...int.config, [key]: value } } : int))
    );
  };

  const updateTrackingPixel = (id: string, field: string, value: any) => {
    setTrackingPixels((prev) =>
      prev.map((pixel) => (pixel.id === id ? { ...pixel, [field]: value } : pixel))
    );
  };

  const updateTrackingConfig = (id: string, key: string, value: string) => {
    setTrackingPixels((prev) =>
      prev.map((pixel) => (pixel.id === id ? { ...pixel, config: { ...pixel.config, [key]: value } } : pixel))
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="communications">
            <Mail className="h-4 w-4 mr-2" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="tracking">
            <TrendingUp className="h-4 w-4 mr-2" />
            Marketing & Tracking
            <Badge className="ml-2 bg-green-500 text-white">Nouveau</Badge>
          </TabsTrigger>
          <TabsTrigger value="business" disabled>
            <Database className="h-4 w-4 mr-2" />
            Business
            <Badge variant="outline" className="ml-2">Bientôt</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Communications */}
        <TabsContent value="communications">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {communicationIntegrations.map((integration) => {
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
                            updateCommunicationIntegration(integration.id, 'enabled', checked)
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
                          onChange={(e) => updateCommunicationConfig(integration.id, field.key, e.target.value)}
                        />
                      </div>
                    ))}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(integration.id, false)}
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
            <Button onClick={handleSaveCommunications} disabled={saving} size="lg">
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
        </TabsContent>

        {/* Tab 2: Marketing & Tracking */}
        <TabsContent value="tracking">
          {/* AI Assistant Card */}
          <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">🧙‍♂️ Assistant IA de Configuration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Copiez-collez simplement vos IDs de pixels, l'IA configure automatiquement tous les événements de tracking
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Démarrer la configuration IA
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Pixels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {trackingPixels.map((pixel) => {
              const testResult = testResults[pixel.id];
              const Icon = pixel.icon;

              return (
                <Card key={pixel.id} className={pixel.enabled ? 'border-green-300' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {pixel.name}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {pixel.connected && <Badge className="bg-green-500">Actif</Badge>}
                        <Switch
                          checked={pixel.enabled}
                          onCheckedChange={(checked) =>
                            updateTrackingPixel(pixel.id, 'enabled', checked)
                          }
                        />
                      </div>
                    </div>
                    <CardDescription>{pixel.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Config Fields */}
                    {pixel.fields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label}</Label>
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={pixel.config[field.key] || ''}
                          onChange={(e) => updateTrackingConfig(pixel.id, field.key, e.target.value)}
                        />
                        {field.helperText && (
                          <p className="text-xs text-gray-500">{field.helperText}</p>
                        )}
                      </div>
                    ))}

                    {/* Features */}
                    {pixel.features && (
                      <div className="pt-2">
                        <Label className="text-xs text-gray-600">Événements trackés :</Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {pixel.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(pixel.id, true)}
                        disabled={testingId === pixel.id}
                      >
                        {testingId === pixel.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Test...
                          </>
                        ) : (
                          'Tester la connexion'
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Voir le code
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

          {/* Server-Side Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🔧 Configuration Server-Side</CardTitle>
              <CardDescription>
                Optimisez votre tracking avec un service server-side (contourne les ad-blockers)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Service Server-Side</Label>
                <select className="w-full border rounded-md p-2">
                  <option value="none">Aucun (Backend uniquement)</option>
                  <option value="stape">Stape.io (Recommandé - Simple)</option>
                  <option value="gtm_server">GTM Server-Side (Google Cloud)</option>
                  <option value="segment">Segment CDP</option>
                  <option value="custom">Custom Endpoint</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Container URL</Label>
                <Input
                  type="url"
                  placeholder="https://tag.votredomaine.com"
                />
                <p className="text-xs text-gray-500">
                  URL de votre container server-side (Stape ou GTM Server)
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Guide Stape.io
                </Button>
                <Button variant="outline" size="sm">
                  Tester la connexion
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveTracking} disabled={saving} size="lg">
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
        </TabsContent>

        {/* Tab 3: Business (Coming Soon) */}
        <TabsContent value="business">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bientôt disponible</h3>
              <p className="text-gray-600">
                Intégrations portails immobiliers, signature électronique, paiements, etc.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
