import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

/**
 * 🤖 Smart AI Notification Service
 *
 * Ce service utilise l'intelligence artificielle pour optimiser
 * la livraison des notifications en fonction:
 * - Des préférences utilisateur
 * - De l'historique d'engagement
 * - Des patterns comportementaux
 * - Des quiet hours
 * - De la fréquence optimale
 */
@Injectable()
export class SmartNotificationsService {
  private readonly logger = new Logger(SmartNotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 🎯 Déterminer le meilleur canal pour une notification
   * Utilise l'AI pour choisir le canal avec le meilleur taux d'engagement
   */
  async selectOptimalChannel(
    userId: string,
    notificationType: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
  ): Promise<string> {
    try {
      // 1. Récupérer les préférences utilisateur
      const preferences = await this.getUserPreferences(userId);

      // 2. Récupérer les canaux autorisés pour ce type
      const allowedChannels = this.getAllowedChannels(preferences, notificationType);

      if (allowedChannels.length === 0) {
        return 'in_app'; // Fallback par défaut
      }

      if (allowedChannels.length === 1) {
        return allowedChannels[0];
      }

      // 3. Si AI optimization activée, analyser l'historique
      if (preferences?.aiOptimization) {
        const optimalChannel = await this.analyzeEngagementHistory(userId, allowedChannels);
        if (optimalChannel) {
          this.logger.debug(`AI selected optimal channel: ${optimalChannel} for user ${userId}`);
          return optimalChannel;
        }
      }

      // 4. Règles basiques de priorité
      if (priority === 'high') {
        // Pour haute priorité: privilégier email ou SMS
        if (allowedChannels.includes('email')) return 'email';
        if (allowedChannels.includes('sms')) return 'sms';
        if (allowedChannels.includes('push')) return 'push';
      }

      // 5. Par défaut, retourner le premier canal autorisé
      return allowedChannels[0] || 'in_app';
    } catch (error) {
      this.logger.error(`Error selecting optimal channel: ${error.message}`);
      return 'in_app'; // Fallback sûr
    }
  }

  /**
   * 📊 Analyser l'historique d'engagement pour choisir le meilleur canal
   * Calcule le taux d'ouverture par canal et retourne le plus performant
   */
  private async analyzeEngagementHistory(
    userId: string,
    allowedChannels: string[],
  ): Promise<string | null> {
    try {
      // Récupérer les stats des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const notifications = await this.prisma.notification.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
          channel: { in: allowedChannels },
        },
        select: {
          channel: true,
          openedAt: true,
          deliveredAt: true,
        },
      });

      if (notifications.length === 0) {
        return null; // Pas assez de données
      }

      // Calculer le taux d'ouverture par canal
      const channelStats = this.calculateChannelEngagement(notifications);

      // Retourner le canal avec le meilleur taux
      const bestChannel = this.getBestPerformingChannel(channelStats, allowedChannels);

      return bestChannel;
    } catch (error) {
      this.logger.error(`Error analyzing engagement: ${error.message}`);
      return null;
    }
  }

  /**
   * 📈 Calculer les métriques d'engagement par canal
   */
  private calculateChannelEngagement(notifications: any[]): Map<string, { openRate: number; count: number }> {
    const stats = new Map<string, { opened: number; total: number }>();

    notifications.forEach((notif) => {
      const channel = notif.channel;
      if (!stats.has(channel)) {
        stats.set(channel, { opened: 0, total: 0 });
      }

      const channelStat = stats.get(channel)!;
      channelStat.total++;
      if (notif.openedAt) {
        channelStat.opened++;
      }
    });

    // Convertir en taux d'ouverture
    const result = new Map<string, { openRate: number; count: number }>();
    stats.forEach((stat, channel) => {
      result.set(channel, {
        openRate: stat.total > 0 ? (stat.opened / stat.total) * 100 : 0,
        count: stat.total,
      });
    });

    return result;
  }

  /**
   * 🏆 Retourner le canal avec le meilleur taux d'engagement
   */
  private getBestPerformingChannel(
    stats: Map<string, { openRate: number; count: number }>,
    allowedChannels: string[],
  ): string | null {
    let bestChannel: string | null = null;
    let bestScore = -1;

    allowedChannels.forEach((channel) => {
      const stat = stats.get(channel);
      if (!stat) return;

      // Score = openRate pondéré par le nombre de notifications (fiabilité)
      // Si count < 5, réduire le score (pas assez de données)
      const reliabilityFactor = Math.min(stat.count / 10, 1);
      const score = stat.openRate * reliabilityFactor;

      if (score > bestScore) {
        bestScore = score;
        bestChannel = channel;
      }
    });

    return bestChannel;
  }

  /**
   * ⏰ Vérifier si on peut envoyer maintenant (quiet hours)
   */
  async canSendNow(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);

      if (!preferences?.quietHours) {
        return true; // Pas de quiet hours configurées
      }

      const quietHours = preferences.quietHours as any;
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Vérifier si on est dans les quiet hours
      if (quietHours.start && quietHours.end) {
        const isQuietTime = this.isTimeInRange(currentTime, quietHours.start, quietHours.end);
        return !isQuietTime; // Peut envoyer si on n'est PAS en quiet time
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking quiet hours: ${error.message}`);
      return true; // En cas d'erreur, autoriser l'envoi
    }
  }

  /**
   * 🔢 Vérifier si la fréquence maximale n'est pas dépassée
   */
  async isWithinRateLimit(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const maxPerHour = preferences?.maxPerHour || 10;

      // Compter les notifications envoyées dans la dernière heure
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      const count = await this.prisma.notification.count({
        where: {
          userId,
          createdAt: { gte: oneHourAgo },
        },
      });

      return count < maxPerHour;
    } catch (error) {
      this.logger.error(`Error checking rate limit: ${error.message}`);
      return true; // En cas d'erreur, autoriser l'envoi
    }
  }

  /**
   * 🎚️ Vérifier si la priorité de la notification est suffisante
   */
  async meetsMinimumPriority(
    userId: string,
    notificationPriority: 'high' | 'medium' | 'low',
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      const minPriority = preferences?.minPriority || 'low';

      const priorityLevels = { high: 3, medium: 2, low: 1 };
      const notifLevel = priorityLevels[notificationPriority];
      const minLevel = priorityLevels[minPriority];

      return notifLevel >= minLevel;
    } catch (error) {
      this.logger.error(`Error checking priority: ${error.message}`);
      return true;
    }
  }

  /**
   * 🚀 Décider si une notification doit être envoyée maintenant
   * Retourne: { shouldSend: boolean, reason?: string, suggestedTime?: Date }
   */
  async shouldSendNotification(
    userId: string,
    notificationType: string,
    priority: 'high' | 'medium' | 'low' = 'medium',
  ): Promise<{
    shouldSend: boolean;
    reason?: string;
    channel?: string;
    suggestedTime?: Date;
  }> {
    try {
      // 1. Vérifier la priorité minimale
      const meetsPriority = await this.meetsMinimumPriority(userId, priority);
      if (!meetsPriority) {
        return {
          shouldSend: false,
          reason: 'Priority too low for user preferences',
        };
      }

      // 2. Vérifier les quiet hours
      const canSend = await this.canSendNow(userId);
      if (!canSend) {
        const suggestedTime = await this.getNextAvailableTime(userId);
        return {
          shouldSend: false,
          reason: 'Quiet hours active',
          suggestedTime,
        };
      }

      // 3. Vérifier la fréquence maximale
      const withinLimit = await this.isWithinRateLimit(userId);
      if (!withinLimit) {
        return {
          shouldSend: false,
          reason: 'Rate limit exceeded',
          suggestedTime: new Date(Date.now() + 60 * 60 * 1000), // +1 heure
        };
      }

      // 4. Sélectionner le canal optimal
      const channel = await this.selectOptimalChannel(userId, notificationType, priority);

      // Tout est OK, envoyer maintenant
      return {
        shouldSend: true,
        channel,
      };
    } catch (error) {
      this.logger.error(`Error deciding notification send: ${error.message}`);
      // En cas d'erreur, autoriser l'envoi par défaut
      return {
        shouldSend: true,
        channel: 'in_app',
      };
    }
  }

  /**
   * 📅 Calculer le prochain moment disponible pour envoyer
   */
  private async getNextAvailableTime(userId: string): Promise<Date> {
    const preferences = await this.getUserPreferences(userId);
    const quietHours = preferences?.quietHours as any;

    const now = new Date();
    const nextTime = new Date(now);

    if (quietHours?.end) {
      const [hours, minutes] = quietHours.end.split(':').map(Number);
      nextTime.setHours(hours, minutes, 0, 0);

      // Si c'est déjà passé aujourd'hui, passer au lendemain
      if (nextTime <= now) {
        nextTime.setDate(nextTime.getDate() + 1);
      }
    } else {
      // Par défaut, dans 1 heure
      nextTime.setHours(nextTime.getHours() + 1);
    }

    return nextTime;
  }

  /**
   * 📊 Récupérer les statistiques par canal pour un utilisateur
   */
  async getChannelStatistics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        channel: true,
        openedAt: true,
        deliveredAt: true,
        createdAt: true,
      },
    });

    // Grouper par canal
    const statsByChannel = new Map<string, {
      total: number;
      delivered: number;
      opened: number;
      deliveryRate: number;
      openRate: number;
    }>();

    notifications.forEach((notif) => {
      if (!statsByChannel.has(notif.channel)) {
        statsByChannel.set(notif.channel, {
          total: 0,
          delivered: 0,
          opened: 0,
          deliveryRate: 0,
          openRate: 0,
        });
      }

      const stats = statsByChannel.get(notif.channel)!;
      stats.total++;
      if (notif.deliveredAt) stats.delivered++;
      if (notif.openedAt) stats.opened++;
    });

    // Calculer les taux
    statsByChannel.forEach((stats) => {
      stats.deliveryRate = stats.total > 0 ? (stats.delivered / stats.total) * 100 : 0;
      stats.openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
    });

    return Object.fromEntries(statsByChannel);
  }

  /**
   * 🔧 Récupérer ou créer les préférences utilisateur
   */
  async getUserPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Créer des préférences par défaut si elles n'existent pas
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  /**
   * 💾 Mettre à jour les préférences utilisateur
   */
  async updateUserPreferences(
    userId: string,
    data: {
      channels?: any;
      quietHours?: any;
      maxPerHour?: number;
      aiOptimization?: boolean;
      dailyDigest?: boolean;
      digestTime?: string;
      minPriority?: string;
    },
  ) {
    // Créer les préférences si elles n'existent pas
    await this.getUserPreferences(userId);

    // Mettre à jour
    return this.prisma.notificationPreference.update({
      where: { userId },
      data,
    });
  }

  /**
   * 🕐 Vérifier si une heure est dans une plage
   */
  private isTimeInRange(current: string, start: string, end: string): boolean {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      // Plage normale (ex: 09:00 - 18:00)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Plage qui traverse minuit (ex: 22:00 - 06:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  /**
   * Convertir HH:MM en minutes depuis minuit
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Extraire les canaux autorisés pour un type de notification
   */
  private getAllowedChannels(preferences: any, notificationType: string): string[] {
    if (!preferences?.channels) {
      return ['in_app']; // Défaut
    }

    const channels = typeof preferences.channels === 'string'
      ? JSON.parse(preferences.channels)
      : preferences.channels;

    return channels[notificationType] || ['in_app'];
  }

  /**
   * 📝 Marquer une notification comme livrée
   */
  async markAsDelivered(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { deliveredAt: new Date() },
    });
  }

  /**
   * 👁️ Marquer une notification comme ouverte
   */
  async markAsOpened(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        openedAt: new Date(),
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
