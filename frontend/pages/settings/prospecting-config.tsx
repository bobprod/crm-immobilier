import React, { useState, useEffect } from 'react';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import apiClient from '@/shared/utils/backend-api';
import { CheckCircle2, XCircle, Loader2, Settings, Search, Flame, Globe, Sparkles } from 'lucide-react';

interface APIConfig {
    pica?: {
        apiKey: string;
        enabled: boolean;
    };
    serp?: {
        apiKey: string;
        enabled: boolean;
    };
    firecrawl?: {
        apiKey: string;
        enabled: boolean;
    };
    scraping?: {
        enabled: boolean;
        maxConcurrent: number;
        timeout: number;
    };
    llm?: {
        enabled: boolean;
        provider: string;
    };
}

export default function ProspectingConfigPage() {
    const [config, setConfig] = useState<APIConfig>({
        pica: { apiKey: '', enabled: false },
        serp: { apiKey: '', enabled: false },
        firecrawl: { apiKey: '', enabled: false },
        scraping: { enabled: true, maxConcurrent: 5, timeout: 30000 },
        llm: { enabled: true, provider: 'openai' },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
    const [testResults, setTestResults] = useState<{ [key: string]: any }>({});

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            // Load from different settings endpoints
            const responses = await Promise.allSettled([
                apiClient.get('/settings/prospecting/pica'),
                apiClient.get('/settings/prospecting/serp'),
                apiClient.get('/settings/prospecting/firecrawl'),
                apiClient.get('/settings/prospecting/scraping'),
                apiClient.get('/settings/prospecting/llm'),
            ]);

            const newConfig: APIConfig = { ...config };

            if (responses[0].status === 'fulfilled') newConfig.pica = responses[0].value.data;
            if (responses[1].status === 'fulfilled') newConfig.serp = responses[1].value.data;
            if (responses[2].status === 'fulfilled') newConfig.firecrawl = responses[2].value.data;
            if (responses[3].status === 'fulfilled') newConfig.scraping = responses[3].value.data;
            if (responses[4].status === 'fulfilled') newConfig.llm = responses[4].value.data;

            setConfig(newConfig);
        } catch (error) {
            console.error('Erreur chargement config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (section: string) => {
        try {
            setSaving(true);
            await apiClient.post(`/settings/prospecting/${section}`, config[section as keyof APIConfig]);
            alert(`Configuration ${section} sauvegardée !`);
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async (service: string) => {
        try {
            setTesting({ ...testing, [service]: true });
            setTestResults({ ...testResults, [service]: null });

            const response = await apiClient.post(`/settings/prospecting/${service}/test`);
            setTestResults({ ...testResults, [service]: response.data });
        } catch (error: any) {
            console.error('Erreur test:', error);
            setTestResults({
                ...testResults,
                [service]: {
                    success: false,
                    message: error.response?.data?.message || 'Erreur lors du test'
                }
            });
        } finally {
            setTesting({ ...testing, [service]: false });
        }
    };

    const updateConfig = (section: keyof APIConfig, key: string, value: any) => {
        setConfig({
            ...config,
            [section]: {
                ...config[section],
                [key]: value,
            },
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="h-8 w-8" />
                        Configuration Prospection
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Configurez les intégrations et API pour la prospection automatique
                    </p>
                </div>

                <Tabs defaultValue="pica" className="space-y-6">
                    <TabsList className="grid grid-cols-5 w-full">
                        <TabsTrigger value="pica" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Pica API
                        </TabsTrigger>
                        <TabsTrigger value="serp" className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            SERP API
                        </TabsTrigger>
                        <TabsTrigger value="firecrawl" className="flex items-center gap-2">
                            <Flame className="h-4 w-4" />
                            Firecrawl
                        </TabsTrigger>
                        <TabsTrigger value="scraping" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Scraping
                        </TabsTrigger>
                        <TabsTrigger value="llm" className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            LLM/IA
                        </TabsTrigger>
                    </TabsList>

                    {/* Pica API Configuration */}
                    <TabsContent value="pica">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-purple-600" />
                                    Configuration Pica API
                                </CardTitle>
                                <CardDescription>
                                    Pica API combine SERP et Firecrawl pour une prospection puissante
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="pica-enabled"
                                        checked={config.pica?.enabled}
                                        onChange={(e) => updateConfig('pica', 'enabled', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="pica-enabled">Activer Pica API</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="pica-key">Clé API Pica</Label>
                                    <Input
                                        id="pica-key"
                                        type="password"
                                        placeholder="pica_xxxxxxxxxxxxx"
                                        value={config.pica?.apiKey || ''}
                                        onChange={(e) => updateConfig('pica', 'apiKey', e.target.value)}
                                        disabled={!config.pica?.enabled}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Obtenez votre clé API sur{' '}
                                        <a
                                            href="https://pica.ai"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-600 hover:underline"
                                        >
                                            pica.ai
                                        </a>
                                    </p>
                                </div>

                                {testResults.pica && (
                                    <Alert variant={testResults.pica.success ? 'default' : 'destructive'}>
                                        {testResults.pica.success ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <XCircle className="h-4 w-4" />
                                        )}
                                        <AlertDescription>{testResults.pica.message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('pica')} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Enregistrer
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleTest('pica')}
                                        disabled={testing.pica || !config.pica?.apiKey}
                                    >
                                        {testing.pica ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Tester la connexion
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SERP API Configuration */}
                    <TabsContent value="serp">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5 text-blue-600" />
                                    Configuration SERP API
                                </CardTitle>
                                <CardDescription>
                                    API de recherche Google pour extraire des résultats SERP
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="serp-enabled"
                                        checked={config.serp?.enabled}
                                        onChange={(e) => updateConfig('serp', 'enabled', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="serp-enabled">Activer SERP API</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serp-key">Clé API SERP</Label>
                                    <Input
                                        id="serp-key"
                                        type="password"
                                        placeholder="serp_xxxxxxxxxxxxx"
                                        value={config.serp?.apiKey || ''}
                                        onChange={(e) => updateConfig('serp', 'apiKey', e.target.value)}
                                        disabled={!config.serp?.enabled}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Obtenez votre clé API sur{' '}
                                        <a
                                            href="https://serpapi.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            serpapi.com
                                        </a>
                                    </p>
                                </div>

                                {testResults.serp && (
                                    <Alert variant={testResults.serp.success ? 'default' : 'destructive'}>
                                        {testResults.serp.success ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <XCircle className="h-4 w-4" />
                                        )}
                                        <AlertDescription>{testResults.serp.message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('serp')} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Enregistrer
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleTest('serp')}
                                        disabled={testing.serp || !config.serp?.apiKey}
                                    >
                                        {testing.serp ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Tester la connexion
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Firecrawl Configuration */}
                    <TabsContent value="firecrawl">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-600" />
                                    Configuration Firecrawl
                                </CardTitle>
                                <CardDescription>
                                    Service de web scraping puissant pour extraire du contenu structuré
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="firecrawl-enabled"
                                        checked={config.firecrawl?.enabled}
                                        onChange={(e) => updateConfig('firecrawl', 'enabled', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="firecrawl-enabled">Activer Firecrawl</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="firecrawl-key">Clé API Firecrawl</Label>
                                    <Input
                                        id="firecrawl-key"
                                        type="password"
                                        placeholder="fc-xxxxxxxxxxxxx"
                                        value={config.firecrawl?.apiKey || ''}
                                        onChange={(e) => updateConfig('firecrawl', 'apiKey', e.target.value)}
                                        disabled={!config.firecrawl?.enabled}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Obtenez votre clé API sur{' '}
                                        <a
                                            href="https://firecrawl.dev"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-orange-600 hover:underline"
                                        >
                                            firecrawl.dev
                                        </a>
                                    </p>
                                </div>

                                {testResults.firecrawl && (
                                    <Alert variant={testResults.firecrawl.success ? 'default' : 'destructive'}>
                                        {testResults.firecrawl.success ? (
                                            <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                            <XCircle className="h-4 w-4" />
                                        )}
                                        <AlertDescription>{testResults.firecrawl.message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('firecrawl')} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Enregistrer
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleTest('firecrawl')}
                                        disabled={testing.firecrawl || !config.firecrawl?.apiKey}
                                    >
                                        {testing.firecrawl ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Tester la connexion
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Scraping Configuration */}
                    <TabsContent value="scraping">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-gray-600" />
                                    Configuration Scraping
                                </CardTitle>
                                <CardDescription>
                                    Paramètres généraux pour le web scraping personnalisé
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="scraping-enabled"
                                        checked={config.scraping?.enabled}
                                        onChange={(e) => updateConfig('scraping', 'enabled', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="scraping-enabled">Activer le scraping personnalisé</Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max-concurrent">Nombre de requêtes simultanées</Label>
                                    <Input
                                        id="max-concurrent"
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={config.scraping?.maxConcurrent || 5}
                                        onChange={(e) => updateConfig('scraping', 'maxConcurrent', parseInt(e.target.value))}
                                        disabled={!config.scraping?.enabled}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Nombre maximum de pages à scraper simultanément (1-20)
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="timeout">Timeout (ms)</Label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        min="5000"
                                        max="120000"
                                        step="1000"
                                        value={config.scraping?.timeout || 30000}
                                        onChange={(e) => updateConfig('scraping', 'timeout', parseInt(e.target.value))}
                                        disabled={!config.scraping?.enabled}
                                    />
                                    <p className="text-sm text-gray-500">
                                        Temps maximum d'attente par page en millisecondes (5000-120000)
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('scraping')} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Enregistrer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* LLM/IA Configuration */}
                    <TabsContent value="llm">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                    Configuration LLM / IA
                                </CardTitle>
                                <CardDescription>
                                    Intelligence artificielle pour l'analyse et la qualification automatique des leads
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="llm-enabled"
                                        checked={config.llm?.enabled}
                                        onChange={(e) => updateConfig('llm', 'enabled', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="llm-enabled">Activer l'analyse IA des leads</Label>
                                </div>

                                <Alert>
                                    <Sparkles className="h-4 w-4" />
                                    <AlertDescription>
                                        La configuration détaillée du LLM est disponible dans{' '}
                                        <a href="/settings/llm-config" className="text-indigo-600 hover:underline font-medium">
                                            Paramètres → Configuration LLM
                                        </a>
                                    </AlertDescription>
                                </Alert>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-2">Fonctionnalités IA activées :</h4>
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>Détection automatique d'opportunités dans les résultats SERP</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>Analyse et extraction des informations de contact</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>Classification automatique des leads par qualité</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>Enrichissement des données avec contexte business</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => handleSave('llm')} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Enregistrer
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.href = '/settings/llm-config'}
                                    >
                                        Configurer le LLM
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Info Box */}
                <Card className="mt-6 border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    ℹ️
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-blue-900 mb-1">
                                    À propos des configurations API
                                </h4>
                                <p className="text-sm text-blue-800">
                                    Ces paramètres contrôlent les intégrations externes pour la prospection automatique.
                                    Vous pouvez activer ou désactiver chaque service indépendamment. Les clés API sont
                                    stockées de manière sécurisée et ne sont jamais exposées côté client.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
