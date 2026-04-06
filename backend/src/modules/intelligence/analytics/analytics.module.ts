import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsEventHandlerService } from './analytics-event-handler.service';
import { PrismaModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsEventHandlerService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
