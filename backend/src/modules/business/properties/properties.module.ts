import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyHistoryService } from './property-history.service';
import { PropertyTrackingStatsService } from './property-tracking-stats.service';
import { ImageCompressionService } from '../../../shared/services/image-compression.service';
import { PrismaModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PropertiesService,
    PropertyHistoryService,
    PropertyTrackingStatsService,
    ImageCompressionService,
  ],
  controllers: [PropertiesController],
  exports: [PropertiesService, PropertyHistoryService, PropertyTrackingStatsService],
})
export class PropertiesModule {}
