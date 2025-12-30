import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScrapingQueueController } from './scraping-queue.controller';
import { ScrapingQueueService } from './scraping-queue.service';
import { ScrapingProcessor } from './processors/scraping.processor';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { ScrapingModule } from '../../scraping/scraping.module';
import { ProviderRegistryModule } from '../provider-registry/provider-registry.module';

/**
 * Scraping Queue Module - Async Scraping with BullMQ
 *
 * Gère la queue de scraping avec:
 * - Traitement async des URLs
 * - Retry automatique (3 tentatives avec backoff exponentiel)
 * - Priorisation des jobs (LOW, NORMAL, HIGH, URGENT)
 * - Tracking de progression en temps réel
 * - Intégration avec ProviderRegistry pour metrics
 *
 * Utilise BullMQ (déjà configuré dans ProspectingModule)
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 7 * 24 * 3600, // Garder 7 jours
          count: 1000, // Max 1000 jobs complétés
        },
        removeOnFail: {
          age: 30 * 24 * 3600, // Garder 30 jours
        },
      },
    }),
    PrismaModule,
    ScrapingModule, // Pour WebDataService
    ProviderRegistryModule, // Pour tracking usage
  ],
  controllers: [ScrapingQueueController],
  providers: [ScrapingQueueService, ScrapingProcessor],
  exports: [ScrapingQueueService], // Export pour utilisation par d'autres modules
})
export class ScrapingQueueModule {}
