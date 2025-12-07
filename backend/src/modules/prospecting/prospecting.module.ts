import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ProspectingController } from './prospecting.controller';
import { ProspectingService } from './prospecting.service';
import { ProspectingIntegrationService } from './prospecting-integration.service';
import { LLMProspectingService } from './llm-prospecting.service';
import { BrowserlessService } from './browserless.service';
import { BehavioralSignalsService } from './behavioral-signals.service';
import { ScrapingQueueService } from './scraping-queue.service';
import { BehavioralProspectingController } from './behavioral-prospecting.controller';
import { PrismaService } from '../../shared/database/prisma.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    BullModule.registerQueue(
      { name: 'scraping' },
      { name: 'scoring' },
    ),
  ],
  controllers: [
    ProspectingController,
    BehavioralProspectingController,
  ],
  providers: [
    ProspectingService,
    ProspectingIntegrationService,
    LLMProspectingService,
    BrowserlessService,
    BehavioralSignalsService,
    ScrapingQueueService,
    PrismaService,
  ],
  exports: [
    ProspectingService,
    ProspectingIntegrationService,
    LLMProspectingService,
    BrowserlessService,
    BehavioralSignalsService,
    ScrapingQueueService,
  ],
})
export class ProspectingModule {}
