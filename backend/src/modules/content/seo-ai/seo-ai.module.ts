import { Module } from '@nestjs/common';
import { SeoAiService } from './seo-ai.service';
import { SeoAiController } from './seo-ai.controller';
import { PrismaModule } from '@/shared/database/prisma.module';
import { LLMProviderFactory } from './providers/llm-provider.factory';

/**
 * Module SEO AI
 *
 * Optimisation automatique du référencement des biens immobiliers
 * via intelligence artificielle multi-provider.
 *
 * Fonctionnalités :
 * - Génération meta titles et descriptions
 * - Création de mots-clés pertinents
 * - FAQ pour rich snippets
 * - Alt text pour images
 * - Score SEO automatique
 * - Suggestions d'amélioration
 *
 * Providers supportés :
 * - Anthropic (Claude Sonnet 4)
 * - OpenAI (GPT-4)
 * - Google (Gemini)
 * - OpenRouter (Multi-models)
 */
@Module({
  imports: [PrismaModule],
  controllers: [SeoAiController],
  providers: [SeoAiService, LLMProviderFactory],
  exports: [SeoAiService],
})
export class SeoAiModule {}
