import { Module } from '@nestjs/common';
import { AIMetricsController } from './ai-metrics.controller';
import { AIMetricsService } from './ai-metrics.service';
import { ProspectingMetricsService } from './prospecting-metrics.service';

@Module({
  controllers: [AIMetricsController],
  providers: [AIMetricsService, ProspectingMetricsService],
  exports: [AIMetricsService, ProspectingMetricsService],
})
export class AIMetricsModule {}
