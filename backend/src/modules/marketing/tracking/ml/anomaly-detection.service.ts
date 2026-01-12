import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { TrackingPlatform, DetectedAnomaly } from '../dto';

/**
 * Service de détection d'anomalies
 */
@Injectable()
export class AnomalyDetectionService {
  constructor(private readonly prisma: PrismaService) {}

  async detectAnomalies(userId: string, platform: TrackingPlatform): Promise<DetectedAnomaly[]> {
    const anomalies: DetectedAnomaly[] = [];

    try {
      // Récupérer les événements récents pour détecter les anomalies
      const recentEvents = await this.prisma.trackingEvents.findMany({
        where: {
          userId,
          platform,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 1000,
      });

      if (recentEvents.length === 0) {
        return [];
      }

      // Calculer des statistiques de base
      const stats = this.calculateStats(recentEvents);

      // Détecter les anomalies basées sur les statistiques
      
      // 1. Détection de baisse drastique du volume
      if (stats.hourlyRate < stats.avgHourlyRate * 0.3) {
        anomalies.push({
          id: `anomaly-volume-${Date.now()}`,
          type: 'volume_drop',
          severity: 'critical',
          platform,
          metric: 'event_rate',
          expectedValue: stats.avgHourlyRate,
          actualValue: stats.hourlyRate,
          description: `Baisse drastique du volume d'événements sur ${platform}`,
          recommendations: [
            'Vérifier que le pixel est toujours actif',
            'Vérifier les paramètres de configuration',
            'Consulter les logs du serveur',
          ],
          detectedAt: new Date(),
        });
      }

      // 2. Détection d'augmentation anormale (possible spam/bot)
      if (stats.hourlyRate > stats.avgHourlyRate * 3) {
        anomalies.push({
          id: `anomaly-spike-${Date.now()}`,
          type: 'unusual_spike',
          severity: 'high',
          platform,
          metric: 'event_rate',
          expectedValue: stats.avgHourlyRate,
          actualValue: stats.hourlyRate,
          description: `Pic anormal d'événements sur ${platform}`,
          recommendations: [
            'Vérifier les sources de trafic pour détecter du trafic bot',
            'Analyser les adresses IP sources',
            'Considérer activer le filtrage anti-bot',
          ],
          detectedAt: new Date(),
        });
      }

      // 3. Détection de taux de conversion anormalement bas
      if (stats.conversionRate < 0.01 && stats.totalEvents > 100) {
        anomalies.push({
          id: `anomaly-conversion-${Date.now()}`,
          type: 'low_conversion',
          severity: 'medium',
          platform,
          metric: 'conversion_rate',
          expectedValue: 0.02,
          actualValue: stats.conversionRate,
          description: 'Taux de conversion inférieur à la normale',
          recommendations: [
            'Analyser le parcours utilisateur',
            'Vérifier les points de friction',
            'Tester les appels à l\'action',
          ],
          detectedAt: new Date(),
        });
      }

    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }

    return anomalies;
  }

  private calculateStats(events: any[]) {
    const totalEvents = events.length;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Événements de la dernière heure
    const lastHourEvents = events.filter(
      e => new Date(e.timestamp).getTime() > now - 60 * 60 * 1000
    );

    // Événements de conversion
    const conversionEvents = events.filter(
      e => e.eventName === 'Purchase' || e.eventName === 'Lead' || e.eventName === 'CompleteRegistration'
    );

    return {
      totalEvents,
      hourlyRate: lastHourEvents.length,
      avgHourlyRate: totalEvents / 24,
      conversionRate: conversionEvents.length / totalEvents,
    };
  }
}
