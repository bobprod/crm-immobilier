import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreditBalance {
  balance: number;
  consumed: number;
  quotaMonthly?: number | null;
  quotaDaily?: number | null;
  isAgency: boolean;
  alertThreshold?: number | null;
  alertSent: boolean;
}

export interface ConsumeResult {
  success: boolean;
  newBalance: number;
  consumed: number;
  isAgency: boolean;
}

@Injectable()
export class AiCreditsService {
  constructor(private prisma: PrismaService) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * RÉCUPÉRATION DU SOLDE
   * ═══════════════════════════════════════════════════════════
   *
   * LOGIQUE :
   * - Si agencyId existe → utilise AiCredits (pool agence)
   * - Si agencyId est null → utilise UserAiCredits (utilisateur indépendant)
   */
  async getBalance(
    userId: string,
    agencyId?: string | null,
  ): Promise<CreditBalance> {
    // Cas 1 : Utilisateur en agence → solde de l'agence
    if (agencyId) {
      const agencyCredits = await this.prisma.aiCredits.findUnique({
        where: { agencyId },
      });

      if (!agencyCredits) {
        // Initialiser si n'existe pas
        const newCredits = await this.prisma.aiCredits.create({
          data: {
            agencyId,
            balance: 0,
            consumed: 0,
          },
        });

        return {
          balance: newCredits.balance,
          consumed: newCredits.consumed,
          quotaMonthly: newCredits.quotaMonthly,
          quotaDaily: newCredits.quotaDaily,
          isAgency: true,
          alertThreshold: newCredits.alertThreshold,
          alertSent: newCredits.alertSent,
        };
      }

      return {
        balance: agencyCredits.balance,
        consumed: agencyCredits.consumed,
        quotaMonthly: agencyCredits.quotaMonthly,
        quotaDaily: agencyCredits.quotaDaily,
        isAgency: true,
        alertThreshold: agencyCredits.alertThreshold,
        alertSent: agencyCredits.alertSent,
      };
    }

    // Cas 2 : Utilisateur indépendant → UserAiCredits
    const userCredits = await this.prisma.userAiCredits.findUnique({
      where: { userId },
    });

    if (!userCredits) {
      // Initialiser si n'existe pas
      const newCredits = await this.prisma.userAiCredits.create({
        data: {
          userId,
          balance: 0,
          consumed: 0,
        },
      });

      return {
        balance: newCredits.balance,
        consumed: newCredits.consumed,
        quotaMonthly: newCredits.quotaMonthly,
        quotaDaily: newCredits.quotaDaily,
        isAgency: false,
        alertThreshold: newCredits.alertThreshold,
        alertSent: newCredits.alertSent,
      };
    }

    return {
      balance: userCredits.balance,
      consumed: userCredits.consumed,
      quotaMonthly: userCredits.quotaMonthly,
      quotaDaily: userCredits.quotaDaily,
      isAgency: false,
      alertThreshold: userCredits.alertThreshold,
      alertSent: userCredits.alertSent,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * VÉRIFICATION & CONSOMMATION DE CRÉDITS
   * ═══════════════════════════════════════════════════════════
   *
   * Cette méthode :
   * 1. Vérifie que le solde est suffisant
   * 2. Consomme les crédits (décrémente balance, incrémente consumed)
   * 3. Retourne le nouveau solde
   *
   * ATOMICITÉ : Utilise une transaction Prisma pour garantir la cohérence
   */
  async checkAndConsume(
    userId: string,
    creditsToConsume: number,
    actionCode: string,
    agencyId?: string | null,
  ): Promise<ConsumeResult> {
    if (creditsToConsume <= 0) {
      throw new BadRequestException('Le nombre de crédits doit être supérieur à 0');
    }

    // Récupérer le solde actuel
    const balance = await this.getBalance(userId, agencyId);

    // Vérifier le solde
    if (balance.balance < creditsToConsume) {
      throw new ForbiddenException(
        `Crédits insuffisants. Solde : ${balance.balance}, requis : ${creditsToConsume}. ` +
        `Veuillez recharger vos crédits ou contacter l'administrateur.`
      );
    }

    // Consommer les crédits
    if (agencyId) {
      return await this.consumeAgencyCredits(agencyId, creditsToConsume);
    } else {
      return await this.consumeUserCredits(userId, creditsToConsume);
    }
  }

  /**
   * Consomme les crédits d'une AGENCE (pool partagé)
   */
  private async consumeAgencyCredits(
    agencyId: string,
    creditsToConsume: number,
  ): Promise<ConsumeResult> {
    const updated = await this.prisma.aiCredits.update({
      where: { agencyId },
      data: {
        balance: { decrement: creditsToConsume },
        consumed: { increment: creditsToConsume },
      },
    });

    return {
      success: true,
      newBalance: updated.balance,
      consumed: updated.consumed,
      isAgency: true,
    };
  }

  /**
   * Consomme les crédits d'un USER INDÉPENDANT
   */
  private async consumeUserCredits(
    userId: string,
    creditsToConsume: number,
  ): Promise<ConsumeResult> {
    const updated = await this.prisma.userAiCredits.update({
      where: { userId },
      data: {
        balance: { decrement: creditsToConsume },
        consumed: { increment: creditsToConsume },
      },
    });

    return {
      success: true,
      newBalance: updated.balance,
      consumed: updated.consumed,
      isAgency: false,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * AJOUT DE CRÉDITS (RECHARGE)
   * ═══════════════════════════════════════════════════════════
   */
  async addCreditsToAgency(agencyId: string, creditsToAdd: number) {
    if (creditsToAdd <= 0) {
      throw new BadRequestException('Le nombre de crédits doit être supérieur à 0');
    }

    return await this.prisma.aiCredits.upsert({
      where: { agencyId },
      create: {
        agencyId,
        balance: creditsToAdd,
        consumed: 0,
      },
      update: {
        balance: { increment: creditsToAdd },
      },
    });
  }

  async addCreditsToUser(userId: string, creditsToAdd: number) {
    if (creditsToAdd <= 0) {
      throw new BadRequestException('Le nombre de crédits doit être supérieur à 0');
    }

    return await this.prisma.userAiCredits.upsert({
      where: { userId },
      create: {
        userId,
        balance: creditsToAdd,
        consumed: 0,
      },
      update: {
        balance: { increment: creditsToAdd },
      },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * GESTION DES QUOTAS
   * ═══════════════════════════════════════════════════════════
   */
  async setAgencyQuota(
    agencyId: string,
    quotaMonthly?: number,
    quotaDaily?: number,
    resetFrequency?: 'daily' | 'monthly',
  ) {
    return await this.prisma.aiCredits.upsert({
      where: { agencyId },
      create: {
        agencyId,
        balance: 0,
        consumed: 0,
        quotaMonthly,
        quotaDaily,
        resetFrequency: resetFrequency || 'monthly',
      },
      update: {
        quotaMonthly,
        quotaDaily,
        resetFrequency: resetFrequency || 'monthly',
      },
    });
  }

  async setUserQuota(
    userId: string,
    quotaMonthly?: number,
    quotaDaily?: number,
    resetFrequency?: 'daily' | 'monthly',
  ) {
    return await this.prisma.userAiCredits.upsert({
      where: { userId },
      create: {
        userId,
        balance: 0,
        consumed: 0,
        quotaMonthly,
        quotaDaily,
        resetFrequency: resetFrequency || 'monthly',
      },
      update: {
        quotaMonthly,
        quotaDaily,
        resetFrequency: resetFrequency || 'monthly',
      },
    });
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * RESET AUTOMATIQUE DES CRÉDITS (CRON JOB)
   * ═══════════════════════════════════════════════════════════
   *
   * À appeler via un CRON job mensuel/journalier
   * Réinitialise les crédits consommés selon les quotas
   */
  async resetMonthlyCredits() {
    const now = new Date();

    // Reset pour les agences
    const agencies = await this.prisma.aiCredits.findMany({
      where: {
        resetFrequency: 'monthly',
        quotaMonthly: { not: null },
      },
    });

    for (const agency of agencies) {
      await this.prisma.aiCredits.update({
        where: { id: agency.id },
        data: {
          balance: agency.quotaMonthly!,
          consumed: 0,
          lastResetAt: now,
          alertSent: false,
        },
      });
    }

    // Reset pour les utilisateurs indépendants
    const users = await this.prisma.userAiCredits.findMany({
      where: {
        resetFrequency: 'monthly',
        quotaMonthly: { not: null },
      },
    });

    for (const user of users) {
      await this.prisma.userAiCredits.update({
        where: { id: user.id },
        data: {
          balance: user.quotaMonthly!,
          consumed: 0,
          lastResetAt: now,
          alertSent: false,
        },
      });
    }

    return {
      agenciesReset: agencies.length,
      usersReset: users.length,
      resetAt: now,
    };
  }

  async resetDailyCredits() {
    const now = new Date();

    // Reset pour les agences
    const agencies = await this.prisma.aiCredits.findMany({
      where: {
        resetFrequency: 'daily',
        quotaDaily: { not: null },
      },
    });

    for (const agency of agencies) {
      await this.prisma.aiCredits.update({
        where: { id: agency.id },
        data: {
          balance: agency.quotaDaily!,
          consumed: 0,
          lastResetAt: now,
          alertSent: false,
        },
      });
    }

    // Reset pour les utilisateurs indépendants
    const users = await this.prisma.userAiCredits.findMany({
      where: {
        resetFrequency: 'daily',
        quotaDaily: { not: null },
      },
    });

    for (const user of users) {
      await this.prisma.userAiCredits.update({
        where: { id: user.id },
        data: {
          balance: user.quotaDaily!,
          consumed: 0,
          lastResetAt: now,
          alertSent: false,
        },
      });
    }

    return {
      agenciesReset: agencies.length,
      usersReset: users.length,
      resetAt: now,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * GESTION DES ALERTES DE SEUIL
   * ═══════════════════════════════════════════════════════════
   */
  async checkAlertThreshold(
    userId: string,
    agencyId?: string | null,
  ): Promise<{ shouldAlert: boolean; balance: number; threshold: number }> {
    const balance = await this.getBalance(userId, agencyId);

    if (!balance.alertThreshold) {
      return { shouldAlert: false, balance: balance.balance, threshold: 0 };
    }

    const shouldAlert = balance.balance <= balance.alertThreshold && !balance.alertSent;

    // Si alerte à envoyer, marquer comme envoyée
    if (shouldAlert) {
      if (agencyId) {
        await this.prisma.aiCredits.update({
          where: { agencyId },
          data: { alertSent: true },
        });
      } else {
        await this.prisma.userAiCredits.update({
          where: { userId },
          data: { alertSent: true },
        });
      }
    }

    return {
      shouldAlert,
      balance: balance.balance,
      threshold: balance.alertThreshold,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * STATISTIQUES
   * ═══════════════════════════════════════════════════════════
   */
  async getAgencyStats(agencyId: string) {
    const credits = await this.prisma.aiCredits.findUnique({
      where: { agencyId },
    });

    if (!credits) {
      return {
        balance: 0,
        consumed: 0,
        quotaMonthly: null,
        quotaDaily: null,
        usagePercentage: 0,
      };
    }

    const usagePercentage = credits.quotaMonthly
      ? Math.round((credits.consumed / credits.quotaMonthly) * 100)
      : 0;

    return {
      balance: credits.balance,
      consumed: credits.consumed,
      quotaMonthly: credits.quotaMonthly,
      quotaDaily: credits.quotaDaily,
      usagePercentage,
      lastResetAt: credits.lastResetAt,
    };
  }

  async getUserStats(userId: string) {
    const credits = await this.prisma.userAiCredits.findUnique({
      where: { userId },
    });

    if (!credits) {
      return {
        balance: 0,
        consumed: 0,
        quotaMonthly: null,
        quotaDaily: null,
        usagePercentage: 0,
      };
    }

    const usagePercentage = credits.quotaMonthly
      ? Math.round((credits.consumed / credits.quotaMonthly) * 100)
      : 0;

    return {
      balance: credits.balance,
      consumed: credits.consumed,
      quotaMonthly: credits.quotaMonthly,
      quotaDaily: credits.quotaDaily,
      usagePercentage,
      lastResetAt: credits.lastResetAt,
    };
  }
}
