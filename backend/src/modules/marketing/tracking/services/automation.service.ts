import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AutomationMode, AISuggestion, TrackingPlatform } from '../dto';

/**
 * Service d'automatisation IA
 */
@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(userId: string) {
    return this.prisma.mlConfig.findUnique({
      where: { userId },
    });
  }

  async updateConfig(userId: string, data: any) {
    return this.prisma.mlConfig.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        mode: data.mode || AutomationMode.SUGGESTION,
        enableConversionPrediction: data.enableConversionPrediction ?? true,
        enableAnomalyDetection: data.enableAnomalyDetection ?? true,
        enableAutoSegmentation: data.enableAutoSegmentation ?? true,
        enableSmartAttribution: data.enableSmartAttribution ?? true,
      },
    });
  }

  async generateSuggestions(userId: string): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    try {
      // Récupérer la configuration ML de l'utilisateur
      const mlConfig = await this.prisma.mlConfig.findUnique({
        where: { userId },
      });

      if (!mlConfig || mlConfig.mode === AutomationMode.SUGGESTION) {
        // En mode suggestion, on ne génère pas de suggestions automatiques
        return [];
      }

      // Récupérer les configurations de tracking
      const trackingConfigs = await this.prisma.trackingConfig.findMany({
        where: { userId },
      });

      // Récupérer les événements récents pour analyse
      const recentEvents = await this.prisma.trackingEvents.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 5000,
      });

      // Analyser les performances par plateforme
      const platformStats = this.calculatePlatformStats(recentEvents);

      // Générer des suggestions basées sur l'analyse
      for (const [platform, stats] of Object.entries(platformStats)) {
        // Suggestion 1: Augmenter le budget si forte performance
        if (stats.conversionRate > 0.05 && stats.eventCount > 100) {
          // Valider que la plateforme est un TrackingPlatform valide
          const validPlatform = Object.values(TrackingPlatform).includes(platform as TrackingPlatform) 
            ? (platform as TrackingPlatform) 
            : TrackingPlatform.FACEBOOK;
            
          suggestions.push({
            id: `suggestion-budget-inc-${Date.now()}-${platform}`,
            type: 'budget',
            platform: validPlatform,
            currentValue: stats.budget || 0,
            suggestedValue: (stats.budget || 0) * 1.2,
            expectedImpact: {
              metric: 'conversions',
              change: 20,
            },
            confidence: 0.85,
            reasoning: `Taux de conversion élevé (${(stats.conversionRate * 100).toFixed(2)}%) sur ${platform}. Augmenter le budget pourrait améliorer les résultats.`,
            status: 'pending',
            createdAt: new Date(),
          });
        }

        // Suggestion 2: Réduire le budget si faible performance
        if (stats.conversionRate < 0.01 && stats.eventCount > 50) {
          const validPlatform = Object.values(TrackingPlatform).includes(platform as TrackingPlatform) 
            ? (platform as TrackingPlatform) 
            : TrackingPlatform.FACEBOOK;
            
          suggestions.push({
            id: `suggestion-budget-dec-${Date.now()}-${platform}`,
            type: 'budget',
            platform: validPlatform,
            currentValue: stats.budget || 0,
            suggestedValue: (stats.budget || 0) * 0.8,
            expectedImpact: {
              metric: 'cost_efficiency',
              change: 20,
            },
            confidence: 0.75,
            reasoning: `Taux de conversion faible (${(stats.conversionRate * 100).toFixed(2)}%) sur ${platform}. Réduire le budget et optimiser la stratégie.`,
            status: 'pending',
            createdAt: new Date(),
          });
        }

        // Suggestion 3: Changer l'audience si mauvais engagement
        if (stats.avgTimeOnPage < 30 && stats.eventCount > 100) {
          const validPlatform = Object.values(TrackingPlatform).includes(platform as TrackingPlatform) 
            ? (platform as TrackingPlatform) 
            : TrackingPlatform.FACEBOOK;
            
          suggestions.push({
            id: `suggestion-targeting-${Date.now()}-${platform}`,
            type: 'targeting',
            platform: validPlatform,
            currentValue: 'Current audience',
            suggestedValue: 'Refined targeting',
            expectedImpact: {
              metric: 'engagement',
              change: 30,
            },
            confidence: 0.7,
            reasoning: `Temps de visite moyen très faible (${stats.avgTimeOnPage}s) sur ${platform}. Affiner le ciblage de l'audience.`,
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }

      // Suggestion 4: Activer de nouvelles plateformes si sous-utilisé
      const activePlatforms = trackingConfigs.filter(c => c.isActive).length;
      if (activePlatforms < 3) {
        // Trouver une plateforme inactive à suggérer
        const allPlatforms = Object.values(TrackingPlatform);
        const activePlatformNames = trackingConfigs
          .filter(c => c.isActive)
          .map(c => c.platform);
        
        const inactivePlatforms = allPlatforms.filter(
          p => !activePlatformNames.includes(p)
        );

        if (inactivePlatforms.length > 0) {
          // Prioriser TikTok et LinkedIn pour l'immobilier
          const suggestedPlatform = inactivePlatforms.find(p => 
            p === TrackingPlatform.TIKTOK || p === TrackingPlatform.LINKEDIN
          ) || inactivePlatforms[0];

          suggestions.push({
            id: `suggestion-platform-${Date.now()}`,
            type: 'targeting',
            platform: suggestedPlatform,
            currentValue: 0,
            suggestedValue: 1,
            expectedImpact: {
              metric: 'reach',
              change: 50,
            },
            confidence: 0.65,
            reasoning: `Seulement ${activePlatforms} plateformes actives. ${suggestedPlatform} peut apporter un nouveau public.`,
            status: 'pending',
            createdAt: new Date(),
          });
        }
      }

    } catch (error) {
      console.error('Error generating suggestions:', error);
    }

    return suggestions;
  }

  async applyAutomation(userId: string) {
    try {
      const mlConfig = await this.prisma.mlConfig.findUnique({
        where: { userId },
      });

      if (!mlConfig || mlConfig.mode !== AutomationMode.FULL_AUTO) {
        return {
          success: false,
          message: 'Full automation mode not enabled',
        };
      }

      const suggestions = await this.generateSuggestions(userId);
      const appliedActions = [];

      for (const suggestion of suggestions) {
        // Appliquer les suggestions avec forte confiance
        if (suggestion.confidence >= (mlConfig.minConfidenceScore || 0.8)) {
          // Simuler l'application de l'action
          appliedActions.push({
            type: suggestion.type,
            platform: suggestion.platform,
            applied: true,
          });

          // Dans une vraie implémentation, on appellerait les APIs des plateformes ici
          console.log(`Applied automation: ${suggestion.type} on ${suggestion.platform}`);
        }
      }

      return {
        success: true,
        message: `Applied ${appliedActions.length} automation actions`,
        actions: appliedActions,
      };
    } catch (error) {
      console.error('Error applying automation:', error);
      return {
        success: false,
        message: 'Error applying automation',
        error: error.message,
      };
    }
  }

  private calculatePlatformStats(events: any[]) {
    const statsByPlatform: Record<string, any> = {};

    events.forEach(event => {
      const platform = event.platform || 'unknown';
      
      if (!statsByPlatform[platform]) {
        statsByPlatform[platform] = {
          eventCount: 0,
          conversionCount: 0,
          totalTimeOnPage: 0,
          budget: 0,
        };
      }

      statsByPlatform[platform].eventCount++;
      
      if (event.eventName === 'Purchase' || event.eventName === 'Lead') {
        statsByPlatform[platform].conversionCount++;
      }

      if (event.data?.timeOnPage) {
        statsByPlatform[platform].totalTimeOnPage += event.data.timeOnPage;
      }
    });

    // Calculer les statistiques finales
    Object.keys(statsByPlatform).forEach(platform => {
      const stats = statsByPlatform[platform];
      stats.conversionRate = stats.conversionCount / stats.eventCount;
      stats.avgTimeOnPage = stats.totalTimeOnPage / stats.eventCount;
    });

    return statsByPlatform;
  }
}
