import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Bright Data Service - Scraping via API Bright Data (ex-Luminati)
 *
 * Bright Data est le leader mondial des proxies résidentiels et du scraping.
 * Ils offrent des scrapers pré-construits et une API REST puissante.
 *
 * Avantages:
 * - Proxies résidentiels premium (contournement anti-bot)
 * - Scrapers maintenus pour sites majeurs
 * - Infrastructure ultra-scalable
 * - Support de tous les sites
 *
 * Pricing:
 * - Free trial: $50 de crédit
 * - Pay-as-you-go: ~$0.001-0.01 par requête
 *
 * Documentation: https://docs.brightdata.com/scraping-automation
 */
@Injectable()
export class BrightDataService {
  private readonly logger = new Logger(BrightDataService.name);
  private readonly baseUrl = 'https://api.brightdata.com';

  constructor(private configService: ConfigService) {}

  /**
   * Obtenir les credentials Bright Data
   */
  private getCredentials(tenantId?: string): { apiKey: string } | null {
    // 1. Clé au niveau utilisateur (BYOK)
    if (tenantId) {
      const userKey = this.configService.get<string>(`BRIGHTDATA_API_KEY_${tenantId}`);
      if (userKey) return { apiKey: userKey };
    }

    // 2. Clé globale
    const globalKey = this.configService.get<string>('BRIGHTDATA_API_KEY');
    if (globalKey) return { apiKey: globalKey };

    return null;
  }

  /**
   * Tester la disponibilité de l'API
   */
  async testApiKey(apiKey?: string, tenantId?: string): Promise<boolean> {
    try {
      const creds = this.getCredentials(tenantId);
      const key = apiKey || creds?.apiKey;

      if (!key) {
        this.logger.warn('Aucune clé API Bright Data configurée');
        return false;
      }

      // Test avec l'endpoint status
      const response = await axios.get(`${this.baseUrl}/account`, {
        headers: { Authorization: `Bearer ${key}` },
        timeout: 5000,
      });

      this.logger.log(`✅ Bright Data API disponible`);
      return true;
    } catch (error) {
      this.logger.warn(`❌ Bright Data API non disponible: ${error.message}`);
      return false;
    }
  }

  /**
   * Créer une tâche de scraping
   */
  async createScrapingTask(
    collectorId: string,
    urls: string[],
    tenantId?: string,
  ): Promise<string> {
    const creds = this.getCredentials(tenantId);
    if (!creds) {
      throw new Error('Clé API Bright Data non configurée');
    }

    try {
      this.logger.log(`Création tâche scraping pour ${urls.length} URLs`);

      const response = await axios.post(
        `${this.baseUrl}/datasets/v3/trigger`,
        {
          collector_id: collectorId,
          urls: urls,
        },
        {
          headers: { Authorization: `Bearer ${creds.apiKey}` },
        },
      );

      const taskId = response.data.snapshot_id;
      this.logger.log(`✅ Tâche créée: ${taskId}`);
      return taskId;
    } catch (error) {
      this.logger.error(`Erreur Bright Data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupérer les résultats d'une tâche
   */
  async getTaskResults(taskId: string, tenantId?: string): Promise<any[]> {
    const creds = this.getCredentials(tenantId);
    if (!creds) {
      throw new Error('Clé API Bright Data non configurée');
    }

    try {
      // Attendre que la tâche soit terminée (polling)
      let attempts = 0;
      const maxAttempts = 30; // 30 * 10s = 5 minutes max

      while (attempts < maxAttempts) {
        const statusResponse = await axios.get(
          `${this.baseUrl}/datasets/v3/snapshot/${taskId}`,
          {
            headers: { Authorization: `Bearer ${creds.apiKey}` },
          },
        );

        const status = statusResponse.data.status;
        this.logger.log(`Status tâche ${taskId}: ${status}`);

        if (status === 'ready') {
          // Récupérer les résultats
          const resultsResponse = await axios.get(
            `${this.baseUrl}/datasets/v3/snapshot/${taskId}?format=json`,
            {
              headers: { Authorization: `Bearer ${creds.apiKey}` },
            },
          );

          this.logger.log(`✅ ${resultsResponse.data.length} résultats récupérés`);
          return resultsResponse.data;
        }

        if (status === 'failed' || status === 'error') {
          throw new Error(`Tâche échouée avec le status: ${status}`);
        }

        // Attendre 10 secondes avant de réessayer
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }

      throw new Error('Timeout: la tâche n\'a pas terminé dans le délai imparti');
    } catch (error) {
      this.logger.error(`Erreur récupération résultats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scraper un site avec Bright Data (tout-en-un)
   */
  async scrapeUrls(
    urls: string[],
    collectorId: string,
    tenantId?: string,
  ): Promise<any[]> {
    const taskId = await this.createScrapingTask(collectorId, urls, tenantId);
    return this.getTaskResults(taskId, tenantId);
  }

  /**
   * Scraper via proxy résidentiel (pour sites avec anti-bot)
   */
  async scrapeWithProxy(
    url: string,
    tenantId?: string,
  ): Promise<{ html: string; status: number }> {
    const creds = this.getCredentials(tenantId);
    if (!creds) {
      throw new Error('Clé API Bright Data non configurée');
    }

    try {
      this.logger.log(`Scraping avec proxy résidentiel: ${url}`);

      // Utiliser le proxy résidentiel de Bright Data
      const response = await axios.get(url, {
        headers: {
          'X-BrightData-Auth': creds.apiKey,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000,
      });

      this.logger.log(`✅ Scraping réussi (status ${response.status})`);
      return {
        html: response.data,
        status: response.status,
      };
    } catch (error) {
      this.logger.error(`Erreur scraping avec proxy: ${error.message}`);
      throw error;
    }
  }
}
