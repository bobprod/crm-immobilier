import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

/**
 * Service pour gérer les tests A/B de configurations de tracking pixels
 *
 * Permet de tester différentes configurations de pixels pour optimiser
 * les performances et la conversion.
 */
@Injectable()
export class ABTestingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer un test A/B
   */
  async createABTest(
    userId: string,
    data: {
      name: string;
      description?: string;
      variantA: any; // Configuration tracking variante A
      variantB: any; // Configuration tracking variante B
      trafficSplit: number; // % pour variant A (0-100), le reste va à B
      duration: number; // Durée en jours
    },
  ) {
    const endDate = new Date();
    endDate.setDate(endDate.setDate(endDate.getDate() + data.duration));

    return this.prisma.trackingABTest.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        variantAConfig: data.variantA,
        variantBConfig: data.variantB,
        trafficSplit: data.trafficSplit,
        startDate: new Date(),
        endDate,
        status: 'running',
      },
    });
  }

  /**
   * Obtenir la variante pour un utilisateur (attribution cohérente)
   */
  async getVariantForSession(testId: string, sessionId: string): Promise<'A' | 'B'> {
    // Utiliser le hash du sessionId pour attribution déterministe
    const hash = this.hashString(sessionId);
    const test = await this.prisma.trackingABTest.findUnique({
      where: { id: testId },
    });

    if (!test) throw new Error('Test not found');

    // Attribution basée sur le hash
    const variant = hash % 100 < test.trafficSplit ? 'A' : 'B';

    // Enregistrer l'attribution
    await this.prisma.trackingABTestAssignment.upsert({
      where: {
        testId_sessionId: {
          testId,
          sessionId,
        },
      },
      create: {
        testId,
        sessionId,
        variant,
      },
      update: {},
    });

    return variant;
  }

  /**
   * Enregistrer un résultat de conversion pour un test
   */
  async recordConversion(
    testId: string,
    sessionId: string,
    eventName: string,
    value?: number,
  ) {
    const assignment = await this.prisma.trackingABTestAssignment.findUnique({
      where: {
        testId_sessionId: {
          testId,
          sessionId,
        },
      },
    });

    if (!assignment) {
      throw new Error('No assignment found for this session');
    }

    return this.prisma.trackingABTestResult.create({
      data: {
        testId,
        sessionId,
        variant: assignment.variant,
        eventName,
        value,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Obtenir les statistiques d'un test A/B
   */
  async getTestStats(testId: string) {
    const [test, variantAResults, variantBResults, variantAConversions, variantBConversions] =
      await Promise.all([
        this.prisma.trackingABTest.findUnique({ where: { id: testId } }),
        this.prisma.trackingABTestResult.count({
          where: { testId, variant: 'A' },
        }),
        this.prisma.trackingABTestResult.count({
          where: { testId, variant: 'B' },
        }),
        this.prisma.trackingABTestResult.count({
          where: {
            testId,
            variant: 'A',
            eventName: { in: ['Lead', 'Purchase', 'CompleteRegistration'] },
          },
        }),
        this.prisma.trackingABTestResult.count({
          where: {
            testId,
            variant: 'B',
            eventName: { in: ['Lead', 'Purchase', 'CompleteRegistration'] },
          },
        }),
      ]);

    const variantAConversionRate =
      variantAResults > 0 ? (variantAConversions / variantAResults) * 100 : 0;
    const variantBConversionRate =
      variantBResults > 0 ? (variantBConversions / variantBResults) * 100 : 0;

    // Test de signification statistique (Z-test simplifié)
    const pooledRate = (variantAConversions + variantBConversions) / (variantAResults + variantBResults);
    const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / variantAResults + 1 / variantBResults));
    const zScore = (variantAConversionRate / 100 - variantBConversionRate / 100) / se;
    const isSignificant = Math.abs(zScore) > 1.96; // p < 0.05

    return {
      test,
      variantA: {
        totalEvents: variantAResults,
        conversions: variantAConversions,
        conversionRate: variantAConversionRate.toFixed(2),
      },
      variantB: {
        totalEvents: variantBResults,
        conversions: variantBConversions,
        conversionRate: variantBConversionRate.toFixed(2),
      },
      winner: variantAConversionRate > variantBConversionRate ? 'A' : 'B',
      improvementPercentage: Math.abs(variantAConversionRate - variantBConversionRate).toFixed(2),
      isStatisticallySignificant: isSignificant,
      zScore: zScore.toFixed(2),
    };
  }

  /**
   * Arrêter un test A/B
   */
  async stopTest(testId: string) {
    return this.prisma.trackingABTest.update({
      where: { id: testId },
      data: { status: 'stopped', endDate: new Date() },
    });
  }

  /**
   * Liste tous les tests A/B d'un utilisateur
   */
  async getUserTests(userId: string) {
    return this.prisma.trackingABTest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
