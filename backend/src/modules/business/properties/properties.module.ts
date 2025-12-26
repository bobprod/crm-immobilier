import { Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { PropertyHistoryService } from './property-history.service';
import { ImageCompressionService } from '../../../shared/services/image-compression.service';

@Module({
  providers: [
    PropertiesService,
    PropertyHistoryService,
    ImageCompressionService,
  ],
  controllers: [PropertiesController],
  exports: [PropertiesService, PropertyHistoryService],
})
export class PropertiesModule {}
