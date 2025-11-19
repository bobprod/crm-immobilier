import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class AIMetricsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtenir les statistiques globales d'utilisation IA
   */
  async getStats(userId: string) {
    const metrics = await this.prisma.ai_usage_metrics.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const totalTokens = metrics.reduce((sum, m) => sum + m.tokensUsed, 0);
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      totalRequests: metrics.length,
      totalTokens,
      totalCost,
      byProvider: this.groupByProvider(metrics),
      byModel: this.groupByModel(metrics),
    };
  }

  /**
   * Obtenir les métriques par agent/utilisateur
   */
  async getMetricsByAgent(userId: string) {
    const metrics = await this.prisma.ai_usage_metrics.groupBy({
      by: ['provider', 'model'],
      where: { userId },
      _sum: {
        tokensUsed: true,
        cost: true,
      },
      _count: true,
    });

    return metrics.map((m) => ({
      provider: m.provider,
      model: m.model,
      requests: m._count,
      totalTokens: m._sum.tokensUsed || 0,
      totalCost: m._sum.cost || 0,
    }));
  }

  /**
   * Calculer le ROI de l'IA
   */
  async getAIROI(userId: string) {
    const metrics = await this.prisma.ai_usage_metrics.findMany({
      where: { userId },
    });

    const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    // Calculer les conversions attribuables à l'IA
    const conversions = await this.prisma.conversion_events.count({
      where: {
        userId,
        eventType: { in: ['prospect_qualified', 'deal_closed'] },
      },
    });

    // ROI simplifié : nombre de conversions / coût
    const roi = totalCost > 0 ? conversions / totalCost : 0;

    return {
      totalCost,
      conversions,
      roi,
      avgCostPerConversion: conversions > 0 ? totalCost / conversions : 0,
    };
  }

  /**
   * Obtenir les statistiques globales
   */
  async getGlobalStats(userId: string) {
    const [metrics, conversions] = await Promise.all([
      this.getStats(userId),
      this.prisma.conversion_events.count({ where: { userId } }),
    ]);

    return {
      ...metrics,
      totalConversions: conversions,
    };
  }

  /**
   * Obtenir l'historique d'utilisation
   */
  async getUsageHistory(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.prisma.ai_usage_metrics.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Grouper par jour
    const byDay = this.groupByDay(metrics);

    return byDay;
  }

  /**
   * Obtenir les conversions récentes
   */
  async getRecentConversions(userId: string, limit: number = 10) {
    return this.prisma.conversion_events.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Tracker une conversion
   */
  async trackConversion(data: {
    userId: string;
    eventType: string;
    eventName?: string;
    prospectId?: string;
    propertyId?: string;
    appointmentId?: string;
    value?: number;
    source?: string;
    metadata?: any;
  }) {
    return this.prisma.conversion_events.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        eventName: data.eventName,
        prospectId: data.prospectId,
        propertyId: data.propertyId,
        appointmentId: data.appointmentId,
        value: data.value,
        source: data.source,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Helpers privés
   */
  private groupByProvider(metrics: any[]) {
    const grouped = metrics.reduce((acc, m) => {
      if (!acc[m.provider]) {
        acc[m.provider] = { requests: 0, tokens: 0, cost: 0 };
      }
      acc[m.provider].requests++;
      acc[m.provider].tokens += m.tokensUsed;
      acc[m.provider].cost += m.cost || 0;
      return acc;
    }, {});

    return Object.entries(grouped).map(([provider, stats]: [string, any]) => ({
      provider,
      requests: stats.requests,
      tokens: stats.tokens,
      cost: stats.cost,
    }));
  }

  private groupByModel(metrics: any[]) {
    const grouped = metrics.reduce((acc, m) => {
      if (!acc[m.model]) {
        acc[m.model] = { requests: 0, tokens: 0, cost: 0 };
      }
      acc[m.model].requests++;
      acc[m.model].tokens += m.tokensUsed;
      acc[m.model].cost += m.cost || 0;
      return acc;
    }, {});

    return Object.entries(grouped).map(([model, stats]: [string, any]) => ({
      model,
      requests: stats.requests,
      tokens: stats.tokens,
      cost: stats.cost,
    }));
  }

  private groupByDay(metrics: any[]) {
    const grouped = metrics.reduce((acc, m) => {
      const day = m.timestamp.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = { requests: 0, tokens: 0, cost: 0 };
      }
      acc[day].requests++;
      acc[day].tokens += m.tokensUsed;
      acc[day].cost += m.cost || 0;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, stats]: [string, any]) => ({
        date,
        requests: stats.requests,
        tokens: stats.tokens,
        cost: stats.cost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
