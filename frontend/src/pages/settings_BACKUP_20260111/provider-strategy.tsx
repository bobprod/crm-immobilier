import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    Globe,
    AlertCircle,
    Zap,
    ArrowLeft,
} from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

interface ProviderInfo {
    provider: string;
    available: boolean;
    requiresApiKey: boolean;
    priority: number;
    description: string;
    tier: 'search' | 'scraping' | 'enrichment';
}

interface ProviderStrategy {
    search: string[];
    scrape: string[];
}

export default function ProviderStrategyPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [strategy, setStrategy] = useState<ProviderStrategy>({ search: [], scrape: [] });
    const [selectedSearch, setSelectedSearch] = useState<string>('');
    const [selectedScrape, setSelectedScrape] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/ai/orchestrate/providers/available');

            setProviders(response.data.available);
            setStrategy(response.data.strategy);

            // Sélectionner les premiers de chaque catégorie
            if (response.data.strategy.search.length > 0) {
                setSelectedSearch(response.data.strategy.search[0]);
            }
            if (response.data.strategy.scrape.length > 0) {
                setSelectedScrape(response.data.strategy.scrape[0]);
            }
        } catch (error) {
            console.error('Erreur chargement providers:', error);
            setMessage({
                type: 'error',
                text: 'Impossible de charger les providers disponibles',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        try {
            setSaving(true);
            await apiClient.post('/ai/orchestrate/providers/preferences', {
                searchProviders: selectedSearch ? [selectedSearch] : [],
                scrapingProviders: selectedScrape ? [selectedScrape] : [],
                autoFallback: true,
            });

            setMessage({
                type: 'success',
                text: 'Préférences de providers sauvegardées !',
            });

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            setMessage({
                type: 'error',
                text: 'Erreur lors de la sauvegarde des préférences',
            });
        } finally {
            setSaving(false);
        }
    };

    const getProviderIcon = (tier: string) => {
        switch (tier) {
            case 'search':
                return <Search className="h-4 w-4" />;
            case 'scraping':
                return <Globe className="h-4 w-4" />;
            default:
                return <Zap className="h-4 w-4" />;
        }
    };

    const getProviderBadgeColor = (provider: string) => {
        const colors: { [key: string]: string } = {
            serpapi: 'bg-blue-100 text-blue-800',
            firecrawl: 'bg-purple-100 text-purple-800',
            puppeteer: 'bg-green-100 text-green-800',
            cheerio: 'bg-amber-100 text-amber-800',
        };
        return colors[provider] || 'bg-gray-100 text-gray-800';
    };

    const searchProviders = providers.filter((p) => p.tier === 'search' && p.available);
    const scrapingProviders = providers.filter((p) => p.tier === 'scraping' && p.available);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Link href="/settings" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Retour aux paramètres
                </Link>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="h-8 w-8 text-yellow-600" />
                        Stratégie des Providers
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Configurez vos providers préférés pour la recherche et le scraping de prospects
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <Alert
                        className={
                            message.type === 'success'
                                ? 'border-green-200 bg-green-50 mb-6'
                                : 'border-red-200 bg-red-50 mb-6'
                        }
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription
                            className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}
                        >
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Info Banner */}
                <Alert className="border-blue-200 bg-blue-50 mb-6">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        Le système utilisera automatiquement les providers disponibles selon vos clés API
                        configurées. Si le provider sélectionné n'est pas disponible, il utilisera le
                        prochain dans la chaîne de secours.
                    </AlertDescription>
                </Alert>

                {/* Search Providers */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-blue-600" />
                            Providers de Recherche
                        </CardTitle>
                        <CardDescription>
                            Utilisé pour trouver des prospects et des entreprises via Google, SerpAPI ou d'autres
                            moteurs de recherche
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {searchProviders.length === 0 ? (
                            <Alert className="border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    Aucun provider de recherche disponible. Veuillez configurer vos clés API dans{' '}
                                    <Link href="/settings/ai-api-keys" className="font-semibold hover:underline">
                                        les clés API
                                    </Link>
                                    .
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-3">
                                {searchProviders.map((provider) => (
                                    <label
                                        key={provider.provider}
                                        className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${selectedSearch === provider.provider
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="search-provider"
                                            value={provider.provider}
                                            checked={selectedSearch === provider.provider}
                                            onChange={(e) => setSelectedSearch(e.target.value)}
                                            className="mt-1 w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold flex items-center gap-2">
                                                {getProviderIcon(provider.tier)}
                                                <span className={`px-2 py-1 rounded text-sm font-mono ${getProviderBadgeColor(provider.provider)}`}>
                                                    {provider.provider}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">{provider.description}</p>
                                            <div className="mt-3 flex gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {provider.requiresApiKey ? '🔑 Nécessite clé API' : '⚙️ Intégré'}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {provider.priority > 0 ? `Priorité: ${provider.priority}` : 'Fallback'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {provider.available && (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Scraping Providers */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-green-600" />
                            Providers de Scraping
                        </CardTitle>
                        <CardDescription>
                            Utilisé pour extraire des données détaillées (email, téléphone, informations) des
                            sites web trouvés
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {scrapingProviders.length === 0 ? (
                            <Alert className="border-yellow-200 bg-yellow-50">
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800">
                                    Aucun provider de scraping disponible.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-3">
                                {scrapingProviders.map((provider) => (
                                    <label
                                        key={provider.provider}
                                        className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${selectedScrape === provider.provider
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="scrape-provider"
                                            value={provider.provider}
                                            checked={selectedScrape === provider.provider}
                                            onChange={(e) => setSelectedScrape(e.target.value)}
                                            className="mt-1 w-4 h-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold flex items-center gap-2">
                                                {getProviderIcon(provider.tier)}
                                                <span className={`px-2 py-1 rounded text-sm font-mono ${getProviderBadgeColor(provider.provider)}`}>
                                                    {provider.provider}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">{provider.description}</p>
                                            <div className="mt-3 flex gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {provider.requiresApiKey ? '🔑 Nécessite clé API' : '⚙️ Intégré'}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {provider.priority > 0 ? `Priorité: ${provider.priority}` : 'Fallback'}
                                                </Badge>
                                            </div>
                                        </div>
                                        {provider.available && (
                                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                                        )}
                                    </label>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Strategy Summary */}
                {(selectedSearch || selectedScrape) && (
                    <Card className="mb-6 border-2 border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-green-900">
                                <CheckCircle2 className="h-5 w-5" />
                                Résumé de votre stratégie
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {selectedSearch && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Recherche:</p>
                                    <Badge className="mt-1 bg-blue-100 text-blue-800">{selectedSearch}</Badge>
                                </div>
                            )}
                            {selectedScrape && (
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Scraping:</p>
                                    <Badge className="mt-1 bg-green-100 text-green-800">{selectedScrape}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                    <Link href="/settings">
                        <Button variant="outline">Annuler</Button>
                    </Link>
                    <Button
                        onClick={handleSavePreferences}
                        disabled={saving || (!selectedSearch && !selectedScrape)}
                        size="lg"
                        className="gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Sauvegarde en cours...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                Sauvegarder les préférences
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
