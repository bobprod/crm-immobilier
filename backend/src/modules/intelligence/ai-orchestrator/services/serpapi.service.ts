import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../../../shared/database/prisma.service';

/**
 * Interface pour les résultats SerpAPI
 */
export interface SerpApiSearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  source?: string;
}

export interface SerpApiResponse {
  organic_results?: SerpApiSearchResult[];
  total_results?: number;
  search_metadata?: any;
}

/**
 * Service SerpAPI pour la recherche Google
 */
@Injectable()
export class SerpApiService {
  private readonly logger = new Logger(SerpApiService.name);
  private readonly baseUrl = 'https://serpapi.com/search.json';

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupérer la clé API SerpAPI du tenant
   */
  private async getApiKey(tenantId: string): Promise<string> {
    // TODO: adapter selon ton modèle Prisma
    // Pour l'instant, on suppose que la clé est dans Settings ou une table IntegrationKey
    const settings = await this.prisma.settings.findFirst({
      where: { tenantId },
    });

    const apiKey = settings?.['serpApiKey'] || process.env.SERPAPI_KEY;

    if (!apiKey) {
      throw new Error('SerpAPI key not configured for tenant');
    }

    return apiKey;
  }

  /**
   * Rechercher sur Google via SerpAPI
   */
  async search(params: {
    tenantId: string;
    query: string;
    location?: string;
    numResults?: number;
    language?: string;
  }): Promise<SerpApiSearchResult[]> {
    const { tenantId, query, location, numResults = 10, language = 'fr' } = params;

    try {
      this.logger.log(`SerpAPI search: "${query}"`);

      const apiKey = await this.getApiKey(tenantId);

      const response = await axios.get<SerpApiResponse>(this.baseUrl, {
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
      this.logger.error('SerpAPI search failed:', error.message);
      throw new Error(`SerpAPI search failed: ${error.message}`);
    }
  }

  /**
   * Recherche locale (pour trouver des professionnels dans une zone)
   */
  async localSearch(params: {
    tenantId: string;
    query: string;
    location: string;
    numResults?: number;
  }): Promise<any[]> {
    const { tenantId, query, location, numResults = 20 } = params;

    try {
      this.logger.log(`SerpAPI local search: "${query}" in ${location}`);

      const apiKey = await this.getApiKey(tenantId);

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
      this.logger.error('SerpAPI local search failed:', error.message);
      throw new Error(`SerpAPI local search failed: ${error.message}`);
    }
  }
}
