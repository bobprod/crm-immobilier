import { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';

interface ApiKeys {
  // LLM Providers
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  deepseekApiKey?: string;
  openrouterApiKey?: string;
  // New LLM Providers
  mistralApiKey?: string;
  grokApiKey?: string;
  cohereApiKey?: string;
  togetherAiApiKey?: string;
  replicateApiKey?: string;
  perplexityApiKey?: string;
  huggingfaceApiKey?: string;
  alephAlphaApiKey?: string;
  nlpCloudApiKey?: string;
  // Scraping Providers
  serpApiKey?: string;
  firecrawlApiKey?: string;
  picaApiKey?: string;
  jinaReaderApiKey?: string;
  scrapingBeeApiKey?: string;
  browserlessApiKey?: string;
  rapidApiKey?: string;
}

export default function AIApiKeysPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [llmKeys, setLlmKeys] = useState<ApiKeys>({});
  const [scrapingKeys, setScrapingKeys] = useState<ApiKeys>({});

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-billing/api-keys/user`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Séparer LLM et Scraping
        setLlmKeys({
          anthropicApiKey: data.anthropicApiKey,
          openaiApiKey: data.openaiApiKey,
          geminiApiKey: data.geminiApiKey,
          deepseekApiKey: data.deepseekApiKey,
          openrouterApiKey: data.openrouterApiKey,
          mistralApiKey: data.mistralApiKey,
          grokApiKey: data.grokApiKey,
          cohereApiKey: data.cohereApiKey,
          togetherAiApiKey: data.togetherAiApiKey,
          replicateApiKey: data.replicateApiKey,
          perplexityApiKey: data.perplexityApiKey,
          huggingfaceApiKey: data.huggingfaceApiKey,
          alephAlphaApiKey: data.alephAlphaApiKey,
          nlpCloudApiKey: data.nlpCloudApiKey,
        });

        setScrapingKeys({
          serpApiKey: data.serpApiKey,
          firecrawlApiKey: data.firecrawlApiKey,
          picaApiKey: data.picaApiKey,
          jinaReaderApiKey: data.jinaReaderApiKey,
          scrapingBeeApiKey: data.scrapingBeeApiKey,
          browserlessApiKey: data.browserlessApiKey,
          rapidApiKey: data.rapidApiKey,
        });
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoadingKeys(false);
    }
  };

  const handleSave = async (category: 'llm' | 'scraping') => {
    setLoading(true);
    setMessage(null);

    try {
      const keysToSave = category === 'llm' ? llmKeys : scrapingKeys;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-billing/api-keys/user`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(keysToSave),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Clés API sauvegardées avec succès !' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
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
        {value && value !== 'null' && (
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
        value={value && value !== 'null' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-sm"
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="h-8 w-8 text-blue-600" />
            Mes Clés API (BYOK)
          </h1>
          <p className="text-gray-600 mt-1">
            Configurez vos propres clés API pour utiliser les services IA
          </p>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>BYOK (Bring Your Own Key)</strong> : Vos clés API personnelles sont prioritaires. Si non configurées,
            les clés de votre agence puis les clés globales seront utilisées en fallback.
          </AlertDescription>
        </Alert>

        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="llm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="llm" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              LLM / IA
            </TabsTrigger>
            <TabsTrigger value="scraping" className="flex items-center gap-2">
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
                  Providers LLM
                </CardTitle>
                <CardDescription>
                  Configurez vos clés API pour les modèles de langage (Claude, GPT, Gemini, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyInput(
                  'Anthropic (Claude)',
                  'anthropicApiKey',
                  'sk-ant-...',
                  llmKeys.anthropicApiKey,
                  (val) => setLlmKeys({ ...llmKeys, anthropicApiKey: val }),
                  'Pour utiliser Claude 3 (Sonnet, Opus, Haiku)'
                )}

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
                  'OpenRouter',
                  'openrouterApiKey',
                  'sk-or-...',
                  llmKeys.openrouterApiKey,
                  (val) => setLlmKeys({ ...llmKeys, openrouterApiKey: val }),
                  'Accès à plusieurs modèles via une seule API'
                )}

                {/* New LLM Providers */}
                {renderKeyInput(
                  'Mistral AI',
                  'mistralApiKey',
                  'mistral-...',
                  llmKeys.mistralApiKey,
                  (val) => setLlmKeys({ ...llmKeys, mistralApiKey: val }),
                  'Pour Mistral Small, Medium, Large'
                )}

                {renderKeyInput(
                  'Grok (xAI)',
                  'grokApiKey',
                  'grok-...',
                  llmKeys.grokApiKey,
                  (val) => setLlmKeys({ ...llmKeys, grokApiKey: val }),
                  'Modèle Grok avec connaissance du web en temps réel'
                )}

                {renderKeyInput(
                  'Cohere',
                  'cohereApiKey',
                  'cohere-...',
                  llmKeys.cohereApiKey,
                  (val) => setLlmKeys({ ...llmKeys, cohereApiKey: val }),
                  'Pour les modèles Command et Rerank'
                )}

                {renderKeyInput(
                  'Together AI',
                  'togetherAiApiKey',
                  'together-...',
                  llmKeys.togetherAiApiKey,
                  (val) => setLlmKeys({ ...llmKeys, togetherAiApiKey: val }),
                  'Modèles open-source optimisés'
                )}

                {renderKeyInput(
                  'Replicate',
                  'replicateApiKey',
                  'r8_...',
                  llmKeys.replicateApiKey,
                  (val) => setLlmKeys({ ...llmKeys, replicateApiKey: val }),
                  'Modèles open-source avec API simple'
                )}

                {renderKeyInput(
                  'Perplexity',
                  'perplexityApiKey',
                  'pplx-...',
                  llmKeys.perplexityApiKey,
                  (val) => setLlmKeys({ ...llmKeys, perplexityApiKey: val }),
                  'Pour Perplexity avec recherche en temps réel'
                )}

                {renderKeyInput(
                  'Hugging Face',
                  'huggingfaceApiKey',
                  'hf_...',
                  llmKeys.huggingfaceApiKey,
                  (val) => setLlmKeys({ ...llmKeys, huggingfaceApiKey: val }),
                  'Accès aux modèles du Hub Hugging Face'
                )}

                {renderKeyInput(
                  'Aleph Alpha',
                  'alephAlphaApiKey',
                  'AA_...',
                  llmKeys.alephAlphaApiKey,
                  (val) => setLlmKeys({ ...llmKeys, alephAlphaApiKey: val }),
                  'Pour Luminous avec explainability'
                )}

                {renderKeyInput(
                  'NLP Cloud',
                  'nlpCloudApiKey',
                  'nlpcloud-...',
                  llmKeys.nlpCloudApiKey,
                  (val) => setLlmKeys({ ...llmKeys, nlpCloudApiKey: val }),
                  'Pour modèles GPT-J, Bloom et autres'
                )}

                <div className="pt-4">
                  <Button
                    onClick={() => handleSave('llm')}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les clés LLM'}
                  </Button>
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
                  Providers Scraping & Data
                </CardTitle>
                <CardDescription>
                  Configurez vos clés API pour le scraping et la recherche de données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyInput(
                  'SERP API (Google Search)',
                  'serpApiKey',
                  'serp-...',
                  scrapingKeys.serpApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, serpApiKey: val }),
                  'Pour les recherches Google automatisées'
                )}

                {renderKeyInput(
                  'Firecrawl',
                  'firecrawlApiKey',
                  'fc-...',
                  scrapingKeys.firecrawlApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, firecrawlApiKey: val }),
                  'Web scraping avec conversion en Markdown'
                )}

                {renderKeyInput(
                  'Pica AI',
                  'picaApiKey',
                  'pica-...',
                  scrapingKeys.picaApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, picaApiKey: val }),
                  'Recherche immobilière intelligente'
                )}

                {renderKeyInput(
                  'Jina Reader',
                  'jinaReaderApiKey',
                  'jina-...',
                  scrapingKeys.jinaReaderApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, jinaReaderApiKey: val }),
                  'Conversion de pages web en texte lisible'
                )}

                {renderKeyInput(
                  'ScrapingBee',
                  'scrapingBeeApiKey',
                  'sb-...',
                  scrapingKeys.scrapingBeeApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, scrapingBeeApiKey: val }),
                  'Web scraping avec rotation de proxy'
                )}

                {renderKeyInput(
                  'Browserless',
                  'browserlessApiKey',
                  'bl-...',
                  scrapingKeys.browserlessApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, browserlessApiKey: val }),
                  'Automatisation de navigateur headless'
                )}

                {renderKeyInput(
                  'RapidAPI',
                  'rapidApiKey',
                  'rapid-...',
                  scrapingKeys.rapidApiKey,
                  (val) => setScrapingKeys({ ...scrapingKeys, rapidApiKey: val }),
                  'Accès à des milliers d\'APIs'
                )}

                <div className="pt-4">
                  <Button
                    onClick={() => handleSave('scraping')}
                    disabled={loading}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Sauvegarde...' : 'Sauvegarder les clés Scraping'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
