import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(private notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanOldNotifications() {
    this.logger.log('Starting automatic cleanup of old notifications...');

    try {
      const result = await this.notificationsService.cleanOldNotifications();
      this.logger.log(`Cleanup completed: ${result.count} notifications removed`);
    } catch (error) {
      this.logger.error('Cleanup failed:', error);
    }
  }

  @Cron(CronExpression.EVERY_WEEK)
  async cleanDeletedNotifications() {
    this.logger.log('Starting cleanup of soft-deleted notifications...');

    try {
      // Hard delete notifications soft-deleted > 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.notificationsService.hardDeleteOldSoftDeleted(thirtyDaysAgo);
      this.logger.log(`Hard delete completed: ${result.count} notifications permanently removed`);
    } catch (error) {
      this.logger.error('Hard delete failed:', error);
    }
  }
}
