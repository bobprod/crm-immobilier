import { Injectable, Logger } from '@nestjs/common';
import { CheerioService } from './cheerio.service';
import { PuppeteerService } from './puppeteer.service';
import { FirecrawlService } from './firecrawl.service';

export type WebDataProvider = 'firecrawl' | 'cheerio' | 'puppeteer';

export interface WebDataFetchOptions {
  provider?: WebDataProvider;
  tenantId?: string;
  waitFor?: number;
  screenshot?: boolean;
  extractionPrompt?: string;
  forceProvider?: boolean; // Si true, ne pas faire de fallback automatique
}

export interface WebDataResult {
  provider: WebDataProvider;
  url: string;
  html?: string;
  text: string;
  markdown?: string;
  title?: string;
  metadata?: any;
  extractedData?: any;
  screenshot?: string;
}

/**
 * Service unifié de scraping web
 * 
 * Ce service encapsule TOUS les providers de scraping et sélectionne
 * automatiquement le meilleur provider selon l'URL et les besoins.
 * 
 * Architecture:
 * - Tier 1: Firecrawl (API payante, IA intégrée, sites complexes)
 * - Tier 2: Cheerio (gratuit, rapide, sites simples/statiques)
 * - Tier 3: Puppeteer (gratuit, sites JS dynamiques)
 * 
 * Les clés API de scraping se configurent par l'utilisateur dans les paramètres,
 * et le LLM Router / AI Orchestrator se charge de choisir le meilleur moteur.
 */
@Injectable()
export class WebDataService {
  private readonly logger = new Logger(WebDataService.name);

  constructor(
    private readonly cheerioService: CheerioService,
    private readonly puppeteerService: PuppeteerService,
    private readonly firecrawlService: FirecrawlService,
  ) {}

  /**
   * Récupérer le contenu HTML d'une URL avec le provider optimal
   */
  async fetchHtml(url: string, options?: WebDataFetchOptions): Promise<WebDataResult> {
    this.logger.log(`Récupération de ${url} avec les options: ${JSON.stringify(options)}`);

    // Sélectionner le provider
    const provider = options?.provider ?? this.selectBestProvider(url, options);

    this.logger.log(`Provider sélectionné: ${provider}`);

    try {
      // Tenter avec le provider sélectionné
      const result = await this.fetchWithProvider(url, provider, options);
      return result;
    } catch (error) {
      this.logger.warn(`Échec avec ${provider}: ${error.message}`);

      // Si forceProvider est activé, ne pas faire de fallback
      if (options?.forceProvider) {
        throw error;
      }

      // Stratégie de fallback automatique
      return await this.fallbackFetch(url, provider, options);
    }
  }

  /**
   * Récupérer plusieurs URLs en parallèle
   */
  async fetchMultipleUrls(
    urls: string[],
    options?: WebDataFetchOptions,
  ): Promise<WebDataResult[]> {
    this.logger.log(`Récupération de ${urls.length} URLs`);

    const results = await Promise.allSettled(
      urls.map((url) => this.fetchHtml(url, options)),
    );

    const successfulResults: WebDataResult[] = [];
    let failedCount = 0;

    for (const result of results) {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);
      } else {
        failedCount++;
        this.logger.warn(`Échec du scraping: ${result.reason}`);
      }
    }

    this.logger.log(
      `Scraping terminé: ${successfulResults.length} réussis, ${failedCount} échoués`,
    );

    return successfulResults;
  }

  /**
   * Extraire des données structurées avec IA (utilise Firecrawl si disponible)
   */
  async extractStructuredData(
    url: string,
    extractionPrompt: string,
    tenantId?: string,
  ): Promise<any> {
    this.logger.log(`Extraction structurée pour ${url}`);

    try {
      // Essayer d'abord avec Firecrawl (avec l'IA intégrée)
      const data = await this.firecrawlService.extractWithLLM(url, extractionPrompt, tenantId);
      return { provider: 'firecrawl', data };
    } catch (error) {
      this.logger.warn(`Firecrawl non disponible, fallback sur scraping + parsing manuel`);

      // Fallback: scraper avec Puppeteer puis parser le HTML
      const result = await this.puppeteerService.scrapeUrl(url);
      return {
        provider: 'puppeteer',
        html: result.html,
        text: result.text,
        note: 'Extraction manuelle requise - Firecrawl non disponible',
      };
    }
  }

  /**
   * Tester la disponibilité d'un provider
   */
  async testProvider(provider: WebDataProvider, tenantId?: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'firecrawl':
          return await this.firecrawlService.testApiKey(undefined, tenantId);

        case 'cheerio':
          // Cheerio est toujours disponible
          return true;

        case 'puppeteer':
          // Tester si Puppeteer peut démarrer
          await this.puppeteerService.scrapeUrl('https://example.com');
          return true;

        default:
          return false;
      }
    } catch (error) {
      this.logger.warn(`Test du provider ${provider} échoué: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtenir les providers disponibles pour un utilisateur
   */
  async getAvailableProviders(tenantId?: string): Promise<Array<{
    name: WebDataProvider;
    available: boolean;
    description: string;
    cost: string;
  }>> {
    const providers = [
      {
        name: 'cheerio' as WebDataProvider,
        available: true,
        description: 'Parsing HTML simple et rapide - Idéal pour sites statiques',
        cost: '0€ (gratuit)',
      },
      {
        name: 'puppeteer' as WebDataProvider,
        available: true,
        description: 'Browser automation - Sites avec JavaScript dynamique',
        cost: '0€ (gratuit, consomme CPU)',
      },
      {
        name: 'firecrawl' as WebDataProvider,
        available: await this.testProvider('firecrawl', tenantId),
        description: 'IA intégrée - Sites complexes et extraction structurée',
        cost: '~$0.001 par page (tier gratuit disponible)',
      },
    ];

    return providers;
  }

  // ============================================
  // PRIVATE: Sélection intelligente du provider
  // ============================================

  /**
   * Sélectionner automatiquement le meilleur provider selon l'URL
   */
  private selectBestProvider(url: string, options?: WebDataFetchOptions): WebDataProvider {
    const urlLower = url.toLowerCase();

    // Sites complexes connus → Firecrawl (si disponible) sinon Puppeteer
    const complexSites = [
      'bricks.co',
      'homunity',
      'facebook.com',
      'linkedin.com',
      'instagram.com',
      'twitter.com',
      'x.com',
    ];

    for (const site of complexSites) {
      if (urlLower.includes(site)) {
        // Préférer Puppeteer pour les sites complexes (gratuit)
        // Note: Firecrawl serait optimal mais nécessite une clé API
        // et vérification du budget. Pour l'instant, utiliser Puppeteer
        // qui est gratuit et supporte le JavaScript
        return 'puppeteer';
      }
    }

    // Sites simples → Cheerio (rapide et gratuit)
    const simpleSites = [
      'immobilier.com',
      'tayara.tn',
      'mubawab.tn',
      'afariat.com',
      'wikipedia.org',
    ];

    for (const site of simpleSites) {
      if (urlLower.includes(site)) {
        return 'cheerio';
      }
    }

    // Si un prompt d'extraction est fourni → Firecrawl (IA)
    if (options?.extractionPrompt) {
      return 'firecrawl';
    }

    // Par défaut: Cheerio (gratuit, rapide)
    return 'cheerio';
  }

  /**
   * Récupérer avec un provider spécifique
   */
  private async fetchWithProvider(
    url: string,
    provider: WebDataProvider,
    options?: WebDataFetchOptions,
  ): Promise<WebDataResult> {
    switch (provider) {
      case 'firecrawl':
        return await this.fetchWithFirecrawl(url, options);

      case 'cheerio':
        return await this.fetchWithCheerio(url, options);

      case 'puppeteer':
        return await this.fetchWithPuppeteer(url, options);

      default:
        throw new Error(`Provider non supporté: ${provider}`);
    }
  }

  /**
   * Stratégie de fallback si le provider principal échoue
   */
  private async fallbackFetch(
    url: string,
    failedProvider: WebDataProvider,
    options?: WebDataFetchOptions,
  ): Promise<WebDataResult> {
    this.logger.log(`Fallback activé après échec de ${failedProvider}`);

    // Cascade de fallback:
    // Firecrawl → Puppeteer → Cheerio
    // Puppeteer → Cheerio
    // Cheerio → Puppeteer (en dernier recours)

    const fallbackChain: WebDataProvider[] = [];

    if (failedProvider === 'firecrawl') {
      fallbackChain.push('puppeteer', 'cheerio');
    } else if (failedProvider === 'puppeteer') {
      fallbackChain.push('cheerio');
    } else if (failedProvider === 'cheerio') {
      fallbackChain.push('puppeteer');
    }

    for (const fallbackProvider of fallbackChain) {
      try {
        this.logger.log(`Tentative avec fallback: ${fallbackProvider}`);
        return await this.fetchWithProvider(url, fallbackProvider, options);
      } catch (error) {
        this.logger.warn(`Fallback ${fallbackProvider} échoué: ${error.message}`);
        continue;
      }
    }

    throw new Error(`Tous les providers ont échoué pour ${url}`);
  }

  // ============================================
  // PRIVATE: Méthodes par provider
  // ============================================

  private async fetchWithCheerio(
    url: string,
    options?: WebDataFetchOptions,
  ): Promise<WebDataResult> {
    const result = await this.cheerioService.scrapeUrl(url, {
      timeout: options?.waitFor,
    });

    return {
      provider: 'cheerio',
      url,
      html: result.html,
      text: result.text,
      title: result.metadata?.title,
      metadata: {
        ...result.metadata,
        links: result.links,
        emails: result.emails,
        phones: result.phones,
      },
    };
  }

  private async fetchWithPuppeteer(
    url: string,
    options?: WebDataFetchOptions,
  ): Promise<WebDataResult> {
    const result = await this.puppeteerService.scrapeUrl(url, {
      waitForTimeout: options?.waitFor,
      screenshot: options?.screenshot,
    });

    return {
      provider: 'puppeteer',
      url: result.url,
      html: result.html,
      text: result.text,
      title: result.title,
      metadata: result.metadata,
      screenshot: result.screenshot,
    };
  }

  private async fetchWithFirecrawl(
    url: string,
    options?: WebDataFetchOptions,
  ): Promise<WebDataResult> {
    const result = await this.firecrawlService.scrapeUrl(
      url,
      {
        waitFor: options?.waitFor,
        extractionPrompt: options?.extractionPrompt,
      },
      options?.tenantId,
    );

    return {
      provider: 'firecrawl',
      url,
      html: result.html,
      text: result.text,
      markdown: result.markdown,
      title: result.metadata?.title,
      metadata: result.metadata,
      extractedData: result.extractedData,
    };
  }
}
