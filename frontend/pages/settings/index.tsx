import { useState, useEffect } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Key,
  Brain,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { validateApiKey, getAvailableModels, validateScrapingApiKey } from '../../utils/api-key-validators';

type TabType = 'profile' | 'api-keys' | 'llm' | 'security';

interface ApiKeyFieldState {
  apiKey: string;
  testing: boolean;
  testResult: { success: boolean; message?: string; error?: string } | null;
  models: string[];
  loadingModels: boolean;
  selectedModel: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedOtherLLM, setSelectedOtherLLM] = useState<string>('cohere');

  // State for API key testing
  const [apiKeyStates, setApiKeyStates] = useState<Record<string, ApiKeyFieldState>>({
    openai: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    anthropic: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    gemini: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    deepseek: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    mistral: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    openrouter: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    grok: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
  });

  // State for scraping API keys (legacy - kept for saving)
  const [scrapingKeys, setScrapingKeys] = useState({
    firecrawlApiKey: '',
    serpApiKey: '',
    picaApiKey: '',
  });

  // State for scraping API key testing
  const [scrapingApiKeyStates, setScrapingApiKeyStates] = useState<Record<string, ApiKeyFieldState>>({
    firecrawl: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    serpapi: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
    pica: { apiKey: '', testing: false, testResult: null, models: [], loadingModels: false, selectedModel: '' },
  });

  const [savingLLM, setSavingLLM] = useState(false);
  const [savingScraping, setSavingScraping] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // State for internal scraping engines
  const [internalEngines, setInternalEngines] = useState({
    cheerio: { enabled: true, name: 'Cheerio', description: 'Parser HTML léger et rapide (recommandé pour sites simples)' },
    puppeteer: { enabled: true, name: 'Puppeteer', description: 'Navigateur headless complet (pour sites JavaScript complexes)' },
  });
  const [savingEngines, setSavingEngines] = useState(false);

  // Fetch user API keys on component mount
  useEffect(() => {
    const fetchUserApiKeys = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoadingKeys(false);
          return;
        }

        const response = await fetch('http://localhost:3001/api/ai-billing/api-keys/user', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Populate LLM API keys states
          if (data.openaiApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              openai: { ...prev.openai, apiKey: data.openaiApiKey },
            }));
          }
          if (data.anthropicApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              anthropic: { ...prev.anthropic, apiKey: data.anthropicApiKey },
            }));
          }
          if (data.geminiApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              gemini: { ...prev.gemini, apiKey: data.geminiApiKey },
            }));
          }
          if (data.deepseekApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              deepseek: { ...prev.deepseek, apiKey: data.deepseekApiKey },
            }));
          }
          if (data.mistralApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              mistral: { ...prev.mistral, apiKey: data.mistralApiKey },
            }));
          }
          if (data.openrouterApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              openrouter: { ...prev.openrouter, apiKey: data.openrouterApiKey },
            }));
          }
          if (data.grokApiKey) {
            setApiKeyStates((prev) => ({
              ...prev,
              grok: { ...prev.grok, apiKey: data.grokApiKey },
            }));
          }

          // Populate scraping API keys states
          if (data.firecrawlApiKey) {
            setScrapingApiKeyStates((prev) => ({
              ...prev,
              firecrawl: { ...prev.firecrawl, apiKey: data.firecrawlApiKey },
            }));
            setScrapingKeys((prev) => ({ ...prev, firecrawlApiKey: data.firecrawlApiKey }));
          }
          if (data.serpApiKey) {
            setScrapingApiKeyStates((prev) => ({
              ...prev,
              serpapi: { ...prev.serpapi, apiKey: data.serpApiKey },
            }));
            setScrapingKeys((prev) => ({ ...prev, serpApiKey: data.serpApiKey }));
          }
          if (data.picaApiKey) {
            setScrapingApiKeyStates((prev) => ({
              ...prev,
              pica: { ...prev.pica, apiKey: data.picaApiKey },
            }));
            setScrapingKeys((prev) => ({ ...prev, picaApiKey: data.picaApiKey }));
          }

          // Set default provider and model if available
          if (data.defaultProvider) {
            const provider = data.defaultProvider;
            if (data.defaultModel && apiKeyStates[provider]) {
              setApiKeyStates((prev) => ({
                ...prev,
                [provider]: {
                  ...prev[provider],
                  selectedModel: data.defaultModel,
                },
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user API keys:', error);
      } finally {
        setLoadingKeys(false);
      }
    };

    const fetchEnginesConfig = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('http://localhost:3001/api/ai-billing/api-keys/scraping-engines', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setInternalEngines({
            cheerio: {
              enabled: data.cheerioEnabled,
              name: 'Cheerio',
              description: 'Parser HTML léger et rapide (recommandé pour sites simples)'
            },
            puppeteer: {
              enabled: data.puppeteerEnabled,
              name: 'Puppeteer',
              description: 'Navigateur headless complet (pour sites JavaScript complexes)'
            },
          });
        }
      } catch (error) {
        console.error('Error fetching engines config:', error);
      }
    };

    fetchUserApiKeys();
    fetchEnginesConfig();
  }, []);

  const testApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: false,
            error: 'Veuillez entrer une clé API',
          },
        },
      }));
      return;
    }

    // Check if API key is masked (contains ***)
    if (apiKey.includes('*')) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: true,
            message: '🔒 Clé déjà sauvegardée (masquée pour sécurité). Entrez une nouvelle clé pour tester.',
          },
        },
      }));
      return;
    }

    // Start testing
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        testing: true,
        testResult: null,
      },
    }));

    try {
      // Call the direct API validator (no backend needed)
      const result = await validateApiKey(provider, apiKey);

      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: result,
        },
      }));

      // If validation successful, load available models
      if (result.success) {
        loadModels(provider, apiKey);
      }
    } catch (error) {
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: {
            success: false,
            error: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          },
        },
      }));
    }
  };

  const loadModels = async (provider: string, apiKey: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        loadingModels: true,
      },
    }));

    try {
      const models = await getAvailableModels(provider, apiKey);
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          models,
          loadingModels: false,
          selectedModel: models.length > 0 ? models[0] : '',
        },
      }));
    } catch (error) {
      console.error('Error loading models:', error);
      setApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          loadingModels: false,
        },
      }));
    }
  };

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: value,
        // Clear test result when user changes the key
        testResult: null,
      },
    }));
  };

  const handleModelSelect = (provider: string, model: string) => {
    setApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        selectedModel: model,
      },
    }));
  };

  // Scraping API key handlers
  const testScrapingApiKey = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: false,
            error: 'Veuillez entrer une clé API',
          },
        },
      }));
      return;
    }

    // Check if API key is masked (contains ***)
    if (apiKey.includes('*')) {
      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testResult: {
            success: true,
            message: '🔒 Clé déjà sauvegardée (masquée pour sécurité). Entrez une nouvelle clé pour tester.',
          },
        },
      }));
      return;
    }

    // Start testing
    setScrapingApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        testing: true,
        testResult: null,
      },
    }));

    try {
      // Call the scraping API validator
      const result = await validateScrapingApiKey(provider, apiKey);

      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: result,
        },
      }));

      // Update the legacy scrapingKeys state for saving
      if (result.success) {
        if (provider === 'firecrawl') {
          setScrapingKeys((prev) => ({ ...prev, firecrawlApiKey: apiKey }));
        } else if (provider === 'serpapi') {
          setScrapingKeys((prev) => ({ ...prev, serpApiKey: apiKey }));
        } else if (provider === 'pica') {
          setScrapingKeys((prev) => ({ ...prev, picaApiKey: apiKey }));
        }
      }
    } catch (error) {
      setScrapingApiKeyStates((prev) => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          testing: false,
          testResult: {
            success: false,
            error: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
          },
        },
      }));
    }
  };

  const handleScrapingApiKeyChange = (provider: string, value: string) => {
    setScrapingApiKeyStates((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: value,
        // Clear test result when user changes the key
        testResult: null,
      },
    }));

    // Also update the legacy scrapingKeys state
    if (provider === 'firecrawl') {
      setScrapingKeys((prev) => ({ ...prev, firecrawlApiKey: value }));
    } else if (provider === 'serpapi') {
      setScrapingKeys((prev) => ({ ...prev, serpApiKey: value }));
    } else if (provider === 'pica') {
      setScrapingKeys((prev) => ({ ...prev, picaApiKey: value }));
    }
  };

  const handleSaveLLMKeys = async () => {
    setSavingLLM(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('❌ Authentification requise. Veuillez vous connecter.');
        setSavingLLM(false);
        return;
      }

      // Préparer les données à envoyer
      const dataToSend: any = {};

      // Ajouter les clés API validées
      if (apiKeyStates.openai.apiKey) {
        dataToSend.openaiApiKey = apiKeyStates.openai.apiKey;
        if (apiKeyStates.openai.selectedModel) {
          dataToSend.defaultProvider = 'openai';
          dataToSend.defaultModel = apiKeyStates.openai.selectedModel;
        }
      }
      if (apiKeyStates.anthropic.apiKey) {
        dataToSend.anthropicApiKey = apiKeyStates.anthropic.apiKey;
        if (apiKeyStates.anthropic.selectedModel && !dataToSend.defaultProvider) {
          dataToSend.defaultProvider = 'anthropic';
          dataToSend.defaultModel = apiKeyStates.anthropic.selectedModel;
        }
      }
      if (apiKeyStates.gemini.apiKey) {
        dataToSend.geminiApiKey = apiKeyStates.gemini.apiKey;
        if (apiKeyStates.gemini.selectedModel && !dataToSend.defaultProvider) {
          dataToSend.defaultProvider = 'gemini';
          dataToSend.defaultModel = apiKeyStates.gemini.selectedModel;
        }
      }
      if (apiKeyStates.deepseek.apiKey) {
        dataToSend.deepseekApiKey = apiKeyStates.deepseek.apiKey;
        if (apiKeyStates.deepseek.selectedModel && !dataToSend.defaultProvider) {
          dataToSend.defaultProvider = 'deepseek';
          dataToSend.defaultModel = apiKeyStates.deepseek.selectedModel;
        }
      }
      if (apiKeyStates.mistral.apiKey) dataToSend.mistralApiKey = apiKeyStates.mistral.apiKey;
      if (apiKeyStates.openrouter.apiKey) dataToSend.openrouterApiKey = apiKeyStates.openrouter.apiKey;
      if (apiKeyStates.grok.apiKey) dataToSend.grokApiKey = apiKeyStates.grok.apiKey;

      // Vérifier qu'au moins une clé est remplie
      if (Object.keys(dataToSend).length === 0) {
        setMessage('⚠️ Veuillez entrer au moins une clé API');
        setSavingLLM(false);
        return;
      }

      console.log('📤 Sending LLM keys:', dataToSend);

      const response = await fetch('http://localhost:3001/api/ai-billing/api-keys/user', {
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
        setMessage('✅ Clés LLM sauvegardées avec succès!');
      } else if (response.status === 401) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(`❌ Erreur: ${errorData.message || 'Erreur lors de la sauvegarde'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSavingLLM(false);
    }
  };

  const handleSaveScrapingKeys = async () => {
    setSavingScraping(true);
    setMessage('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setMessage('❌ Authentification requise. Veuillez vous connecter.');
        setSavingScraping(false);
        return;
      }

      // Filtrer les clés vides
      const dataToSend: any = {};
      if (scrapingKeys.firecrawlApiKey) dataToSend.firecrawlApiKey = scrapingKeys.firecrawlApiKey;
      if (scrapingKeys.serpApiKey) dataToSend.serpApiKey = scrapingKeys.serpApiKey;
      if (scrapingKeys.picaApiKey) dataToSend.picaApiKey = scrapingKeys.picaApiKey;

      // Vérifier qu'au moins une clé est remplie
      if (Object.keys(dataToSend).length === 0) {
        setMessage('⚠️ Veuillez entrer au moins une clé API');
        setSavingScraping(false);
        return;
      }

      console.log('📤 Sending Scraping keys:', dataToSend);

      const response = await fetch('http://localhost:3001/api/ai-billing/api-keys/user', {
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
        setMessage('✅ Clés Scraping sauvegardées avec succès!');
      } else if (response.status === 401) {
        setMessage('❌ Session expirée. Veuillez vous reconnecter.');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(`❌ Erreur: ${errorData.message || 'Erreur lors de la sauvegarde'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setSavingScraping(false);
    }
  };

  const renderApiKeyInput = (
    provider: string,
    label: string,
    placeholder: string,
    description: string,
  ) => {
    const state = apiKeyStates[provider];

    return (
      <div key={provider}>
        <Label>{label}</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="password"
            placeholder={placeholder}
            value={state.apiKey}
            onChange={(e) => handleApiKeyChange(provider, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => testApiKey(provider, state.apiKey)}
            disabled={state.testing || !state.apiKey.trim()}
            className="whitespace-nowrap"
          >
            {state.testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Test...
              </>
            ) : (
              'Tester'
            )}
          </Button>
        </div>
        {state.testResult && (
          <div
            className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${state.testResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}
          >
            {state.testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p
                className={
                  state.testResult.success
                    ? 'text-sm text-green-800'
                    : 'text-sm text-red-800'
                }
              >
                {state.testResult.success
                  ? state.testResult.message ||
                  'Clé API valide'
                  : state.testResult.error ||
                  'Erreur de validation'}
              </p>
            </div>
          </div>
        )}

        {/* Models Dropdown - Show only if validation was successful and models were loaded */}
        {state.testResult?.success && state.models.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Label className="text-blue-900 font-semibold">📊 Modèles disponibles</Label>
            {state.loadingModels ? (
              <div className="mt-2 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-600">Chargement des modèles...</span>
              </div>
            ) : (
              <select
                value={state.selectedModel}
                onChange={(e) => handleModelSelect(provider, e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-blue-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionnez un modèle</option>
                {state.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            )}
            {state.selectedModel && (
              <div className="mt-2 p-2 bg-white rounded border border-blue-300">
                <p className="text-sm font-medium text-blue-900">
                  ✅ Sélectionné: <span className="font-mono text-blue-700">{state.selectedModel}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  const renderScrapingApiKeyInput = (
    provider: string,
    label: string,
    placeholder: string,
    description: string,
  ) => {
    const state = scrapingApiKeyStates[provider];

    return (
      <div key={provider}>
        <Label>{label}</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="password"
            placeholder={placeholder}
            value={state.apiKey}
            onChange={(e) => handleScrapingApiKeyChange(provider, e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => testScrapingApiKey(provider, state.apiKey)}
            disabled={state.testing || !state.apiKey.trim()}
            className="whitespace-nowrap"
          >
            {state.testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Test...
              </>
            ) : (
              'Tester'
            )}
          </Button>
        </div>
        {state.testResult && (
          <div
            className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${state.testResult.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}
          >
            {state.testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p
                className={
                  state.testResult.success
                    ? 'text-sm text-green-800'
                    : 'text-sm text-red-800'
                }
              >
                {state.testResult.success
                  ? state.testResult.message ||
                  'Clé API valide'
                  : state.testResult.error ||
                  'Erreur de validation'}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    );
  };

  const otherLLMModels = [
    { id: 'cohere', name: 'Cohere', description: 'Modèles de génération et classification de texte' },
    { id: 'together', name: 'Together AI', description: 'Plateforme d\'inférence optimisée pour LLM' },
    { id: 'replicate', name: 'Replicate', description: 'Exécutez des modèles ML en nuage' },
    { id: 'perplexity', name: 'Perplexity', description: 'Modèles d\'IA avec accès à Internet en temps réel' },
    { id: 'huggingface', name: 'Hugging Face', description: 'Plateforme communautaire d\'IA open-source' },
    { id: 'aleph', name: 'Aleph Alpha', description: 'Modèles d\'IA multilingues et multimodaux' },
    { id: 'nlp_cloud', name: 'NLP Cloud', description: 'API NLP sans infrastructure' },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // TODO: Implémenter la sauvegarde
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMessage('Profil mis à jour avec succès');
    } catch (error) {
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const renderTabButton = (tab: TabType, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === tab
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          </div>
          <p className="text-gray-600">Gérez vos préférences et configuration</p>
        </div>

        {/* Message Display */}
        {message && (
          <Card className="mb-6 border-l-4 border-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-blue-900">{message}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {renderTabButton('profile', 'Profil', <User className="h-4 w-4" />)}
          {renderTabButton('api-keys', 'API Keys', <Key className="h-4 w-4" />)}
          {renderTabButton('llm', 'LLM/IA', <Brain className="h-4 w-4" />)}
          {renderTabButton('security', 'Sécurité', <Shield className="h-4 w-4" />)}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* User Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input
                        placeholder="Votre prénom"
                        defaultValue={user?.firstName || ''}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input
                        placeholder="Votre nom"
                        defaultValue={user?.lastName || ''}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      defaultValue={user?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications par email</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-600">Recevoir des notifications push</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels des rendez-vous</p>
                    <p className="text-sm text-gray-600">Recevoir des rappels avant les rendez-vous</p>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: API Keys Configuration */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            {/* LLM Models Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  LLM - Modèles d'IA
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Configurez vos clés API pour les modèles d'IA avancés
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderApiKeyInput(
                  'openai',
                  'OpenAI API Key',
                  'sk-...',
                  'Votre clé API OpenAI pour accéder aux modèles GPT-4o, GPT-4, etc.',
                )}
                {renderApiKeyInput(
                  'anthropic',
                  'Anthropic API Key',
                  'sk-ant-...',
                  'Clé API pour Claude 3 Opus, Sonnet et autres modèles Anthropic',
                )}
                {renderApiKeyInput(
                  'gemini',
                  'Google Gemini API Key',
                  'AIza...',
                  'Clé API Google pour Gemini 2.0 et autres modèles Google',
                )}
                {renderApiKeyInput(
                  'deepseek',
                  'Deepseek API Key',
                  'sk-...',
                  'Clé API pour Deepseek - Modèles d\'IA haute performance et cost-effective',
                )}
                {renderApiKeyInput(
                  'mistral',
                  'Mistral API Key',
                  '...',
                  'Clé API pour Mistral - Modèles optimisés pour la performance et la latence',
                )}
                {renderApiKeyInput(
                  'openrouter',
                  'Open Router API Key',
                  'sk-or-...',
                  'Clé API pour Open Router - Accédez à plusieurs modèles via une seule API',
                )}
                {renderApiKeyInput(
                  'grok',
                  'Grok API Key',
                  '...',
                  'Clé API pour Grok (xAI) - Modèles d\'IA avec compréhension du contexte en temps réel',
                )}
                <div>
                  <Label>Autres Modèles LLM (BYOK)</Label>
                  <select
                    value={selectedOtherLLM}
                    onChange={(e) => setSelectedOtherLLM(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white"
                  >
                    {otherLLMModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} - {model.description}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-blue-900">
                    {otherLLMModels.find((m) => m.id === selectedOtherLLM)?.name} API Key
                  </Label>
                  <Input
                    type="password"
                    placeholder={`Clé API pour ${otherLLMModels.find((m) => m.id === selectedOtherLLM)?.name}`}
                    className="mt-2 bg-white"
                  />
                  <p className="text-xs text-blue-700 mt-2">
                    {otherLLMModels.find((m) => m.id === selectedOtherLLM)?.description}
                  </p>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLLMKeys}
                    disabled={savingLLM}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingLLM ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer les clés LLM'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Web Scraping Engines Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-orange-600" />
                  Moteurs de Scraping Web
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Configurez vos clés API pour les services de web scraping et extraction de données
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderScrapingApiKeyInput(
                  'firecrawl',
                  'Firecrawl API Key',
                  'fcrawl-...',
                  'Clé API pour Firecrawl - Web scraping LLM-friendly avec support des PDFs',
                )}
                {renderScrapingApiKeyInput(
                  'serpapi',
                  'SERP API Key',
                  '...',
                  'Clé API pour SerpAPI - Scraping des résultats de recherche (Google, Bing, etc.)',
                )}
                {renderScrapingApiKeyInput(
                  'pica',
                  'Pica API Key',
                  '...',
                  'Clé API pour Pica - Scraping de données web structurées et non-structurées',
                )}
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScrapingKeys}
                    disabled={savingScraping}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingScraping ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer les clés API'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Moteurs de Scraping Internes
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Activez ou désactivez les moteurs de scraping locaux installés sur votre serveur
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(internalEngines).map(([key, engine]) => (
                  <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{engine.name}</h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          engine.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {engine.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{engine.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={engine.enabled}
                        onChange={(e) => {
                          setInternalEngines(prev => ({
                            ...prev,
                            [key]: { ...prev[key], enabled: e.target.checked }
                          }));
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Ordre de priorité</p>
                      <p className="mt-1">Par défaut, le système utilise Cheerio en premier pour économiser les ressources. Puppeteer est utilisé automatiquement pour les sites JavaScript complexes.</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to defaults
                      setInternalEngines({
                        cheerio: { enabled: true, name: 'Cheerio', description: 'Parser HTML léger et rapide (recommandé pour sites simples)' },
                        puppeteer: { enabled: true, name: 'Puppeteer', description: 'Navigateur headless complet (pour sites JavaScript complexes)' },
                      });
                    }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Réinitialiser
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setSavingEngines(true);
                      setMessage('');

                      try {
                        const token = localStorage.getItem('auth_token');
                        if (!token) {
                          setMessage('❌ Authentification requise. Veuillez vous connecter.');
                          setSavingEngines(false);
                          return;
                        }

                        const response = await fetch('http://localhost:3001/api/ai-billing/api-keys/scraping-engines', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            cheerioEnabled: internalEngines.cheerio.enabled,
                            puppeteerEnabled: internalEngines.puppeteer.enabled,
                          }),
                        });

                        if (response.ok) {
                          setMessage('✅ Configuration des moteurs sauvegardée!');
                        } else {
                          const errorData = await response.json().catch(() => ({}));
                          setMessage(`❌ Erreur: ${errorData.message || 'Échec de la sauvegarde'}`);
                        }
                      } catch (error) {
                        setMessage(`❌ Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                      } finally {
                        setSavingEngines(false);
                      }
                    }}
                    disabled={savingEngines}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {savingEngines ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer la configuration'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage & Billing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Appels API ce mois</p>
                    <p className="text-2xl font-bold mt-2">2,450</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tokens utilisés</p>
                    <p className="text-2xl font-bold mt-2">125K</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Coût estimé</p>
                    <p className="text-2xl font-bold mt-2">$12.50</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: LLM/IA Configuration */}
        {activeTab === 'llm' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Configuration LLM / IA
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Paramétrez le modèle d'IA et ses préférences
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Modèle IA Principal</Label>
                  <select className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white">
                    <option>GPT-4o</option>
                    <option>Claude 3 Opus</option>
                    <option>Gemini 2.0</option>
                    <option>Mistral Large</option>
                  </select>
                </div>

                <div>
                  <Label>Température (Créativité)</Label>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full mt-1" />
                  <p className="text-xs text-gray-500 mt-1">
                    0 = Déterministe | 2 = Très créatif
                  </p>
                </div>

                <div>
                  <Label>Max Tokens par requête</Label>
                  <Input
                    type="number"
                    defaultValue="4000"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Système de prompt personnalisé</Label>
                  <textarea
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md min-h-[120px]"
                    placeholder="Entrez vos instructions système personnalisées..."
                    defaultValue="Tu es un assistant immobilier expert..."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input type="checkbox" id="retry" defaultChecked className="h-4 w-4" />
                      <label htmlFor="retry" className="ml-2 text-sm">
                        Réessayer automatiquement en cas d'erreur
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="stream" defaultChecked className="h-4 w-4" />
                      <label htmlFor="stream" className="ml-2 text-sm">
                        Streaming des réponses
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" id="cache" className="h-4 w-4" />
                      <label htmlFor="cache" className="ml-2 text-sm">
                        Activer le cache des requêtes
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage('ℹ️ Configuration LLM - Cette fonctionnalité sera implémentée prochainement')}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background h-10 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Enregistrer la configuration
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modèles Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>✓ GPT-4o (4K tokens)</p>
                  <p>✓ Claude 3 Opus (100K tokens)</p>
                  <p>✓ Gemini 2.0 (100K tokens)</p>
                  <p>✓ Mistral Large (32K tokens)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label>Mot de passe actuel</Label>
                    <Input
                      type="password"
                      placeholder="Entrez votre mot de passe actuel"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Nouveau mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="Entrez un nouveau mot de passe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Confirmer le mot de passe</Label>
                    <Input
                      type="password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline">
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Changer le mot de passe
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sessions actives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Chrome sur Windows</p>
                      <p className="text-sm text-gray-600">Dernière activité: il y a 5 minutes</p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Déconnecter
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Safari sur iPhone</p>
                      <p className="text-sm text-gray-600">Dernière activité: hier</p>
                    </div>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      Déconnecter
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authentification à deux facteurs (2FA)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Renforcez la sécurité de votre compte avec la 2FA
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Activer la 2FA
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Zone Danger</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Supprimer définitivement votre compte et toutes les données associées
                </p>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  Supprimer le compte
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
