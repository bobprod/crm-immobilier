import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateNotificationDto, NotificationType } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
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
  ) { }

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
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUserNotificationsPaginated(userId: string, query: any) {
    const limit = query?.limit || 20;
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
          throw new BadRequestException(
            `Invalid JSON format in metadata field: ${parseError.message}`,
          );
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

  async hardDeleteOldSoftDeleted(cutoffDate: Date) {
    return this.prisma.notifications.deleteMany({
      where: {
        deletedAt: {
          lt: cutoffDate,
        },
      },
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

      // Envoyer selon le canal (avec support multi-tenant)
      switch (channel) {
        case 'email':
          if (user.email) {
            // Utiliser sendForUser pour support multi-tenant
            const emailHtml = this.getNotificationEmailHtml(notificationData);
            const emailText = `${notificationData.title}\n\n${notificationData.message}${notificationData.actionUrl ? `\n\nLien: ${notificationData.actionUrl}` : ''
              }`;

            const result = await this.emailService.sendForUser(userId, {
              to: user.email,
              subject: notificationData.title,
              html: emailHtml,
              text: emailText,
            });

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
            // Utiliser sendSmsForUser pour support multi-tenant
            const smsMessage = this.getNotificationSmsText(notificationData);
            const result = await this.smsService.sendSmsForUser(userId, {
              to: user.phone,
              message: smsMessage,
            });

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
            // Utiliser sendWhatsAppForUser pour support multi-tenant
            const whatsappMessage = this.getNotificationWhatsAppText(notificationData);
            const result = await this.smsService.sendWhatsAppForUser(userId, {
              to: user.phone,
              message: whatsappMessage,
            });

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

  /**
   * 🎨 Template HTML pour email de notification (simplifié)
   */
  private getNotificationEmailHtml(notification: {
    title: string;
    message: string;
    actionUrl?: string;
    type?: string;
  }): string {
    const typeColors: Record<string, string> = {
      appointment: '#3B82F6',
      task: '#F59E0B',
      lead: '#10B981',
      system: '#6B7280',
      property: '#8B5CF6',
      message: '#EC4899',
    };

    const color = typeColors[notification.type || 'system'] || '#6B7280';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${notification.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden;">
          <tr>
            <td style="background-color: ${color}; padding: 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🏠 CRM Immobilier</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">${notification.title}</h2>
              <p style="margin: 0; color: #4B5563; font-size: 16px; line-height: 1.6;">${notification.message}</p>
              ${notification.actionUrl
        ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${notification.actionUrl}" style="display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">Voir →</a>
                  </td>
                </tr>
              </table>
              `
        : ''
      }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * 📱 Format SMS pour notification (max 160 caractères)
   */
  private getNotificationSmsText(notification: {
    title: string;
    message: string;
    actionUrl?: string;
  }): string {
    let smsMessage = `${notification.title}\n${notification.message}`;

    if (notification.actionUrl) {
      smsMessage += `\n${notification.actionUrl}`;
    }

    // Tronquer si trop long
    if (smsMessage.length > 160) {
      smsMessage = smsMessage.substring(0, 157) + '...';
    }

    return smsMessage;
  }

  /**
   * 💚 Format WhatsApp pour notification
   */
  private getNotificationWhatsAppText(notification: {
    title: string;
    message: string;
    actionUrl?: string;
  }): string {
    let whatsappMessage = `*${notification.title}*\n\n${notification.message}`;

    if (notification.actionUrl) {
      whatsappMessage += `\n\n🔗 ${notification.actionUrl}`;
    }

    return whatsappMessage;
  }
}
