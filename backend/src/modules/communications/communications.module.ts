import { Module } from '@nestjs/common';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { CommunicationsAIService } from './communications-ai.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { PrismaService } from '../../shared/database/prisma.service';
import { QuickWinsLLMModule } from '../intelligence/quick-wins-llm/quick-wins-llm.module';
import { AIChatAssistantModule } from '../intelligence/ai-chat-assistant/ai-chat-assistant.module';

@Module({
  imports: [QuickWinsLLMModule, AIChatAssistantModule],
  controllers: [CommunicationsController, IntegrationsController],
  providers: [
    CommunicationsService,
    CommunicationsAIService,
    IntegrationsService,
    EmailService,
    SmsService,
    PrismaService,
  ],
  exports: [
    CommunicationsService,
    CommunicationsAIService,
    IntegrationsService,
    EmailService,
    SmsService,
  ],
})
export class CommunicationsModule {}
