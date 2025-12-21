/**
 * Investment Intelligence Module
 * Multi-platform investment project analysis and comparison
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/database/prisma.module';
import { AiOrchestratorModule } from '../intelligence/ai-orchestrator/ai-orchestrator.module';

// Controllers
import { InvestmentIntelligenceController } from './investment-intelligence.controller';

// Services
import { InvestmentImportService } from './services/investment-import.service';
import { InvestmentAnalysisService } from './services/investment-analysis.service';
import { InvestmentComparisonService } from './services/investment-comparison.service';
import { InvestmentAlertService } from './services/investment-alert.service';
import { AdapterRegistryService } from './services/adapter-registry.service';

// Adapters
import { BricksAdapter } from './adapters/bricks.adapter';
import { HomunityAdapter } from './adapters/homunity.adapter';
import { GenericAdapter } from './adapters/generic.adapter';

@Module({
  imports: [
    PrismaModule,
    AiOrchestratorModule, // For AI analysis
  ],
  controllers: [InvestmentIntelligenceController],
  providers: [
    // Services
    InvestmentImportService,
    InvestmentAnalysisService,
    InvestmentComparisonService,
    InvestmentAlertService,
    AdapterRegistryService,

    // Adapters
    BricksAdapter,
    HomunityAdapter,
    GenericAdapter,

    // TODO: Add more adapters as they are implemented
    // AnaxagoAdapter,
    // FundimmoAdapter,
    // FundriseAdapter,
    // etc.
  ],
  exports: [
    InvestmentImportService,
    InvestmentAnalysisService,
    InvestmentComparisonService,
    InvestmentAlertService,
    AdapterRegistryService,
  ],
})
export class InvestmentIntelligenceModule {}
