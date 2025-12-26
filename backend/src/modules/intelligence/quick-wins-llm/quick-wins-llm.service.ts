import { Injectable, Logger } from '@nestjs/common';
import { LLMProviderFactory } from '../llm-config/providers/llm-provider.factory';
import { ApiCostTrackerService } from '../../../shared/services/api-cost-tracker.service';

/**
 * Service d'intégration LLM pour les modules Quick Wins
 * Utilise le LLM Router centralisé au lieu d'appels directs OpenAI
 */
@Injectable()
export class QuickWinsLLMService {
  private readonly logger = new Logger(QuickWinsLLMService.name);

  constructor(
    private readonly llmFactory: LLMProviderFactory,
    private readonly costTracker: ApiCostTrackerService,
  ) {}

  /**
   * Analyser une requête de recherche sémantique
   * Utilisé par: Semantic Search module
   */
  async analyzeSearchIntent(
    userId: string,
    query: string,
  ): Promise<{
    intent: string;
    keywords: string[];
    filters: any;
  }> {
    try {
      const provider = await this.llmFactory.createProvider(userId);

      const prompt = `Analyse cette requête de recherche immobilière et retourne un JSON avec:
- intent: le type de recherche (property/prospect/appointment)
- keywords: mots-clés principaux (array)
- filters: filtres suggérés (objet)

Requête: "${query}"

Réponds uniquement avec un JSON valide, sans explication.`;

      const startTime = Date.now();
      const response = await provider.generate(prompt, {
        maxTokens: 300,
        temperature: 0.3,
      });
      const duration = Date.now() - startTime;

      // Tracker les coûts
      await this.trackUsage(userId, 'semantic_search', query.length, response.length, duration);

      // Parser la réponse JSON
      try {
        const parsed = JSON.parse(response);
        return {
          intent: parsed.intent || 'property',
          keywords: parsed.keywords || [],
          filters: parsed.filters || {},
        };
      } catch (parseError) {
        this.logger.warn('Failed to parse LLM response, using fallback', parseError);
        return this.fallbackSearchIntent(query);
      }
    } catch (error) {
      this.logger.error('Error analyzing search intent with LLM', error);
      return this.fallbackSearchIntent(query);
    }
  }

  /**
   * Générer des insights pour un rapport
   * Utilisé par: Auto Reports module
   */
  async generateReportInsights(
    userId: string,
    stats: {
      newProspects: number;
      qualifiedProspects: number;
      newProperties: number;
      completedAppointments: number;
      totalAppointments: number;
      qualificationRate: number;
    },
    period: string,
  ): Promise<string[]> {
    try {
      const provider = await this.llmFactory.createProvider(userId);

      const prompt = `Tu es un analyste CRM immobilier. Génère 3-5 insights pertinents basés sur ces statistiques ${period}:

Statistiques:
- Nouveaux prospects: ${stats.newProspects}
- Prospects qualifiés: ${stats.qualifiedProspects}
- Taux de qualification: ${stats.qualificationRate}%
- Nouvelles propriétés: ${stats.newProperties}
- Rendez-vous complétés: ${stats.completedAppointments}/${stats.totalAppointments}

Retourne uniquement un array JSON de strings, chaque string étant un insight concis et actionnable.
Format: ["insight 1", "insight 2", "insight 3"]`;

      const startTime = Date.now();
      const response = await provider.generate(prompt, {
        maxTokens: 500,
        temperature: 0.7,
      });
      const duration = Date.now() - startTime;

      await this.trackUsage(userId, 'report_insights', prompt.length, response.length, duration);

      try {
        const insights = JSON.parse(response);
        return Array.isArray(insights) ? insights : [insights];
      } catch (parseError) {
        // Extract insights from text response
        const lines = response
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => line.replace(/^[-•*]\s*/, '').trim())
          .filter((line) => line.length > 20);
        return lines.slice(0, 5);
      }
    } catch (error) {
      this.logger.error('Error generating insights with LLM', error);
      return this.fallbackReportInsights(stats);
    }
  }

  /**
   * Générer des recommandations pour un rapport
   * Utilisé par: Auto Reports module
   */
  async generateRecommendations(
    userId: string,
    stats: any,
    insights: string[],
  ): Promise<string[]> {
    try {
      const provider = await this.llmFactory.createProvider(userId);

      const prompt = `Tu es un conseiller CRM immobilier. Génère 3-4 recommandations actionnables basées sur ces insights:

Insights:
${insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}

Statistiques:
- Nouveaux prospects: ${stats.newProspects}
- Taux de qualification: ${stats.qualificationRate}%
- Nouvelles propriétés: ${stats.newProperties}

Retourne uniquement un array JSON de recommendations actionnables.
Format: ["recommendation 1", "recommendation 2", "recommendation 3"]`;

      const startTime = Date.now();
      const response = await provider.generate(prompt, {
        maxTokens: 400,
        temperature: 0.7,
      });
      const duration = Date.now() - startTime;

      await this.trackUsage(
        userId,
        'report_recommendations',
        prompt.length,
        response.length,
        duration,
      );

      try {
        const recommendations = JSON.parse(response);
        return Array.isArray(recommendations) ? recommendations : [recommendations];
      } catch (parseError) {
        const lines = response
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => line.replace(/^[-•*]\s*/, '').trim())
          .filter((line) => line.length > 20);
        return lines.slice(0, 4);
      }
    } catch (error) {
      this.logger.error('Error generating recommendations with LLM', error);
      return this.fallbackRecommendations(stats);
    }
  }

  /**
   * Analyser l'urgence d'un prospect
   * Utilisé par: Priority Inbox module
   */
  async analyzeProspectUrgency(
    userId: string,
    prospect: {
      notes?: string;
      budget?: number;
      status?: string;
      createdAt: Date;
    },
  ): Promise<{
    urgencyScore: number;
    reasons: string[];
  }> {
    try {
      const provider = await this.llmFactory.createProvider(userId);

      const prompt = `Analyse l'urgence de ce prospect immobilier et retourne un JSON avec:
- urgencyScore: score de 0 à 100
- reasons: array de raisons justifiant le score

Prospect:
- Notes: "${prospect.notes || 'Aucune'}"
- Budget: ${prospect.budget || 'Non spécifié'}
- Statut: ${prospect.status || 'nouveau'}
- Créé: ${Math.floor((Date.now() - prospect.createdAt.getTime()) / (1000 * 60 * 60 * 24))} jours

Réponds uniquement avec un JSON valide.`;

      const startTime = Date.now();
      const response = await provider.generate(prompt, {
        maxTokens: 200,
        temperature: 0.3,
      });
      const duration = Date.now() - startTime;

      await this.trackUsage(userId, 'urgency_analysis', prompt.length, response.length, duration);

      try {
        const parsed = JSON.parse(response);
        return {
          urgencyScore: parsed.urgencyScore || 50,
          reasons: parsed.reasons || [],
        };
      } catch (parseError) {
        return { urgencyScore: 50, reasons: [] };
      }
    } catch (error) {
      this.logger.error('Error analyzing urgency with LLM', error);
      return { urgencyScore: 50, reasons: [] };
    }
  }

  /**
   * Analyser du texte générique avec le LLM
   * Utilisé par: Email AI Response module
   */
  async analyzeText(userId: string, prompt: string): Promise<string> {
    try {
      const provider = await this.llmFactory.createProvider(userId);

      const startTime = Date.now();
      const response = await provider.generate(prompt, {
        maxTokens: 500,
        temperature: 0.7,
      });
      const duration = Date.now() - startTime;

      await this.trackUsage(userId, 'text_analysis', prompt.length, response.length, duration);

      return response;
    } catch (error) {
      this.logger.error('Error analyzing text with LLM', error);
      throw error;
    }
  }

  /**
   * Tracker l'utilisation et les coûts
   */
  private async trackUsage(
    userId: string,
    feature: string,
    inputLength: number,
    outputLength: number,
    duration: number,
  ): Promise<void> {
    try {
      // Estimer les tokens (rough estimation: 1 token ≈ 4 characters)
      const inputTokens = Math.ceil(inputLength / 4);
      const outputTokens = Math.ceil(outputLength / 4);

      await this.costTracker.trackApiCall({
        userId,
        provider: 'llm', // Will be replaced by actual provider
        feature: `quick_wins_${feature}`,
        inputTokens,
        outputTokens,
        cost: 0, // Will be calculated by cost tracker
        duration,
        success: true,
      });
    } catch (error) {
      this.logger.warn('Failed to track usage', error);
    }
  }

  /**
   * Fallback pour l'analyse de recherche (sans LLM)
   */
  private fallbackSearchIntent(query: string): {
    intent: string;
    keywords: string[];
    filters: any;
  } {
    const lowercaseQuery = query.toLowerCase();
    let intent = 'property';

    if (lowercaseQuery.includes('prospect') || lowercaseQuery.includes('client')) {
      intent = 'prospect';
    } else if (
      lowercaseQuery.includes('rendez-vous') ||
      lowercaseQuery.includes('appointment')
    ) {
      intent = 'appointment';
    }

    // Extract keywords (simple tokenization)
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .filter((word) => !['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du'].includes(word));

    return { intent, keywords, filters: {} };
  }

  /**
   * Fallback pour les insights de rapport (sans LLM)
   */
  private fallbackReportInsights(stats: any): string[] {
    const insights: string[] = [];

    if (stats.newProspects === 0) {
      insights.push('Aucune activité significative pendant cette période');
    } else {
      insights.push(`${stats.newProspects} nouveaux prospects ajoutés`);

      if (stats.qualificationRate > 0) {
        insights.push(`Taux de qualification de ${stats.qualificationRate.toFixed(1)}%`);
      }
    }

    if (stats.newProperties > 0) {
      insights.push(`${stats.newProperties} nouvelles propriétés enregistrées`);
    }

    if (stats.completedAppointments > 0) {
      insights.push(
        `${stats.completedAppointments} rendez-vous complétés sur ${stats.totalAppointments} prévus`,
      );
    }

    return insights.length > 0 ? insights : ['Aucune activité significative pendant cette période'];
  }

  /**
   * Fallback pour les recommandations (sans LLM)
   */
  private fallbackRecommendations(stats: any): string[] {
    const recommendations: string[] = [];

    if (stats.newProspects < 5) {
      recommendations.push('Intensifier la prospection pour augmenter le flux de leads');
    }

    if (stats.qualificationRate < 50) {
      recommendations.push('Améliorer le processus de qualification des prospects');
    }

    if (stats.newProperties < 3) {
      recommendations.push('Enrichir le catalogue de propriétés disponibles');
    }

    if (stats.completedAppointments < stats.totalAppointments * 0.7) {
      recommendations.push('Améliorer le taux de réalisation des rendez-vous');
    }

    return recommendations.length > 0
      ? recommendations
      : ['Continuer les efforts de prospection'];
  }
}
