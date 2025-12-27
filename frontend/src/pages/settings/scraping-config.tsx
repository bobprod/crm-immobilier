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
  Search,
  Globe,
  Database,
  Key,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface ApiConfig {
  enabled: boolean;
  apiKey: string;
  endpoint?: string;
  rateLimit?: number;
}

interface ScrapingConfig {
  pica: ApiConfig;
  serpApi: ApiConfig;
  scrapingBee: ApiConfig;
  browserless: ApiConfig;
}

export default function ScrapingConfigPage() {
  const [config, setConfig] = useState<ScrapingConfig>({
    pica: { enabled: false, apiKey: '', rateLimit: 100 },
    serpApi: { enabled: false, apiKey: '', rateLimit: 100 },
    scrapingBee: { enabled: false, apiKey: '', rateLimit: 50 },
    browserless: { enabled: false, apiKey: '', endpoint: 'https://chrome.browserless.io' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settings/scraping');
      if (response.data) {
        setConfig((prev) => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Erreur chargement config scraping:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.post('/settings/scraping/bulk', { settings: config });
      alert('Configuration sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (provider: string) => {
    try {
      setTestingProvider(provider);
      setTestResults((prev) => ({ ...prev, [provider]: undefined as any }));
      const response = await apiClient.post(`/settings/scraping/test`, { provider });
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: response.data.success, message: response.data.message },
      }));
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          success: false,
          message: error.response?.data?.message || 'Erreur de connexion',
        },
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const updateConfig = (provider: keyof ScrapingConfig, field: keyof ApiConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  const providers = [
    {
      id: 'pica',
      name: 'Pica API',
      description: 'API de scraping pour les annonces immobilières',
      website: 'https://pica.dev',
      keyFormat: 'pica_xxxxxxxxxxxx',
      features: ['Scraping annonces', 'Extraction données', 'Parsing HTML'],
    },
    {
      id: 'serpApi',
      name: 'SerpAPI',
      description: 'API pour les résultats de recherche Google',
      website: 'https://serpapi.com',
      keyFormat: 'xxxxxxxxxxxxxxxxxxxxx',
      features: ['Recherche Google', 'Google Maps', 'Google Images'],
    },
    {
      id: 'scrapingBee',
      name: 'ScrapingBee',
      description: 'API de scraping web avec proxy rotatif',
      website: 'https://scrapingbee.com',
      keyFormat: 'xxxxxxxxxxxxxxxxxxxx',
      features: ['Proxy rotatif', 'JavaScript rendering', 'Anti-bot bypass'],
    },
    {
      id: 'browserless',
      name: 'Browserless',
      description: 'Chrome headless dans le cloud',
      website: 'https://browserless.io',
      keyFormat: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      features: ['Chrome headless', 'Screenshots', 'PDF generation'],
    },
  ];

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
          <Search className="h-8 w-8" />
          Configuration APIs de Scraping
        </h1>
        <p className="text-gray-600 mt-2">
          Configurez vos APIs pour le scraping et la recherche de données immobilières
        </p>
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {providers.map((provider) => {
          const providerConfig = config[provider.id as keyof ScrapingConfig];
          const testResult = testResults[provider.id];

          return (
            <Card key={provider.id} className={providerConfig?.enabled ? 'border-green-300' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {provider.name}
                  </CardTitle>
                  <Switch
                    checked={providerConfig?.enabled || false}
                    onCheckedChange={(checked) =>
                      updateConfig(provider.id as keyof ScrapingConfig, 'enabled', checked)
                    }
                  />
                </div>
                <CardDescription>{provider.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {provider.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Clé API
                  </Label>
                  <Input
                    type="password"
                    placeholder={provider.keyFormat}
                    value={providerConfig?.apiKey || ''}
                    onChange={(e) =>
                      updateConfig(provider.id as keyof ScrapingConfig, 'apiKey', e.target.value)
                    }
                  />
                </div>

                {/* Custom endpoint for browserless */}
                {provider.id === 'browserless' && (
                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Input
                      placeholder="https://chrome.browserless.io"
                      value={providerConfig?.endpoint || ''}
                      onChange={(e) =>
                        updateConfig(
                          provider.id as keyof ScrapingConfig,
                          'endpoint',
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}

                {/* Rate limit */}
                <div className="space-y-2">
                  <Label>Limite requêtes/minute</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={providerConfig?.rateLimit || ''}
                    onChange={(e) =>
                      updateConfig(
                        provider.id as keyof ScrapingConfig,
                        'rateLimit',
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(provider.id)}
                    disabled={testingProvider === provider.id || !providerConfig?.apiKey}
                  >
                    {testingProvider === provider.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Test...
                      </>
                    ) : (
                      'Tester'
                    )}
                  </Button>
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                  >
                    Obtenir une clé <ExternalLink className="h-3 w-3" />
                  </a>
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
