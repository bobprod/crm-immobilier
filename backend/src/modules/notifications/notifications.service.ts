import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Créer une nouvelle notification
   */
  async createNotification(data: CreateNotificationDto) {
    try {
      // TODO: Implémenter WebSocket pour push temps réel
      // TODO: Intégrer avec service Email/SMS pour notifications externes

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

      // TODO: Envoyer via WebSocket si l'utilisateur est connecté
      // this.websocketGateway.sendNotification(data.userId, notification);

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
   * Marquer une notification comme lue
   */
  async markAsRead(notificationId: string) {
    return this.prisma.notifications.update({
      where: { id: notificationId },
      data: { isRead: true },
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
}
