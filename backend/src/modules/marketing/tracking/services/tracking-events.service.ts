import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingEvent, TrackingPlatform } from '../dto';
import { ConversionPredictionService } from '../ml/conversion-prediction.service';
import { TrackingRealtimeGateway } from '../analytics/tracking-realtime.gateway';
import { TrackingNotificationsService } from '../notifications/tracking-notifications.service';
import { TrackingCommunicationsService } from '../communications/tracking-communications.service';
import { PropertyTrackingStatsService } from '@/modules/business/properties/property-tracking-stats.service';

/**
 * Service de tracking des événements marketing
 */
@Injectable()
export class TrackingEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversionPrediction: ConversionPredictionService,
    @Inject(forwardRef(() => TrackingRealtimeGateway))
    private readonly realtimeGateway: TrackingRealtimeGateway,
    @Optional()
    private readonly trackingNotifications?: TrackingNotificationsService,
    @Optional()
    private readonly trackingCommunications?: TrackingCommunicationsService,
    @Optional()
    private readonly propertyTrackingStats?: PropertyTrackingStatsService,
  ) {}

  async trackEvent(userId: string, event: TrackingEvent) {
    const savedEvent = await this.prisma.trackingEvent.create({
      data: {
        userId,
        eventName: event.eventName,
        eventType: event.eventType,
        sessionId: event.sessionId,
        prospectId: event.prospectId,
        propertyId: event.propertyId,
        platform: event.platform[0], // Première plateforme
        data: event.data,
        source: event.source,
        userAgent: event.userAgent,
        ipAddress: event.ipAddress,
        referrer: event.referrer,
        url: event.url,
        timestamp: event.timestamp || new Date(),
      },
    });

    // Prédiction ML si PageView ou événement important
    let finalEvent = savedEvent;
    if (event.eventName === 'PageView' || event.eventName === 'ViewContent') {
      const prediction = await this.conversionPrediction.predictConversion(userId, event);

      if (prediction) {
        finalEvent = await this.prisma.trackingEvent.update({
          where: { id: savedEvent.id },
          data: {
            conversionProbability: prediction.probability,
            leadScore: prediction.confidence * 100,
          },
        });
      }
    }

    // Émettre l'événement en temps réel via WebSocket
    try {
      this.realtimeGateway?.emitTrackingEvent({
        userId,
        platform: event.platform[0],
        eventName: event.eventName,
        eventData: event.data,
        timestamp: finalEvent.timestamp,
        id: finalEvent.id,
      });
    } catch (error) {
      // Ne pas bloquer si WebSocket échoue
      console.error('Failed to emit realtime event:', error);
    }

    // Déclencher les notifications automatiques si configuré
    try {
      if (this.trackingNotifications) {
        await this.trackingNotifications.processTrackingEvent(userId, {
          eventName: event.eventName,
          data: event.data,
          sessionId: event.sessionId,
          propertyId: event.propertyId,
          prospectId: event.prospectId,
          timestamp: finalEvent.timestamp,
        });
      }
    } catch (error) {
      // Ne pas bloquer si les notifications échouent
      console.error('Failed to process tracking notifications:', error);
    }

    // Mettre à jour les statistiques des biens si configuré
    try {
      if (this.propertyTrackingStats && event.propertyId) {
        let eventType: 'impression' | 'click' | 'lead' = 'impression';
        let additionalData: any = {};

        if (event.eventName === 'PropertyImpression') {
          eventType = 'impression';
          additionalData.timeSpent = event.data?.timeSpent || 0;
        } else if (event.eventName === 'PropertyButtonClick') {
          eventType = 'click';
        } else if (event.eventName === 'Lead') {
          eventType = 'lead';
        }

        await this.propertyTrackingStats.updatePropertyStats(
          userId,
          event.propertyId,
          eventType,
          additionalData,
        );
      }
    } catch (error) {
      console.error('Failed to update property tracking stats:', error);
    }

    // Déclencher les communications automatiques si configuré
    try {
      if (this.trackingCommunications) {
        await this.trackingCommunications.processTrackingEvent(userId, {
          eventName: event.eventName,
          data: event.data,
          sessionId: event.sessionId,
          propertyId: event.propertyId,
          prospectId: event.prospectId,
          timestamp: finalEvent.timestamp,
        });
      }
    } catch (error) {
      console.error('Failed to process tracking communications:', error);
    }

    return finalEvent;
  }

  async getEvents(
    userId: string,
    filters?: {
      platform?: TrackingPlatform;
      eventName?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    },
  ) {
    return this.prisma.trackingEvent.findMany({
      where: {
        userId,
        platform: filters?.platform,
        eventName: filters?.eventName,
        timestamp: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: filters?.limit || 100,
    });
  }

  async getEventStats(userId: string, period: 'day' | 'week' | 'month' = 'week') {
    const startDate = this.getStartDate(period);

    const [totalEvents, eventsByName, eventsByPlatform, conversionEvents] = await Promise.all([
      this.prisma.trackingEvent.count({
        where: { userId, timestamp: { gte: startDate } },
      }),
      this.prisma.trackingEvent.groupBy({
        by: ['eventName'],
        where: { userId, timestamp: { gte: startDate } },
        _count: true,
      }),
      this.prisma.trackingEvent.groupBy({
        by: ['platform'],
        where: { userId, timestamp: { gte: startDate } },
        _count: true,
      }),
      this.prisma.trackingEvent.count({
        where: {
          userId,
          eventName: { in: ['Lead', 'CompleteRegistration', 'Purchase'] },
          timestamp: { gte: startDate },
        },
      }),
    ]);

    const conversionRate = totalEvents > 0 ? (conversionEvents / totalEvents) * 100 : 0;

    return {
      totalEvents,
      conversionEvents,
      conversionRate: Math.round(conversionRate * 100) / 100,
      eventsByName: eventsByName.map((e) => ({
        name: e.eventName,
        count: e._count,
      })),
      eventsByPlatform: eventsByPlatform.map((e) => ({
        platform: e.platform,
        count: e._count,
      })),
    };
  }

  private getStartDate(period: 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
