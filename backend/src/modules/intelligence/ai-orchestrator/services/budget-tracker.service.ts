import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';

/**
 * Service de tracking et contrôle du budget IA
 *
 * Vérifie les quotas et track les dépenses par tenant
 */
@Injectable()
export class BudgetTrackerService {
  private readonly logger = new Logger(BudgetTrackerService.name);

  // Budgets par défaut (configurables via DB ou env)
  private readonly DEFAULT_DAILY_BUDGET = parseFloat(process.env.AI_DEFAULT_DAILY_BUDGET || '10'); // 10$ par jour
  private readonly DEFAULT_MONTHLY_BUDGET = parseFloat(process.env.AI_DEFAULT_MONTHLY_BUDGET || '200'); // 200$ par mois

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifier si le tenant peut effectuer une nouvelle orchestration
   * en fonction de son budget
   */
  async checkBudget(
    tenantId: string,
    estimatedCost: number = 0.5,
  ): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
    try {
      // Récupérer les dépenses du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailySpent = await this.getDailySpent(tenantId, today);

      // Récupérer les dépenses du mois
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthlySpent = await this.getMonthlySpent(tenantId, monthStart);

      // Vérifier le budget journalier
      if (dailySpent + estimatedCost > this.DEFAULT_DAILY_BUDGET) {
        return {
          allowed: false,
          reason: `Daily budget exceeded (${dailySpent.toFixed(2)}$ / ${this.DEFAULT_DAILY_BUDGET}$)`,
          remaining: Math.max(0, this.DEFAULT_DAILY_BUDGET - dailySpent),
        };
      }

      // Vérifier le budget mensuel
      if (monthlySpent + estimatedCost > this.DEFAULT_MONTHLY_BUDGET) {
        return {
          allowed: false,
          reason: `Monthly budget exceeded (${monthlySpent.toFixed(2)}$ / ${this.DEFAULT_MONTHLY_BUDGET}$)`,
          remaining: Math.max(0, this.DEFAULT_MONTHLY_BUDGET - monthlySpent),
        };
      }

      return {
        allowed: true,
        remaining: Math.min(
          this.DEFAULT_DAILY_BUDGET - dailySpent,
          this.DEFAULT_MONTHLY_BUDGET - monthlySpent,
        ),
      };
    } catch (error) {
      this.logger.error(`Budget check failed for tenant ${tenantId}:`, error);

      // En cas d'erreur, on autorise mais on log
      return { allowed: true };
    }
  }

  /**
   * Enregistrer une dépense d'orchestration
   */
  async recordSpending(params: {
    tenantId: string;
    userId: string;
    orchestrationId: string;
    provider: string;
    cost: number;
    tokensUsed?: number;
    details?: any;
  }) {
    try {
      await this.prisma.ai_usage_metrics.create({
        data: {
          userId: params.userId,
          provider: params.provider,
          model: 'orchestrator',
          operation: 'orchestration',
          tokensUsed: params.tokensUsed || 0,
          cost: params.cost,
          timestamp: new Date(),
          metadata: {
            tenantId: params.tenantId,
            orchestrationId: params.orchestrationId,
            ...params.details,
          },
        },
      });

      this.logger.log(
        `Recorded spending: ${params.cost.toFixed(4)}$ for tenant ${params.tenantId}`,
      );
    } catch (error) {
      this.logger.error('Failed to record spending:', error);
      // Ne pas bloquer l'opération si le tracking échoue
    }
  }

  /**
   * Obtenir les dépenses du jour pour un tenant
   */
  private async getDailySpent(tenantId: string, startOfDay: Date): Promise<number> {
    const metrics = await this.prisma.ai_usage_metrics.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
        },
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      select: {
        cost: true,
      },
    });

    return metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
  }

  /**
   * Obtenir les dépenses du mois pour un tenant
   */
  private async getMonthlySpent(tenantId: string, startOfMonth: Date): Promise<number> {
    const metrics = await this.prisma.ai_usage_metrics.findMany({
      where: {
        timestamp: {
          gte: startOfMonth,
        },
        metadata: {
          path: ['tenantId'],
          equals: tenantId,
        },
      },
      select: {
        cost: true,
      },
    });

    return metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
  }

  /**
   * Obtenir le résumé budgétaire d'un tenant
   */
  async getBudgetSummary(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const dailySpent = await this.getDailySpent(tenantId, today);
    const monthlySpent = await this.getMonthlySpent(tenantId, monthStart);

    return {
      daily: {
        spent: dailySpent,
        budget: this.DEFAULT_DAILY_BUDGET,
        remaining: Math.max(0, this.DEFAULT_DAILY_BUDGET - dailySpent),
        percentage: (dailySpent / this.DEFAULT_DAILY_BUDGET) * 100,
      },
      monthly: {
        spent: monthlySpent,
        budget: this.DEFAULT_MONTHLY_BUDGET,
        remaining: Math.max(0, this.DEFAULT_MONTHLY_BUDGET - monthlySpent),
        percentage: (monthlySpent / this.DEFAULT_MONTHLY_BUDGET) * 100,
      },
    };
  }
}
