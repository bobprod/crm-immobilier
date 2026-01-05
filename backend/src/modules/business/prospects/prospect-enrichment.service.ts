import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour enrichir automatiquement les prospects avec les données de tracking
 *
 * Synchronise les données de comportement visiteur (heatmaps, property views, button clicks)
 * avec les profils prospects pour un scoring et une qualification intelligents.
 */
@Injectable()
export class ProspectEnrichmentService {
  private readonly logger = new Logger(ProspectEnrichmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enrichir un prospect avec ses données de tracking
   */
  async enrichProspectWithTracking(prospectId: string): Promise<any> {
    const prospect = await this.prisma.prospects.findUnique({
      where: { id: prospectId },
    });

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    // Récupérer les événements de tracking associés à ce prospect
    // (via email, phone, ou sessionId si disponible)
    const trackingEvents = await this.getProspectTrackingEvents(prospect);

    if (trackingEvents.length === 0) {
      this.logger.log(`No tracking data found for prospect ${prospectId}`);
      return { enriched: false, reason: 'no_tracking_data' };
    }

    // Analyser les données de tracking
    const trackingInsights = this.analyzeTrackingData(trackingEvents);

    // Mettre à jour le prospect avec les insights
    const updated = await this.prisma.prospects.update({
      where: { id: prospectId },
      data: {
        trackingInsights: trackingInsights as any,
        // Recalculer le score avec les données comportementales
        score: this.calculateEnrichedScore(prospect, trackingInsights),
        updatedAt: new Date(),
      },
    });

    this.logger.log(
      `Prospect ${prospectId} enriched with ${trackingEvents.length} tracking events`,
    );

    return {
      enriched: true,
      prospectId,
      trackingEventsCount: trackingEvents.length,
      insights: trackingInsights,
      newScore: updated.score,
    };
  }

  /**
   * Enrichir tous les nouveaux prospects créés dans les dernières 24h
   */
  async enrichRecentProspects(userId: string): Promise<any> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentProspects = await this.prisma.prospects.findMany({
      where: {
        userId,
        createdAt: { gte: yesterday },
      },
    });

    const results = [];

    for (const prospect of recentProspects) {
      try {
        const result = await this.enrichProspectWithTracking(prospect.id);
        results.push(result);
      } catch (error) {
        this.logger.error(`Failed to enrich prospect ${prospect.id}:`, error);
        results.push({
          enriched: false,
          prospectId: prospect.id,
          error: error.message,
        });
      }
    }

    return {
      total: recentProspects.length,
      enriched: results.filter((r) => r.enriched).length,
      failed: results.filter((r) => !r.enriched).length,
      results,
    };
  }

  /**
   * Créer automatiquement un prospect depuis un événement Lead
   */
  async createProspectFromLeadEvent(
    userId: string,
    leadEvent: any,
  ): Promise<any> {
    const eventData = leadEvent.data || leadEvent.eventData || {};

    // Extraire les informations du lead
    const prospectData: any = {
      userId,
      source: 'vitrine_tracking',
      type: 'lead',
      status: 'new',
      notes: `Lead automatique depuis vitrine - ${eventData.propertyId ? `Bien: ${eventData.propertyData?.title}` : 'Page générale'}`,
    };

    // Si on a des infos de contact (via formulaire)
    if (eventData.email) {
      prospectData.email = eventData.email;
    }
    if (eventData.phone) {
      prospectData.phone = eventData.phone;
    }
    if (eventData.firstName) {
      prospectData.firstName = eventData.firstName;
    }
    if (eventData.lastName) {
      prospectData.lastName = eventData.lastName;
    }

    // Vérifier si un prospect existe déjà avec cet email/phone
    if (prospectData.email || prospectData.phone) {
      const existing = await this.prisma.prospects.findFirst({
        where: {
          userId,
          OR: [
            prospectData.email ? { email: prospectData.email } : {},
            prospectData.phone ? { phone: prospectData.phone } : {},
          ].filter((o) => Object.keys(o).length > 0),
        },
      });

      if (existing) {
        // Mettre à jour le prospect existant avec le lead event
        return this.enrichProspectWithTracking(existing.id);
      }
    }

    // Créer le nouveau prospect
    const prospect = await this.prisma.prospects.create({
      data: prospectData,
    });

    this.logger.log(`Created prospect ${prospect.id} from lead event`);

    // Enrichir immédiatement avec les données de tracking
    await this.enrichProspectWithTracking(prospect.id);

    return prospect;
  }

  /**
   * Récupérer les événements de tracking pour un prospect
   */
  private async getProspectTrackingEvents(prospect: any): Promise<any[]> {
    const where: any = {
      userId: prospect.userId,
      eventName: {
        in: ['PropertyImpression', 'PropertyTimeSpent', 'PropertyButtonClick', 'Lead'],
      },
    };

    // Chercher par email ou phone si disponibles
    if (prospect.email || prospect.phone) {
      const contactFilters = [];
      if (prospect.email) {
        contactFilters.push({
          data: {
            path: ['email'],
            equals: prospect.email,
          },
        });
      }
      if (prospect.phone) {
        contactFilters.push({
          data: {
            path: ['phone'],
            equals: prospect.phone,
          },
        });
      }

      if (contactFilters.length > 0) {
        where.OR = contactFilters;
      }
    }

    return this.prisma.trackingEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 500, // Limiter à 500 événements max
    });
  }

  /**
   * Analyser les données de tracking pour extraire des insights
   */
  private analyzeTrackingData(events: any[]): any {
    const insights: any = {
      totalEvents: events.length,
      lastActivity: events[0]?.timestamp,
      propertiesViewed: new Set(),
      buttonClicks: new Set(),
      leads: 0,
      engagementScore: 0,
      interestedProperties: [],
      behaviorPattern: 'unknown',
    };

    let totalTimeSpent = 0;
    const propertyInteractions = new Map<
      string,
      {
        propertyId: string;
        propertyData: any;
        impressions: number;
        timeSpent: number;
        clicks: number;
      }
    >();

    for (const event of events) {
      const data = event.data || {};

      if (event.eventName === 'PropertyImpression') {
        insights.propertiesViewed.add(data.propertyId);

        if (!propertyInteractions.has(data.propertyId)) {
          propertyInteractions.set(data.propertyId, {
            propertyId: data.propertyId,
            propertyData: data.propertyData,
            impressions: 0,
            timeSpent: 0,
            clicks: 0,
          });
        }

        propertyInteractions.get(data.propertyId)!.impressions++;
      } else if (event.eventName === 'PropertyTimeSpent') {
        totalTimeSpent += data.timeSpentSeconds || 0;

        if (propertyInteractions.has(data.propertyId)) {
          propertyInteractions.get(data.propertyId)!.timeSpent +=
            data.timeSpentSeconds || 0;
        }
      } else if (event.eventName === 'PropertyButtonClick') {
        insights.buttonClicks.add(data.buttonType);

        if (propertyInteractions.has(data.propertyId)) {
          propertyInteractions.get(data.propertyId)!.clicks++;
        }
      } else if (event.eventName === 'Lead') {
        insights.leads++;
      }
    }

    // Identifier les propriétés les plus intéressantes
    insights.interestedProperties = Array.from(propertyInteractions.values())
      .filter((p) => p.impressions > 1 || p.timeSpent > 30 || p.clicks > 0)
      .sort((a, b) => {
        // Score = impressions * 10 + timeSpent + clicks * 20
        const scoreA = a.impressions * 10 + a.timeSpent + a.clicks * 20;
        const scoreB = b.impressions * 10 + b.timeSpent + b.clicks * 20;
        return scoreB - scoreA;
      })
      .slice(0, 5) // Top 5
      .map((p) => ({
        propertyId: p.propertyId,
        title: p.propertyData?.title,
        price: p.propertyData?.price,
        city: p.propertyData?.city,
        impressions: p.impressions,
        timeSpent: p.timeSpent,
        clicks: p.clicks,
        interestScore: p.impressions * 10 + p.timeSpent + p.clicks * 20,
      }));

    // Calculer le score d'engagement (0-100)
    insights.engagementScore = this.calculateEngagementScore({
      totalEvents: events.length,
      propertiesViewed: insights.propertiesViewed.size,
      buttonClicks: insights.buttonClicks.size,
      totalTimeSpent,
      leads: insights.leads,
    });

    // Déterminer le pattern de comportement
    insights.behaviorPattern = this.identifyBehaviorPattern({
      totalEvents: events.length,
      propertiesViewed: insights.propertiesViewed.size,
      avgTimePerProperty: totalTimeSpent / Math.max(insights.propertiesViewed.size, 1),
      buttonClicksCount: insights.buttonClicks.size,
      leads: insights.leads,
    });

    // Convertir les Sets en arrays pour JSON
    insights.propertiesViewed = Array.from(insights.propertiesViewed);
    insights.buttonClicks = Array.from(insights.buttonClicks);

    return insights;
  }

  /**
   * Calculer le score d'engagement basé sur le comportement
   */
  private calculateEngagementScore(metrics: {
    totalEvents: number;
    propertiesViewed: number;
    buttonClicks: number;
    totalTimeSpent: number;
    leads: number;
  }): number {
    let score = 0;

    // Événements totaux (max 20 points)
    score += Math.min((metrics.totalEvents / 50) * 20, 20);

    // Biens vus (max 20 points)
    score += Math.min((metrics.propertiesViewed / 10) * 20, 20);

    // Clics sur boutons (max 20 points)
    score += Math.min((metrics.buttonClicks / 5) * 20, 20);

    // Temps passé (max 20 points - 1 point par minute)
    score += Math.min((metrics.totalTimeSpent / 60) * 20, 20);

    // Leads générés (max 20 points)
    score += Math.min(metrics.leads * 20, 20);

    return Math.round(score);
  }

  /**
   * Identifier le pattern de comportement
   */
  private identifyBehaviorPattern(metrics: {
    totalEvents: number;
    propertiesViewed: number;
    avgTimePerProperty: number;
    buttonClicksCount: number;
    leads: number;
  }): string {
    if (metrics.leads > 0) {
      return 'hot_lead'; // A déjà converti
    }

    if (
      metrics.propertiesViewed >= 5 &&
      metrics.avgTimePerProperty > 30 &&
      metrics.buttonClicksCount >= 2
    ) {
      return 'highly_engaged'; // Très engagé
    }

    if (
      metrics.propertiesViewed >= 3 &&
      (metrics.avgTimePerProperty > 15 || metrics.buttonClicksCount >= 1)
    ) {
      return 'interested'; // Intéressé
    }

    if (metrics.propertiesViewed >= 2 && metrics.totalEvents >= 5) {
      return 'browsing'; // Parcourt le catalogue
    }

    if (metrics.totalEvents <= 3) {
      return 'low_intent'; // Faible intention
    }

    return 'exploring'; // Exploration générale
  }

  /**
   * Calculer le score enrichi du prospect avec les données comportementales
   */
  private calculateEnrichedScore(prospect: any, trackingInsights: any): number {
    // Score de base (0-100)
    let baseScore = prospect.score || 0;

    // Bonus d'engagement (0-30 points)
    const engagementBonus = (trackingInsights.engagementScore / 100) * 30;

    // Bonus de pattern (0-20 points)
    const patternBonus = this.getPatternBonus(trackingInsights.behaviorPattern);

    // Bonus de leads (0-20 points)
    const leadBonus = Math.min(trackingInsights.leads * 10, 20);

    // Score final (plafonné à 100)
    const finalScore = Math.min(baseScore + engagementBonus + patternBonus + leadBonus, 100);

    return Math.round(finalScore);
  }

  /**
   * Obtenir le bonus de points selon le pattern de comportement
   */
  private getPatternBonus(pattern: string): number {
    const bonuses: Record<string, number> = {
      hot_lead: 20,
      highly_engaged: 15,
      interested: 10,
      browsing: 5,
      exploring: 3,
      low_intent: 0,
      unknown: 0,
    };

    return bonuses[pattern] || 0;
  }
}
