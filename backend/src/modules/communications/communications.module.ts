import { Module } from '@nestjs/common';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { EmailService } from './email/email.service';
import { SmsService } from './sms/sms.service';
import { PrismaService } from '../../shared/database/prisma.service';

@Module({
  controllers: [CommunicationsController, IntegrationsController],
  providers: [
    CommunicationsService,
    IntegrationsService,
    EmailService,
    SmsService,
    PrismaService,
  ],
  exports: [CommunicationsService, IntegrationsService, EmailService, SmsService],
})
export class CommunicationsModule {}
