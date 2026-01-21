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
import { ApiKeysService } from '../../shared/services/api-keys.service';
import { SeoAiModule } from '../content/seo-ai/seo-ai.module';
import { LLMConfigModule } from '../intelligence/llm-config/llm-config.module';
import { CommunicationsModule } from '../communications/communications.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { ValidationModule } from '../../shared/validation/validation.module';
import { CampaignService } from './services/campaign.service';
import { LeadManagementService } from './services/lead-management.service';
import { MatchingService } from './services/matching.service';
import { ProspectingValidationService } from './services/prospecting-validation.service';
import { ProspectingOrchestratorService } from './services/prospecting-orchestrator.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    CommunicationsModule,
    SeoAiModule,
    LLMConfigModule,
    ScrapingModule,
    ValidationModule,
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
    ApiKeysService,
    CampaignService,
    LeadManagementService,
    MatchingService,
    ProspectingValidationService,
    ProspectingOrchestratorService,
  ],
  exports: [
    ProspectingService,
    ProspectingIntegrationService,
    LLMProspectingService,
    BrowserlessService,
    BehavioralSignalsService,
    ScrapingQueueService,
    CampaignService,
    LeadManagementService,
    MatchingService,
    ProspectingValidationService,
    ProspectingOrchestratorService,
  ],
})
export class ProspectingModule { }
