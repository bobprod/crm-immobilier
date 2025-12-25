import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { SmartNotificationsService } from './smart-notifications.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private smartNotifications: SmartNotificationsService,
  ) {}

  /**
   * Créer une nouvelle notification avec Smart AI
   */
  async createNotification(
    data: CreateNotificationDto,
    options?: {
      priority?: 'high' | 'medium' | 'low';
      bypassSmartRouting?: boolean;
    },
  ) {
    try {
      const priority = options?.priority || 'medium';
      const bypassSmartRouting = options?.bypassSmartRouting || false;

      this.logger.log(`Creating notification for user ${data.userId}: ${data.title}`);

      // ✅ SMART AI ROUTING - Décider si et comment envoyer
      let channel = 'in_app'; // Défaut
      let shouldSend = true;

      if (!bypassSmartRouting) {
        const decision = await this.smartNotifications.shouldSendNotification(
          data.userId,
          data.type,
          priority,
        );

        shouldSend = decision.shouldSend;
        channel = decision.channel || 'in_app';

        if (!shouldSend) {
          this.logger.debug(
            `Smart AI delayed notification: ${decision.reason}. Suggested time: ${decision.suggestedTime}`,
          );

          // TODO: Implémenter queue pour envoyer plus tard
          // await this.scheduleNotification(data, decision.suggestedTime);

          return {
            delayed: true,
            reason: decision.reason,
            suggestedTime: decision.suggestedTime,
          };
        }
      }

      // Créer la notification dans la base de données avec le canal optimisé
      const notification = await this.prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          metadata: data.metadata ? JSON.parse(data.metadata) : {},
          channel, // ✅ Canal sélectionné par l'AI
          isRead: false,
        },
      });

      // Marquer comme livrée immédiatement pour in_app
      if (channel === 'in_app') {
        await this.smartNotifications.markAsDelivered(notification.id);
      }

      // TODO: Envoyer via WebSocket si l'utilisateur est connecté
      // this.websocketGateway.sendNotification(data.userId, notification);

      // Envoyer via le canal externe si nécessaire
      if (channel !== 'in_app') {
        await this.sendExternalNotification(data.userId, notification, channel);
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
      where: { userId },
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
      },
    });
  }

  /**
   * Marquer une notification comme lue (et ouverte)
   */
  async markAsRead(notificationId: string) {
    // Utiliser le SmartService pour tracking complet
    return this.smartNotifications.markAsOpened(notificationId);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId: string) {
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
   * Envoyer notification externe (Email/SMS/Push)
   * TODO: Implémenter l'intégration avec le service de communications
   */
  private async sendExternalNotification(userId: string, notification: any, channel: string) {
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
}
