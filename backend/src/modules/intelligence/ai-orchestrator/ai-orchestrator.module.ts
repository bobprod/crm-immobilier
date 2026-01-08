import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { ScrapingModule } from '../../../modules/scraping/scraping.module';
import { LLMConfigModule } from '../llm-config/llm-config.module';
import { CommunicationsModule } from '../../communications/communications.module';
import { AiBillingModule } from '../../../shared/ai-billing/ai-billing.module';

// Services d'outils
import { LlmService } from './services/llm.service';
import { SerpApiService } from './services/serpapi.service';
import { FirecrawlService } from './services/firecrawl.service';
import { IntegrationKeysService } from './services/integrations/integration-keys.service';
import { ProviderSelectorService } from './services/provider-selector.service';
import { MetricsService } from '../../../shared/metrics/metrics.service';

// Services orchestrateur
import { IntentAnalyzerService } from './services/intent-analyzer.service';
import { ExecutionPlannerService } from './services/execution-planner.service';
import { ToolExecutorService } from './services/tool-executor.service';
import { BudgetTrackerService } from './services/budget-tracker.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';

// Guards
import { OrchestratorRateLimitGuard } from './guards/orchestrator-rate-limit.guard';

// Controller
import { AiOrchestratorController } from './ai-orchestrator.controller';

@Module({
  imports: [
    PrismaModule,
    LLMConfigModule, // Pour utiliser LLMProviderFactory
    CommunicationsModule,
    AiBillingModule, // Pour ApiKeysService (utilisé par SerpApiService et FirecrawlService)
    ScrapingModule,
  ],
  providers: [
    // Guards
    OrchestratorRateLimitGuard,

    // Services d'intégration
    IntegrationKeysService,

    // Service de sélection de provider
    ProviderSelectorService,

    // Services d'outils externes
    LlmService,
    SerpApiService,
    FirecrawlService,

    // Services orchestrateur
    IntentAnalyzerService,
    ExecutionPlannerService,
    ToolExecutorService,
    BudgetTrackerService,
    AiOrchestratorService,
    // Metrics
    MetricsService,
  ],
  controllers: [AiOrchestratorController],
  exports: [
    IntegrationKeysService,
    LlmService,
    SerpApiService,
    FirecrawlService,
    ProviderSelectorService,
    MetricsService,
    IntentAnalyzerService,
    ExecutionPlannerService,
    ToolExecutorService,
    AiOrchestratorService,
  ],
})
export class AiOrchestratorModule { }
