import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { AIMetricsModule } from '../../intelligence/ai-metrics/ai-metrics.module';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { ProspectsConversionTrackerService } from './prospects-conversion-tracker.service';
import { ProspectsConversionTrackerController } from './prospects-conversion-tracker.controller';
import { ProspectsEnhancedController } from './prospects-enhanced.controller';
import { ProspectsEnhancedService } from './prospects-enhanced.service';
import { ProspectHistoryService } from './prospect-history.service';
import { ProspectEnrichmentService } from './prospect-enrichment.service';
import { ProspectEnrichmentController } from './prospect-enrichment.controller';

@Module({
  imports: [PrismaModule, AIMetricsModule],
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
  ],
  exports: [
    ProspectsService,
    ProspectsConversionTrackerService,
    ProspectsEnhancedService,
    ProspectHistoryService,
    ProspectEnrichmentService,
  ],
})
export class ProspectsModule {}
