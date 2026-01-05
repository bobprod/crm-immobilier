import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour synchroniser les statistiques de tracking avec les biens immobiliers
 *
 * Met à jour automatiquement les métriques de performance de chaque bien :
 * - Nombre de vues totales
 * - Temps moyen passé
 * - Taux d'engagement (CTR)
 * - Nombre de leads générés
 * - Score de popularité (0-100)
 */
@Injectable()
export class PropertyTrackingStatsService {
  private readonly logger = new Logger(PropertyTrackingStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mettre à jour les statistiques d'un bien après un événement de tracking
   */
  async updatePropertyStats(
    userId: string,
    propertyId: string,
    eventType: 'impression' | 'click' | 'lead',
    additionalData?: any,
  ): Promise<void> {
    try {
      // Récupérer les stats actuelles ou créer une nouvelle entrée
      let stats = await this.prisma.propertyTrackingStats.findUnique({
        where: {
          userId_propertyId: {
            userId,
            propertyId,
          },
        },
      });

      if (!stats) {
        // Créer les stats initiales
        stats = await this.prisma.propertyTrackingStats.create({
          data: {
            userId,
            propertyId,
            totalViews: eventType === 'impression' ? 1 : 0,
            totalClicks: eventType === 'click' ? 1 : 0,
            totalLeads: eventType === 'lead' ? 1 : 0,
            totalTimeSpent: additionalData?.timeSpent || 0,
            lastViewedAt: new Date(),
            popularityScore: 0,
          },
        });
      } else {
        // Mettre à jour les stats existantes
        const updates: any = {
          lastViewedAt: new Date(),
        };

        if (eventType === 'impression') {
          updates.totalViews = { increment: 1 };
          if (additionalData?.timeSpent) {
            updates.totalTimeSpent = { increment: additionalData.timeSpent };
          }
        } else if (eventType === 'click') {
          updates.totalClicks = { increment: 1 };
        } else if (eventType === 'lead') {
          updates.totalLeads = { increment: 1 };
        }

        stats = await this.prisma.propertyTrackingStats.update({
          where: {
            userId_propertyId: {
              userId,
              propertyId,
            },
          },
          data: updates,
        });
      }

      // Recalculer le score de popularité
      await this.recalculatePopularityScore(userId, propertyId);
    } catch (error) {
      this.logger.error(
        `Failed to update property stats for ${propertyId}:`,
        error,
      );
    }
  }

  /**
   * Recalculer le score de popularité d'un bien (0-100)
   */
  async recalculatePopularityScore(
    userId: string,
    propertyId: string,
  ): Promise<number> {
    const stats = await this.prisma.propertyTrackingStats.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
    });

    if (!stats) return 0;

    // Formule de popularité :
    // - Vues : 20 points (max 100 vues = 20 points)
    // - Clics : 30 points (max 20 clics = 30 points)
    // - Temps passé : 30 points (max 300 secondes = 30 points)
    // - Leads : 20 points (max 5 leads = 20 points)

    let score = 0;

    // Score vues (max 20 points)
    score += Math.min((stats.totalViews / 100) * 20, 20);

    // Score clics (max 30 points)
    score += Math.min((stats.totalClicks / 20) * 30, 30);

    // Score temps passé (max 30 points)
    const avgTimeSpent =
      stats.totalViews > 0 ? stats.totalTimeSpent / stats.totalViews : 0;
    score += Math.min((avgTimeSpent / 300) * 30, 30);

    // Score leads (max 20 points)
    score += Math.min((stats.totalLeads / 5) * 20, 20);

    const popularityScore = Math.round(score);

    // Mettre à jour le score en base
    await this.prisma.propertyTrackingStats.update({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      data: { popularityScore },
    });

    return popularityScore;
  }

  /**
   * Obtenir les biens les plus populaires
   */
  async getPopularProperties(
    userId: string,
    limit: number = 10,
    period?: 'day' | 'week' | 'month',
  ): Promise<any[]> {
    const where: any = { userId };

    if (period) {
      const startDate = this.getStartDate(period);
      where.lastViewedAt = { gte: startDate };
    }

    const stats = await this.prisma.propertyTrackingStats.findMany({
      where,
      orderBy: { popularityScore: 'desc' },
      take: limit,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            type: true,
            category: true,
            status: true,
          },
        },
      },
    });

    return stats.map((stat) => ({
      propertyId: stat.propertyId,
      property: stat.property,
      stats: {
        totalViews: stat.totalViews,
        totalClicks: stat.totalClicks,
        totalLeads: stat.totalLeads,
        avgTimeSpent:
          stat.totalViews > 0
            ? Math.round(stat.totalTimeSpent / stat.totalViews)
            : 0,
        clickThroughRate:
          stat.totalViews > 0
            ? Math.round((stat.totalClicks / stat.totalViews) * 100 * 100) /
              100
            : 0,
        conversionRate:
          stat.totalViews > 0
            ? Math.round((stat.totalLeads / stat.totalViews) * 100 * 100) / 100
            : 0,
        popularityScore: stat.popularityScore,
      },
      lastViewedAt: stat.lastViewedAt,
    }));
  }

  /**
   * Obtenir les biens sous-performants (besoin d'optimisation)
   */
  async getUnderperformingProperties(
    userId: string,
    minViews: number = 10,
  ): Promise<any[]> {
    const stats = await this.prisma.propertyTrackingStats.findMany({
      where: {
        userId,
        totalViews: { gte: minViews },
        popularityScore: { lt: 40 }, // Score < 40 = sous-performant
      },
      orderBy: { popularityScore: 'asc' },
      take: 20,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            type: true,
            category: true,
            status: true,
          },
        },
      },
    });

    return stats.map((stat) => ({
      propertyId: stat.propertyId,
      property: stat.property,
      stats: {
        totalViews: stat.totalViews,
        totalClicks: stat.totalClicks,
        totalLeads: stat.totalLeads,
        avgTimeSpent:
          stat.totalViews > 0
            ? Math.round(stat.totalTimeSpent / stat.totalViews)
            : 0,
        clickThroughRate:
          stat.totalViews > 0
            ? Math.round((stat.totalClicks / stat.totalViews) * 100 * 100) /
              100
            : 0,
        conversionRate:
          stat.totalViews > 0
            ? Math.round((stat.totalLeads / stat.totalViews) * 100 * 100) / 100
            : 0,
        popularityScore: stat.popularityScore,
      },
      issues: this.identifyIssues(stat),
    }));
  }

  /**
   * Identifier les problèmes d'un bien sous-performant
   */
  private identifyIssues(stat: any): string[] {
    const issues: string[] = [];

    // Taux de clic faible
    const ctr =
      stat.totalViews > 0 ? (stat.totalClicks / stat.totalViews) * 100 : 0;
    if (ctr < 10) {
      issues.push('Taux de clic faible - améliorer CTAs et visuels');
    }

    // Temps passé faible
    const avgTime =
      stat.totalViews > 0 ? stat.totalTimeSpent / stat.totalViews : 0;
    if (avgTime < 20) {
      issues.push('Temps passé faible - enrichir description et photos');
    }

    // Taux de conversion faible
    const convRate =
      stat.totalClicks > 0 ? (stat.totalLeads / stat.totalClicks) * 100 : 0;
    if (convRate < 15 && stat.totalClicks >= 5) {
      issues.push(
        'Taux de conversion faible - simplifier formulaire de contact',
      );
    }

    // Pas de leads malgré du trafic
    if (stat.totalViews >= 20 && stat.totalLeads === 0) {
      issues.push('Aucun lead généré - revoir prix et informations clés');
    }

    return issues;
  }

  /**
   * Marquer un bien comme "hot" (forte demande)
   */
  async markPropertyAsHot(
    userId: string,
    propertyId: string,
    isHot: boolean,
  ): Promise<void> {
    await this.prisma.propertyTrackingStats.update({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      data: { isHot },
    });
  }

  /**
   * Obtenir les statistiques détaillées d'un bien
   */
  async getPropertyDetailedStats(
    userId: string,
    propertyId: string,
  ): Promise<any> {
    const stats = await this.prisma.propertyTrackingStats.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            type: true,
            category: true,
            status: true,
          },
        },
      },
    });

    if (!stats) {
      return null;
    }

    return {
      propertyId: stats.propertyId,
      property: stats.property,
      metrics: {
        totalViews: stats.totalViews,
        totalClicks: stats.totalClicks,
        totalLeads: stats.totalLeads,
        totalTimeSpent: stats.totalTimeSpent,
        avgTimeSpent:
          stats.totalViews > 0
            ? Math.round(stats.totalTimeSpent / stats.totalViews)
            : 0,
        clickThroughRate:
          stats.totalViews > 0
            ? Math.round((stats.totalClicks / stats.totalViews) * 100 * 100) /
              100
            : 0,
        conversionRate:
          stats.totalViews > 0
            ? Math.round((stats.totalLeads / stats.totalViews) * 100 * 100) /
              100
            : 0,
        popularityScore: stats.popularityScore,
        isHot: stats.isHot,
      },
      lastViewedAt: stats.lastViewedAt,
      createdAt: stats.createdAt,
      updatedAt: stats.updatedAt,
    };
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
   * Détecter automatiquement les biens "hot" et les marquer
   */
  async autoDetectHotProperties(userId: string): Promise<string[]> {
    // Critères pour un bien "hot" :
    // - Score de popularité >= 70
    // - Au moins 5 vues dans les dernières 24h
    // - Au moins 1 lead dans les dernières 48h

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Récupérer tous les biens avec bon score
    const candidates = await this.prisma.propertyTrackingStats.findMany({
      where: {
        userId,
        popularityScore: { gte: 70 },
        lastViewedAt: { gte: oneDayAgo },
      },
    });

    const hotPropertyIds: string[] = [];

    for (const candidate of candidates) {
      // Vérifier l'activité récente
      const recentViews = await this.prisma.trackingEvent.count({
        where: {
          userId,
          propertyId: candidate.propertyId,
          eventName: 'PropertyImpression',
          timestamp: { gte: oneDayAgo },
        },
      });

      const recentLeads = await this.prisma.trackingEvent.count({
        where: {
          userId,
          propertyId: candidate.propertyId,
          eventName: 'Lead',
          timestamp: { gte: twoDaysAgo },
        },
      });

      if (recentViews >= 5 && recentLeads >= 1) {
        await this.markPropertyAsHot(userId, candidate.propertyId, true);
        hotPropertyIds.push(candidate.propertyId);
      } else if (candidate.isHot) {
        // Retirer le statut hot si les conditions ne sont plus remplies
        await this.markPropertyAsHot(userId, candidate.propertyId, false);
      }
    }

    return hotPropertyIds;
  }
}
