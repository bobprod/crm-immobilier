import { Module } from '@nestjs/common';
import { LLMConfigService } from './llm-config.service';
import { LLMConfigController } from './llm-config.controller';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';

/**
 * Module de configuration LLM
 * Permet à l'agent de choisir son provider IA préféré
 */
@Module({
  controllers: [LLMConfigController],
  providers: [LLMConfigService, LLMProviderFactory, PrismaService],
  exports: [LLMConfigService, LLMProviderFactory],
})
export class LLMConfigModule {}
