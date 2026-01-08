import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import apiClient from '@/shared/utils/backend-api';

export interface ProviderInfo {
    provider: string;
    available: boolean;
    requiresApiKey: boolean;
    priority: number;
    description: string;
    tier: 'search' | 'scraping' | 'enrichment';
}

export interface ProviderStrategy {
    search: string[];
    scrape: string[];
}

export interface ProspectionProviderSelectorProps {
    tenantId?: string;
    onStrategyChange?: (strategy: ProviderStrategy) => void;
}

export const ProspectionProviderSelector: React.FC<ProspectionProviderSelectorProps> = ({
    tenantId,
    onStrategyChange,
}) => {
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

            if (onStrategyChange) {
                onStrategyChange({
                    search: selectedSearch ? [selectedSearch] : [],
                    scrape: selectedScrape ? [selectedScrape] : [],
                });
            }

            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
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

    const searchProviders = providers.filter((p) => p.tier === 'search' && p.available);
    const scrapingProviders = providers.filter((p) => p.tier === 'scraping' && p.available);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                    Configurez vos providers préférés pour la prospection. Le système utilisera automatiquement
                    les providers disponibles selon vos clés API configurées.
                </AlertDescription>
            </Alert>

            {/* Message */}
            {message && (
                <Alert
                    className={
                        message.type === 'success'
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
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

            {/* Search Providers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Providers de Recherche
                    </CardTitle>
                    <CardDescription>
                        Utilisé pour trouver des prospects (recherche Google, données publiques)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {searchProviders.length === 0 ? (
                        <Alert className="border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800">
                                Aucun provider de recherche disponible. Configurez vos clés API dans les paramètres.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {searchProviders.map((provider) => (
                                <label
                                    key={provider.provider}
                                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${selectedSearch === provider.provider
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
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            {getProviderIcon(provider.tier)}
                                            {provider.provider}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{provider.description}</p>
                                        <div className="mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                {provider.requiresApiKey ? 'Nécessite clé API' : 'Intégré'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {provider.available && (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Scraping Providers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Providers de Scraping
                    </CardTitle>
                    <CardDescription>
                        Utilisé pour extraire des données des pages web trouvées
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {scrapingProviders.map((provider) => (
                                <label
                                    key={provider.provider}
                                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${selectedScrape === provider.provider
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
                                        className="mt-1"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm flex items-center gap-2">
                                            {getProviderIcon(provider.tier)}
                                            {provider.provider}
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{provider.description}</p>
                                        <div className="mt-2">
                                            <Badge variant="outline" className="text-xs">
                                                {provider.requiresApiKey ? 'Nécessite clé API' : 'Intégré'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {provider.available && (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    )}
                                </label>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSavePreferences}
                    disabled={saving || (!selectedSearch && !selectedScrape)}
                    size="lg"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sauvegarde...
                        </>
                    ) : (
                        'Sauvegarder les préférences'
                    )}
                </Button>
            </div>
        </div>
    );
};
