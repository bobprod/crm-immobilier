import { useState, useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
  Key,
  Brain,
  Search,
  Save,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Info,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';

interface ApiKeys {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
  mistralApiKey?: string;
  grokApiKey?: string;
  cohereApiKey?: string;
  togetherAiApiKey?: string;
  replicateApiKey?: string;
  perplexityApiKey?: string;
  huggingfaceApiKey?: string;
  alephAlphaApiKey?: string;
  nlpCloudApiKey?: string;
  serpApiKey?: string;
  firecrawlApiKey?: string;
  picaApiKey?: string;
  jinaReaderApiKey?: string;
  scrapingBeeApiKey?: string;
  browserlessApiKey?: string;
  rapidApiKey?: string;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ProviderModels {
  gemini: string[];
  openai: string[];
  deepseek: string[];
  anthropic: string[];
}

// Modèles par provider
const PROVIDER_MODELS: ProviderModels = {
  gemini: [
    'gemini-2.0-flash',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-pro',
    'gemini-pro-vision',
  ],
  openai: [
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-16k',
  ],
  deepseek: [
    'deepseek-chat',
    'deepseek-coder',
  ],
  anthropic: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
};

// Composant Toast
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[toast.type];

  const textColor = {
    success: 'text-green-800',
    error: 'text-red-800',
    info: 'text-blue-800',
  }[toast.type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[toast.type];

  return (
    <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg border ${bgColor} flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 z-50`}>
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${textColor}`} />
      <p className={`flex-1 text-sm font-medium ${textColor}`}>{toast.message}</p>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${textColor} hover:opacity-70`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function AIApiKeysPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [llmKeys, setLlmKeys] = useState<ApiKeys>({});
  const [scrapingKeys, setScrapingKeys] = useState<ApiKeys>({});

  // État pour la sélection du provider et modèle
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [defaultProvider, setDefaultProvider] = useState<string>('openai');

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, message, type };
    setToasts(prev => [...prev, toast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addToast('Authentification requise', 'error');
        setLoadingKeys(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ai-billing/api-keys/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        setLlmKeys({
          anthropicApiKey: data.anthropicApiKey || '',
          openaiApiKey: data.openaiApiKey || '',
          geminiApiKey: data.geminiApiKey || '',
          deepseekApiKey: data.deepseekApiKey || '',
          openrouterApiKey: data.openrouterApiKey || '',
          mistralApiKey: data.mistralApiKey || '',
          grokApiKey: data.grokApiKey || '',
          cohereApiKey: data.cohereApiKey || '',
          togetherAiApiKey: data.togetherAiApiKey || '',
          replicateApiKey: data.replicateApiKey || '',
          perplexityApiKey: data.perplexityApiKey || '',
          huggingfaceApiKey: data.huggingfaceApiKey || '',
          alephAlphaApiKey: data.alephAlphaApiKey || '',
          nlpCloudApiKey: data.nlpCloudApiKey || '',
        });

        setScrapingKeys({
          serpApiKey: data.serpApiKey || '',
          firecrawlApiKey: data.firecrawlApiKey || '',
          picaApiKey: data.picaApiKey || '',
          jinaReaderApiKey: data.jinaReaderApiKey || '',
          scrapingBeeApiKey: data.scrapingBeeApiKey || '',
          browserlessApiKey: data.browserlessApiKey || '',
          rapidApiKey: data.rapidApiKey || '',
        });

        // Charger le provider et modèle sauvegardés
        if (data.defaultProvider) {
          setDefaultProvider(data.defaultProvider);
          setSelectedProvider(data.defaultProvider);
        }
        if (data.defaultModel) {
          setSelectedModel(data.defaultModel);
        } else if (data.defaultProvider) {
          const models = PROVIDER_MODELS[data.defaultProvider as keyof ProviderModels] || [];
          if (models.length > 0) {
            setSelectedModel(models[0]);
          }
        }
      } else if (response.status === 401) {
        addToast('Session expirée, veuillez vous reconnecter', 'error');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      addToast('Erreur lors du chargement des clés API', 'error');
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleSave = async (category: 'llm' | 'scraping') => {
    console.log('🔥 handleSave called with category:', category);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addToast('Authentification requise. Veuillez vous connecter.', 'error');
        setLoading(false);
        return;
      }

      const keysToSave = category === 'llm' ? llmKeys : scrapingKeys;

      // Filtrer les valeurs vides
      const filteredKeys = Object.fromEntries(
        Object.entries(keysToSave).filter(([_, value]) => value && value !== '')
      );

      // Vérifier qu'au moins une clé est remplie
      if (Object.keys(filteredKeys).length === 0) {
        addToast('Veuillez entrer au moins une clé API', 'error');
        setLoading(false);
        return;
      }

      // Ajouter provider et modèle si on sauvegarde les clés LLM
      const dataToSend = category === 'llm'
        ? {
          ...filteredKeys,
          defaultProvider: selectedProvider,
          defaultModel: selectedModel,
        }
        : filteredKeys;

      console.log('��� Sending data:', dataToSend);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/ai-billing/api-keys/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Save response:', responseData);

        if (category === 'llm') {
          addToast(
            `✅ Clés LLM sauvegardées! Provider: ${selectedProvider.toUpperCase()}, Modèle: ${selectedModel}`,
            'success'
          );
        } else {
          addToast('✅ Clés Scraping sauvegardées avec succès!', 'success');
        }

        // Recharger les clés pour confirmer
        setTimeout(() => loadApiKeys(), 500);
      } else if (response.status === 401) {
        addToast('Session expirée', 'error');
      } else {
        const errorData = await response.json().catch(() => ({}));
        addToast(
          `❌ Erreur: ${errorData.message || 'Erreur lors de la sauvegarde'}`,
          'error'
        );
      }
    } catch (error) {
      console.error('Save error:', error);
      addToast(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const renderKeyInput = (
    label: string,
    keyName: keyof ApiKeys,
    placeholder: string,
    value: string | undefined,
    onChange: (value: string) => void,
    description?: string
  ) => (
    <div key={keyName} className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={keyName}>{label}</Label>
        {value && value !== '' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => toggleShowKey(keyName)}
          >
            {showKeys[keyName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        )}
      </div>
      <Input
        id={keyName}
        type={showKeys[keyName] ? 'text' : 'password'}
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm"
        data-testid={`input-${keyName}`}
      />
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  );

  if (loadingKeys) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  const availableModels = PROVIDER_MODELS[selectedProvider as keyof ProviderModels] || [];

  return (
    <MainLayout
      title="Clés API & Configuration LLM"
      breadcrumbs={[
        { label: 'Paramètres', href: '/settings' },
        { label: 'Clés API' },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>BYOK (Bring Your Own Key)</strong> : Vos clés API personnelles sont prioritaires. Les champs optionnels permettent de configurer plusieurs providers.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="llm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="llm" className="flex items-center gap-2" data-testid="tab-llm">
              <Brain className="h-4 w-4" />
              LLM / IA
            </TabsTrigger>
            <TabsTrigger value="scraping" className="flex items-center gap-2" data-testid="tab-scraping">
              <Search className="h-4 w-4" />
              Scraping & Data
            </TabsTrigger>
          </TabsList>

          {/* LLM Tab */}
          <TabsContent value="llm">
            {/* BOUTON DE TEST DANS LE TAB */}
            <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500">
              <p className="mb-2 font-bold">🧪 Zone de Test - Si ce bouton ne fonctionne pas, le problème vient des Tabs</p>
              <button
                type="button"
                onClick={() => alert('✅ Bouton dans TabsContent fonctionne!')}
                className="px-4 py-2 bg-yellow-500 text-black rounded font-bold"
              >
                TEST BOUTON DANS TAB
              </button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Configuration LLM & Providers
                </CardTitle>
                <CardDescription>
                  Configurez vos clés API et sélectionnez votre modèle par défaut (optionnel)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* BOUTON DE TEST DANS LE CARD */}
                <div className="p-4 bg-red-100 border-2 border-red-500">
                  <p className="mb-2 font-bold">🧪 Test dans Card - Si ce bouton ne fonctionne pas, le problème vient du Card</p>
                  <button
                    type="button"
                    onClick={() => alert('✅ Bouton dans Card fonctionne!')}
                    className="px-4 py-2 bg-red-500 text-white rounded font-bold"
                  >
                    TEST BOUTON DANS CARD
                  </button>
                </div>

                {/* Provider & Model Selection */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="provider">Sélectionner un Provider LLM</Label>
                      <select
                        id="provider"
                        value={selectedProvider}
                        onChange={(e) => {
                          setSelectedProvider(e.target.value);
                          setDefaultProvider(e.target.value);
                          // Définir le premier modèle du provider sélectionné
                          const models = PROVIDER_MODELS[e.target.value as keyof ProviderModels] || [];
                          if (models.length > 0) {
                            setSelectedModel(models[0]);
                          }
                        }}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                        data-testid="select-provider"
                      >
                        <option value="openai">OpenAI (GPT)</option>
                        <option value="gemini">Google Gemini</option>
                        <option value="deepseek">DeepSeek</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="model">Modèle à utiliser</Label>
                      <select
                        id="model"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
                        data-testid="select-model"
                      >
                        <option value="">Sélectionner un modèle</option>
                        {availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedProvider && selectedModel && (
                    <div className="p-3 bg-white rounded border border-purple-300">
                      <p className="text-sm text-purple-900" data-testid="selection-display">
                        <strong>Configuration sélectionnée:</strong> {selectedProvider.toUpperCase()} - <code className="font-mono text-purple-700">{selectedModel}</code>
                      </p>
                    </div>
                  )}
                </div>

                {/* API Keys Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900">Clés API (tous les champs optionnels)</h3>

                  {renderKeyInput(
                    'OpenAI (GPT)',
                    'openaiApiKey',
                    'sk-...',
                    llmKeys.openaiApiKey,
                    (val) => setLlmKeys({ ...llmKeys, openaiApiKey: val }),
                    'Pour GPT-4, GPT-3.5-turbo, etc.'
                  )}

                  {renderKeyInput(
                    'Google Gemini',
                    'geminiApiKey',
                    'AIza...',
                    llmKeys.geminiApiKey,
                    (val) => setLlmKeys({ ...llmKeys, geminiApiKey: val }),
                    'Pour Gemini Pro et Gemini Ultra'
                  )}

                  {renderKeyInput(
                    'DeepSeek',
                    'deepseekApiKey',
                    'sk-...',
                    llmKeys.deepseekApiKey,
                    (val) => setLlmKeys({ ...llmKeys, deepseekApiKey: val }),
                    'Pour DeepSeek Chat et Coder'
                  )}

                  {renderKeyInput(
                    'Anthropic (Claude)',
                    'anthropicApiKey',
                    'sk-ant-...',
                    llmKeys.anthropicApiKey,
                    (val) => setLlmKeys({ ...llmKeys, anthropicApiKey: val }),
                    'Pour utiliser Claude 3 (Sonnet, Opus, Haiku)'
                  )}

                  {renderKeyInput(
                    'OpenRouter',
                    'openrouterApiKey',
                    'sk-or-...',
                    llmKeys.openrouterApiKey,
                    (val) => setLlmKeys({ ...llmKeys, openrouterApiKey: val }),
                    'Accès à plusieurs modèles via une seule API'
                  )}

                  {renderKeyInput(
                    'Mistral AI',
                    'mistralApiKey',
                    'mistral-...',
                    llmKeys.mistralApiKey,
                    (val) => setLlmKeys({ ...llmKeys, mistralApiKey: val }),
                    'Pour Mistral Small, Medium, Large'
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleSave('llm')}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-save-llm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les clés LLM
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scraping Tab */}
          <TabsContent value="scraping">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Providers Scraping & Data (optionnel)
                </CardTitle>
                <CardDescription>
                  Configurez vos clés API pour les services de scraping et extraction de données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyInput(
                  'SERP API (Google Search)',
                  'serpApiKey',
                  'serp-...',
                  scrapingKeys.serpApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, serpApiKey: val }),
                  'Pour accéder à Google Search Results'
                )}

                {renderKeyInput(
                  'Firecrawl',
                  'firecrawlApiKey',
                  'fc_...',
                  scrapingKeys.firecrawlApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, firecrawlApiKey: val }),
                  'Pour scraper et transformer les pages web'
                )}

                {renderKeyInput(
                  'Jina Reader',
                  'jinaReaderApiKey',
                  'jina-...',
                  scrapingKeys.jinaReaderApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, jinaReaderApiKey: val }),
                  'Pour convertir URLs en contenu structuré'
                )}

                {renderKeyInput(
                  'ScrapingBee',
                  'scrapingBeeApiKey',
                  'sb_...',
                  scrapingKeys.scrapingBeeApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, scrapingBeeApiKey: val }),
                  'Pour scraper avec gestion des JavaScript'
                )}

                {renderKeyInput(
                  'Browserless',
                  'browserlessApiKey',
                  'browserless-...',
                  scrapingKeys.browserlessApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, browserlessApiKey: val }),
                  'Pour l\'automatisation navigateur'
                )}

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleSave('scraping')}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-save-scraping"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les clés Scraping
                      </>
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(toast => (
          <ToastNotification
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </MainLayout>
  );
}
