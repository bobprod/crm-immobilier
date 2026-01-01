import { Module, forwardRef } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppWebhookController } from './webhooks/whatsapp-webhook.controller';
import { WhatsAppService } from './whatsapp.service';
import { MetaCloudProvider } from './providers/meta-cloud.provider';
import { TwilioProvider } from './providers/twilio.provider';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { TemplatesModule } from './templates/templates.module';
import { ContactsModule } from './contacts/contacts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    PrismaModule,
    TemplatesModule,
    ContactsModule,
    forwardRef(() => CampaignsModule),
    AnalyticsModule,
  ],
  controllers: [WhatsAppController, WhatsAppWebhookController],
  providers: [WhatsAppService, MetaCloudProvider, TwilioProvider],
  exports: [WhatsAppService],
})
export class WhatsAppModule {}
