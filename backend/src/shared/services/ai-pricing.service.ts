import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface PricingInfo {
  actionCode: string;
  actionName: string;
  description: string | null;
  creditsCost: number;
  estimatedTokens: number | null;
  providerCostUsd: number | null;
  enabled: boolean;
  category: string | null;
}

export interface CreatePricingDto {
  actionCode: string;
  actionName: string;
  description?: string;
  creditsCost: number;
  estimatedTokens?: number;
  providerCostUsd?: number;
  enabled?: boolean;
  category?: string;
}

export interface UpdatePricingDto {
  actionName?: string;
  description?: string;
  creditsCost?: number;
  estimatedTokens?: number;
  providerCostUsd?: number;
  enabled?: boolean;
  category?: string;
}

@Injectable()
export class AiPricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * RÉCUPÉRATION DES COÛTS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Récupère le coût en crédits pour une action donnée
   */
  async getCreditsCost(actionCode: string): Promise<number> {
    const pricing = await this.prisma.aiPricing.findUnique({
      where: { actionCode },
    });

    if (!pricing) {
      throw new NotFoundException(
        `Pricing non trouvé pour l'action "${actionCode}". ` +
        `Veuillez configurer le pricing dans la table ai_pricing.`
      );
    }

    if (!pricing.enabled) {
      throw new NotFoundException(
        `L'action "${actionCode}" est désactivée.`
      );
    }

    return pricing.creditsCost;
  }

  /**
   * Récupère les informations complètes de pricing pour une action
   */
  async getPricingInfo(actionCode: string): Promise<PricingInfo> {
    const pricing = await this.prisma.aiPricing.findUnique({
      where: { actionCode },
    });

    if (!pricing) {
      throw new NotFoundException(
        `Pricing non trouvé pour l'action "${actionCode}".`
      );
    }

    return {
      actionCode: pricing.actionCode,
      actionName: pricing.actionName,
      description: pricing.description,
      creditsCost: pricing.creditsCost,
      estimatedTokens: pricing.estimatedTokens,
      providerCostUsd: pricing.providerCostUsd,
      enabled: pricing.enabled,
      category: pricing.category,
    };
  }

  /**
   * Vérifie si une action existe et est activée
   */
  async isActionEnabled(actionCode: string): Promise<boolean> {
    const pricing = await this.prisma.aiPricing.findUnique({
      where: { actionCode },
    });

    return pricing ? pricing.enabled : false;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * LISTE DES ACTIONS
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Récupère toutes les actions de pricing (actives uniquement par défaut)
   */
  async getAllPricing(includeDisabled: boolean = false): Promise<PricingInfo[]> {
    const pricings = await this.prisma.aiPricing.findMany({
      where: includeDisabled ? {} : { enabled: true },
      orderBy: [
        { category: 'asc' },
        { creditsCost: 'asc' },
      ],
    });

    return pricings.map(p => ({
      actionCode: p.actionCode,
      actionName: p.actionName,
      description: p.description,
      creditsCost: p.creditsCost,
      estimatedTokens: p.estimatedTokens,
      providerCostUsd: p.providerCostUsd,
      enabled: p.enabled,
      category: p.category,
    }));
  }

  /**
   * Récupère les actions par catégorie
   */
  async getPricingByCategory(category: string): Promise<PricingInfo[]> {
    const pricings = await this.prisma.aiPricing.findMany({
      where: {
        category,
        enabled: true,
      },
      orderBy: { creditsCost: 'asc' },
    });

    return pricings.map(p => ({
      actionCode: p.actionCode,
      actionName: p.actionName,
      description: p.description,
      creditsCost: p.creditsCost,
      estimatedTokens: p.estimatedTokens,
      providerCostUsd: p.providerCostUsd,
      enabled: p.enabled,
      category: p.category,
    }));
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * GESTION DU PRICING (SUPER ADMIN)
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Crée une nouvelle entrée de pricing
   */
  async createPricing(data: CreatePricingDto) {
    return await this.prisma.aiPricing.create({
      data: {
        actionCode: data.actionCode,
        actionName: data.actionName,
        description: data.description || null,
        creditsCost: data.creditsCost,
        estimatedTokens: data.estimatedTokens || null,
        providerCostUsd: data.providerCostUsd || null,
        enabled: data.enabled !== undefined ? data.enabled : true,
        category: data.category || null,
      },
    });
  }

  /**
   * Met à jour une entrée de pricing existante
   */
  async updatePricing(actionCode: string, data: UpdatePricingDto) {
    const existing = await this.prisma.aiPricing.findUnique({
      where: { actionCode },
    });

    if (!existing) {
      throw new NotFoundException(
        `Pricing non trouvé pour l'action "${actionCode}".`
      );
    }

    return await this.prisma.aiPricing.update({
      where: { actionCode },
      data: {
        actionName: data.actionName,
        description: data.description,
        creditsCost: data.creditsCost,
        estimatedTokens: data.estimatedTokens,
        providerCostUsd: data.providerCostUsd,
        enabled: data.enabled,
        category: data.category,
      },
    });
  }

  /**
   * Désactive une action (soft delete)
   */
  async disableAction(actionCode: string) {
    return await this.prisma.aiPricing.update({
      where: { actionCode },
      data: { enabled: false },
    });
  }

  /**
   * Active une action
   */
  async enableAction(actionCode: string) {
    return await this.prisma.aiPricing.update({
      where: { actionCode },
      data: { enabled: true },
    });
  }

  /**
   * Supprime définitivement une entrée de pricing
   */
  async deletePricing(actionCode: string) {
    return await this.prisma.aiPricing.delete({
      where: { actionCode },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * CALCULS DE COÛT
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Calcule le coût total pour plusieurs actions
   */
  async calculateTotalCost(actionCodes: string[]): Promise<{
    totalCredits: number;
    breakdown: Array<{ actionCode: string; actionName: string; credits: number }>;
  }> {
    const breakdown = [];
    let totalCredits = 0;

    for (const actionCode of actionCodes) {
      const pricing = await this.getPricingInfo(actionCode);
      breakdown.push({
        actionCode: pricing.actionCode,
        actionName: pricing.actionName,
        credits: pricing.creditsCost,
      });
      totalCredits += pricing.creditsCost;
    }

    return {
      totalCredits,
      breakdown,
    };
  }

  /**
   * Calcule le coût estimé en USD basé sur le provider
   */
  async getEstimatedUsdCost(actionCode: string): Promise<number | null> {
    const pricing = await this.getPricingInfo(actionCode);
    return pricing.providerCostUsd;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * UPSERT EN BULK (POUR SEEDING)
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Crée ou met à jour plusieurs entrées de pricing
   * Utile pour le seeding initial
   */
  async upsertBulkPricing(pricings: CreatePricingDto[]) {
    const results = [];

    for (const pricing of pricings) {
      const result = await this.prisma.aiPricing.upsert({
        where: { actionCode: pricing.actionCode },
        create: {
          actionCode: pricing.actionCode,
          actionName: pricing.actionName,
          description: pricing.description || null,
          creditsCost: pricing.creditsCost,
          estimatedTokens: pricing.estimatedTokens || null,
          providerCostUsd: pricing.providerCostUsd || null,
          enabled: pricing.enabled !== undefined ? pricing.enabled : true,
          category: pricing.category || null,
        },
        update: {
          actionName: pricing.actionName,
          description: pricing.description || null,
          creditsCost: pricing.creditsCost,
          estimatedTokens: pricing.estimatedTokens || null,
          providerCostUsd: pricing.providerCostUsd || null,
          enabled: pricing.enabled !== undefined ? pricing.enabled : true,
          category: pricing.category || null,
        },
      });

      results.push(result);
    }

    return results;
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * STATISTIQUES
   * ═══════════════════════════════════════════════════════════
   */

  /**
   * Récupère les statistiques de pricing
   */
  async getPricingStats() {
    const [total, enabled, disabled, categories] = await Promise.all([
      this.prisma.aiPricing.count(),
      this.prisma.aiPricing.count({ where: { enabled: true } }),
      this.prisma.aiPricing.count({ where: { enabled: false } }),
      this.prisma.aiPricing.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    const avgCredits = await this.prisma.aiPricing.aggregate({
      _avg: { creditsCost: true },
      where: { enabled: true },
    });

    return {
      total,
      enabled,
      disabled,
      categories: categories.map(c => ({
        category: c.category,
        count: c._count,
      })),
      averageCredits: avgCredits._avg.creditsCost || 0,
    };
  }
}
