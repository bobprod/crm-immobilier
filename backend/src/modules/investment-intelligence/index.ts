/**
 * Investment Intelligence Module Exports
 */

// Module
export { InvestmentIntelligenceModule } from './investment-intelligence.module';

// Controller
export { InvestmentIntelligenceController } from './investment-intelligence.controller';

// Services
export { InvestmentImportService } from './services/investment-import.service';
export { InvestmentAnalysisService } from './services/investment-analysis.service';
export { InvestmentComparisonService } from './services/investment-comparison.service';
export { InvestmentAlertService } from './services/investment-alert.service';
export { AdapterRegistryService } from './services/adapter-registry.service';

// Adapters
export { BaseInvestmentSourceAdapter } from './adapters/base-source.adapter';
export { BricksAdapter } from './adapters/bricks.adapter';
export { HomunityAdapter } from './adapters/homunity.adapter';
export { GenericAdapter } from './adapters/generic.adapter';

// Types
export * from './types/investment-project.types';

// DTOs
export * from './dto/import-project.dto';
