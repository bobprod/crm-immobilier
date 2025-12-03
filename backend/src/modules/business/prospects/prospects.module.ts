import { Module } from '@nestjs/common';
import { AIMetricsModule } from '../../intelligence/ai-metrics/ai-metrics.module';
import { LLMConfigModule } from '../../intelligence/llm-config/llm-config.module';
import { ProspectsController } from './prospects.controller';
import { ProspectsService } from './prospects.service';
import { ProspectsConversionTrackerService } from './prospects-conversion-tracker.service';
import { ProspectsConversionTrackerController } from './prospects-conversion-tracker.controller';
import { ProspectsEnhancedController } from './prospects-enhanced.controller';
import { ProspectsEnhancedService } from './prospects-enhanced.service';
import { ProspectsAIController } from './prospects-ai.controller';
import { ProspectsAIService } from './prospects-ai.service';

@Module({
  imports: [AIMetricsModule, LLMConfigModule],
  controllers: [
    ProspectsController,
    ProspectsConversionTrackerController,
    ProspectsEnhancedController,
    ProspectsAIController,
  ],
  providers: [
    ProspectsService,
    ProspectsConversionTrackerService,
    ProspectsEnhancedService,
    ProspectsAIService,
  ],
  exports: [
    ProspectsService,
    ProspectsConversionTrackerService,
    ProspectsEnhancedService,
    ProspectsAIService,
  ],
})
export class ProspectsModule {}
