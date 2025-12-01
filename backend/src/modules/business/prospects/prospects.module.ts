import { Module } from '@nestjs/common';
import { AIMetricsModule } from '../../intelligence/ai-metrics/ai-metrics.module';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { ProspectsConversionTrackerService } from './prospects-conversion-tracker.service';
import { ProspectsConversionTrackerController } from './prospects-conversion-tracker.controller';
import { ProspectsEnhancedController } from './prospects-enhanced.controller';
import { ProspectsEnhancedService } from './prospects-enhanced.service';

@Module({
  imports: [AIMetricsModule],
  controllers: [
    ProspectsController,
    ProspectsConversionTrackerController,
    ProspectsEnhancedController,
  ],
  providers: [ProspectsService, ProspectsConversionTrackerService, ProspectsEnhancedService],
  exports: [ProspectsService, ProspectsConversionTrackerService, ProspectsEnhancedService],
})
export class ProspectsModule {}
