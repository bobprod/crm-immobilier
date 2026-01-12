import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { AutomationMode, AISuggestion } from '../dto';

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
          suggestions.push({
            type: 'budget_increase',
            platform: platform as any,
            currentValue: stats.budget || 0,
            suggestedValue: (stats.budget || 0) * 1.2,
            reasoning: `Taux de conversion élevé (${(stats.conversionRate * 100).toFixed(2)}%) sur ${platform}. Augmenter le budget pourrait améliorer les résultats.`,
            confidence: 0.85,
            potentialImpact: 'high',
            estimatedImprovement: '+20% conversions',
          });
        }

        // Suggestion 2: Réduire le budget si faible performance
        if (stats.conversionRate < 0.01 && stats.eventCount > 50) {
          suggestions.push({
            type: 'budget_decrease',
            platform: platform as any,
            currentValue: stats.budget || 0,
            suggestedValue: (stats.budget || 0) * 0.8,
            reasoning: `Taux de conversion faible (${(stats.conversionRate * 100).toFixed(2)}%) sur ${platform}. Réduire le budget et optimiser la stratégie.`,
            confidence: 0.75,
            potentialImpact: 'medium',
            estimatedImprovement: 'Économie budget',
          });
        }

        // Suggestion 3: Changer l'audience si mauvais engagement
        if (stats.avgTimeOnPage < 30 && stats.eventCount > 100) {
          suggestions.push({
            type: 'audience_change',
            platform: platform as any,
            currentValue: 'Current audience',
            suggestedValue: 'Refined targeting',
            reasoning: `Temps de visite moyen très faible (${stats.avgTimeOnPage}s) sur ${platform}. Affiner le ciblage de l'audience.`,
            confidence: 0.7,
            potentialImpact: 'high',
            estimatedImprovement: '+30% engagement',
          });
        }
      }

      // Suggestion 4: Activer de nouvelles plateformes si sous-utilisé
      const activePlatforms = trackingConfigs.filter(c => c.isActive).length;
      if (activePlatforms < 3) {
        suggestions.push({
          type: 'platform_activation',
          platform: 'tiktok',
          currentValue: 0,
          suggestedValue: 1,
          reasoning: 'Seulement ' + activePlatforms + ' plateformes actives. TikTok peut apporter un nouveau public.',
          confidence: 0.65,
          potentialImpact: 'medium',
          estimatedImprovement: 'Nouvelle audience',
        });
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
