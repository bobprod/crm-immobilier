import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import {
  BrowserlessService,
  FacebookMarketplaceSearch,
  ScrapingResult,
} from './browserless.service';
import { BehavioralSignalsService, IntentionScore } from './behavioral-signals.service';
import { PrismaService } from '../../shared/database/prisma.service';

/**
 * Service de gestion des queues de scraping avec Bull
 *
 * Fonctionnalités:
 * - Rate limiting par provider
 * - Retry automatique en cas d'échec
 * - Traitement asynchrone
 * - Monitoring des jobs
 */

export interface ScrapingJobData {
  type: 'facebook_marketplace' | 'pica' | 'serp' | 'generic';
  search?: FacebookMarketplaceSearch;
  url?: string;
  selectors?: { [key: string]: string };
  userId: string;
  campaignId?: string;
}

export interface ScoringJobData {
  prospectId: string;
  userId: string;
  forceRecalculate?: boolean;
}

export interface ScrapingJobResult extends ScrapingResult {
  processedAt: Date;
  jobId: string;
  scoringResults?: IntentionScore[];
}

@Injectable()
export class ScrapingQueueService {
  private readonly logger = new Logger(ScrapingQueueService.name);

  constructor(
    @InjectQueue('scraping') private scrapingQueue: Queue,
    @InjectQueue('scoring') private scoringQueue: Queue,
    private readonly browserlessService: BrowserlessService,
    private readonly behavioralSignalsService: BehavioralSignalsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Ajouter un job de scraping Facebook Marketplace à la queue
   */
  async queueFacebookMarketplaceScraping(
    search: FacebookMarketplaceSearch,
    userId: string,
    campaignId?: string,
  ): Promise<Job<ScrapingJobData>> {
    this.logger.log(`Queuing Facebook Marketplace scraping: ${search.query}`);

    return this.scrapingQueue.add(
      'facebook_marketplace',
      {
        type: 'facebook_marketplace',
        search,
        userId,
        campaignId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // 5s, 25s, 125s
        },
        timeout: 120000, // 2 minutes max par job
        removeOnComplete: 100, // Garder les 100 derniers jobs complétés
        removeOnFail: 500, // Garder les 500 derniers échecs
      },
    );
  }

  /**
   * Ajouter un job de scraping générique
   */
  async queueGenericScraping(
    url: string,
    selectors: { [key: string]: string },
    userId: string,
  ): Promise<Job<ScrapingJobData>> {
    this.logger.log(`Queuing generic scraping: ${url}`);

    return this.scrapingQueue.add(
      'generic_scraping',
      {
        type: 'generic',
        url,
        selectors,
        userId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        timeout: 60000,
      },
    );
  }

  /**
   * Ajouter un job de scoring comportemental
   */
  async queueBehavioralScoring(
    prospectId: string,
    userId: string,
    forceRecalculate: boolean = false,
  ): Promise<Job<ScoringJobData>> {
    this.logger.log(`Queuing behavioral scoring for prospect: ${prospectId}`);

    return this.scoringQueue.add(
      'calculate_intention_score',
      {
        prospectId,
        userId,
        forceRecalculate,
      },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 2000 },
        timeout: 30000,
      },
    );
  }

  /**
   * Traitement direct (non-Bull): Scraping Facebook Marketplace
   * Peut être appelé directement par d'autres services.
   */
  async processFacebookMarketplaceScraping(job: Job<ScrapingJobData>): Promise<ScrapingJobResult> {
    const { search, userId, campaignId } = job.data;

    this.logger.log(`Processing Facebook Marketplace scraping job ${job.id}: ${search?.query}`);

    try {
      // 1. Scraper Facebook Marketplace
      const result = await this.browserlessService.scrapeFacebookMarketplace(search!, userId);

      if (!result.success) {
        throw new Error(`Scraping failed: ${result.errors?.join(', ')}`);
      }

      // 2. Sauvegarder les prospects dans la DB
      const prospects = await this.saveProspectsFromScraping(
        result.data,
        userId,
        campaignId,
        'facebook_marketplace',
      );

      // 3. Ajouter jobs de scoring pour chaque prospect
      const scoringJobs = await Promise.all(
        prospects.map((prospect) => this.queueBehavioralScoring(prospect.id, userId)),
      );

      this.logger.log(
        `Facebook scraping job ${job.id} completed: ${prospects.length} prospects, ${scoringJobs.length} scoring jobs queued`,
      );

      return {
        ...result,
        processedAt: new Date(),
        jobId: job.id.toString(),
      };
    } catch (error) {
      this.logger.error(`Facebook scraping job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Traitement direct (non-Bull): Scraping générique
   */
  async processGenericScraping(job: Job<ScrapingJobData>): Promise<ScrapingJobResult> {
    const { url, selectors, userId } = job.data;

    this.logger.log(`Processing generic scraping job ${job.id}: ${url}`);

    try {
      const result = await this.browserlessService.scrapeWebsite(url!, selectors!, userId);

      if (!result.success) {
        throw new Error(`Scraping failed: ${result.errors?.join(', ')}`);
      }

      return {
        ...result,
        processedAt: new Date(),
        jobId: job.id.toString(),
      };
    } catch (error) {
      this.logger.error(`Generic scraping job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Traitement direct (non-Bull): Calcul du score comportemental
   */
  async processBehavioralScoring(job: Job<ScoringJobData>): Promise<IntentionScore> {
    const { prospectId, userId, forceRecalculate } = job.data;

    this.logger.log(`Processing scoring job ${job.id} for prospect: ${prospectId}`);

    try {
      // 1. Récupérer le prospect avec ses signaux comportementaux
      const prospect = await this.prisma.prospect.findUnique({
        where: { id: prospectId },
        include: {
          interactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          notes: true,
          tags: true,
        },
      });

      if (!prospect) {
        throw new Error(`Prospect not found: ${prospectId}`);
      }

      // Vérifier si on a déjà un score récent (< 24h)
      if (
        !forceRecalculate &&
        prospect.lastScoredAt &&
        Date.now() - prospect.lastScoredAt.getTime() < 24 * 60 * 60 * 1000
      ) {
        this.logger.log(`Skipping scoring for ${prospectId}: recent score exists`);
        return {
          totalScore: prospect.intentionScore || 0,
          quality: prospect.quality as any,
          breakdown: {} as any,
          confidence: 0.8,
          signals: [],
          recommendations: [],
        } as any;
      }

      // 2. Extraire les signaux comportementaux
      const signals = this.extractBehavioralSignalsFromProspect(prospect);

      // 3. Calculer le score d'intention
      const score = await this.behavioralSignalsService.calculateIntentionScore(signals);

      // 4. Mettre à jour le prospect dans la DB
      await this.prisma.prospect.update({
        where: { id: prospectId },
        data: {
          intentionScore: score.totalScore,
          quality: score.quality,
          lastScoredAt: new Date(),
        },
      });

      this.logger.log(
        `Scoring completed for ${prospectId}: ${score.totalScore}/100 (${score.quality})`,
      );

      return score;
    } catch (error) {
      this.logger.error(`Scoring job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sauvegarder les prospects depuis les résultats de scraping
   */
  private async saveProspectsFromScraping(
    data: any[],
    userId: string,
    campaignId: string | undefined,
    source: string,
  ): Promise<any[]> {
    const prospects: any[] = [];

    for (const item of data) {
      try {
        // Vérifier si le prospect existe déjà (par URL ou identifiant unique)
        const existing = await this.prisma.prospect.findFirst({
          where: {
            OR: [{ externalId: item.id }, { url: item.url }],
          },
        });

        if (existing) {
          this.logger.debug(`Prospect already exists: ${item.id}`);
          prospects.push(existing);
          continue;
        }

        // Créer nouveau prospect
        const prospect = await this.prisma.prospect.create({
          data: {
            externalId: item.id,
            firstName: item.seller?.name || '',
            lastName: '',
            email: '', // À enrichir plus tard
            phone: '', // À enrichir plus tard
            source,
            status: 'new',
            quality: 'unqualified',
            intentionScore: 0,
            userId,
            campaignId,
            url: item.url,
            metadata: {
              title: item.title,
              price: item.price,
              currency: item.currency,
              location: item.location,
              description: item.description,
              images: item.images,
              postedDate: item.postedDate,
              category: item.category,
              seller: item.seller,
            },
          },
        });

        prospects.push(prospect);
        this.logger.debug(`Created prospect: ${prospect.id}`);
      } catch (error) {
        this.logger.warn(`Failed to save prospect ${item.id}: ${error.message}`);
      }
    }

    return prospects;
  }

  /**
   * Extraire les signaux comportementaux depuis un prospect
   */
  private extractBehavioralSignalsFromProspect(prospect: any): any {
    const interactions = prospect.interactions || [];
    const notes = prospect.notes || [];
    const tags = prospect.tags || [];

    // Analyser les interactions pour détecter les signaux
    const hasActiveSearch = interactions.some((i: any) => i.type === 'search' || i.type === 'view');
    const hasEngagementOnListings = interactions.filter(
      (i: any) => i.type === 'click' || i.type === 'save',
    ).length;
    const messagesCount = interactions.filter((i: any) => i.type === 'message').length;

    // Extraire le texte des messages et notes
    const allText = [
      ...interactions.map((i: any) => i.content || ''),
      ...notes.map((n: any) => n.content || ''),
    ].join(' ');

    return {
      hasActiveSearch,
      hasEngagementOnListings,
      savedListingsCount: interactions.filter((i: any) => i.type === 'save').length,
      messagesCount,
      hasFinancialIndicators: /budget|financement|crédit|prêt|apport/i.test(allText),
      hasUrgencyKeywords: /urgent|rapide|immédiat|asap/i.test(allText),
      hasPreciseCriteria: this.detectPreciseCriteria(allText),
      hasLifeContext: /mariage|divorce|mutation|naissance|retraite/i.test(allText),
      requestedDocumentation: /documentation|dossier|documents/i.test(allText),
      frequencyDays: this.calculateFrequencyDays(interactions),
      hasSpamIndicators: this.detectSpamIndicators(allText),
      hasUnrealisticBudget: this.detectUnrealisticBudget(allText, prospect.metadata),
      criteria: this.extractCriteria(allText),
      timeContext: this.extractTimeContext(allText),
    };
  }

  private detectPreciseCriteria(text: string): boolean {
    const criteriaKeywords = [
      /\d+\s*pièces?/i,
      /\d+\s*m[²2]/i,
      /\d+\s*chambres?/i,
      /étage|rez-de-chaussée/i,
      /parking|garage/i,
      /jardin|terrasse|balcon/i,
    ];
    return criteriaKeywords.filter((pattern) => pattern.test(text)).length >= 2;
  }

  private detectSpamIndicators(text: string): boolean {
    const spamPatterns = [/copier.coller/i, /message.automatique/i, /spam/i, /publicité/i];
    return spamPatterns.some((pattern) => pattern.test(text));
  }

  private detectUnrealisticBudget(text: string, metadata: any): boolean {
    // Extraire budget mentionné
    const budgetMatch = text.match(/(\d+)\s*(mille|k|dinars?)/i);
    if (!budgetMatch) return false;

    const budget = parseInt(budgetMatch[1]) * (budgetMatch[2].match(/k/i) ? 1000 : 1);
    const propertyPrice = metadata?.price || 0;

    // Budget irréaliste si < 20% du prix
    return propertyPrice > 0 && budget < propertyPrice * 0.2;
  }

  private extractCriteria(text: string): string[] {
    const criteria: string[] = [];

    if (/\d+\s*pièces?/i.test(text)) criteria.push('rooms');
    if (/\d+\s*m[²2]/i.test(text)) criteria.push('surface');
    if (/parking|garage/i.test(text)) criteria.push('parking');
    if (/jardin|terrasse/i.test(text)) criteria.push('outdoor');

    return criteria;
  }

  private extractTimeContext(text: string): string {
    if (/urgent|cette semaine|ce mois/i.test(text)) return 'immediate';
    if (/prochains?\s*mois/i.test(text)) return 'short_term';
    if (/année|long terme/i.test(text)) return 'long_term';
    return 'unspecified';
  }

  private calculateFrequencyDays(interactions: any[]): number {
    if (interactions.length < 2) return 0;

    const dates = interactions.map((i) => new Date(i.createdAt).getTime()).sort((a, b) => a - b);

    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24));
    }

    return intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;
  }

  /**
   * Obtenir les statistiques des queues
   */
  async getQueueStats(): Promise<any> {
    const [scrapingCounts, scoringCounts] = await Promise.all([
      this.scrapingQueue.getJobCounts(),
      this.scoringQueue.getJobCounts(),
    ]);

    return {
      scraping: scrapingCounts,
      scoring: scoringCounts,
      timestamp: new Date(),
    };
  }

  /**
   * Nettoyer les jobs complétés/échoués
   */
  async cleanQueues(): Promise<void> {
    await Promise.all([
      this.scrapingQueue.clean(24 * 60 * 60 * 1000, 'completed'), // 24h
      this.scrapingQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'), // 7 days
      this.scoringQueue.clean(24 * 60 * 60 * 1000, 'completed'),
      this.scoringQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed'),
    ]);

    this.logger.log('Queues cleaned successfully');
  }
}
