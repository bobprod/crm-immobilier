import { Injectable, Logger } from '@nestjs/common';
import { ApiKeysService, ProviderType } from '../../../../shared/services/api-keys.service';

/**
 * Types de providers de scraping/recherche disponibles
 */
export enum ScrapingProvider {
    // NIVEAU 1: Recherche (intent)
    SERPAPI = 'serpapi',

    // NIVEAU 2: Scraping (exécution)
    FIRECRAWL = 'firecrawl',
    PUPPETEER = 'puppeteer',
    CHEERIO = 'cheerio',
}

/**
 * Configuration complète d'un provider
 */
export interface ProviderConfig {
    provider: ScrapingProvider;
    available: boolean;
    requiresApiKey: boolean;
    priority: number; // 1 = meilleur, 10 = moins bon
    description: string;
    tier: 'search' | 'scraping' | 'enrichment'; // Niveau fonctionnel
}

/**
 * Stratégie de sélection de provider
 */
export interface ProviderStrategy {
    search: ScrapingProvider[]; // Pour chercher des prospects (SerpAPI)
    scrape: ScrapingProvider[]; // Pour scraper des pages (Firecrawl > Puppeteer > Cheerio)
    enrichment: ScrapingProvider[]; // Pour enrichir des données
    analysis: string[]; // Pour analyser (toujours LLM)
}

/**
 * Service de sélection intelligente de providers
 *
 * Adapte le choix des providers de scraping selon:
 * - La disponibilité des clés API BYOK
 * - Les capabilities nécessaires
 * - L'ordre de préférence
 */
@Injectable()
export class ProviderSelectorService {
    private readonly logger = new Logger(ProviderSelectorService.name);

    constructor(private apiKeysService: ApiKeysService) { }

    /**
     * Obtenir les providers disponibles pour un utilisateur/agence
     */
    async getAvailableProviders(
        userId: string,
        agencyId?: string,
    ): Promise<Map<ScrapingProvider, ProviderConfig>> {
        this.logger.log(`Getting available providers for userId=${userId}, agencyId=${agencyId}`);

        const available = new Map<ScrapingProvider, ProviderConfig>();

        // 1. SerpAPI (recherche)
        try {
            const serpApiKey = await this.apiKeysService.getApiKey(userId, 'serp', agencyId);
            if (serpApiKey) {
                available.set(ScrapingProvider.SERPAPI, {
                    provider: ScrapingProvider.SERPAPI,
                    available: true,
                    requiresApiKey: true,
                    priority: 1,
                    description: 'SerpAPI - Recherche Google',
                    tier: 'search',
                });
                this.logger.log('✅ SerpAPI available');
            }
        } catch (error) {
            this.logger.log('⚠️ SerpAPI not available:', error.message);
        }

        // 2. Firecrawl (scraping)
        try {
            const firecrawlKey = await this.apiKeysService.getApiKey(userId, 'firecrawl', agencyId);
            if (firecrawlKey) {
                available.set(ScrapingProvider.FIRECRAWL, {
                    provider: ScrapingProvider.FIRECRAWL,
                    available: true,
                    requiresApiKey: true,
                    priority: 1,
                    description: 'Firecrawl - Scraping avancé',
                    tier: 'scraping',
                });
                this.logger.log('✅ Firecrawl available');
            }
        } catch (error) {
            this.logger.log('⚠️ Firecrawl not available:', error.message);
        }

        // 3. Puppeteer (moteur intégré - toujours disponible)
        available.set(ScrapingProvider.PUPPETEER, {
            provider: ScrapingProvider.PUPPETEER,
            available: true,
            requiresApiKey: false,
            priority: 2,
            description: 'Puppeteer - Moteur intégré (JavaScript)',
            tier: 'scraping',
        });
        this.logger.log('✅ Puppeteer available (built-in)');

        // 4. Cheerio (moteur léger intégré - toujours disponible)
        available.set(ScrapingProvider.CHEERIO, {
            provider: ScrapingProvider.CHEERIO,
            available: true,
            requiresApiKey: false,
            priority: 3,
            description: 'Cheerio - Moteur léger intégré',
            tier: 'scraping',
        });
        this.logger.log('✅ Cheerio available (built-in)');

        return available;
    }

    /**
     * Sélectionner les meilleurs providers pour une stratégie d'exécution
     */
    async selectOptimalStrategy(
        userId: string,
        agencyId?: string,
    ): Promise<ProviderStrategy> {
        const available = await this.getAvailableProviders(userId, agencyId);

        // Sélectionner les providers optimaux pour chaque étape
        const strategy: ProviderStrategy = {
            search: [],
            scrape: [],
            enrichment: [],
            analysis: ['llm'], // LLM toujours disponible
        };

        // ============================================
        // TIER 1: Recherche (SerpAPI uniquement)
        // ============================================
        const searchProviders = [ScrapingProvider.SERPAPI];
        strategy.search = searchProviders.filter((p) =>
            available.has(p) && available.get(p)!.available,
        );

        // ============================================
        // TIER 2: Scraping (Firecrawl > Puppeteer > Cheerio)
        // ============================================
        // Cette hiérarchie suit la logique de WebDataService
        const scrapeProviders = [
            ScrapingProvider.FIRECRAWL, // Meilleur: IA + sites complexes
            ScrapingProvider.PUPPETEER, // Alternatif: sites JS dynamiques
            ScrapingProvider.CHEERIO,   // Fallback: sites statiques
        ];
        strategy.scrape = scrapeProviders.filter((p) =>
            available.has(p) && available.get(p)!.available,
        );

        // ============================================
        // TIER 3: Enrichissement (Puppeteer > Cheerio)
        // ============================================
        const enrichmentProviders = [
            ScrapingProvider.PUPPETEER,
            ScrapingProvider.CHEERIO,
        ];
        strategy.enrichment = enrichmentProviders.filter((p) =>
            available.has(p) && available.get(p)!.available,
        );

        this.logger.log(
            `Optimal strategy: search=[${strategy.search.join(', ')}], ` +
            `scrape=[${strategy.scrape.join(', ')}], ` +
            `enrichment=[${strategy.enrichment.join(', ')}], ` +
            `analysis=[${strategy.analysis.join(', ')}]`
        );

        return strategy;
    }

    /**
     * Obtenir le premier provider disponible pour une tâche
     */
    async getPreferredProvider(
        task: 'search' | 'scrape' | 'enrichment',
        userId: string,
        agencyId?: string,
    ): Promise<ScrapingProvider | null> {
        const strategy = await this.selectOptimalStrategy(userId, agencyId);

        const providers = strategy[task];
        if (providers.length === 0) {
            this.logger.warn(`⚠️ No providers available for task: ${task}`);
            return null;
        }

        const selected = providers[0];
        this.logger.log(`Selected provider for ${task}: ${selected}`);
        return selected;
    }

    /**
     * Vérifier si une clé API est valide/disponible
     */
    async isProviderAvailable(
        provider: ScrapingProvider,
        userId: string,
        agencyId?: string,
    ): Promise<boolean> {
        try {
            const apiKeyType = this.getApiKeyTypeForProvider(provider);
            if (!apiKeyType) {
                // Providers intégrés (pas de clé)
                return true;
            }

            const key = await this.apiKeysService.getApiKey(userId, apiKeyType as ProviderType, agencyId);
            return !!key;
        } catch (error) {
            this.logger.warn(`Provider ${provider} not available: ${error.message}`);
            return false;
        }
    }

    /**
     * Obtenir le type de clé API pour un provider
     */
    private getApiKeyTypeForProvider(provider: ScrapingProvider): string | null {
        switch (provider) {
            case ScrapingProvider.SERPAPI:
                return 'serp';
            case ScrapingProvider.FIRECRAWL:
                return 'firecrawl';
            case ScrapingProvider.PUPPETEER:
            case ScrapingProvider.CHEERIO:
                return null; // Providers intégrés
            default:
                return null;
        }
    }

    /**
     * Obtenir les tools disponibles pour IntentAnalyzer
     *
     * Retourne dynamiquement les tools DISPONIBLES selon les clés API
     *
     * @example
     * // Si SerpAPI + Firecrawl disponibles:
     * ['llm', 'serpapi', 'firecrawl']
     *
     * // Si uniquement moteurs intégrés:
     * ['llm', 'puppeteer', 'cheerio']
     */
    async getAvailableTools(
        userId: string,
        agencyId?: string,
    ): Promise<string[]> {
        const available = await this.getAvailableProviders(userId, agencyId);
        const tools: string[] = [];

        // LLM est toujours disponible
        tools.push('llm');

        // Ajouter les providers disponibles en tant que tools
        if (available.get(ScrapingProvider.SERPAPI)?.available) {
            tools.push('serpapi');
        }
        if (available.get(ScrapingProvider.FIRECRAWL)?.available) {
            tools.push('firecrawl');
        }
        if (available.get(ScrapingProvider.PUPPETEER)?.available) {
            tools.push('puppeteer');
        }
        if (available.get(ScrapingProvider.CHEERIO)?.available) {
            tools.push('cheerio');
        }

        this.logger.log(`Available tools: [${tools.join(', ')}]`);

        // Si aucun provider disponible, au moins retourner LLM + moteurs intégrés
        if (tools.length === 1) {
            // LLM + Puppeteer + Cheerio sont toujours disponibles (built-in)
            tools.push('puppeteer', 'cheerio');
            this.logger.warn(
                'Aucun provider externe disponible. Utilisant moteurs intégrés (Puppeteer + Cheerio)',
            );
        }

        return tools;
    }
}
