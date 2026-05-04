/**
 * Investment Intelligence Module
 * Multi-platform investment project analysis, comparison & Pépite Detector
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/database/prisma.module';
import { AiOrchestratorModule } from '../intelligence/ai-orchestrator/ai-orchestrator.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Controllers
import { InvestmentIntelligenceController } from './investment-intelligence.controller';

// Existing services
import { InvestmentImportService } from './services/investment-import.service';
import { InvestmentAnalysisService } from './services/investment-analysis.service';
import { InvestmentComparisonService } from './services/investment-comparison.service';
import { InvestmentAlertService } from './services/investment-alert.service';
import { AdapterRegistryService } from './services/adapter-registry.service';

// Adapters
import { BricksAdapter } from './adapters/bricks.adapter';
import { HomunityAdapter } from './adapters/homunity.adapter';
import { GenericAdapter } from './adapters/generic.adapter';

// Pépite Detector services
import { GeopauService } from './services/pepite/tunisia/geopau.service';
import { JortService } from './services/pepite/tunisia/jort.service';
import { DomaineEtatService } from './services/pepite/tunisia/domainetat.service';
import { DvfService } from './services/pepite/france/dvf.service';
import { GeorisquesService } from './services/pepite/france/georisques.service';
import { PepiteScorerService } from './services/pepite/pepite-scorer.service';
import { PepiteAiService } from './services/pepite/pepite-ai.service';
import { PepiteBenchmarkService } from './services/pepite/pepite-benchmark.service';
import { PepiteCronService } from './services/pepite/pepite-cron.service';

@Module({
  imports: [
    PrismaModule,
    AiOrchestratorModule,
    ScrapingModule,
    NotificationsModule,
  ],
  controllers: [InvestmentIntelligenceController],
  providers: [
    // Existing services
    InvestmentImportService,
    InvestmentAnalysisService,
    InvestmentComparisonService,
    InvestmentAlertService,
    AdapterRegistryService,

    // Adapters
    BricksAdapter,
    HomunityAdapter,
    GenericAdapter,

    // Pépite / Radar Spot
    GeopauService,
    JortService,
    DomaineEtatService,
    DvfService,
    GeorisquesService,
    PepiteAiService,
    PepiteBenchmarkService,
    PepiteScorerService,
    PepiteCronService,
  ],
  exports: [
    InvestmentImportService,
    InvestmentAnalysisService,
    InvestmentComparisonService,
    InvestmentAlertService,
    AdapterRegistryService,
    PepiteScorerService,
  ],
})
export class InvestmentIntelligenceModule {}
