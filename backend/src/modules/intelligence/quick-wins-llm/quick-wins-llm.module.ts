import { Module } from '@nestjs/common';
import { QuickWinsLLMService } from './quick-wins-llm.service';
import { LLMConfigModule } from '../llm-config/llm-config.module';
import { ApiCostTrackerService } from '../../../shared/services/api-cost-tracker.service';
import { PrismaService } from '../../../shared/database/prisma.service';

@Module({
  imports: [LLMConfigModule],
  providers: [QuickWinsLLMService, ApiCostTrackerService, PrismaService],
  exports: [QuickWinsLLMService],
})
export class QuickWinsLLMModule {}
