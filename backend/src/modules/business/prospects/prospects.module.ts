import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { AIMetricsModule } from '../../intelligence/ai-metrics/ai-metrics.module';
import { ValidationModule } from '../../../shared/validation/validation.module';
import { ValidationModule as IntelligenceValidationModule } from '../../intelligence/validation/validation.module';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { ProspectsConversionTrackerService } from './prospects-conversion-tracker.service';
import { ProspectsConversionTrackerController } from './prospects-conversion-tracker.controller';
import { ProspectsEnhancedController } from './prospects-enhanced.controller';
import { ProspectsEnhancedService } from './prospects-enhanced.service';
import { ProspectHistoryService } from './prospect-history.service';
import { ProspectEnrichmentService } from './prospect-enrichment.service';
import { ProspectEnrichmentController } from './prospect-enrichment.controller';
import { ProspectSmartValidationService } from './prospect-smart-validation.service';

@Module({
  imports: [PrismaModule, AIMetricsModule, ValidationModule, IntelligenceValidationModule],
  controllers: [
    ProspectsController,
    ProspectsConversionTrackerController,
    ProspectsEnhancedController,
    ProspectEnrichmentController,
  ],
  providers: [
    ProspectsService,
    ProspectsConversionTrackerService,
    ProspectsEnhancedService,
    ProspectHistoryService,
    ProspectEnrichmentService,
    ProspectSmartValidationService,
  ],
  exports: [
    ProspectsService,
    ProspectsConversionTrackerService,
    ProspectsEnhancedService,
    ProspectHistoryService,
    ProspectEnrichmentService,
    ProspectSmartValidationService,
  ],
})
export class ProspectsModule {}
