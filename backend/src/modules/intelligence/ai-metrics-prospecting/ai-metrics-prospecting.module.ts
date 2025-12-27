import { Module } from '@nestjs/common';
import { AIMetricsProspectingController } from './ai-metrics-prospecting.controller';
import { AIMetricsProspectingService } from './ai-metrics-prospecting.service';

@Module({
  controllers: [AIMetricsProspectingController],
  providers: [AIMetricsProspectingService],
  exports: [AIMetricsProspectingService],
})
export class AIMetricsProspectingModule {}
