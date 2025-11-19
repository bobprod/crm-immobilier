import { Module } from '@nestjs/common';
import { AIMetricsController } from './ai-metrics.controller';
import { AIMetricsService } from './ai-metrics.service';

@Module({
  controllers: [AIMetricsController],
  providers: [AIMetricsService],
  exports: [AIMetricsService],
})
export class AIMetricsModule {}
