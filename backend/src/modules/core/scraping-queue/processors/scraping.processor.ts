import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { WebDataService } from '../../../scraping/services/web-data.service';
import { ProviderRegistryService } from '../../provider-registry/services/provider-registry.service';
import { ProviderType } from '@prisma/client';

export interface ScrapingJobData {
  userId: string;
  agencyId?: string;
  urls: string[];
  provider?: string;
  waitFor?: number;
  screenshot?: boolean;
  extractionPrompt?: string;
  forceProvider?: boolean;
  metadata?: any;
}

export interface ScrapingJobResult {
  success: boolean;
  totalUrls: number;
  successfulUrls: number;
  failedUrls: number;
  results: any[];
  errors: any[];
}

/**
 * Processor pour les jobs de scraping
 * Traite les jobs BullMQ de scraping de manière async
 */
@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(
    private readonly webDataService: WebDataService,
    private readonly providerRegistryService: ProviderRegistryService,
  ) {}

  @Process('scrape-urls')
  async handleScrapingJob(job: Job<ScrapingJobData>): Promise<ScrapingJobResult> {
    const { userId, urls, provider, waitFor, screenshot, extractionPrompt, forceProvider, agencyId } = job.data;

    this.logger.log(`Processing scraping job ${job.id} for ${urls.length} URLs`);

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;
    let failCount = 0;

    // Sélectionner le provider via ProviderRegistry (si pas de provider spécifié)
    let selectedProvider = provider || 'auto';

    if (provider === 'auto') {
      try {
        const providerConfig = await this.providerRegistryService.selectBestProvider(
          userId,
          ProviderType.scraping,
          {
            operationType: 'web_scraping',
            minSuccessRate: 80,
          },
        );
        selectedProvider = providerConfig.provider;
        this.logger.log(`Auto-selected provider: ${selectedProvider}`);
      } catch (error) {
        this.logger.warn(`Failed to auto-select provider, falling back to default: ${error.message}`);
        selectedProvider = 'cheerio'; // Fallback
      }
    }

    // Traiter chaque URL
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        this.logger.log(`Scraping URL ${i + 1}/${urls.length}: ${url}`);

        const startTime = Date.now();

        // Scraper l'URL via WebDataService
        const result = await this.webDataService.fetchHtml(url, {
          provider: selectedProvider as any,
          tenantId: userId,
          waitFor,
          screenshot,
          extractionPrompt,
          forceProvider,
        });

        const latency = Date.now() - startTime;

        results.push({
          url,
          success: true,
          provider: result.provider,
          data: result,
          latency,
        });

        successCount++;

        // Logger l'utilisation du provider
        await this.logProviderUsage(userId, selectedProvider, url, latency, true, agencyId);

        // Mettre à jour la progression
        const progress = Math.round(((i + 1) / urls.length) * 100);
        await job.progress(progress);

      } catch (error) {
        this.logger.error(`Failed to scrape ${url}: ${error.message}`);

        errors.push({
          url,
          error: error.message,
          stack: error.stack,
        });

        failCount++;

        // Logger l'échec
        await this.logProviderUsage(
          userId,
          selectedProvider,
          url,
          undefined,
          false,
          agencyId,
          error.message,
        );
      }
    }

    this.logger.log(
      `Job ${job.id} completed: ${successCount} success, ${failCount} failed`,
    );

    return {
      success: failCount === 0,
      totalUrls: urls.length,
      successfulUrls: successCount,
      failedUrls: failCount,
      results,
      errors,
    };
  }

  /**
   * Logger l'utilisation d'un provider via ProviderRegistry
   */
  private async logProviderUsage(
    userId: string,
    provider: string,
    url: string,
    latency?: number,
    success: boolean = true,
    agencyId?: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      // Récupérer le providerConfig
      const providerConfigs = await this.providerRegistryService.findAllByUser(userId, {
        type: ProviderType.scraping,
      });

      const providerConfig = providerConfigs.find((p) => p.provider === provider);

      if (!providerConfig) {
        this.logger.warn(`Provider config not found for ${provider}, skipping usage log`);
        return;
      }

      // Logger l'utilisation
      await this.providerRegistryService.logUsage(
        providerConfig.id,
        userId,
        {
          operationType: 'web_scraping',
          operationCode: 'scrape_url',
          requestData: { url },
          latencyMs: latency,
          success,
          errorMessage,
        },
        agencyId,
      );
    } catch (error) {
      this.logger.error(`Failed to log provider usage: ${error.message}`);
    }
  }
}
