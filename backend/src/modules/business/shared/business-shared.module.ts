import { Module } from '@nestjs/common';
import { NotificationsModule } from '../../notifications/notifications.module';
import { BusinessNotificationHelper } from './notification.helper';

@Module({
  imports: [NotificationsModule],
  providers: [BusinessNotificationHelper],
  exports: [BusinessNotificationHelper],
})
export class BusinessSharedModule {}
