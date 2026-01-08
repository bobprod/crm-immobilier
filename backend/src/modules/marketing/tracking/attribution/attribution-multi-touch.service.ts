import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';

export type AttributionModel =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'data_driven';

export interface TouchPoint {
  platform: string;
  eventName: string;
  timestamp: Date;
  sessionId: string;
}

export interface AttributionResult {
  platform: string;
  credit: number; // 0-100
  touchpoints: number;
}

/**
 * Service pour l'attribution multi-touch
 *
 * Analyse le parcours complet du lead depuis le premier contact
 * jusqu'à la conversion et attribue le crédit à chaque point de contact
 * selon différents modèles d'attribution.
 */
@Injectable()
export class AttributionMultiTouchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculer l'attribution pour une conversion
   */
  async calculateAttribution(
    userId: string,
    sessionId: string,
    model: AttributionModel = 'linear',
  ): Promise<AttributionResult[]> {
    // Récupérer tous les événements du parcours
    const journey = await this.getUserJourney(userId, sessionId);

    if (journey.length === 0) {
      return [];
    }

    // Appliquer le modèle d'attribution
    switch (model) {
      case 'first_touch':
        return this.firstTouchAttribution(journey);
      case 'last_touch':
        return this.lastTouchAttribution(journey);
      case 'linear':
        return this.linearAttribution(journey);
      case 'time_decay':
        return this.timeDecayAttribution(journey);
      case 'position_based':
        return this.positionBasedAttribution(journey);
      case 'data_driven':
        return this.dataDrivenAttribution(journey);
      default:
        return this.linearAttribution(journey);
    }
  }

  /**
   * Récupérer le parcours utilisateur complet
   */
  private async getUserJourney(userId: string, sessionId: string): Promise<TouchPoint[]> {
    const events = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        OR: [
          { sessionId },
          // Inclure aussi les sessions précédentes du même utilisateur
          // (basé sur un identifiant persistant comme email, userId, etc.)
        ],
      },
      orderBy: {
        timestamp: 'asc',
      },
      select: {
        platform: true,
        eventName: true,
        timestamp: true,
        sessionId: true,
      },
    });

    return events;
  }

  /**
   * First Touch Attribution: 100% de crédit au premier point de contact
   */
  private firstTouchAttribution(journey: TouchPoint[]): AttributionResult[] {
    if (journey.length === 0) return [];

    const firstTouch = journey[0];

    return [
      {
        platform: firstTouch.platform,
        credit: 100,
        touchpoints: 1,
      },
    ];
  }

  /**
   * Last Touch Attribution: 100% de crédit au dernier point de contact
   */
  private lastTouchAttribution(journey: TouchPoint[]): AttributionResult[] {
    if (journey.length === 0) return [];

    const lastTouch = journey[journey.length - 1];

    return [
      {
        platform: lastTouch.platform,
        credit: 100,
        touchpoints: 1,
      },
    ];
  }

  /**
   * Linear Attribution: Crédit égal à tous les points de contact
   */
  private linearAttribution(journey: TouchPoint[]): AttributionResult[] {
    if (journey.length === 0) return [];

    const platformTouches = new Map<string, number>();

    journey.forEach((touch) => {
      platformTouches.set(touch.platform, (platformTouches.get(touch.platform) || 0) + 1);
    });

    const creditPerTouch = 100 / journey.length;

    return Array.from(platformTouches.entries()).map(([platform, touchpoints]) => ({
      platform,
      credit: creditPerTouch * touchpoints,
      touchpoints,
    }));
  }

  /**
   * Time Decay Attribution: Plus de crédit aux interactions récentes
   * Décroissance exponentielle avec demi-vie de 7 jours
   */
  private timeDecayAttribution(journey: TouchPoint[]): AttributionResult[] {
    if (journey.length === 0) return [];

    const conversionTime = journey[journey.length - 1].timestamp.getTime();
    const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 jours en ms

    // Calculer les poids avec décroissance exponentielle
    const weights = journey.map((touch) => {
      const timeDiff = conversionTime - touch.timestamp.getTime();
      return Math.pow(2, -timeDiff / halfLife);
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);

    const platformCredits = new Map<string, { credit: number; touchpoints: number }>();

    journey.forEach((touch, index) => {
      const credit = (weights[index] / totalWeight) * 100;
      const existing = platformCredits.get(touch.platform) || { credit: 0, touchpoints: 0 };

      platformCredits.set(touch.platform, {
        credit: existing.credit + credit,
        touchpoints: existing.touchpoints + 1,
      });
    });

    return Array.from(platformCredits.entries()).map(([platform, data]) => ({
      platform,
      credit: data.credit,
      touchpoints: data.touchpoints,
    }));
  }

  /**
   * Position-Based Attribution (U-Shaped):
   * 40% premier, 40% dernier, 20% réparti sur le milieu
   */
  private positionBasedAttribution(journey: TouchPoint[]): AttributionResult[] {
    if (journey.length === 0) return [];

    if (journey.length === 1) {
      return [
        {
          platform: journey[0].platform,
          credit: 100,
          touchpoints: 1,
        },
      ];
    }

    const platformCredits = new Map<string, { credit: number; touchpoints: number }>();

    // Premier touch: 40%
    const firstPlatform = journey[0].platform;
    platformCredits.set(firstPlatform, {
      credit: 40,
      touchpoints: 1,
    });

    // Dernier touch: 40%
    const lastPlatform = journey[journey.length - 1].platform;
    const lastCredit = platformCredits.get(lastPlatform) || { credit: 0, touchpoints: 0 };
    platformCredits.set(lastPlatform, {
      credit: lastCredit.credit + 40,
      touchpoints: lastCredit.touchpoints + 1,
    });

    // Milieu: 20% réparti
    if (journey.length > 2) {
      const middleTouches = journey.slice(1, -1);
      const creditPerMiddle = 20 / middleTouches.length;

      middleTouches.forEach((touch) => {
        const existing = platformCredits.get(touch.platform) || { credit: 0, touchpoints: 0 };
        platformCredits.set(touch.platform, {
          credit: existing.credit + creditPerMiddle,
          touchpoints: existing.touchpoints + 1,
        });
      });
    }

    return Array.from(platformCredits.entries()).map(([platform, data]) => ({
      platform,
      credit: data.credit,
      touchpoints: data.touchpoints,
    }));
  }

  /**
   * Data-Driven Attribution: Basé sur les données de conversion
   * Utilise un modèle de Markov pour calculer la contribution réelle
   */
  private dataDrivenAttribution(journey: TouchPoint[]): AttributionResult[] {
    // Implémentation simplifiée - idéalement utiliser un vrai modèle ML
    // Pour l'instant, on fait une approximation basée sur les taux de conversion

    // Fallback sur linear pour cette version simplifiée
    return this.linearAttribution(journey);
  }

  /**
   * Comparer tous les modèles d'attribution
   */
  async compareAttributionModels(userId: string, sessionId: string) {
    const models: AttributionModel[] = [
      'first_touch',
      'last_touch',
      'linear',
      'time_decay',
      'position_based',
    ];

    const results = await Promise.all(
      models.map(async (model) => {
        const attribution = await this.calculateAttribution(userId, sessionId, model);
        return {
          model,
          attribution,
        };
      }),
    );

    return results;
  }

  /**
   * Obtenir le ROI par plateforme basé sur l'attribution
   */
  async getPlatformROI(userId: string, model: AttributionModel = 'linear') {
    // Récupérer toutes les conversions
    const conversions = await this.prisma.trackingEvent.findMany({
      where: {
        userId,
        eventName: { in: ['Lead', 'Purchase', 'CompleteRegistration'] },
      },
      select: {
        sessionId: true,
        data: true,
      },
    });

    const platformROI = new Map<string, { credit: number; value: number; touchpoints: number }>();

    for (const conversion of conversions) {
      const attribution = await this.calculateAttribution(userId, conversion.sessionId, model);
      const value = (conversion.data as any)?.value || 0;

      attribution.forEach((result) => {
        const existing = platformROI.get(result.platform) || {
          credit: 0,
          value: 0,
          touchpoints: 0,
        };

        platformROI.set(result.platform, {
          credit: existing.credit + result.credit,
          value: existing.value + (value * result.credit) / 100,
          touchpoints: existing.touchpoints + result.touchpoints,
        });
      });
    }

    return Array.from(platformROI.entries()).map(([platform, data]) => ({
      platform,
      totalCredit: data.credit,
      totalValue: data.value,
      touchpoints: data.touchpoints,
      averageValue: data.value / data.touchpoints,
    }));
  }
}
