import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AttributionModel } from '../dto';

/**
 * Service d'attribution multi-touch
 */
@Injectable()
export class AttributionService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateAttribution(
    userId: string,
    prospectId: string,
    model: 'last_click' | 'first_click' | 'linear' | 'time_decay' | 'shapley' | 'markov' = 'linear',
  ): Promise<AttributionModel | null> {
    try {
      // Récupérer tous les événements du prospect triés par date
      const events = await this.prisma.trackingEvents.findMany({
        where: {
          userId,
          prospectId,
        },
        orderBy: { timestamp: 'asc' },
      });

      if (events.length === 0) {
        return null;
      }

      // Identifier les points de contact (touchpoints)
      const touchpoints = events.map(event => ({
        platform: event.platform,
        eventName: event.eventName,
        timestamp: event.timestamp,
        source: event.source || 'direct',
        medium: event.medium || 'none',
        campaign: event.campaign || 'organic',
      }));

      // Calculer l'attribution selon le modèle choisi
      const attribution = this.calculateAttributionWeights(touchpoints, model);

      // Calculer le crédit total pour normaliser
      const totalCredit = attribution.reduce((sum, weight) => sum + weight, 0);

      return {
        touchpoints: touchpoints.map((tp, index) => ({
          channel: tp.source,
          platform: tp.platform,
          timestamp: tp.timestamp,
          credit: totalCredit > 0 ? attribution[index] / totalCredit : 0,
        })),
        totalValue: 1.0, // Valeur normalisée
        conversionTime: touchpoints[touchpoints.length - 1]?.timestamp || new Date(),
        model,
      };

    } catch (error) {
      console.error('Error calculating attribution:', error);
      return null;
    }
  }

  private calculateAttributionWeights(
    touchpoints: any[],
    model: string
  ): number[] {
    const count = touchpoints.length;
    
    if (count === 0) return [];
    if (count === 1) return [1.0];

    switch (model) {
      case 'last_click':
        // 100% au dernier point de contact
        return touchpoints.map((_, i) => i === count - 1 ? 1.0 : 0);

      case 'first_click':
        // 100% au premier point de contact
        return touchpoints.map((_, i) => i === 0 ? 1.0 : 0);

      case 'linear':
        // Distribution égale sur tous les points
        const linearWeight = 1.0 / count;
        return touchpoints.map(() => linearWeight);

      case 'time_decay':
        // Plus de poids aux points de contact récents
        const totalWeight = count * (count + 1) / 2;
        return touchpoints.map((_, i) => (i + 1) / totalWeight);

      case 'shapley':
      case 'markov':
        // Approximation simple pour modèles complexes
        // Dans une vraie implémentation, il faudrait des calculs plus sophistiqués
        const weights = touchpoints.map((_, i) => {
          if (i === 0) return 0.3; // Premier contact
          if (i === count - 1) return 0.4; // Dernier contact
          return 0.3 / (count - 2); // Contacts intermédiaires
        });
        return weights;

      default:
        return this.calculateAttributionWeights(touchpoints, 'linear');
    }
  }
}
