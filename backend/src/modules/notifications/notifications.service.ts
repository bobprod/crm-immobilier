import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { SmartNotificationsService } from './smart-notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { EmailService } from '../communications/email/email.service';
import { SmsService } from '../communications/sms/sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private smartNotifications: SmartNotificationsService,
    private notificationsGateway: NotificationsGateway,
    private emailService: EmailService,
    private smsService: SmsService,
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

      // ✅ Envoyer via WebSocket si l'utilisateur est connecté (temps réel)
      if (channel === 'in_app' && this.notificationsGateway.isUserConnected(data.userId)) {
        this.notificationsGateway.sendNotificationToUser(data.userId, notification);
      }

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
   * ✅ Envoyer notification externe (Email/SMS/Push/WhatsApp)
   * Implémentation complète avec Email et SMS
   */
  private async sendExternalNotification(userId: string, notification: any, channel: string) {
    try {
      // Récupérer les informations de l'utilisateur
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for external notification`);
        return;
      }

      const notificationData = {
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        type: notification.type,
      };

      // Envoyer selon le canal
      switch (channel) {
        case 'email':
          if (user.email) {
            const result = await this.emailService.sendNotificationEmail(user.email, notificationData);
            if (result.success) {
              await this.smartNotifications.markAsDelivered(notification.id);
              this.logger.log(`📧 Email sent to ${user.email} (messageId: ${result.messageId})`);
            } else {
              this.logger.error(`Failed to send email: ${result.error}`);
            }
          } else {
            this.logger.warn(`User ${userId} has no email address`);
          }
          break;

        case 'sms':
          if (user.phone) {
            const result = await this.smsService.sendNotificationSms(user.phone, notificationData);
            if (result.success) {
              await this.smartNotifications.markAsDelivered(notification.id);
              this.logger.log(`📱 SMS sent to ${user.phone} (messageId: ${result.messageId})`);
            } else {
              this.logger.error(`Failed to send SMS: ${result.error}`);
            }
          } else {
            this.logger.warn(`User ${userId} has no phone number`);
          }
          break;

        case 'whatsapp':
          if (user.phone) {
            const result = await this.smsService.sendNotificationWhatsApp(user.phone, notificationData);
            if (result.success) {
              await this.smartNotifications.markAsDelivered(notification.id);
              this.logger.log(`💚 WhatsApp sent to ${user.phone} (messageId: ${result.messageId})`);
            } else {
              this.logger.error(`Failed to send WhatsApp: ${result.error}`);
            }
          } else {
            this.logger.warn(`User ${userId} has no phone number`);
          }
          break;

        case 'push':
          // TODO: Implémenter Push Notifications (Firebase Cloud Messaging)
          this.logger.warn(`Push notifications not yet implemented`);
          break;

        default:
          this.logger.warn(`Unknown notification channel: ${channel}`);
      }
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
