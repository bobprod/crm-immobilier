import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from '../../notifications/notifications.module';
import { DatabaseModule } from '../../../shared/services/database/database.module';
import { BusinessNotificationHelper } from './notification.helper';
import { BusinessActivityLogger } from './activity-logger.helper';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { EmailService } from './email.service';

@Module({
  imports: [
    NotificationsModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    BusinessNotificationHelper,
    BusinessActivityLogger,
    ScheduledTasksService,
    EmailService,
  ],
  exports: [
    BusinessNotificationHelper,
    BusinessActivityLogger,
    EmailService,
  ],
})
export class BusinessSharedModule {}
