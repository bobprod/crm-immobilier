import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import apiClient from '@/shared/utils/backend-api';
import { CheckCircle2, XCircle, Loader2, ExternalLink, Sparkles } from 'lucide-react';

export default function LLMConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, providersData] = await Promise.all([
        apiClient.get('/llm-config'),
        apiClient.get('/llm-config/providers'),
      ]);
      setConfig(configData.data);
      setProviders(providersData.data);
    } catch (error) {
      console.error('Erreur chargement config LLM:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiClient.put('/llm-config', config);
      alert('Configuration sauvegardée !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const response = await apiClient.post('/llm-config/test');
      setTestResult(response.data);
    } catch (error) {
      console.error('Erreur test:', error);
      setTestResult({ success: false, message: 'Erreur lors du test' });
    } finally {
      setTesting(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === config?.provider);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8" />
          Configuration LLM / IA
        </h1>
        <p className="text-gray-600 mt-2">
          Choisissez le modèle d'Intelligence Artificielle pour l'optimisation SEO automatique
        </p>
      </div>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="providers">Providers disponibles</TabsTrigger>
        </TabsList>

        {/* Configuration actuelle */}
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuration active</CardTitle>
              <CardDescription>
                Configurez votre provider IA et votre clé API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider */}
              <div>
                <Label>Provider IA</Label>
                <Select
                  value={config?.provider || 'anthropic'}
                  onValueChange={(value) => setConfig({ ...config, provider: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Infos provider sélectionné */}
              {selectedProvider && (
                <Alert>
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">{selectedProvider.name}</p>
                      <p className="text-sm">{selectedProvider.description}</p>
                      <p className="text-sm text-gray-600">
                        Tarif : {selectedProvider.pricing}
                      </p>
                      <p className="text-sm">
                        Format clé : <code className="bg-gray-100 px-1">{selectedProvider.keyFormat}</code>
                      </p>
                      <a
                        href={selectedProvider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Obtenir une clé API <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Clé API */}
              <div>
                <Label>Clé API</Label>
                <Input
                  type="password"
                  placeholder={selectedProvider?.keyFormat || 'Votre clé API'}
                  value={config?.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Votre clé est stockée de manière sécurisée et n'est jamais affichée
                </p>
              </div>

              {/* Modèle */}
              <div>
                <Label>Modèle</Label>
                <Select
                  value={config?.model || ''}
                  onValueChange={(value) => setConfig({ ...config, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvider?.models.map((model: string) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder'
                  )}
                </Button>

                <Button variant="outline" onClick={handleTest} disabled={testing}>
                  {testing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    'Tester la configuration'
                  )}
                </Button>
              </div>

              {/* Résultat test */}
              {testResult && (
                <Alert className={testResult.success ? 'border-green-500' : 'border-red-500'}>
                  <AlertDescription className="flex items-center gap-2">
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-green-600">{testResult.message}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">{testResult.message}</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liste providers */}
        <TabsContent value="providers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((provider) => (
              <Card key={provider.id} className={config?.provider === provider.id ? 'border-blue-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {provider.name}
                    {config?.provider === provider.id && (
                      <Badge className="bg-blue-500">Actif</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{provider.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">Modèles disponibles :</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.models.map((model: string) => (
                        <Badge key={model} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-semibold">Tarif :</span> {provider.pricing}
                    </p>
                    <p>
                      <span className="font-semibold">Format clé :</span>{' '}
                      <code className="bg-gray-100 px-1">{provider.keyFormat}</code>
                    </p>
                  </div>

                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Obtenir une clé API <ExternalLink className="h-3 w-3" />
                  </a>

                  {config?.provider !== provider.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfig({ ...config, provider: provider.id })}
                      className="w-full"
                    >
                      Choisir ce provider
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
