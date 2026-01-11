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
    Sparkles,
    Loader2,
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

interface ProviderModels {
    gemini: string[];
    openai: string[];
    deepseek: string[];
    anthropic: string[];
}

// Hardcoded models list
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

export default function EnhancedAIApiKeysPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingKeys, setLoadingKeys] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

    const [llmKeys, setLlmKeys] = useState<ApiKeys>({});
    const [scrapingKeys, setScrapingKeys] = useState<ApiKeys>({});

    // State for model and provider selection
    const [selectedProvider, setSelectedProvider] = useState<string>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
    const [defaultProvider, setDefaultProvider] = useState<string>('openai');

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

                // Load saved provider and model
                if (data.defaultProvider) {
                    setDefaultProvider(data.defaultProvider);
                    setSelectedProvider(data.defaultProvider);
                }
                if (data.defaultModel) {
                    setSelectedModel(data.defaultModel);
                } else if (data.defaultProvider) {
                    // Set first model of the default provider
                    const models = PROVIDER_MODELS[data.defaultProvider as keyof ProviderModels] || [];
                    if (models.length > 0) {
                        setSelectedModel(models[0]);
                    }
                }
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

            // Add provider and model to the request if saving LLM keys
            const dataToSend = category === 'llm'
                ? {
                    ...keysToSave,
                    defaultProvider: selectedProvider,
                    defaultModel: selectedModel,
                }
                : keysToSave;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai-billing/api-keys/user`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(dataToSend),
            });

            if (response.ok) {
                const responseData = await response.json();
                setMessage({
                    type: 'success',
                    text: `Clés API sauvegardées avec succès!${category === 'llm' ? ` Provider: ${selectedProvider}, Modèle: ${selectedModel}` : ''}`
                });
                setTimeout(() => setMessage(null), 5000);
            } else {
                setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur de connexion au serveur' });
            console.error('Save error:', error);
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

    const availableModels = PROVIDER_MODELS[selectedProvider as keyof ProviderModels] || [];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Key className="h-8 w-8 text-blue-600" />
                        Mes Clés API & Configuration LLM
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Configurez vos clés API et sélectionnez votre modèle LLM par défaut
                    </p>
                </div>

                {/* Info Alert */}
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>BYOK (Bring Your Own Key)</strong> : Vos clés API personnelles sont prioritaires. Les champs optionnels permettent de configurer plusieurs providers.
                    </AlertDescription>
                </Alert>

                {message && (
                    <Alert className={`${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
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
                                                    // Set first model of selected provider
                                                    const models = PROVIDER_MODELS[e.target.value as keyof ProviderModels] || [];
                                                    if (models.length > 0) {
                                                        setSelectedModel(models[0]);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-purple-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1"
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
                                            <p className="text-sm text-purple-900">
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
                                    <Button
                                        onClick={() => handleSave('llm')}
                                        disabled={loading}
                                        className="w-full"
                                        size="lg"
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
                                    <Button
                                        onClick={() => handleSave('scraping')}
                                        disabled={loading}
                                        className="w-full"
                                        size="lg"
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
