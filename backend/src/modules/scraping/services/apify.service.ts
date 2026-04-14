import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Apify Service - Scraping via API Apify
 *
 * Apify est une plateforme de scraping cloud avec des scrapers pré-construits
 * pour Zillow, Realtor.com, et de nombreux autres sites immobiliers.
 *
 * Avantages:
 * - Scrapers maintenus et mis à jour
 * - Infrastructure scalable
 * - Pas besoin de gérer les proxies
 * - API REST simple
 *
 * Pricing:
 * - Free tier: $5 de crédit/mois
 * - Pay-as-you-go: ~$0.001-0.01 par page
 *
 * Documentation: https://docs.apify.com/api/v2
 */
@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name);
  private readonly baseUrl = 'https://api.apify.com/v2';

  constructor(private configService: ConfigService) {}

  /**
   * Obtenir la clé API Apify
   */
  private getApiKey(tenantId?: string): string | null {
    // 1. Clé au niveau utilisateur (BYOK)
    if (tenantId) {
      const userKey = this.configService.get<string>(`APIFY_API_KEY_${tenantId}`);
      if (userKey) return userKey;
    }

    // 2. Clé globale (agence ou système)
    return this.configService.get<string>('APIFY_API_KEY') || null;
  }

  /**
   * Tester la disponibilité de l'API
   */
  async testApiKey(apiKey?: string, tenantId?: string): Promise<boolean> {
    try {
      const key = apiKey || this.getApiKey(tenantId);
      if (!key) {
        this.logger.warn('Aucune clé API Apify configurée');
        return false;
      }

      // Test avec l'endpoint user
      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 5000,
      });

      this.logger.log(`✅ Apify API disponible (user: ${response.data.data.username})`);
      return true;
    } catch (error) {
      this.logger.warn(`❌ Apify API non disponible: ${error.message}`);
      return false;
    }
  }

  /**
   * Lancer un scraper Apify et attendre les résultats
   */
  async runActor(
    actorId: string,
    input: Record<string, any>,
    tenantId?: string,
  ): Promise<any> {
    const apiKey = this.getApiKey(tenantId);
    if (!apiKey) {
      throw new Error('Clé API Apify non configurée');
    }

    try {
      this.logger.log(`Lancement du scraper Apify: ${actorId}`);

      // 1. Démarrer l'actor
      const runResponse = await axios.post(
        `${this.baseUrl}/acts/${actorId}/runs`,
        input,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          params: { waitForFinish: 120 }, // Attendre max 2 minutes
          timeout: 130000,
        },
      );

      const runId = runResponse.data.data.id;
      const status = runResponse.data.data.status;

      this.logger.log(`Run ID: ${runId}, Status: ${status}`);

      // 2. Récupérer les résultats
      if (status === 'SUCCEEDED') {
        const resultsResponse = await axios.get(
          `${this.baseUrl}/acts/${actorId}/runs/${runId}/dataset/items`,
          {
            headers: { Authorization: `Bearer ${apiKey}` },
          },
        );

        this.logger.log(`✅ ${resultsResponse.data.length} résultats récupérés`);
        return resultsResponse.data;
      } else {
        throw new Error(`Scraping échoué avec le status: ${status}`);
      }
    } catch (error) {
      this.logger.error(`Erreur Apify: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scraper Zillow avec Apify
   * Actor ID: apify/zillow-scraper
   */
  async scrapeZillow(params: {
    location: string;
    maxItems?: number;
    listingType?: 'for_sale' | 'for_rent' | 'sold';
    tenantId?: string;
  }): Promise<any[]> {
    const input = {
      startUrls: [{ url: `https://www.zillow.com/homes/${params.location}` }],
      maxItems: params.maxItems || 100,
      extendOutputFunction: `($) => {
        return {
          address: $('.ds-address-container').text(),
          price: $('.ds-value').first().text(),
          beds: $('[data-label="bed"]').text(),
          baths: $('[data-label="bath"]').text(),
          sqft: $('[data-label="sqft"]').text(),
        };
      }`,
    };

    return this.runActor('apify/zillow-scraper', input, params.tenantId);
  }

  /**
   * Scraper Realtor.com avec Apify
   * Actor ID: apify/realtor-scraper
   */
  async scrapeRealtor(params: {
    location: string;
    maxItems?: number;
    tenantId?: string;
  }): Promise<any[]> {
    const input = {
      location: params.location,
      maxItems: params.maxItems || 100,
    };

    return this.runActor('apify/realtor-scraper', input, params.tenantId);
  }

  /**
   * Scraper Google Maps (pour trouver agents immobiliers)
   * Actor ID: compass/crawler-google-places
   */
  async scrapeGoogleMaps(params: {
    searchQuery: string; // ex: "real estate agent Paris"
    maxItems?: number;
    tenantId?: string;
  }): Promise<any[]> {
    const input = {
      searchStringsArray: [params.searchQuery],
      maxCrawledPlacesPerSearch: params.maxItems || 50,
      language: 'fr',
    };

    return this.runActor('compass/crawler-google-places', input, params.tenantId);
  }

  /**
   * Scraper personnalisé avec Web Scraper Actor
   * Actor ID: apify/web-scraper
   */
  async scrapeCustomUrl(params: {
    startUrls: string[];
    pageFunction: string;
    maxItems?: number;
    tenantId?: string;
  }): Promise<any[]> {
    const input = {
      startUrls: params.startUrls.map(url => ({ url })),
      pageFunction: params.pageFunction,
      maxRequestsPerCrawl: params.maxItems || 100,
    };

    return this.runActor('apify/web-scraper', input, params.tenantId);
  }
}
