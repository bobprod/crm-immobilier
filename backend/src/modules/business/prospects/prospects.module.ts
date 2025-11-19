import { Module } from '@nestjs/common';
import { AIMetricsModule } from '../../intelligence/ai-metrics/ai-metrics.module';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { ProspectsConversionTrackerService } from './prospects-conversion-tracker.service';
import { ProspectsConversionTrackerController } from './prospects-conversion-tracker.controller';

@Module({
  imports: [AIMetricsModule],
  controllers: [
    ProspectsController,
    ProspectsConversionTrackerController,
  ],
  providers: [
    ProspectsService,
    ProspectsConversionTrackerService,
  ],
  exports: [
    ProspectsService,
    ProspectsConversionTrackerService,
  ],
})
export class ProspectsModule {}
