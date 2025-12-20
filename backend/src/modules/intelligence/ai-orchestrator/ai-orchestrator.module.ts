import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { LLMConfigModule } from '../llm-config/llm-config.module';

// Services d'outils
import { LlmService } from './services/llm.service';
import { SerpApiService } from './services/serpapi.service';
import { FirecrawlService } from './services/firecrawl.service';

// Services orchestrateur
import { IntentAnalyzerService } from './services/intent-analyzer.service';
import { ExecutionPlannerService } from './services/execution-planner.service';
import { ToolExecutorService } from './services/tool-executor.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';

// Controller
import { AiOrchestratorController } from './ai-orchestrator.controller';

@Module({
  imports: [
    PrismaModule,
    LLMConfigModule, // Pour utiliser LLMProviderFactory
  ],
  providers: [
    // Services d'outils externes
    LlmService,
    SerpApiService,
    FirecrawlService,

    // Services orchestrateur
    IntentAnalyzerService,
    ExecutionPlannerService,
    ToolExecutorService,
    AiOrchestratorService,
  ],
  controllers: [AiOrchestratorController],
  exports: [
    LlmService,
    SerpApiService,
    FirecrawlService,
    IntentAnalyzerService,
    ExecutionPlannerService,
    ToolExecutorService,
    AiOrchestratorService,
  ],
})
export class AiOrchestratorModule {}
