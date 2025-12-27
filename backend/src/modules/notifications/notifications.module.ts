import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SmartNotificationsService } from './smart-notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../communications/email/email.service';
import { SmsService } from '../communications/sms/sms.service';
import { PrismaModule } from '../../shared/database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    SmartNotificationsService,
    NotificationsGateway,
    EmailService,
    SmsService,
  ],
  exports: [NotificationsService, SmartNotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
