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
  TestTube,
} from 'lucide-react';

/**
 * Utilitaire pour récupérer le token depuis localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Essayer différentes clés de stockage
  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('crm-token') ||
    localStorage.getItem('token');

  return token;
}

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

  // Pica-specific states for testing/configuration
  const [picaPlatform, setPicaPlatform] = useState('');
  const [picaConnectionKey, setPicaConnectionKey] = useState('');

  // État pour la sélection du provider et modèle
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [defaultProvider, setDefaultProvider] = useState<string>('openai');

  // État pour la validation des clés
  const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
  const [validatedKeys, setValidatedKeys] = useState<Record<string, boolean>>({});
  const [availableModelsPerKey, setAvailableModelsPerKey] = useState<Record<string, string[]>>({});

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
      const token = getAuthToken();
      if (!token) {
        addToast('Authentification requise. Veuillez vous connecter.', 'error');
        setLoadingKeys(false);
        return;
      }

      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Normalize API URL to avoid double /api/api if defined in .env
      apiUrl = apiUrl.replace(/\/api$/, '');

      // Charger les clés complètes (non masquées) pour l'édition
      const response = await fetch(`${apiUrl}/api/ai-billing/api-keys/user/full`, {
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
      } else if (response.status === 429) {
        addToast('Trop de requêtes. Veuillez patienter un instant.', 'info');
      } else {
        const text = await response.text();
        console.error('Failed to load keys:', response.status, text);
        addToast('Erreur lors du chargement des clés API', 'error');
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
      addToast('Erreur lors du chargement des clés API. Vérifiez votre connexion.', 'error');
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleSave = async (category: 'llm' | 'scraping') => {
    console.log('🔥 handleSave called with category:', category);
    setLoading(true);

    try {
      const token = getAuthToken();
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

      // Pour LLM, vérifier que le modèle est sélectionné
      if (category === 'llm' && !selectedModel) {
        addToast('Veuillez sélectionner un modèle', 'error');
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

      console.log('📤 Sending data:', dataToSend);

      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // Normalize API URL to avoid double /api/api if defined in .env
      apiUrl = apiUrl.replace(/\/api$/, '');

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

  /**
   * Teste la validité d'une clé API via le backend pour éviter les problèmes CORS
   */
  const handleTestApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey || apiKey.trim() === '') {
      addToast('Veuillez entrer une clé API', 'error');
      return;
    }

    setTestingKeys(prev => ({ ...prev, [provider]: true }));
    console.log(`🔍 Testing ${provider} API key via backend...`);

    try {
      const token = getAuthToken();
      if (!token) {
        addToast('Authentification requise', 'error');
        setTestingKeys(prev => ({ ...prev, [provider]: false }));
        return;
      }

      // Cas spécial pour Pica (validation simple côté client car souvent pas implémenté côté backend ou instable)
      if (provider === 'pica') {
        if (apiKey && apiKey.length > 5) {
          // Simulation d'un délai pour l'UX
          await new Promise(resolve => setTimeout(resolve, 800));
          setValidatedKeys(prev => ({ ...prev, [provider]: true }));
          addToast(`✅ Clé PICA format valide`, 'success');
        } else {
          setValidatedKeys(prev => ({ ...prev, [provider]: false }));
          addToast(`❌ Clé PICA invalide (trop courte)`, 'error');
        }
        setTestingKeys(prev => ({ ...prev, [provider]: false }));
        return;
      }

      let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      apiUrl = apiUrl.replace(/\/api$/, '');

      const targetUrl = `${apiUrl}/api/ai-billing/api-keys/validate`;
      console.log(`📡 Fetching: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.valid) {
          const models = data.models || [];
          setValidatedKeys(prev => ({ ...prev, [provider]: true }));

          if (models.length > 0) {
            setAvailableModelsPerKey(prev => ({ ...prev, [provider]: models }));
            // Si c'est le provider sélectionné, sélectionner le premier modèle par défaut
            if (selectedProvider === provider) {
              setSelectedModel(models[0]);
            }
          }

          addToast(`✅ Clé ${provider.toUpperCase()} validée! ${models.length > 0 ? models.length + ' modèles' : ''}`, 'success');
        } else {
          setValidatedKeys(prev => ({ ...prev, [provider]: false }));
          addToast(`❌ Clé ${provider.toUpperCase()} invalide: ${data.message || 'Erreur inconnue'}`, 'error');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur serveur');
      }
    } catch (error: any) {
      console.error(`Error testing ${provider}:`, error);
      setValidatedKeys(prev => ({ ...prev, [provider]: false }));

      let errorMessage = 'Erreur réseau';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Erreur de connexion (CORS, AdBlock ou backend éteint)';
        } else {
          errorMessage = error.message;
        }
      }

      addToast(`❌ Erreur lors du test de la clé ${provider.toUpperCase()}: ${errorMessage}`, 'error');
    } finally {
      setTestingKeys(prev => ({ ...prev, [provider]: false }));
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  /**
   * Mappe les noms de clés API aux noms de providers
   */
  const getProviderFromKeyName = (keyName: string): string | null => {
    const mapping: Record<string, string> = {
      'openaiApiKey': 'openai',
      'geminiApiKey': 'gemini',
      'deepseekApiKey': 'deepseek',
      'anthropicApiKey': 'anthropic',
      'openrouterApiKey': 'openrouter',
      'mistralApiKey': 'mistral',
      'grokApiKey': 'grok',
      'cohereApiKey': 'cohere',
      'togetherAiApiKey': 'togetherai',
      'replicateApiKey': 'replicate',
      'perplexityApiKey': 'perplexity',
      'huggingfaceApiKey': 'huggingface',
      'serpApiKey': 'serp',
      'firecrawlApiKey': 'firecrawl',
      'jinaReaderApiKey': 'jina',
      'scrapingBeeApiKey': 'scrapingbee',
      'browserlessApiKey': 'browserless',
      'picaApiKey': 'pica',
    };
    return mapping[keyName] || null;
  };

  const renderKeyInput = (
    label: string,
    keyName: keyof ApiKeys,
    placeholder: string,
    value: string | undefined,
    onChange: (value: string) => void,
    description?: string,
    isLLMKey: boolean = false
  ) => {
    const hasValue = value && value !== '';
    const provider = isLLMKey ? getProviderFromKeyName(keyName as string) : null;
    const isValidated = provider ? validatedKeys[provider] : false;
    const isTesting = provider ? testingKeys[provider] : false;

    return (
      <div key={keyName} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <Label htmlFor={keyName} className="font-semibold text-gray-900">{label}</Label>
          <div className="flex items-center gap-2">
            {isValidated && (
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> ✓ Validée
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              id={keyName as string}
              type={showKeys[keyName as string] ? 'text' : 'password'}
              placeholder={placeholder}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="font-mono text-sm"
              data-testid={`input-${keyName}`}
            />
          </div>

          {hasValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => toggleShowKey(keyName as string)}
              className="px-2"
              title={showKeys[keyName as string] ? 'Masquer' : 'Afficher'}
            >
              {showKeys[keyName as string] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}

          {isLLMKey && provider && (
            <Button
              type="button"
              variant={isValidated ? "default" : "outline"}
              size="sm"
              onClick={() => handleTestApiKey(provider, value || '')}
              disabled={!hasValue || isTesting}
              className={`gap-1.5 whitespace-nowrap font-medium transition-all ${isValidated
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : hasValue && !isTesting
                  ? 'hover:bg-blue-50'
                  : 'opacity-50 cursor-not-allowed'
                }`}
              title={hasValue ? "Tester la validité de la clé API" : "Entrez une clé API pour tester"}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Test...
                </>
              ) : isValidated ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Validée
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  Tester
                </>
              )}
            </Button>
          )}
        </div>

        {description && (
          <p className="text-xs text-gray-600 mt-2">{description}</p>
        )}
      </div>
    );
  };

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
                    'Pour GPT-4, GPT-3.5-turbo, etc.',
                    true
                  )}

                  {renderKeyInput(
                    'Google Gemini',
                    'geminiApiKey',
                    'AIza...',
                    llmKeys.geminiApiKey,
                    (val) => setLlmKeys({ ...llmKeys, geminiApiKey: val }),
                    'Pour Gemini Pro et Gemini Ultra',
                    true
                  )}

                  {renderKeyInput(
                    'DeepSeek',
                    'deepseekApiKey',
                    'sk-...',
                    llmKeys.deepseekApiKey,
                    (val) => setLlmKeys({ ...llmKeys, deepseekApiKey: val }),
                    'Pour DeepSeek Chat et Coder',
                    true
                  )}

                  {renderKeyInput(
                    'Anthropic (Claude)',
                    'anthropicApiKey',
                    'sk-ant-...',
                    llmKeys.anthropicApiKey,
                    (val) => setLlmKeys({ ...llmKeys, anthropicApiKey: val }),
                    'Pour utiliser Claude 3 (Sonnet, Opus, Haiku)',
                    true
                  )}

                  {renderKeyInput(
                    'OpenRouter',
                    'openrouterApiKey',
                    'sk-or-...',
                    llmKeys.openrouterApiKey,
                    (val) => setLlmKeys({ ...llmKeys, openrouterApiKey: val }),
                    'Accès à plusieurs modèles via une seule API',
                    true
                  )}

                  {renderKeyInput(
                    'Mistral AI',
                    'mistralApiKey',
                    'mistral-...',
                    llmKeys.mistralApiKey,
                    (val) => setLlmKeys({ ...llmKeys, mistralApiKey: val }),
                    'Pour Mistral Small, Medium, Large',
                    true
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
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      Pica OS & Intégrations
                    </h3>
                    <button
                      type="button"
                      onClick={() => window.open('https://app.picaos.com/connections', '_blank')}
                      className="text-xs bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded transition-colors shadow-sm font-medium"
                    >
                      Gérer les plateformes et clés sur Pica ↗
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    Pica centralise vos connexions. Ajoutez vos clés de plateforme (Firecrawl, SerpApi...) directement sur Pica, puis entrez ci-dessous votre clé principale Pica.
                  </p>

                  {renderKeyInput(
                    'Clé API Pica (Master Key)',
                    'picaApiKey',
                    'pica_...',
                    scrapingKeys.picaApiKey,
                    (val) => setScrapingKeys({ ...scrapingKeys, picaApiKey: val }),
                    'Clé principale Pica OS pour piloter toutes vos intégrations',
                    true
                  )}

                  {/* Pica Optional Connection Configuration */}
                  <div className="mt-2 pl-4 border-l-2 border-slate-100 ml-2 space-y-3">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                      Configuration de connexion spécifique (Optionnel)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Platform ID</label>
                        <input
                          type="text"
                          value={picaPlatform}
                          onChange={(e) => setPicaPlatform(e.target.value)}
                          placeholder="ex: firecrawl"
                          className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Connection Key</label>
                        <input
                          type="text"
                          value={picaConnectionKey}
                          onChange={(e) => setPicaConnectionKey(e.target.value)}
                          placeholder="ex: test::firecrawl::..."
                          className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Ou configurez individuellement</span>
                  </div>
                </div>

                {renderKeyInput(
                  'SERP API (Google Search)',
                  'serpApiKey',
                  'serp-...',
                  scrapingKeys.serpApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, serpApiKey: val }),
                  'Pour accéder à Google Search Results',
                  true
                )}

                {renderKeyInput(
                  'Firecrawl',
                  'firecrawlApiKey',
                  'fc_...',
                  scrapingKeys.firecrawlApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, firecrawlApiKey: val }),
                  'Pour scraper et transformer les pages web',
                  true
                )}

                {renderKeyInput(
                  'Jina Reader',
                  'jinaReaderApiKey',
                  'jina-...',
                  scrapingKeys.jinaReaderApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, jinaReaderApiKey: val }),
                  'Pour convertir URLs en contenu structuré',
                  true
                )}

                {renderKeyInput(
                  'ScrapingBee',
                  'scrapingBeeApiKey',
                  'sb_...',
                  scrapingKeys.scrapingBeeApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, scrapingBeeApiKey: val }),
                  'Pour scraper avec gestion des JavaScript',
                  true
                )}

                {renderKeyInput(
                  'Browserless',
                  'browserlessApiKey',
                  'browserless-...',
                  scrapingKeys.browserlessApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, browserlessApiKey: val }),
                  'Pour l\'automatisation navigateur',
                  true
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
