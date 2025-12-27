import { Module } from '@nestjs/common';
import { LLMConfigService } from './llm-config.service';
import { LLMConfigController } from './llm-config.controller';
import { LLMRouterService } from './llm-router.service';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { ApiCostTrackerService } from '../../../shared/services/api-cost-tracker.service';

/**
 * Module de configuration LLM
 * Permet à l'agent de choisir son provider IA préféré
 * Inclut le router intelligent pour sélection automatique
 */
@Module({
  controllers: [LLMConfigController],
  providers: [
    LLMConfigService,
    LLMRouterService,
    LLMProviderFactory,
    PrismaService,
    ApiCostTrackerService,
  ],
  exports: [
    LLMConfigService,
    LLMRouterService,
    LLMProviderFactory,
    ApiCostTrackerService,
  ],
})
export class LLMConfigModule {}
