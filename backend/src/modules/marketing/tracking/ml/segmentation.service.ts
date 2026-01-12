import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AudienceSegment } from '../dto';

/**
 * Service de segmentation d'audience
 */
@Injectable()
export class SegmentationService {
  constructor(private readonly prisma: PrismaService) {}

  async identifySegments(userId: string): Promise<AudienceSegment[]> {
    const segments: AudienceSegment[] = [];

    try {
      // Récupérer tous les prospects avec leurs événements
      const prospects = await this.prisma.prospects.findMany({
        where: { userId },
        take: 1000,
      });

      // Récupérer les événements des 30 derniers jours
      const recentEvents = await this.prisma.trackingEvents.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      });

      // Créer un mapping prospectId -> événements
      const eventsByProspect = new Map<string, any[]>();
      recentEvents.forEach(event => {
        if (event.prospectId) {
          if (!eventsByProspect.has(event.prospectId)) {
            eventsByProspect.set(event.prospectId, []);
          }
          eventsByProspect.get(event.prospectId)?.push(event);
        }
      });

      // Segment 1: Prospects très engagés
      const highlyEngagedIds = new Set<string>();
      eventsByProspect.forEach((events, prospectId) => {
        if (events.length >= 10) {
          highlyEngagedIds.add(prospectId);
        }
      });

      if (highlyEngagedIds.size > 0) {
        segments.push({
          id: `segment-engaged-${Date.now()}`,
          name: 'Prospects Très Engagés',
          description: '10+ événements dans les 30 derniers jours',
          criteria: {
            minEvents: 10,
            period: '30days',
          },
          size: highlyEngagedIds.size,
          characteristics: [
            'Interactions fréquentes',
            'Potentiel de conversion élevé',
            'Intérêt confirmé',
          ],
          recommendedActions: [
            'Contacter directement',
            'Proposer une visite personnalisée',
            'Envoyer des offres premium',
          ],
        });
      }

      // Segment 2: Prospects inactifs (pas d'événements récents)
      const inactiveProspects = prospects.filter(
        p => !eventsByProspect.has(p.id)
      );

      if (inactiveProspects.length > 0) {
        segments.push({
          id: `segment-inactive-${Date.now()}`,
          name: 'Prospects Inactifs',
          description: 'Aucun événement dans les 30 derniers jours',
          criteria: {
            maxEvents: 0,
            period: '30days',
          },
          size: inactiveProspects.length,
          characteristics: [
            'Pas d\'interaction récente',
            'Risque de désengagement',
            'Nécessite réactivation',
          ],
          recommendedActions: [
            'Campagne de réengagement',
            'Offres spéciales limitées',
            'Enquête de satisfaction',
          ],
        });
      }

      // Segment 3: Prospects avec intentions d'achat (événements de conversion)
      const buyerIntentIds = new Set<string>();
      eventsByProspect.forEach((events, prospectId) => {
        const hasIntent = events.some(e => 
          e.eventName === 'AddToCart' || 
          e.eventName === 'InitiateCheckout' ||
          e.eventName === 'ViewContent'
        );
        if (hasIntent) {
          buyerIntentIds.add(prospectId);
        }
      });

      if (buyerIntentIds.size > 0) {
        segments.push({
          id: `segment-buyer-intent-${Date.now()}`,
          name: 'Intention d\'Achat',
          description: 'Signaux d\'intention d\'achat détectés',
          criteria: {
            eventTypes: ['AddToCart', 'InitiateCheckout', 'ViewContent'],
            period: '30days',
          },
          size: buyerIntentIds.size,
          characteristics: [
            'Intérêt actif pour les biens',
            'Consultation de propriétés',
            'Forte probabilité de conversion',
          ],
          recommendedActions: [
            'Contact prioritaire',
            'Proposer des biens similaires',
            'Organiser des visites',
          ],
        });
      }

      // Segment 4: Nouveaux visiteurs (< 3 événements)
      const newVisitorIds = new Set<string>();
      eventsByProspect.forEach((events, prospectId) => {
        if (events.length > 0 && events.length < 3) {
          newVisitorIds.add(prospectId);
        }
      });

      if (newVisitorIds.size > 0) {
        segments.push({
          id: `segment-new-${Date.now()}`,
          name: 'Nouveaux Visiteurs',
          description: '1-2 événements dans les 30 derniers jours',
          criteria: {
            minEvents: 1,
            maxEvents: 2,
            period: '30days',
          },
          size: newVisitorIds.size,
          characteristics: [
            'Premier contact récent',
            'En phase de découverte',
            'Potentiel à développer',
          ],
          recommendedActions: [
            'Campagne de bienvenue',
            'Contenu éducatif',
            'Faciliter la prise de contact',
          ],
        });
      }

    } catch (error) {
      console.error('Error identifying segments:', error);
    }

    return segments;
  }
}
