import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingEvent, ConversionPrediction } from '../dto';

/**
 * Service de prédiction de conversion avec IA/ML
 */
@Injectable()
export class ConversionPredictionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Prédire probabilité de conversion
   */
  async predictConversion(
    userId: string,
    event: TrackingEvent,
  ): Promise<ConversionPrediction | null> {
    // TODO: Implémenter ML réel
    // Pour l'instant, retourne une prédiction simple basée sur des heuristiques

    const probability = this.calculateSimpleProbability(event);
    const confidence = 0.75;

    if (probability < 0.3) {
      return null; // Pas de prédiction si trop basse
    }

    return {
      prospectId: event.prospectId,
      sessionId: event.sessionId || '',
      probability,
      confidence,
      factors: [
        { name: 'pageViews', impact: 0.3, value: 'Multiple pages' },
        { name: 'timeOnSite', impact: 0.2, value: '> 2min' },
        { name: 'source', impact: 0.15, value: event.referrer },
      ],
      recommendation:
        probability > 0.7
          ? 'Forte probabilité de conversion - Contacter rapidement'
          : 'Probabilité moyenne - Nurturing recommandé',
      timestamp: new Date(),
    };
  }

  private calculateSimpleProbability(event: TrackingEvent): number {
    let score = 0.4; // Base score

    // Facteurs augmentant la probabilité
    if (event.eventName === 'ViewContent') score += 0.1;
    if (event.eventName === 'AddToCart') score += 0.2;
    if (event.data?.timeOnPage > 120) score += 0.15;
    if (event.referrer?.includes('google')) score += 0.1;

    return Math.min(score, 0.95);
  }
}
