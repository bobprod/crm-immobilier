import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SmartNotificationsService } from './smart-notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { CommunicationsModule } from '../communications/communications.module';
import { PrismaModule } from '../../shared/database/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    CommunicationsModule,
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
  ],
  exports: [NotificationsService, SmartNotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
