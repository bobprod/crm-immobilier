import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ApiKeysService } from '../../../shared/services/api-keys.service';

export interface SerpSearchResult {
    position: number;
    title: string;
    link: string;
    snippet: string;
    source?: string;
}

export interface SerpResponse {
    organic_results?: SerpSearchResult[];
    total_results?: number;
    search_metadata?: any;
}

/**
 * Service SerpAPI unifié pour la recherche Google
 */
@Injectable()
export class SerpService {
    private readonly logger = new Logger(SerpService.name);
    private readonly baseUrl = 'https://serpapi.com/search.json';

    constructor(private readonly apiKeys: ApiKeysService) { }

    /**
     * Récupérer la clé API SerpAPI
     */
    private async getApiKey(userId: string, agencyId?: string): Promise<string> {
        const apiKey = await this.apiKeys.getApiKey(userId, 'serp', agencyId);

        if (!apiKey) {
            throw new Error('SerpAPI key not configured for user');
        }

        return apiKey;
    }

    /**
     * Rechercher sur Google via SerpAPI
     */
    async search(params: {
        userId: string;
        query: string;
        location?: string;
        numResults?: number;
        language?: string;
        agencyId?: string;
    }): Promise<SerpSearchResult[]> {
        const { userId, query, location, numResults = 10, language = 'fr', agencyId } = params;

        try {
            this.logger.log(`SerpAPI search: "${query}" (User: ${userId})`);

            const apiKey = await this.getApiKey(userId, agencyId);

            // Appel direct sans retry complexe (axios a des timeouts)
            // On pourrait ajouter un retry simple ici si nécessaire
            const response = await axios.get<SerpResponse>(this.baseUrl, {
                params: {
                    q: query,
                    api_key: apiKey,
                    num: numResults,
                    hl: language,
                    gl: location || 'fr',
                    engine: 'google',
                },
                timeout: 30000,
            });

            const results = response.data.organic_results || [];
            this.logger.log(`SerpAPI returned ${results.length} results`);

            return results.map((r, index) => ({
                position: r.position || index + 1,
                title: r.title,
                link: r.link,
                snippet: r.snippet,
                source: r.source,
            }));
        } catch (error) {
            this.logger.error(`SerpAPI search failed: ${error.message}`);
            throw new Error(`SerpAPI search failed: ${error.message}`);
        }
    }

    /**
     * Recherche locale (Google Maps/Local)
     */
    async localSearch(params: {
        userId: string;
        query: string;
        location: string;
        numResults?: number;
        agencyId?: string;
    }): Promise<any[]> {
        const { userId, query, location, numResults = 20, agencyId } = params;

        try {
            const apiKey = await this.getApiKey(userId, agencyId);

            const response = await axios.get(this.baseUrl, {
                params: {
                    q: query,
                    location: location,
                    api_key: apiKey,
                    num: numResults,
                    engine: 'google_maps',
                },
                timeout: 30000,
            });

            return response.data.local_results || [];
        } catch (error) {
            this.logger.error(`SerpAPI local search failed: ${error.message}`);
            throw error;
        }
    }
}
