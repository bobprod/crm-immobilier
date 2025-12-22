import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ProspectingController } from './prospecting.controller';
import { ProspectingService } from './prospecting.service';
import { ProspectingIntegrationService } from './prospecting-integration.service';
import { LLMProspectingService } from './llm-prospecting.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { SeoAiModule } from '../content/seo-ai/seo-ai.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    SeoAiModule, // Import pour accéder à LLMProviderFactory
  ],
  controllers: [ProspectingController],
  providers: [
    ProspectingService,
    ProspectingIntegrationService,
    LLMProspectingService,
    PrismaService,
  ],
  exports: [ProspectingService, ProspectingIntegrationService, LLMProspectingService],
})
export class ProspectingModule {}
