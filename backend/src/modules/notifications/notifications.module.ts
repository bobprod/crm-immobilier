import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SmartNotificationsService } from './smart-notifications.service';
import { PrismaModule } from '../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmartNotificationsService],
  exports: [NotificationsService, SmartNotificationsService], // Exporter pour utilisation dans d'autres modules
})
export class NotificationsModule {}
