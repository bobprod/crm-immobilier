import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour gérer les notifications automatiques basées sur les événements de tracking
 *
 * Détecte les comportements importants (hot leads, forte intention, abandons)
 * et déclenche des notifications en temps réel pour les commerciaux.
 */
@Injectable()
export class TrackingNotificationsService {
  private readonly logger = new Logger(TrackingNotificationsService.name);

  // Interface pour les services externes (injectés dynamiquement)
  private notificationsService: any;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Injecter le service de notifications (évite circular dependency)
   */
  setNotificationsService(notificationsService: any) {
    this.notificationsService = notificationsService;
  }

  /**
   * Analyser un événement de tracking et déclencher des notifications si nécessaire
   */
  async processTrackingEvent(userId: string, event: any): Promise<void> {
    try {
      const eventName = event.eventName || event.name;
      const eventData = event.data || event.eventData || {};

      // Lead immédiat → Notification haute priorité
      if (eventName === 'Lead') {
        await this.notifyNewLead(userId, eventData);
      }

      // PropertyButtonClick avec contact → Notification prioritaire
      if (
        eventName === 'PropertyButtonClick' &&
        ['contact', 'call', 'schedule_visit'].includes(eventData.buttonType)
      ) {
        await this.notifyHighIntent(userId, eventData);
      }

      // Analyser le comportement de session pour hot leads
      if (eventData.sessionId) {
        await this.analyzeSessionBehavior(userId, eventData.sessionId);
      }
    } catch (error) {
      this.logger.error(`Failed to process tracking event for notifications:`, error);
    }
  }

  /**
   * Notifier un nouveau lead
   */
  private async notifyNewLead(userId: string, eventData: any): Promise<void> {
    const propertyInfo = eventData.propertyData || {};

    const notification = {
      userId,
      type: 'lead_created',
      title: '🎯 Nouveau Lead Vitrine !',
      message: propertyInfo.title
        ? `Un visiteur a manifesté son intérêt pour "${propertyInfo.title}" (${propertyInfo.city || 'N/A'})`
        : 'Un visiteur a manifesté son intérêt sur votre vitrine',
      actionUrl: eventData.propertyId
        ? `/properties/${eventData.propertyId}`
        : '/prospects',
      metadata: JSON.stringify({
        source: 'tracking',
        eventType: 'lead',
        propertyId: eventData.propertyId,
        propertyData: propertyInfo,
        sessionId: eventData.sessionId,
      }),
    };

    if (this.notificationsService) {
      await this.notificationsService.createNotification(notification, {
        priority: 'high',
        bypassSmartRouting: false, // Utiliser le smart routing AI
      });
    }

    this.logger.log(`Notified user ${userId} of new lead from property ${eventData.propertyId}`);
  }

  /**
   * Notifier une intention forte (clic sur contact/appel/visite)
   */
  private async notifyHighIntent(userId: string, eventData: any): Promise<void> {
    const propertyInfo = eventData.propertyData || {};
    const buttonType = eventData.buttonType;

    const actionLabels: Record<string, string> = {
      contact: 'formulaire de contact',
      call: 'bouton d\'appel',
      schedule_visit: 'demande de visite',
    };

    const notification = {
      userId,
      type: 'high_intent_visitor',
      title: '🔥 Visiteur à Forte Intention !',
      message: `Un visiteur a cliqué sur le ${actionLabels[buttonType] || 'bouton'} pour "${propertyInfo.title || 'un bien'}"`,
      actionUrl: `/marketing/tracking/property-analytics`,
      metadata: JSON.stringify({
        source: 'tracking',
        eventType: 'high_intent',
        buttonType,
        propertyId: eventData.propertyId,
        propertyData: propertyInfo,
        sessionId: eventData.sessionId,
      }),
    };

    if (this.notificationsService) {
      await this.notificationsService.createNotification(notification, {
        priority: 'high',
        bypassSmartRouting: false,
      });
    }

    this.logger.log(
      `Notified user ${userId} of high intent action: ${buttonType} on property ${eventData.propertyId}`,
    );
  }

  /**
   * Analyser le comportement d'une session pour détecter les hot leads
   */
  private async analyzeSessionBehavior(userId: string, sessionId: string): Promise<void> {
    try {
      // Récupérer tous les événements de cette session
      const sessionEvents = await this.prisma.trackingEvent.findMany({
        where: {
          userId,
          sessionId,
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: 100,
      });

      if (sessionEvents.length < 5) {
        // Pas assez de données pour analyser
        return;
      }

      // Calculer les métriques de la session
      const metrics = this.calculateSessionMetrics(sessionEvents);

      // Hot lead si :
      // - 3+ propriétés vues
      // - 2+ clics sur boutons
      // - Temps total > 60s
      // - OU 1+ lead déjà généré
      const isHotLead =
        (metrics.propertiesViewed >= 3 &&
          metrics.buttonClicks >= 2 &&
          metrics.totalTimeSpent >= 60) ||
        metrics.leads > 0;

      if (isHotLead && !metrics.hasBeenNotified) {
        await this.notifyHotLead(userId, sessionId, metrics);
        // Marquer comme notifié pour éviter les doublons
        await this.markSessionAsNotified(userId, sessionId);
      }
    } catch (error) {
      this.logger.error(`Failed to analyze session behavior:`, error);
    }
  }

  /**
   * Calculer les métriques d'une session
   */
  private calculateSessionMetrics(events: any[]): any {
    const metrics = {
      propertiesViewed: new Set<string>(),
      buttonClicks: 0,
      totalTimeSpent: 0,
      leads: 0,
      lastActivity: events[events.length - 1]?.timestamp,
      interestedProperty: null as any,
      hasBeenNotified: false,
    };

    let maxTimeSpent = 0;
    let topProperty: any = null;

    events.forEach((event) => {
      const data = event.data as any;

      if (event.eventName === 'PropertyImpression' && data?.propertyId) {
        metrics.propertiesViewed.add(data.propertyId);
      } else if (event.eventName === 'PropertyTimeSpent') {
        metrics.totalTimeSpent += data?.timeSpentSeconds || 0;

        // Trouver le bien avec le plus de temps passé
        if (data?.timeSpentSeconds > maxTimeSpent) {
          maxTimeSpent = data.timeSpentSeconds;
          topProperty = data.propertyData;
        }
      } else if (event.eventName === 'PropertyButtonClick') {
        metrics.buttonClicks++;
      } else if (event.eventName === 'Lead') {
        metrics.leads++;
      } else if (event.eventName === 'SessionNotified') {
        metrics.hasBeenNotified = true;
      }
    });

    metrics.interestedProperty = topProperty;

    return {
      ...metrics,
      propertiesViewed: metrics.propertiesViewed.size,
    };
  }

  /**
   * Notifier un hot lead détecté
   */
  private async notifyHotLead(
    userId: string,
    sessionId: string,
    metrics: any,
  ): Promise<void> {
    const notification = {
      userId,
      type: 'hot_lead_detected',
      title: '🚀 Hot Lead Détecté !',
      message: `Un visiteur très engagé : ${metrics.propertiesViewed} biens vus, ${metrics.buttonClicks} interactions${
        metrics.interestedProperty
          ? ` - Intéressé par "${metrics.interestedProperty.title}"`
          : ''
      }`,
      actionUrl: `/marketing/tracking/property-analytics`,
      metadata: JSON.stringify({
        source: 'tracking',
        eventType: 'hot_lead',
        sessionId,
        metrics: {
          propertiesViewed: metrics.propertiesViewed,
          buttonClicks: metrics.buttonClicks,
          totalTimeSpent: metrics.totalTimeSpent,
          leads: metrics.leads,
        },
        interestedProperty: metrics.interestedProperty,
      }),
    };

    if (this.notificationsService) {
      await this.notificationsService.createNotification(notification, {
        priority: 'high',
        bypassSmartRouting: true, // Hot lead = notification immédiate
      });
    }

    this.logger.log(`Notified user ${userId} of hot lead detection for session ${sessionId}`);
  }

  /**
   * Marquer une session comme déjà notifiée
   */
  private async markSessionAsNotified(userId: string, sessionId: string): Promise<void> {
    try {
      await this.prisma.trackingEvent.create({
        data: {
          userId,
          sessionId,
          platform: 'system',
          eventName: 'SessionNotified',
          data: {
            notifiedAt: new Date().toISOString(),
            reason: 'hot_lead_detected',
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to mark session as notified:`, error);
    }
  }

  /**
   * Détecter les abandons de panier / abandons de visite
   */
  async detectAbandonment(userId: string): Promise<void> {
    try {
      // Récupérer les sessions actives des dernières 2 heures sans conversion
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      const recentEvents = await this.prisma.trackingEvent.findMany({
        where: {
          userId,
          timestamp: { gte: twoHoursAgo },
          eventName: { in: ['PropertyImpression', 'PropertyButtonClick'] },
        },
      });

      // Grouper par session
      const sessionMap = new Map<string, any[]>();

      recentEvents.forEach((event) => {
        const data = event.data as any;
        const sessionId = data?.sessionId || event.sessionId;

        if (sessionId) {
          if (!sessionMap.has(sessionId)) {
            sessionMap.set(sessionId, []);
          }
          sessionMap.get(sessionId)!.push(event);
        }
      });

      // Identifier les sessions avec forte intention mais sans conversion
      for (const [sessionId, events] of sessionMap.entries()) {
        const hasHighIntent = events.some((e) => {
          const data = e.data as any;
          return (
            e.eventName === 'PropertyButtonClick' &&
            ['contact', 'call', 'schedule_visit'].includes(data?.buttonType)
          );
        });

        const hasConversion = events.some((e) => e.eventName === 'Lead');

        // Alerte si forte intention mais pas de conversion
        if (hasHighIntent && !hasConversion && events.length >= 3) {
          await this.notifyAbandonment(userId, sessionId, events);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to detect abandonment:`, error);
    }
  }

  /**
   * Notifier un abandon
   */
  private async notifyAbandonment(
    userId: string,
    sessionId: string,
    events: any[],
  ): Promise<void> {
    const lastEvent = events[events.length - 1];
    const propertyData = (lastEvent.data as any)?.propertyData;

    const notification = {
      userId,
      type: 'lead_abandonment',
      title: '⚠️ Abandon de Lead Potentiel',
      message: propertyData?.title
        ? `Un visiteur intéressé par "${propertyData.title}" n'a pas converti`
        : 'Un visiteur avec forte intention n\'a pas converti',
      actionUrl: `/marketing/tracking/property-analytics`,
      metadata: JSON.stringify({
        source: 'tracking',
        eventType: 'abandonment',
        sessionId,
        eventsCount: events.length,
        propertyData,
      }),
    };

    if (this.notificationsService) {
      await this.notificationsService.createNotification(notification, {
        priority: 'medium',
        bypassSmartRouting: false,
      });
    }

    this.logger.log(`Notified user ${userId} of lead abandonment for session ${sessionId}`);
  }

  /**
   * Résumé quotidien de tracking
   */
  async sendDailyTrackingSummary(userId: string): Promise<void> {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const events = await this.prisma.trackingEvent.findMany({
        where: {
          userId,
          timestamp: { gte: yesterday },
        },
      });

      if (events.length === 0) {
        return; // Pas d'activité
      }

      // Calculer les stats
      const impressions = events.filter((e) => e.eventName === 'PropertyImpression').length;
      const leads = events.filter((e) => e.eventName === 'Lead').length;
      const buttonClicks = events.filter((e) => e.eventName === 'PropertyButtonClick').length;

      const uniqueProperties = new Set(
        events.map((e) => (e.data as any)?.propertyId).filter(Boolean),
      ).size;

      const notification = {
        userId,
        type: 'tracking_summary',
        title: '📊 Résumé Tracking - Dernières 24h',
        message: `${impressions} vues, ${buttonClicks} interactions, ${leads} leads sur ${uniqueProperties} biens`,
        actionUrl: `/marketing/tracking/property-analytics`,
        metadata: JSON.stringify({
          source: 'tracking',
          eventType: 'daily_summary',
          period: '24h',
          stats: {
            impressions,
            leads,
            buttonClicks,
            uniqueProperties,
            conversionRate:
              impressions > 0 ? ((leads / impressions) * 100).toFixed(2) : 0,
          },
        }),
      };

      if (this.notificationsService) {
        await this.notificationsService.createNotification(notification, {
          priority: 'low',
          bypassSmartRouting: false,
        });
      }

      this.logger.log(`Sent daily tracking summary to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send daily tracking summary:`, error);
    }
  }
}
