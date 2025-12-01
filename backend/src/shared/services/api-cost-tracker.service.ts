import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PRICING_PER_1M_TOKENS } from '../../modules/intelligence/llm-config/providers/llm-provider.interface';

export interface UsageRecord {
  userId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  requestType: string;
  endpoint?: string;
  metadata?: Record<string, unknown>;
}

export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  lastUsed: Date | null;
  byProvider: Record<string, { tokens: number; cost: number; requests: number }>;
  byModel: Record<string, { tokens: number; cost: number; requests: number }>;
  dailyUsage: Array<{ date: string; tokens: number; cost: number }>;
}

export interface DashboardMetrics {
  today: { tokens: number; cost: number; requests: number };
  week: { tokens: number; cost: number; requests: number };
  month: { tokens: number; cost: number; requests: number };
  topProvider: string | null;
  costTrend: number;
}

export interface BudgetAlert {
  isOverBudget: boolean;
  currentSpend: number;
  remainingBudget: number;
  percentUsed: number;
}

/**
 * Service de tracking des coûts API (LLM, Pica, SERP, etc.)
 * Enregistre l'utilisation et calcule les coûts
 */
@Injectable()
export class ApiCostTrackerService {
  private readonly logger = new Logger(ApiCostTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enregistrer une utilisation d'API
   */
  async trackUsage(record: UsageRecord): Promise<void> {
    const totalTokens = record.inputTokens + record.outputTokens;
    const cost = this.calculateCost(record.provider, record.inputTokens, record.outputTokens);

    try {
      await this.prisma.ai_usage_metrics.create({
        data: {
          userId: record.userId,
          provider: record.provider,
          model: record.model,
          tokensUsed: totalTokens,
          cost,
          requestType: record.requestType,
          endpoint: record.endpoint,
          metadata: {
            inputTokens: record.inputTokens,
            outputTokens: record.outputTokens,
            ...record.metadata,
          },
        },
      });

      this.logger.debug(
        `Tracked API usage: ${record.provider}/${record.model} - ${totalTokens} tokens ($${cost.toFixed(6)})`,
      );
    } catch (error) {
      this.logger.error('Failed to track API usage:', error);
    }
  }

  /**
   * Calculer le coût d'une requête
   */
  calculateCost(provider: string, inputTokens: number, outputTokens: number): number {
    const pricing = PRICING_PER_1M_TOKENS[provider] || { input: 5.0, output: 15.0 };
    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;
    return inputCost + outputCost;
  }

  /**
   * Estimer les tokens à partir du texte
   * Approximation: ~4 caractères = 1 token (pour la plupart des modèles)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Obtenir les statistiques d'utilisation d'un utilisateur
   */
  async getUsageStats(userId: string, days = 30): Promise<UsageStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.prisma.ai_usage_metrics.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Calculer les statistiques
    let totalTokens = 0;
    let totalCost = 0;
    const byProvider: Record<string, { tokens: number; cost: number; requests: number }> = {};
    const byModel: Record<string, { tokens: number; cost: number; requests: number }> = {};
    const dailyMap: Map<string, { tokens: number; cost: number }> = new Map();

    for (const metric of metrics) {
      totalTokens += metric.tokensUsed;
      totalCost += metric.cost || 0;

      // Par provider
      if (!byProvider[metric.provider]) {
        byProvider[metric.provider] = { tokens: 0, cost: 0, requests: 0 };
      }
      byProvider[metric.provider].tokens += metric.tokensUsed;
      byProvider[metric.provider].cost += metric.cost || 0;
      byProvider[metric.provider].requests += 1;

      // Par modèle
      if (!byModel[metric.model]) {
        byModel[metric.model] = { tokens: 0, cost: 0, requests: 0 };
      }
      byModel[metric.model].tokens += metric.tokensUsed;
      byModel[metric.model].cost += metric.cost || 0;
      byModel[metric.model].requests += 1;

      // Par jour
      const dateKey = metric.timestamp.toISOString().split('T')[0];
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { tokens: 0, cost: 0 });
      }
      const daily = dailyMap.get(dateKey)!;
      daily.tokens += metric.tokensUsed;
      daily.cost += metric.cost || 0;
    }

    const dailyUsage = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalTokens,
      totalCost,
      requestCount: metrics.length,
      lastUsed: metrics.length > 0 ? metrics[0].timestamp : null,
      byProvider,
      byModel,
      dailyUsage,
    };
  }

  /**
   * Obtenir les métriques agrégées pour le dashboard
   */
  async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const [todayMetrics, weekMetrics, monthMetrics, prevMonthMetrics] = await Promise.all([
      this.getAggregatedMetrics(userId, todayStart, now),
      this.getAggregatedMetrics(userId, weekStart, now),
      this.getAggregatedMetrics(userId, monthStart, now),
      this.getAggregatedMetrics(userId, prevMonthStart, monthStart),
    ]);

    // Calculer le trend
    const costTrend =
      prevMonthMetrics.cost > 0
        ? ((monthMetrics.cost - prevMonthMetrics.cost) / prevMonthMetrics.cost) * 100
        : 0;

    // Trouver le top provider
    const stats = await this.getUsageStats(userId, 30);
    const topProvider = Object.entries(stats.byProvider).sort(
      (a, b) => b[1].requests - a[1].requests,
    )[0]?.[0] || null;

    return {
      today: todayMetrics,
      week: weekMetrics,
      month: monthMetrics,
      topProvider,
      costTrend: Math.round(costTrend * 100) / 100,
    };
  }

  private async getAggregatedMetrics(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ tokens: number; cost: number; requests: number }> {
    const result = await this.prisma.ai_usage_metrics.aggregate({
      where: {
        userId,
        timestamp: { gte: startDate, lte: endDate },
      },
      _sum: { tokensUsed: true, cost: true },
      _count: true,
    });

    return {
      tokens: result._sum.tokensUsed || 0,
      cost: result._sum.cost || 0,
      requests: result._count,
    };
  }

  /**
   * Définir des alertes de budget
   */
  async checkBudgetAlert(userId: string, monthlyBudget: number): Promise<BudgetAlert> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyStats = await this.getAggregatedMetrics(userId, monthStart, now);

    return {
      isOverBudget: monthlyStats.cost > monthlyBudget,
      currentSpend: monthlyStats.cost,
      remainingBudget: Math.max(0, monthlyBudget - monthlyStats.cost),
      percentUsed: monthlyBudget > 0 ? (monthlyStats.cost / monthlyBudget) * 100 : 0,
    };
  }
}
