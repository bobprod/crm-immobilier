import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../../shared/database/prisma.service';
import { CreateScrapingJobDto, BatchScrapingJobDto, ScrapingPriority, ScrapingJobStatus } from './dto';

export interface ScrapingJob {
  id: string;
  userId: string;
  agencyId?: string;
  urls: string[];
  provider?: string;
  priority: ScrapingPriority;
  status: ScrapingJobStatus;
  progress: number;
  results: any[];
  errors: any[];
  metadata?: any;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Scraping Queue Service - Gestion centralisée des jobs de scraping
 *
 * Utilise BullMQ pour:
 * - Traitement async des URLs
 * - Retry automatique en cas d'échec
 * - Priorisation des jobs
 * - Tracking de progression
 * - Rate limiting intégré
 */
@Injectable()
export class ScrapingQueueService {
  private readonly logger = new Logger(ScrapingQueueService.name);

  constructor(
    @InjectQueue('scraping') private scrapingQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  // ═════════════════════════════════════════════════════════════════
  // JOB CREATION
  // ═════════════════════════════════════════════════════════════════

  /**
   * Créer un job de scraping pour une ou plusieurs URLs
   */
  async createJob(
    userId: string,
    dto: CreateScrapingJobDto,
    agencyId?: string,
  ): Promise<{ jobId: string; status: string }> {
    this.logger.log(`Creating scraping job for ${dto.urls.length} URLs`);

    // Ajouter le job à la queue BullMQ
    const job = await this.scrapingQueue.add(
      'scrape-urls',
      {
        userId,
        agencyId,
        urls: dto.urls,
        provider: dto.provider || 'auto',
        waitFor: dto.waitFor,
        screenshot: dto.screenshot,
        extractionPrompt: dto.extractionPrompt,
        forceProvider: dto.forceProvider,
        metadata: dto.metadata,
      },
      {
        priority: dto.priority || ScrapingPriority.NORMAL,
        attempts: dto.maxRetries || 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s, ...
        },
        removeOnComplete: false, // Garder l'historique
        removeOnFail: false,
      },
    );

    this.logger.log(`Job ${job.id} created with priority ${dto.priority}`);

    return {
      jobId: job.id.toString(),
      status: 'queued',
    };
  }

  /**
   * Créer un batch de jobs de scraping
   */
  async createBatchJob(
    userId: string,
    dto: BatchScrapingJobDto,
    agencyId?: string,
  ): Promise<{ jobIds: string[]; total: number }> {
    this.logger.log(`Creating batch scraping job for ${dto.urls.length} URLs`);

    const maxConcurrency = dto.maxConcurrency || 5;
    const jobs = [];

    // Diviser les URLs en chunks selon la concurrence
    for (let i = 0; i < dto.urls.length; i += maxConcurrency) {
      const chunk = dto.urls.slice(i, i + maxConcurrency);

      const job = await this.scrapingQueue.add(
        'scrape-urls',
        {
          userId,
          agencyId,
          urls: chunk,
          provider: dto.provider || 'auto',
          ...(dto.options || {}),
        },
        {
          priority: ScrapingPriority.NORMAL,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      jobs.push(job.id.toString());
    }

    this.logger.log(`Batch job created with ${jobs.length} sub-jobs`);

    return {
      jobIds: jobs,
      total: dto.urls.length,
    };
  }

  // ═════════════════════════════════════════════════════════════════
  // JOB MONITORING
  // ═════════════════════════════════════════════════════════════════

  /**
   * Récupérer le statut d'un job
   */
  async getJobStatus(jobId: string): Promise<{
    id: string;
    state: string;
    progress: number;
    data: any;
    results?: any;
    failedReason?: string;
  }> {
    const job = await this.scrapingQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id.toString(),
      state,
      progress: typeof progress === 'number' ? progress : 0,
      data: job.data,
      results: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * Lister tous les jobs d'un utilisateur
   */
  async listUserJobs(
    userId: string,
    filters?: {
      status?: 'waiting' | 'active' | 'completed' | 'failed';
      limit?: number;
    },
  ): Promise<any[]> {
    const limit = filters?.limit || 50;
    let jobs: any[] = [];

    if (!filters?.status || filters.status === 'waiting') {
      const waiting = await this.scrapingQueue.getWaiting(0, limit);
      jobs.push(...waiting.filter((j) => j.data.userId === userId));
    }

    if (!filters?.status || filters.status === 'active') {
      const active = await this.scrapingQueue.getActive(0, limit);
      jobs.push(...active.filter((j) => j.data.userId === userId));
    }

    if (!filters?.status || filters.status === 'completed') {
      const completed = await this.scrapingQueue.getCompleted(0, limit);
      jobs.push(...completed.filter((j) => j.data.userId === userId));
    }

    if (!filters?.status || filters.status === 'failed') {
      const failed = await this.scrapingQueue.getFailed(0, limit);
      jobs.push(...failed.filter((j) => j.data.userId === userId));
    }

    return Promise.all(
      jobs.map(async (job) => ({
        id: job.id.toString(),
        state: await job.getState(),
        progress: job.progress(),
        data: job.data,
        createdAt: job.timestamp,
        finishedAt: job.finishedOn,
        failedReason: job.failedReason,
      })),
    );
  }

  /**
   * Annuler un job
   */
  async cancelJob(jobId: string, userId: string): Promise<void> {
    const job = await this.scrapingQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.data.userId !== userId) {
      throw new Error('Unauthorized to cancel this job');
    }

    await job.remove();
    this.logger.log(`Job ${jobId} cancelled by user ${userId}`);
  }

  /**
   * Retry un job échoué
   */
  async retryJob(jobId: string, userId: string): Promise<void> {
    const job = await this.scrapingQueue.getJob(jobId);

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.data.userId !== userId) {
      throw new Error('Unauthorized to retry this job');
    }

    await job.retry();
    this.logger.log(`Job ${jobId} retried by user ${userId}`);
  }

  // ═════════════════════════════════════════════════════════════════
  // QUEUE STATISTICS
  // ═════════════════════════════════════════════════════════════════

  /**
   * Récupérer les statistiques de la queue
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scrapingQueue.getWaitingCount(),
      this.scrapingQueue.getActiveCount(),
      this.scrapingQueue.getCompletedCount(),
      this.scrapingQueue.getFailedCount(),
      this.scrapingQueue.getDelayedCount(),
    ]);

    const isPaused = await this.scrapingQueue.isPaused();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: isPaused,
    };
  }

  /**
   * Nettoyer les jobs terminés (à appeler via cron)
   */
  async cleanOldJobs(olderThanDays: number = 7): Promise<void> {
    this.logger.log(`Cleaning jobs older than ${olderThanDays} days`);

    const timestamp = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    await this.scrapingQueue.clean(timestamp, 'completed');
    await this.scrapingQueue.clean(timestamp, 'failed');

    this.logger.log('Old jobs cleaned');
  }

  /**
   * Pause la queue
   */
  async pauseQueue(): Promise<void> {
    await this.scrapingQueue.pause();
    this.logger.log('Scraping queue paused');
  }

  /**
   * Resume la queue
   */
  async resumeQueue(): Promise<void> {
    await this.scrapingQueue.resume();
    this.logger.log('Scraping queue resumed');
  }
}
