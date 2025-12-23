import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  NOTIFICATION_FATIGUE_THRESHOLD,
  NOTIFICATION_FATIGUE_WINDOW_MS,
} from '../../intelligence/priority-inbox/constants';

/**
 * Service pour les fonctionnalités de notification intelligente
 */
@Injectable()
export class SmartNotificationsService {
  private readonly logger = new Logger(SmartNotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Déterminer le meilleur moment pour envoyer une notification
   */
  async calculateOptimalTiming(userId: string): Promise<Date> {
    try {
      // Analyser l'historique d'ouverture des notifications
      const notifications = await this.prisma.notifications.findMany({
        where: {
          userId,
          isRead: true,
          readAt: { not: null },
        },
        orderBy: { readAt: 'desc' },
        take: 100,
      });

      if (notifications.length < 10) {
        // Par défaut, envoyer à 10h si pas assez de données
        const now = new Date();
        const optimal = new Date(now);
        optimal.setHours(10, 0, 0, 0);
        if (optimal < now) {
          optimal.setDate(optimal.getDate() + 1);
        }
        return optimal;
      }

      // Analyser les heures d'ouverture
      const hourCounts = new Array(24).fill(0);
      notifications.forEach((notif) => {
        if (notif.readAt) {
          const hour = notif.readAt.getHours();
          hourCounts[hour]++;
        }
      });

      // Trouver l'heure la plus active
      const maxHour = hourCounts.indexOf(Math.max(...hourCounts));

      const now = new Date();
      const optimal = new Date(now);
      optimal.setHours(maxHour, 0, 0, 0);

      // Si l'heure optimale est déjà passée, planifier pour demain
      if (optimal < now) {
        optimal.setDate(optimal.getDate() + 1);
      }

      return optimal;
    } catch (error) {
      this.logger.error(`Error calculating optimal timing: ${error.message}`);
      return new Date(); // Envoyer immédiatement en cas d'erreur
    }
  }

  /**
   * Déterminer le meilleur canal de communication
   */
  async determineOptimalChannel(userId: string): Promise<string> {
    try {
      // Analyser l'historique d'engagement par canal
      // Pour l'instant, retourner 'push' par défaut
      // TODO: Implémenter l'analyse des taux d'ouverture par canal

      return 'push'; // push, email, sms, whatsapp
    } catch (error) {
      this.logger.error(`Error determining optimal channel: ${error.message}`);
      return 'push';
    }
  }

  /**
   * Personnaliser le contenu de la notification
   */
  async personalizeNotification(
    userId: string,
    baseTitle: string,
    baseMessage: string,
    context?: any,
  ): Promise<{ title: string; message: string }> {
    try {
      // Obtenir les préférences de l'utilisateur
      const user = await this.prisma.users.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      let title = baseTitle;
      let message = baseMessage;

      // Ajouter le prénom si disponible
      if (user?.firstName) {
        message = `${user.firstName}, ${message}`;
      }

      // Contextualiser selon le type de notification
      if (context?.type === 'appointment') {
        title = `📅 ${title}`;
      } else if (context?.type === 'lead') {
        title = `👤 ${title}`;
      } else if (context?.type === 'property') {
        title = `🏠 ${title}`;
      }

      return { title, message };
    } catch (error) {
      this.logger.error(`Error personalizing notification: ${error.message}`);
      return { title: baseTitle, message: baseMessage };
    }
  }

  /**
   * Vérifier si l'utilisateur ne reçoit pas trop de notifications (anti-spam)
   */
  async checkNotificationFatigue(userId: string): Promise<boolean> {
    try {
      const now = new Date();
      const windowAgo = new Date(now.getTime() - NOTIFICATION_FATIGUE_WINDOW_MS);

      // Compter les notifications des dernières X minutes
      const recentCount = await this.prisma.notifications.count({
        where: {
          userId,
          createdAt: { gte: windowAgo },
        },
      });

      // Limiter selon le seuil configuré
      return recentCount >= NOTIFICATION_FATIGUE_THRESHOLD;
    } catch (error) {
      this.logger.error(`Error checking notification fatigue: ${error.message}`);
      return false;
    }
  }

  /**
   * Prédire l'engagement pour une notification
   */
  async predictEngagement(
    userId: string,
    notificationType: string,
  ): Promise<number> {
    try {
      // Analyser l'historique d'engagement par type
      const notifications = await this.prisma.notifications.findMany({
        where: {
          userId,
          type: notificationType,
        },
        take: 50,
      });

      if (notifications.length === 0) {
        return 0.5; // 50% par défaut
      }

      const readCount = notifications.filter((n) => n.isRead).length;
      const engagementRate = readCount / notifications.length;

      return engagementRate;
    } catch (error) {
      this.logger.error(`Error predicting engagement: ${error.message}`);
      return 0.5;
    }
  }

  /**
   * Obtenir les statistiques d'engagement des notifications
   */
  async getEngagementStats(userId: string): Promise<any> {
    try {
      const [total, unread, read] = await Promise.all([
        this.prisma.notifications.count({
          where: { userId },
        }),
        this.prisma.notifications.count({
          where: { userId, isRead: false },
        }),
        this.prisma.notifications.count({
          where: { userId, isRead: true },
        }),
      ]);

      const openRate = total > 0 ? (read / total) * 100 : 0;

      return {
        total,
        unread,
        read,
        openRate: openRate.toFixed(1),
      };
    } catch (error) {
      this.logger.error(`Error getting engagement stats: ${error.message}`);
      return null;
    }
  }
}
