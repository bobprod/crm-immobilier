import { Module } from '@nestjs/common';
import { AiBillingModule } from '../../ai-billing/ai-billing.module';
import { LLMConfigService } from './llm-config.service';
import { LLMConfigController } from './llm-config.controller';
import { LLMRouterService } from './llm-router.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory, EmbeddingsProviderFactory } from './providers';
import { ApiCostTrackerService } from '../../../shared/services/api-cost-tracker.service';

/**
 * Module de configuration LLM
 * Permet à l'agent de choisir son provider IA préféré
 * Inclut le router intelligent pour sélection automatique
 */
@Module({
  imports: [AiBillingModule],
  controllers: [LLMConfigController],
  providers: [
    LLMConfigService,
    LLMRouterService,
    LLMProviderFactory,
    EmbeddingsProviderFactory,
    PrismaService,
    ApiCostTrackerService,
  ],
  exports: [
    LLMConfigService,
    LLMRouterService,
    LLMProviderFactory,
    EmbeddingsProviderFactory,
    ApiCostTrackerService,
  ],
})
export class LLMConfigModule { }
