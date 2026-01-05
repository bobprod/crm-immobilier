import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour enrichir les données web (formulaires) avec les données de tracking
 *
 * Associe automatiquement les soumissions de formulaires avec :
 * - L'historique de navigation du visiteur
 * - Les biens consultés
 * - Le temps passé sur le site
 * - Le score d'engagement
 * - La source de trafic
 */
@Injectable()
export class TrackingWebDataService {
  private readonly logger = new Logger(TrackingWebDataService.name);

  // Service externe injecté dynamiquement
  private smartFormsService: any;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Injecter le service Smart Forms
   */
  setSmartFormsService(smartFormsService: any) {
    this.smartFormsService = smartFormsService;
  }

  /**
   * Enrichir une soumission de formulaire avec les données de tracking
   */
  async enrichFormSubmission(
    userId: string,
    submissionId: string,
    sessionId?: string,
  ): Promise<any> {
    try {
      if (!sessionId) {
        this.logger.warn(
          `No sessionId provided for form submission ${submissionId}`,
        );
        return null;
      }

      // Récupérer les événements de tracking pour cette session
      const trackingEvents = await this.prisma.trackingEvent.findMany({
        where: {
          userId,
          sessionId,
        },
        orderBy: { timestamp: 'asc' },
      });

      if (trackingEvents.length === 0) {
        this.logger.warn(
          `No tracking events found for session ${sessionId}`,
        );
        return null;
      }

      // Analyser les données de tracking
      const trackingData = this.analyzeTrackingData(trackingEvents);

      // Créer l'enregistrement d'enrichissement
      const enrichment = await this.prisma.formTrackingEnrichment.create({
        data: {
          userId,
          submissionId,
          sessionId,
          propertiesViewed: trackingData.propertiesViewed,
          totalTimeSpent: trackingData.totalTimeSpent,
          pagesVisited: trackingData.pagesVisited,
          trafficSource: trackingData.trafficSource,
          landingPage: trackingData.landingPage,
          referrer: trackingData.referrer,
          deviceType: trackingData.deviceType,
          engagementScore: trackingData.engagementScore,
          behaviorPattern: trackingData.behaviorPattern,
          topProperty: trackingData.topProperty,
          buttonClicks: trackingData.buttonClicks,
        },
      });

      this.logger.log(
        `Enriched form submission ${submissionId} with tracking data`,
      );

      return enrichment;
    } catch (error) {
      this.logger.error(
        `Failed to enrich form submission ${submissionId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Analyser les données de tracking d'une session
   */
  private analyzeTrackingData(events: any[]): any {
    const data: any = {
      propertiesViewed: [],
      totalTimeSpent: 0,
      pagesVisited: 0,
      trafficSource: 'direct',
      landingPage: null,
      referrer: null,
      deviceType: 'desktop',
      engagementScore: 0,
      behaviorPattern: 'unknown',
      topProperty: null,
      buttonClicks: 0,
    };

    // Compter les pages uniques visitées
    const uniquePages = new Set<string>();
    const propertyViewsMap = new Map<string, number>();
    let totalEvents = events.length;

    events.forEach((event: any, index: number) => {
      const eventData = event.eventData || event.data || {};

      // Première page = landing page
      if (index === 0) {
        data.landingPage = event.url;
        data.referrer = event.referrer;

        // Déterminer la source de trafic
        if (event.referrer) {
          if (event.referrer.includes('google')) {
            data.trafficSource = 'google';
          } else if (event.referrer.includes('facebook')) {
            data.trafficSource = 'facebook';
          } else if (event.referrer.includes('instagram')) {
            data.trafficSource = 'instagram';
          } else {
            data.trafficSource = 'referral';
          }
        }

        // Type de device
        if (event.userAgent) {
          if (
            event.userAgent.includes('Mobile') ||
            event.userAgent.includes('Android')
          ) {
            data.deviceType = 'mobile';
          } else if (event.userAgent.includes('Tablet')) {
            data.deviceType = 'tablet';
          }
        }
      }

      // Pages visitées
      if (event.url) {
        uniquePages.add(event.url);
      }

      // Propriétés vues
      if (eventData.propertyId) {
        const currentCount = propertyViewsMap.get(eventData.propertyId) || 0;
        propertyViewsMap.set(eventData.propertyId, currentCount + 1);
      }

      // Temps passé
      if (
        event.eventName === 'PropertyImpression' &&
        eventData.timeSpent
      ) {
        data.totalTimeSpent += eventData.timeSpent;
      }

      // Clics sur boutons
      if (event.eventName === 'PropertyButtonClick') {
        data.buttonClicks++;
      }
    });

    data.pagesVisited = uniquePages.size;

    // Propriétés vues triées par nombre de vues
    data.propertiesViewed = Array.from(propertyViewsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // Top property = la plus vue
    if (data.propertiesViewed.length > 0) {
      data.topProperty = data.propertiesViewed[0];
    }

    // Calculer le score d'engagement (0-100)
    data.engagementScore = this.calculateEngagementScore({
      totalEvents,
      propertiesViewed: data.propertiesViewed.length,
      pagesVisited: data.pagesVisited,
      totalTimeSpent: data.totalTimeSpent,
      buttonClicks: data.buttonClicks,
    });

    // Déterminer le pattern comportemental
    data.behaviorPattern = this.identifyBehaviorPattern({
      propertiesViewed: data.propertiesViewed.length,
      pagesVisited: data.pagesVisited,
      totalTimeSpent: data.totalTimeSpent,
      buttonClicks: data.buttonClicks,
      engagementScore: data.engagementScore,
    });

    return data;
  }

  /**
   * Calculer le score d'engagement (0-100)
   */
  private calculateEngagementScore(metrics: any): number {
    let score = 0;

    // Événements (20 points max)
    score += Math.min((metrics.totalEvents / 50) * 20, 20);

    // Propriétés vues (20 points max)
    score += Math.min((metrics.propertiesViewed / 10) * 20, 20);

    // Pages visitées (20 points max)
    score += Math.min((metrics.pagesVisited / 15) * 20, 20);

    // Temps passé (20 points max)
    score += Math.min((metrics.totalTimeSpent / 300) * 20, 20);

    // Clics sur boutons (20 points max)
    score += Math.min((metrics.buttonClicks / 5) * 20, 20);

    return Math.round(score);
  }

  /**
   * Identifier le pattern comportemental
   */
  private identifyBehaviorPattern(metrics: any): string {
    // Converter : beaucoup d'engagement + soumission formulaire
    if (metrics.engagementScore >= 70 && metrics.buttonClicks >= 2) {
      return 'converter';
    }

    // Highly engaged : bon score mais pas encore converti
    if (
      metrics.engagementScore >= 60 &&
      metrics.propertiesViewed >= 3
    ) {
      return 'highly_engaged';
    }

    // Interested : engagement moyen, quelques biens vus
    if (metrics.engagementScore >= 40 && metrics.propertiesViewed >= 2) {
      return 'interested';
    }

    // Explorer : beaucoup de pages mais peu de focus
    if (metrics.pagesVisited >= 5 && metrics.totalTimeSpent < 120) {
      return 'explorer';
    }

    // Browsing : engagement faible
    if (metrics.engagementScore >= 20) {
      return 'browsing';
    }

    return 'low_engagement';
  }

  /**
   * Obtenir l'enrichissement d'une soumission de formulaire
   */
  async getFormEnrichment(
    userId: string,
    submissionId: string,
  ): Promise<any> {
    const enrichment = await this.prisma.formTrackingEnrichment.findUnique({
      where: {
        userId_submissionId: {
          userId,
          submissionId,
        },
      },
    });

    return enrichment;
  }

  /**
   * Enrichir automatiquement toutes les soumissions récentes sans enrichissement
   */
  async enrichRecentSubmissions(
    userId: string,
    hours: number = 24,
  ): Promise<number> {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Récupérer les soumissions récentes
    // NOTE: Cette requête suppose que vous avez une table "formSubmissions"
    // Adaptez selon votre structure de base de données
    const submissions = await this.prisma.formSubmission?.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        // Vérifier qu'il n'y a pas déjà d'enrichissement
        enrichment: null,
      },
    }).catch(() => []);

    if (!submissions || submissions.length === 0) {
      return 0;
    }

    let enrichedCount = 0;

    for (const submission of submissions) {
      const result = await this.enrichFormSubmission(
        userId,
        submission.id,
        (submission as any).sessionId,
      );

      if (result) {
        enrichedCount++;
      }
    }

    this.logger.log(
      `Enriched ${enrichedCount}/${submissions.length} recent form submissions`,
    );

    return enrichedCount;
  }

  /**
   * Obtenir les statistiques des formulaires enrichis
   */
  async getEnrichmentStats(
    userId: string,
    period: 'day' | 'week' | 'month' = 'week',
  ): Promise<any> {
    const startDate = this.getStartDate(period);

    const enrichments = await this.prisma.formTrackingEnrichment.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
    });

    if (enrichments.length === 0) {
      return {
        period,
        total: 0,
        avgEngagementScore: 0,
        avgTimeSpent: 0,
        avgPropertiesViewed: 0,
        trafficSources: {},
        behaviorPatterns: {},
        deviceTypes: {},
      };
    }

    // Calculer les moyennes
    const avgEngagementScore =
      enrichments.reduce((sum, e) => sum + (e.engagementScore || 0), 0) /
      enrichments.length;
    const avgTimeSpent =
      enrichments.reduce((sum, e) => sum + (e.totalTimeSpent || 0), 0) /
      enrichments.length;
    const avgPropertiesViewed =
      enrichments.reduce(
        (sum, e) => sum + (e.propertiesViewed?.length || 0),
        0,
      ) / enrichments.length;

    // Grouper par source de trafic
    const trafficSources: Record<string, number> = {};
    enrichments.forEach((e) => {
      const source = e.trafficSource || 'unknown';
      trafficSources[source] = (trafficSources[source] || 0) + 1;
    });

    // Grouper par pattern comportemental
    const behaviorPatterns: Record<string, number> = {};
    enrichments.forEach((e) => {
      const pattern = e.behaviorPattern || 'unknown';
      behaviorPatterns[pattern] = (behaviorPatterns[pattern] || 0) + 1;
    });

    // Grouper par type de device
    const deviceTypes: Record<string, number> = {};
    enrichments.forEach((e) => {
      const device = e.deviceType || 'unknown';
      deviceTypes[device] = (deviceTypes[device] || 0) + 1;
    });

    return {
      period,
      total: enrichments.length,
      avgEngagementScore: Math.round(avgEngagementScore),
      avgTimeSpent: Math.round(avgTimeSpent),
      avgPropertiesViewed: Math.round(avgPropertiesViewed * 10) / 10,
      trafficSources,
      behaviorPatterns,
      deviceTypes,
      topProperties: this.getTopPropertiesFromEnrichments(enrichments),
    };
  }

  /**
   * Extraire les propriétés les plus vues des enrichissements
   */
  private getTopPropertiesFromEnrichments(enrichments: any[]): any[] {
    const propertyCountsMap = new Map<string, number>();

    enrichments.forEach((enrichment) => {
      if (enrichment.topProperty) {
        const current = propertyCountsMap.get(enrichment.topProperty) || 0;
        propertyCountsMap.set(enrichment.topProperty, current + 1);
      }
    });

    return Array.from(propertyCountsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([propertyId, count]) => ({ propertyId, count }));
  }

  /**
   * Calculer la date de début selon la période
   */
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

  /**
   * Créer un profil visiteur enrichi
   */
  async createVisitorProfile(
    userId: string,
    sessionId: string,
  ): Promise<any> {
    try {
      const events = await this.prisma.trackingEvent.findMany({
        where: {
          userId,
          sessionId,
        },
        orderBy: { timestamp: 'asc' },
      });

      if (events.length === 0) return null;

      const trackingData = this.analyzeTrackingData(events);

      // Créer le profil visiteur
      const profile = await this.prisma.visitorProfile.create({
        data: {
          userId,
          sessionId,
          propertiesViewed: trackingData.propertiesViewed,
          totalTimeSpent: trackingData.totalTimeSpent,
          pagesVisited: trackingData.pagesVisited,
          trafficSource: trackingData.trafficSource,
          deviceType: trackingData.deviceType,
          engagementScore: trackingData.engagementScore,
          behaviorPattern: trackingData.behaviorPattern,
          firstVisit: events[0].timestamp,
          lastVisit: events[events.length - 1].timestamp,
        },
      });

      return profile;
    } catch (error) {
      this.logger.error('Failed to create visitor profile:', error);
      return null;
    }
  }
}
