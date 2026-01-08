import { Module, forwardRef } from '@nestjs/common';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { CommunicationsAIService } from './communications-ai.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { UnifiedCommunicationService } from './unified-communication.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { QuickWinsLLMModule } from '../intelligence/quick-wins-llm/quick-wins-llm.module';
import { AIChatAssistantModule } from '../intelligence/ai-chat-assistant/ai-chat-assistant.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    QuickWinsLLMModule,
    forwardRef(() => AIChatAssistantModule),
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [CommunicationsController, IntegrationsController],
  providers: [
    CommunicationsService,
    CommunicationsAIService,
    IntegrationsService,
    EmailService,
    SmsService,
    UnifiedCommunicationService,
    PrismaService,
  ],
  exports: [
    CommunicationsService,
    CommunicationsAIService,
    IntegrationsService,
    EmailService,
    SmsService,
    UnifiedCommunicationService,
  ],
})
export class CommunicationsModule {}
