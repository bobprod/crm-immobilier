import { useState, useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
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

function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return (
        localStorage.getItem('auth_token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('crm-token') ||
        localStorage.getItem('token')
    );
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
    mistral: string[];
    openrouter: string[];
}

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
    mistral: [
        'mistral-large-latest',
        'mistral-medium-latest',
        'mistral-small-latest',
    ],
    openrouter: [
        'openai/gpt-4-turbo',
        'anthropic/claude-3-opus',
        'google/gemini-pro',
    ],
};

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
            <button onClick={onClose} className={`flex-shrink-0 ${textColor} hover:opacity-70`}>
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

    const [selectedProvider, setSelectedProvider] = useState<string>('openai');
    const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
    const [defaultProvider, setDefaultProvider] = useState<string>('openai');

    const [testingKeys, setTestingKeys] = useState<Record<string, boolean>>({});
    const [validatedKeys, setValidatedKeys] = useState<Record<string, boolean>>({});
    const [availableModelsPerKey, setAvailableModelsPerKey] = useState<Record<string, string[]>>({});

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
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
                addToast('Authentification requise', 'error');
                setLoadingKeys(false);
                return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/ai-billing/api-keys/user/full`, {
                headers: { 'Authorization': `Bearer ${token}` },
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

                if (data.defaultProvider) {
                    setDefaultProvider(data.defaultProvider);
                    setSelectedProvider(data.defaultProvider);
                }
                if (data.defaultModel) {
                    setSelectedModel(data.defaultModel);
                }
            }
        } catch (error) {
            console.error('Error loading API keys:', error);
            addToast('Erreur lors du chargement des clés API', 'error');
        } finally {
            setLoadingKeys(false);
        }
    };

    const handleTestApiKey = async (provider: string, apiKey: string) => {
        if (!apiKey || apiKey.trim() === '') {
            addToast('Veuillez entrer une clé API', 'error');
            return;
        }

        setTestingKeys(prev => ({ ...prev, [provider]: true }));

        try {
            let models: string[] = [];
            let isValid = false;

            if (provider === 'openai') {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    isValid = true;
                    models = data.data
                        .filter((m: any) => m.id.includes('gpt'))
                        .map((m: any) => m.id)
                        .slice(0, 10);
                }
            } else if (provider === 'gemini') {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
                );
                if (response.ok) {
                    const data = await response.json();
                    isValid = true;
                    models = data.models
                        .filter((m: any) => m.name.includes('gemini'))
                        .map((m: any) => m.name.replace('models/', ''))
                        .slice(0, 10);
                }
            } else if (provider === 'anthropic') {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'claude-3-sonnet-20240229',
                        max_tokens: 1,
                        messages: [{ role: 'user', content: 'test' }],
                    }),
                });
                if (response.ok || response.status === 400) {
                    isValid = true;
                    models = [
                        'claude-3-5-sonnet-20241022',
                        'claude-3-opus-20240229',
                        'claude-3-sonnet-20240229',
                        'claude-3-haiku-20240307',
                    ];
                }
            } else if (provider === 'deepseek') {
                const response = await fetch('https://api.deepseek.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    isValid = true;
                    models = data.data.map((m: any) => m.id);
                }
            } else if (provider === 'mistral') {
                const response = await fetch('https://api.mistral.ai/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    isValid = true;
                    models = data.data.map((m: any) => m.id);
                }
            } else if (provider === 'openrouter') {
                const response = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: { 'Authorization': `Bearer ${apiKey}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    isValid = true;
                    models = data.data.slice(0, 15).map((m: any) => m.id);
                }
            }

            if (!models.length) {
                models = PROVIDER_MODELS[provider as keyof ProviderModels] || [];
            }

            if (isValid) {
                addToast(`✅ ${provider.toUpperCase()} - Clé valide!`, 'success');
                setValidatedKeys(prev => ({ ...prev, [provider]: true }));
                setAvailableModelsPerKey(prev => ({
                    ...prev,
                    [provider]: models,
                }));
                setSelectedProvider(provider);
                if (models.length > 0) {
                    setSelectedModel(models[0]);
                }
            } else {
                addToast(`❌ ${provider.toUpperCase()} - Clé invalide`, 'error');
                setValidatedKeys(prev => ({ ...prev, [provider]: false }));
            }
        } catch (error) {
            console.error('Test error:', error);
            addToast(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur'}`, 'error');
            setValidatedKeys(prev => ({ ...prev, [provider]: false }));
        } finally {
            setTestingKeys(prev => ({ ...prev, [provider]: false }));
        }
    };

    const toggleShowKey = (keyName: string) => {
        setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
    };

    const getProviderFromKeyName = (keyName: string): string | null => {
        const mapping: Record<string, string> = {
            'openaiApiKey': 'openai',
            'geminiApiKey': 'gemini',
            'deepseekApiKey': 'deepseek',
            'anthropicApiKey': 'anthropic',
            'openrouterApiKey': 'openrouter',
            'mistralApiKey': 'mistral',
        };
        return mapping[keyName] || null;
    };

    const handleSave = async (category: 'llm' | 'scraping') => {
        setLoading(true);

        try {
            const token = getAuthToken();
            if (!token) {
                addToast('Authentification requise', 'error');
                return;
            }

            const keysToSave = category === 'llm' ? llmKeys : scrapingKeys;

            const filteredKeys = Object.fromEntries(
                Object.entries(keysToSave).filter(([_, value]) => value && value !== '')
            );

            if (Object.keys(filteredKeys).length === 0) {
                addToast('Veuillez entrer au moins une clé API', 'error');
                return;
            }

            const dataToSend = category === 'llm'
                ? {
                    ...filteredKeys,
                    defaultProvider: selectedProvider,
                    defaultModel: selectedModel,
                }
                : filteredKeys;

            console.log('📤 Saving:', dataToSend);

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
                addToast(
                    category === 'llm'
                        ? `✅ Clés LLM sauvegardées! ${selectedProvider.toUpperCase()} - ${selectedModel}`
                        : '✅ Clés Scraping sauvegardées!',
                    'success'
                );
                setTimeout(() => loadApiKeys(), 500);
            } else {
                const errorData = await response.json().catch(() => ({}));
                addToast(`❌ Erreur: ${errorData.message || 'Erreur lors de la sauvegarde'}`, 'error');
            }
        } catch (error) {
            console.error('Save error:', error);
            addToast(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur'}`, 'error');
        } finally {
            setLoading(false);
        }
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
        const availableModels = provider ? availableModelsPerKey[provider] || [] : [];

        return (
            <div key={keyName} className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                    <Label className="font-semibold text-gray-900">{label}</Label>
                    {isValidated && (
                        <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                            <CheckCircle className="h-3.5 w-3.5" /> ✓ Validée
                        </span>
                    )}
                </div>

                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <Input
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
                            className={`gap-1.5 whitespace-nowrap font-medium ${isValidated
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'opacity-50 cursor-not-allowed'
                                }`}
                            data-testid={`test-btn-${provider}`}
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

                {/* Models dropdown when validated */}
                {isValidated && isLLMKey && provider && availableModels.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Label className="text-sm font-medium text-green-900 mb-2 block">
                            Modèles disponibles:
                        </Label>
                        <select
                            value={selectedProvider === provider ? selectedModel : ''}
                            onChange={(e) => {
                                if (selectedProvider === provider) {
                                    setSelectedModel(e.target.value);
                                }
                            }}
                            className="w-full px-3 py-2 border border-green-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                            data-testid={`models-select-${provider}`}
                        >
                            <option value="">Sélectionner un modèle *</option>
                            {availableModels.map((model) => (
                                <option key={model} value={model}>
                                    {model}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-green-700 mt-2">
                            {availableModels.length} modèle(s) disponible(s)
                        </p>
                    </div>
                )}

                {description && <p className="text-xs text-gray-600 mt-2">{description}</p>}
            </div>
        );
    };

    if (loadingKeys) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 p-6">
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    const availableModels = PROVIDER_MODELS[selectedProvider as keyof ProviderModels] || [];

    return (
        <ProtectedRoute>
            <MainLayout
                title="Clés API & Configuration LLM"
                breadcrumbs={[
                    { label: 'Paramètres', href: '/settings' },
                    { label: 'Clés API' },
                ]}
            >
                <div className="max-w-5xl mx-auto space-y-6">
                    <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            <strong>Tous les champs sont optionnels.</strong> Testez votre clé API pour récupérer les modèles disponibles.
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

                        <TabsContent value="llm">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-purple-600" />
                                        Configuration LLM & Providers
                                    </CardTitle>
                                    <CardDescription>
                                        Entrez vos clés API, testez-les, puis sauvegardez avec votre modèle préféré
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900">Clés API</h3>

                                        {renderKeyInput(
                                            'OpenAI (GPT)',
                                            'openaiApiKey',
                                            'sk-...',
                                            llmKeys.openaiApiKey,
                                            (val) => setLlmKeys({ ...llmKeys, openaiApiKey: val }),
                                            'Pour GPT-4, GPT-3.5-turbo',
                                            true
                                        )}

                                        {renderKeyInput(
                                            'Google Gemini',
                                            'geminiApiKey',
                                            'AIza...',
                                            llmKeys.geminiApiKey,
                                            (val) => setLlmKeys({ ...llmKeys, geminiApiKey: val }),
                                            'Pour Gemini Pro',
                                            true
                                        )}

                                        {renderKeyInput(
                                            'DeepSeek',
                                            'deepseekApiKey',
                                            'sk-...',
                                            llmKeys.deepseekApiKey,
                                            (val) => setLlmKeys({ ...llmKeys, deepseekApiKey: val }),
                                            'Pour DeepSeek Chat/Coder',
                                            true
                                        )}

                                        {renderKeyInput(
                                            'Anthropic (Claude)',
                                            'anthropicApiKey',
                                            'sk-ant-...',
                                            llmKeys.anthropicApiKey,
                                            (val) => setLlmKeys({ ...llmKeys, anthropicApiKey: val }),
                                            'Pour Claude 3',
                                            true
                                        )}

                                        {renderKeyInput(
                                            'Mistral AI',
                                            'mistralApiKey',
                                            'mistral-...',
                                            llmKeys.mistralApiKey,
                                            (val) => setLlmKeys({ ...llmKeys, mistralApiKey: val }),
                                            'Pour Mistral',
                                            true
                                        )}

                                        {renderKeyInput(
                                            'OpenRouter',
                                            'openrouterApiKey',
                                            'sk-or-...',
                                            llmKeys.openrouterApiKey,
                                            (val) => setLlmKeys({ ...llmKeys, openrouterApiKey: val }),
                                            'Accès multi-providers',
                                            true
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => handleSave('llm')}
                                        disabled={loading}
                                        className="w-full"
                                        size="lg"
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
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="scraping">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Search className="h-5 w-5 text-blue-600" />
                                        Scraping & Data
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {renderKeyInput('SERP API', 'serpApiKey', 'serp-...', scrapingKeys.serpApiKey, (val) => setScrapingKeys({ ...scrapingKeys, serpApiKey: val }))}
                                    {renderKeyInput('Firecrawl', 'firecrawlApiKey', 'fc_...', scrapingKeys.firecrawlApiKey, (val) => setScrapingKeys({ ...scrapingKeys, firecrawlApiKey: val }))}
                                    {renderKeyInput('Jina Reader', 'jinaReaderApiKey', 'jina-...', scrapingKeys.jinaReaderApiKey, (val) => setScrapingKeys({ ...scrapingKeys, jinaReaderApiKey: val }))}

                                    <Button onClick={() => handleSave('scraping')} disabled={loading} className="w-full" size="lg" data-testid="button-save-scraping">
                                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                        Enregistrer les clés Scraping
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="fixed bottom-4 right-4 space-y-2 z-50">
                    {toasts.map(toast => (
                        <ToastNotification key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </div>
            </MainLayout>
        </ProtectedRoute>
    );
}
