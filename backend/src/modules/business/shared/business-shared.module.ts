import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from '../../notifications/notifications.module';
import { PrismaModule as DatabaseModule } from '../../../shared/database/prisma.module';
import { BusinessNotificationHelper } from './notification.helper';
import { BusinessActivityLogger } from './activity-logger.helper';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { EmailService } from './email.service';
import { BusinessEventHandlers } from './events/business.event-handlers';

@Module({
  imports: [
    NotificationsModule,
    DatabaseModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      // Use this instance across the whole app
      global: true,
      // Configure the EventEmitter
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
  ],
  providers: [
    BusinessNotificationHelper,
    BusinessActivityLogger,
    ScheduledTasksService,
    EmailService,
    BusinessEventHandlers,
  ],
  exports: [
    BusinessNotificationHelper,
    BusinessActivityLogger,
    EmailService,
  ],
})
export class BusinessSharedModule { }
