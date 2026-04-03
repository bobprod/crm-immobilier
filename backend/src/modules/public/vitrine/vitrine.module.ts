import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { VitrineController } from './vitrine.controller';
import { VitrineService } from './vitrine.service';
import { VitrineTrackingService } from './services/vitrine-tracking.service';
import { VitrineBuilderService } from './services/vitrine-builder.service';
import { VitrineBuilderController } from './controllers/vitrine-builder.controller';
import { SeoAiModule } from '../../content/seo-ai/seo-ai.module';
import { MarketingTrackingModule } from '../../marketing/tracking/tracking.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SeoAiModule, MarketingTrackingModule, NotificationsModule],
  controllers: [VitrineController, VitrineBuilderController],
  providers: [VitrineService, VitrineTrackingService, VitrineBuilderService],
  exports: [VitrineService, VitrineTrackingService, VitrineBuilderService],
})
export class VitrineModule {}
