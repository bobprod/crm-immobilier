import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { VitrineController } from './vitrine.controller';
import { VitrineService } from './vitrine.service';
import { VitrineConfigService } from './services/vitrine-config.service';
import { VitrinePublicService } from './services/vitrine-public.service';
import { VitrineLeadService } from './services/vitrine-lead.service';
import { VitrineAgentService } from './services/vitrine-agent.service';
import { VitrineTrackingService } from './services/vitrine-tracking.service';
import { VitrineBuilderService } from './services/vitrine-builder.service';
import { VitrineBuilderController } from './controllers/vitrine-builder.controller';
import { SeoAiModule } from '../../content/seo-ai/seo-ai.module';
import { MarketingTrackingModule } from '../../marketing/tracking/tracking.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
  imports: [PrismaModule, SeoAiModule, MarketingTrackingModule, NotificationsModule],
  controllers: [VitrineController, VitrineBuilderController],
  providers: [
    VitrineService,
    VitrineConfigService,
    VitrinePublicService,
    VitrineLeadService,
    VitrineAgentService,
    VitrineTrackingService,
    VitrineBuilderService,
  ],
  exports: [
    VitrineService,
    VitrineConfigService,
    VitrinePublicService,
    VitrineLeadService,
    VitrineAgentService,
    VitrineTrackingService,
    VitrineBuilderService,
  ],
})
export class VitrineModule {}
