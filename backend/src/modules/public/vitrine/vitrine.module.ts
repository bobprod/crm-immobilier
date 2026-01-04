import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { VitrineController } from './vitrine.controller';
import { VitrineService } from './vitrine.service';
import { VitrineTrackingService } from './services/vitrine-tracking.service';
import { SeoAiModule } from '../../content/seo-ai/seo-ai.module';
import { MarketingTrackingModule } from '../../marketing/tracking/tracking.module';

@Module({
  imports: [PrismaModule, SeoAiModule, MarketingTrackingModule],
  controllers: [VitrineController],
  providers: [VitrineService, VitrineTrackingService],
  exports: [VitrineService, VitrineTrackingService],
})
export class VitrineModule {}
