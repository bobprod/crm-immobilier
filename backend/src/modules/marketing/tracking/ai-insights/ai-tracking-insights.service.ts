import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour générer des insights IA à partir des données de tracking
 *
 * Utilise l'AI Orchestrator pour analyser les comportements des visiteurs
 * et générer des recommandations intelligentes pour optimiser les conversions.
 */
@Injectable()
export class AITrackingInsightsService {
  private readonly logger = new Logger(AITrackingInsightsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Générer des insights pour un bien immobilier spécifique
   */
  async generatePropertyInsights(
    userId: string,
    propertyId: string,
  ): Promise<any> {
    // Récupérer les événements de tracking pour ce bien
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        eventName: {
          in: ['PropertyImpression', 'PropertyTimeSpent', 'PropertyButtonClick', 'Lead'],
        },
      },
      take: 1000,
    });

    // Filtrer les événements pour cette propriété
    const propertyEvents = events.filter((e) => {
      const data = e.data as any;
      return data?.propertyId === propertyId;
    });

    if (propertyEvents.length === 0) {
      return {
        propertyId,
        hasData: false,
        message: 'Pas encore de données de tracking pour ce bien',
      };
    }

    // Analyser les métriques
    const metrics = this.analyzePropertyMetrics(propertyEvents);

    // Générer des recommandations basées sur l'analyse
    const recommendations = this.generateRecommendations(metrics);

    // Identifier les points d'amélioration
    const improvements = this.identifyImprovements(metrics);

    // Score de performance (0-100)
    const performanceScore = this.calculatePerformanceScore(metrics);

    return {
      propertyId,
      hasData: true,
      dataPoints: propertyEvents.length,
      metrics,
      performanceScore,
      recommendations,
      improvements,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Générer des insights globaux pour toutes les propriétés
   */
  async generateGlobalInsights(userId: string): Promise<any> {
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        eventName: {
          in: ['PropertyImpression', 'PropertyTimeSpent', 'PropertyButtonClick', 'Lead'],
        },
      },
      take: 5000,
    });

    // Grouper par propriété
    const propertiesMap = new Map<string, any[]>();

    events.forEach((event) => {
      const data = event.data as any;
      const propertyId = data?.propertyId;

      if (propertyId) {
        if (!propertiesMap.has(propertyId)) {
          propertiesMap.set(propertyId, []);
        }
        propertiesMap.get(propertyId)!.push(event);
      }
    });

    // Analyser chaque propriété
    const propertiesInsights = Array.from(propertiesMap.entries()).map(
      ([propertyId, propertyEvents]) => {
        const metrics = this.analyzePropertyMetrics(propertyEvents);
        const performanceScore = this.calculatePerformanceScore(metrics);

        return {
          propertyId,
          propertyData: (propertyEvents[0].data as any)?.propertyData,
          metrics,
          performanceScore,
          eventsCount: propertyEvents.length,
        };
      },
    );

    // Trier par performance
    propertiesInsights.sort((a, b) => b.performanceScore - a.performanceScore);

    // Identifier les top performers et les underperformers
    const topPerformers = propertiesInsights.slice(0, 3);
    const underPerformers = propertiesInsights
      .filter((p) => p.performanceScore < 50 && p.eventsCount >= 10)
      .slice(0, 3);

    // Insights globaux
    const globalMetrics = this.calculateGlobalMetrics(events);

    // Recommandations stratégiques
    const strategicRecommendations =
      this.generateStrategicRecommendations(globalMetrics);

    return {
      totalProperties: propertiesMap.size,
      totalEvents: events.length,
      globalMetrics,
      topPerformers,
      underPerformers,
      strategicRecommendations,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Détecter les anomalies dans le comportement des visiteurs
   */
  async detectAnomalies(userId: string, period: 'day' | 'week' | 'month'): Promise<any> {
    const startDate = this.getStartDate(period);

    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
    });

    // Grouper par jour
    const dailyMetrics = this.groupEventsByDay(events);

    // Détecter les anomalies
    const anomalies = this.findAnomalies(dailyMetrics);

    return {
      period,
      anomaliesDetected: anomalies.length,
      anomalies,
      dailyMetrics: dailyMetrics.slice(-7), // Derniers 7 jours
    };
  }

  /**
   * Prédire les conversions potentielles
   */
  async predictConversions(userId: string): Promise<any> {
    // Récupérer les sessions actives (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentEvents = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        timestamp: { gte: yesterday },
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

    // Analyser chaque session et prédire la probabilité de conversion
    const predictions = Array.from(sessionMap.entries())
      .map(([sessionId, sessionEvents]) => {
        const sessionMetrics = this.analyzePropertyMetrics(sessionEvents);
        const conversionProbability =
          this.predictConversionProbability(sessionMetrics);

        return {
          sessionId,
          eventsCount: sessionEvents.length,
          metrics: sessionMetrics,
          conversionProbability,
          risk: conversionProbability < 30 ? 'high' : conversionProbability < 60 ? 'medium' : 'low',
        };
      })
      .filter((p) => p.conversionProbability > 0)
      .sort((a, b) => b.conversionProbability - a.conversionProbability);

    const hotLeads = predictions.filter((p) => p.conversionProbability >= 70);
    const warmLeads = predictions.filter(
      (p) => p.conversionProbability >= 40 && p.conversionProbability < 70,
    );
    const coldLeads = predictions.filter((p) => p.conversionProbability < 40);

    return {
      totalSessions: sessionMap.size,
      hotLeads: hotLeads.length,
      warmLeads: warmLeads.length,
      coldLeads: coldLeads.length,
      predictions: predictions.slice(0, 10), // Top 10
    };
  }

  /**
   * Analyser les métriques d'une propriété
   */
  private analyzePropertyMetrics(events: any[]): any {
    const metrics = {
      impressions: 0,
      totalTimeSpent: 0,
      averageTimeSpent: 0,
      buttonClicks: 0,
      leads: 0,
      uniqueSessions: new Set(),
      clickThroughRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      topButtons: new Map<string, number>(),
    };

    events.forEach((event) => {
      const data = event.data as any;

      if (event.eventName === 'PropertyImpression') {
        metrics.impressions++;
        if (data?.sessionId) metrics.uniqueSessions.add(data.sessionId);
      } else if (event.eventName === 'PropertyTimeSpent') {
        metrics.totalTimeSpent += data?.timeSpentSeconds || 0;
      } else if (event.eventName === 'PropertyButtonClick') {
        metrics.buttonClicks++;
        const buttonType = data?.buttonType || 'other';
        metrics.topButtons.set(
          buttonType,
          (metrics.topButtons.get(buttonType) || 0) + 1,
        );
      } else if (event.eventName === 'Lead') {
        metrics.leads++;
      }
    });

    metrics.averageTimeSpent =
      metrics.impressions > 0
        ? metrics.totalTimeSpent / metrics.impressions
        : 0;

    metrics.clickThroughRate =
      metrics.impressions > 0
        ? (metrics.buttonClicks / metrics.impressions) * 100
        : 0;

    metrics.conversionRate =
      metrics.impressions > 0 ? (metrics.leads / metrics.impressions) * 100 : 0;

    // Convertir topButtons Map en array
    const topButtonsArray = Array.from(metrics.topButtons.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      ...metrics,
      uniqueSessions: metrics.uniqueSessions.size,
      topButtons: topButtonsArray,
    };
  }

  /**
   * Générer des recommandations basées sur les métriques
   */
  private generateRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];

    // Temps passé faible
    if (metrics.averageTimeSpent < 10) {
      recommendations.push(
        '⏱️ Temps moyen faible (< 10s) : Améliorez la qualité des photos et la description pour retenir l\'attention',
      );
    }

    // CTR faible
    if (metrics.clickThroughRate < 20 && metrics.impressions >= 10) {
      recommendations.push(
        '🖱️ Taux de clic faible (< 20%) : Rendez les boutons d\'action plus visibles et attractifs',
      );
    }

    // Conversion faible
    if (metrics.conversionRate < 5 && metrics.impressions >= 20) {
      recommendations.push(
        '📈 Taux de conversion faible (< 5%) : Simplifiez le parcours de contact et ajoutez des CTA clairs',
      );
    }

    // Bonnes performances
    if (metrics.conversionRate >= 10) {
      recommendations.push(
        '✅ Excellent taux de conversion ! Utilisez cette stratégie pour d\'autres biens',
      );
    }

    // Engagement élevé mais pas de conversion
    if (
      metrics.averageTimeSpent > 30 &&
      metrics.buttonClicks > 5 &&
      metrics.leads === 0
    ) {
      recommendations.push(
        '🎯 Fort engagement sans conversion : Vérifiez si le formulaire de contact fonctionne correctement',
      );
    }

    return recommendations;
  }

  /**
   * Identifier les points d'amélioration
   */
  private identifyImprovements(metrics: any): any[] {
    const improvements = [];

    if (metrics.averageTimeSpent < 15) {
      improvements.push({
        area: 'Contenu',
        priority: 'high',
        suggestion:
          'Ajouter une visite virtuelle ou plus de photos pour augmenter le temps passé',
        impact: 'conversion',
      });
    }

    if (metrics.topButtons.length > 0 && metrics.topButtons[0].type === 'view_details') {
      improvements.push({
        area: 'Navigation',
        priority: 'medium',
        suggestion:
          'Les visiteurs cherchent plus de détails : enrichir la fiche bien directement',
        impact: 'engagement',
      });
    }

    if (metrics.conversionRate < 3) {
      improvements.push({
        area: 'Call-to-Action',
        priority: 'high',
        suggestion: 'Ajouter un bouton "Demander une visite" plus visible',
        impact: 'conversion',
      });
    }

    return improvements;
  }

  /**
   * Calculer le score de performance (0-100)
   */
  private calculatePerformanceScore(metrics: any): number {
    let score = 0;

    // Temps moyen (30 points max)
    if (metrics.averageTimeSpent >= 60) score += 30;
    else if (metrics.averageTimeSpent >= 30) score += 20;
    else if (metrics.averageTimeSpent >= 15) score += 10;

    // CTR (30 points max)
    if (metrics.clickThroughRate >= 50) score += 30;
    else if (metrics.clickThroughRate >= 30) score += 20;
    else if (metrics.clickThroughRate >= 15) score += 10;

    // Taux de conversion (40 points max)
    if (metrics.conversionRate >= 10) score += 40;
    else if (metrics.conversionRate >= 5) score += 25;
    else if (metrics.conversionRate >= 2) score += 10;

    return score;
  }

  /**
   * Calculer les métriques globales
   */
  private calculateGlobalMetrics(events: any[]): any {
    const uniqueProperties = new Set();
    const uniqueSessions = new Set();
    let totalImpressions = 0;
    let totalLeads = 0;

    events.forEach((event) => {
      const data = event.data as any;

      if (data?.propertyId) uniqueProperties.add(data.propertyId);
      if (data?.sessionId) uniqueSessions.add(data.sessionId);

      if (event.eventName === 'PropertyImpression') totalImpressions++;
      if (event.eventName === 'Lead') totalLeads++;
    });

    return {
      totalEvents: events.length,
      uniqueProperties: uniqueProperties.size,
      uniqueSessions: uniqueSessions.size,
      totalImpressions,
      totalLeads,
      globalConversionRate:
        totalImpressions > 0 ? (totalLeads / totalImpressions) * 100 : 0,
    };
  }

  /**
   * Générer des recommandations stratégiques
   */
  private generateStrategicRecommendations(globalMetrics: any): string[] {
    const recommendations = [];

    if (globalMetrics.globalConversionRate < 3) {
      recommendations.push(
        'Améliorer globalement les CTA et simplifier le parcours de conversion',
      );
    }

    if (globalMetrics.uniqueProperties > 20 && globalMetrics.uniqueSessions < 100) {
      recommendations.push(
        'Faible trafic : Investir dans le marketing pour augmenter la visibilité',
      );
    }

    return recommendations;
  }

  /**
   * Grouper les événements par jour
   */
  private groupEventsByDay(events: any[]): any[] {
    const dayGroups = new Map<string, any[]>();

    events.forEach((event) => {
      const date = new Date(event.timestamp);
      const dayKey = date.toISOString().split('T')[0];

      if (!dayGroups.has(dayKey)) {
        dayGroups.set(dayKey, []);
      }
      dayGroups.get(dayKey)!.push(event);
    });

    return Array.from(dayGroups.entries())
      .map(([date, dayEvents]) => ({
        date,
        eventsCount: dayEvents.length,
        metrics: this.analyzePropertyMetrics(dayEvents),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Détecter les anomalies dans les métriques quotidiennes
   */
  private findAnomalies(dailyMetrics: any[]): any[] {
    if (dailyMetrics.length < 7) return [];

    const anomalies = [];

    // Calculer la moyenne et l'écart-type
    const avgEvents =
      dailyMetrics.reduce((sum, d) => sum + d.eventsCount, 0) /
      dailyMetrics.length;

    dailyMetrics.forEach((day) => {
      // Anomalie : écart > 50% de la moyenne
      if (day.eventsCount > avgEvents * 1.5) {
        anomalies.push({
          date: day.date,
          type: 'spike',
          metric: 'events',
          value: day.eventsCount,
          expected: Math.round(avgEvents),
          message: `Pic d'activité inhabituel : ${day.eventsCount} événements (moyenne: ${Math.round(avgEvents)})`,
        });
      } else if (day.eventsCount < avgEvents * 0.5 && day.eventsCount > 0) {
        anomalies.push({
          date: day.date,
          type: 'drop',
          metric: 'events',
          value: day.eventsCount,
          expected: Math.round(avgEvents),
          message: `Baisse d'activité inhabituelle : ${day.eventsCount} événements (moyenne: ${Math.round(avgEvents)})`,
        });
      }
    });

    return anomalies;
  }

  /**
   * Prédire la probabilité de conversion (0-100)
   */
  private predictConversionProbability(metrics: any): number {
    let probability = 0;

    // Basé sur le temps passé (30 points max)
    if (metrics.averageTimeSpent >= 60) probability += 30;
    else if (metrics.averageTimeSpent >= 30) probability += 20;
    else if (metrics.averageTimeSpent >= 10) probability += 10;

    // Basé sur les clics (30 points max)
    if (metrics.buttonClicks >= 5) probability += 30;
    else if (metrics.buttonClicks >= 3) probability += 20;
    else if (metrics.buttonClicks >= 1) probability += 10;

    // Basé sur le nombre de biens vus (20 points max)
    if (metrics.impressions >= 5) probability += 20;
    else if (metrics.impressions >= 3) probability += 15;
    else if (metrics.impressions >= 2) probability += 10;

    // Basé sur les types de boutons cliqués (20 points max)
    const hasContactClick = metrics.topButtons.some(
      (b: any) => b.type === 'contact' || b.type === 'call' || b.type === 'schedule_visit',
    );
    if (hasContactClick) probability += 20;

    return Math.min(probability, 100);
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
