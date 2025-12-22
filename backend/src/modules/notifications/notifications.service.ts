import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Créer une nouvelle notification
   */
  async createNotification(data: CreateNotificationDto) {
    try {
      this.logger.log(`Creating notification for user ${data.userId}: ${data.title}`);

      // Créer la notification dans la base de données
      const notification = await this.prisma.notifications.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.parse(data.metadata) : {},
          isRead: false,
        },
      });

      // Envoyer via WebSocket
      this.notificationsGateway.sendNotificationToUser(data.userId, notification);

      // Si notification importante, envoyer email/SMS
      if (data.type === NotificationType.APPOINTMENT || data.type === NotificationType.LEAD) {
        await this.sendExternalNotification(data.userId, notification);
      }

      return notification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string, limit: number = 20) {
    return this.prisma.notifications.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupérer les notifications non lues
   */
  async getUnreadNotifications(userId: string) {
    return this.prisma.notifications.findMany({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Compter les notifications non lues
   */
  async countUnreadNotifications(userId: string): Promise<number> {
    return this.prisma.notifications.count({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
    });
  }

  /**
   * Pagination cursor-based des notifications
   */
  async getUserNotificationsPaginated(userId: string, query: PaginationQueryDto) {
    const limit = query.limit || 20;
    
    const notifications = await this.prisma.notifications.findMany({
      where: { userId, deletedAt: null },
      take: limit + 1, // +1 pour savoir s'il y a une page suivante
      ...(query.cursor && {
        cursor: { id: query.cursor },
        skip: 1, // Skip le cursor lui-même
      }),
      orderBy: { createdAt: 'desc' },
    });

    const hasNextPage = notifications.length > limit;
    const items = hasNextPage ? notifications.slice(0, limit) : notifications;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasNextPage,
    };
  }

  /**
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string) {
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        userId,
        isRead: false,
        deletedAt: null,
      },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mettre à jour une notification
   */
  async updateNotification(notificationId: string, data: UpdateNotificationDto) {
    try {
      this.logger.log(`Updating notification ${notificationId}`);

      // Check if notification exists
      const existingNotification = await this.prisma.notifications.findUnique({
        where: { id: notificationId },
      });

      if (!existingNotification) {
        throw new NotFoundException(`Notification with id ${notificationId} not found`);
      }

      const updateData: any = {};

      if (data.type !== undefined) updateData.type = data.type;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.message !== undefined) updateData.message = data.message;
      if (data.actionUrl !== undefined) updateData.actionUrl = data.actionUrl;
      if (data.metadata !== undefined) {
        try {
          updateData.metadata = JSON.parse(data.metadata);
        } catch (parseError) {
          this.logger.error(`Invalid JSON in metadata: ${parseError.message}`);
          throw new BadRequestException(`Invalid JSON format in metadata field: ${parseError.message}`);
        }
      }

      const notification = await this.prisma.notifications.update({
        where: { id: notificationId },
        data: updateData,
      });

      return notification;
    } catch (error) {
      this.logger.error(`Error updating notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Supprimer une notification (soft delete)
   */
  async deleteNotification(notificationId: string) {
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restaurer une notification supprimée
   */
  async restoreNotification(notificationId: string) {
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { deletedAt: null },
    });
  }

  /**
   * Supprimer définitivement une notification (hard delete)
   */
  async hardDeleteNotification(notificationId: string) {
    return this.prisma.notifications.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Nettoyer les anciennes notifications (> 30 jours)
   */
  async cleanOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.notifications.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        isRead: true,
      },
    });

    this.logger.log(`Cleaned ${result.count} old notifications`);
    return result;
  }

  /**
   * Envoyer notification externe (Email/SMS)
   * TODO: Implémenter l'intégration avec le service de communications
   */
  private async sendExternalNotification(userId: string, notification: any) {
    try {
      // Récupérer les préférences de notification de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phone: true,
          // TODO: Ajouter champ notificationPreferences dans le schema
        },
      });

      if (!user) return;

      // TODO: Intégrer avec le service de communications
      // await this.communicationsService.sendEmail({
      //   to: user.email,
      //   subject: notification.title,
      //   body: notification.message
      // });

      this.logger.debug(`External notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error sending external notification: ${error.message}`);
      // Ne pas throw l'erreur pour ne pas bloquer la création de notification
    }
  }

  /**
   * Créer des notifications automatiques pour différents événements
   */
  async createAppointmentNotification(userId: string, appointmentData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.APPOINTMENT,
      title: 'Nouveau rendez-vous',
      message: `Rendez-vous prévu le ${new Date(appointmentData.date).toLocaleDateString()}`,
      actionUrl: `/appointments/${appointmentData.id}`,
      metadata: JSON.stringify(appointmentData),
    });
  }

  async createLeadNotification(userId: string, leadData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.LEAD,
      title: 'Nouveau prospect',
      message: `Nouveau prospect: ${leadData.name}`,
      actionUrl: `/prospects/${leadData.id}`,
      metadata: JSON.stringify(leadData),
    });
  }

  async createTaskNotification(userId: string, taskData: any) {
    return this.createNotification({
      userId,
      type: NotificationType.TASK,
      title: 'Nouvelle tâche',
      message: `Tâche assignée: ${taskData.title}`,
      actionUrl: `/tasks/${taskData.id}`,
      metadata: JSON.stringify(taskData),
    });
  }

  async createSystemNotification(userId: string, message: string) {
    return this.createNotification({
      userId,
      type: NotificationType.SYSTEM,
      title: 'Notification système',
      message,
      metadata: JSON.stringify({}),
    });
  }

  /**
   * Obtenir les statistiques de lecture
   */
  async getReadingStats(userId: string) {
    const notifications = await this.prisma.notifications.findMany({
      where: { userId, isRead: true, readAt: { not: null }, deletedAt: null },
      select: { createdAt: true, readAt: true },
    });

    if (notifications.length === 0) {
      return {
        totalRead: 0,
        averageReadingTimeMinutes: 0,
        fastestReadMinutes: 0,
        slowestReadMinutes: 0,
      };
    }

    const readingTimes = notifications.map(n => {
      const created = new Date(n.createdAt).getTime();
      const read = new Date(n.readAt!).getTime();
      return (read - created) / 1000 / 60; // minutes
    });

    const avgReadingTime = readingTimes.reduce((a, b) => a + b, 0) / readingTimes.length;

    return {
      totalRead: notifications.length,
      averageReadingTimeMinutes: parseFloat(avgReadingTime.toFixed(2)),
      fastestReadMinutes: parseFloat(Math.min(...readingTimes).toFixed(2)),
      slowestReadMinutes: parseFloat(Math.max(...readingTimes).toFixed(2)),
    };
  }

  /**
   * Supprimer définitivement les notifications soft-deleted anciennes
   */
  async hardDeleteOldSoftDeleted(beforeDate: Date) {
    return this.prisma.notifications.deleteMany({
      where: {
        deletedAt: { lt: beforeDate, not: null },
      },
    });
  }
}
