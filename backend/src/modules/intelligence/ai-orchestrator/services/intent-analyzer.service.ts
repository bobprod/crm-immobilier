import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from './llm.service';
import { OrchestrationObjective } from '../dto';

/**
 * Résultat de l'analyse d'intention
 */
export interface IntentAnalysis {
  /**
   * Objectif principal (normalisé)
   */
  objective: OrchestrationObjective;

  /**
   * Outils nécessaires pour accomplir l'objectif
   */
  requiredTools: string[];

  /**
   * Paramètres extraits du contexte
   */
  extractedParams: Record<string, any>;

  /**
   * Suggestions et recommandations
   */
  suggestions?: string[];

  /**
   * Niveau de confiance (0-1)
   */
  confidence: number;
}

/**
 * Service d'analyse d'intention pour l'orchestrateur IA
 *
 * Analyse les demandes d'orchestration pour :
 * - Comprendre l'intention
 * - Identifier les outils nécessaires
 * - Extraire les paramètres pertinents
 */
@Injectable()
export class IntentAnalyzerService {
  private readonly logger = new Logger(IntentAnalyzerService.name);

  constructor(private readonly llmService: LlmService) {}

  /**
   * Analyser une demande d'orchestration
   */
  async analyze(params: {
    userId: string;
    objective: OrchestrationObjective;
    context: Record<string, any>;
  }): Promise<IntentAnalysis> {
    const { userId, objective, context } = params;

    this.logger.log(`Analyzing intent: ${objective}`);

    // Pour les objectifs standards, on peut utiliser des règles
    // Pour CUSTOM, on utilise le LLM
    if (objective !== OrchestrationObjective.CUSTOM) {
      return this.analyzeStandardObjective(objective, context);
    }

    // Analyse custom avec LLM
    return this.analyzeCustomObjective(userId, context);
  }

  /**
   * Analyser un objectif standard (règles prédéfinies)
   */
  private analyzeStandardObjective(
    objective: OrchestrationObjective,
    context: Record<string, any>,
  ): IntentAnalysis {
    switch (objective) {
      case OrchestrationObjective.PROSPECTION:
        return this.analyzeProspectionIntent(context);

      case OrchestrationObjective.INVESTMENT_BENCHMARK:
        return this.analyzeInvestmentBenchmarkIntent(context);

      case OrchestrationObjective.PROPERTY_ANALYSIS:
        return this.analyzePropertyAnalysisIntent(context);

      case OrchestrationObjective.LEAD_ENRICHMENT:
        return this.analyzeLeadEnrichmentIntent(context);

      default:
        throw new Error(`Unknown objective: ${objective}`);
    }
  }

  /**
   * Analyse pour la prospection
   */
  private analyzeProspectionIntent(context: Record<string, any>): IntentAnalysis {
    const requiredTools = ['serpapi', 'firecrawl', 'llm'];
    const extractedParams: Record<string, any> = {};

    // Extraire les paramètres de ciblage
    if (context.zone) extractedParams.zone = context.zone;
    if (context.targetType) extractedParams.targetType = context.targetType;
    if (context.budget) extractedParams.budget = context.budget;
    if (context.keywords) extractedParams.keywords = context.keywords;
    if (context.propertyType) extractedParams.propertyType = context.propertyType;

    const suggestions = [];

    // Suggestions contextuelles
    if (!context.zone) {
      suggestions.push('Considérez de spécifier une zone géographique pour de meilleurs résultats');
    }

    if (!context.keywords) {
      suggestions.push('Des mots-clés spécifiques peuvent améliorer la pertinence des résultats');
    }

    return {
      objective: OrchestrationObjective.PROSPECTION,
      requiredTools,
      extractedParams,
      suggestions,
      confidence: this.calculateConfidence(extractedParams),
    };
  }

  /**
   * Analyse pour l'import de benchmark d'investissement
   */
  private analyzeInvestmentBenchmarkIntent(context: Record<string, any>): IntentAnalysis {
    const requiredTools = ['firecrawl', 'llm'];
    const extractedParams: Record<string, any> = {};

    if (!context.url) {
      throw new Error('URL is required for investment benchmark import');
    }

    extractedParams.url = context.url;

    // Détecter la source à partir de l'URL
    if (context.url.includes('bricks.co')) {
      extractedParams.source = 'bricks';
    } else if (context.url.includes('homunity.com')) {
      extractedParams.source = 'homunity';
    } else if (context.url.includes('anaxago.com')) {
      extractedParams.source = 'anaxago';
    } else {
      extractedParams.source = 'unknown';
    }

    return {
      objective: OrchestrationObjective.INVESTMENT_BENCHMARK,
      requiredTools,
      extractedParams,
      confidence: 0.95,
    };
  }

  /**
   * Analyse pour l'analyse de propriété
   */
  private analyzePropertyAnalysisIntent(context: Record<string, any>): IntentAnalysis {
    const requiredTools = ['serpapi', 'llm'];
    const extractedParams: Record<string, any> = {};

    if (context.propertyId) extractedParams.propertyId = context.propertyId;
    if (context.address) extractedParams.address = context.address;
    if (context.analysisType) extractedParams.analysisType = context.analysisType;

    return {
      objective: OrchestrationObjective.PROPERTY_ANALYSIS,
      requiredTools,
      extractedParams,
      confidence: 0.9,
    };
  }

  /**
   * Analyse pour l'enrichissement de lead
   */
  private analyzeLeadEnrichmentIntent(context: Record<string, any>): IntentAnalysis {
    const requiredTools = ['serpapi', 'firecrawl', 'llm'];
    const extractedParams: Record<string, any> = {};

    if (context.leadId) extractedParams.leadId = context.leadId;
    if (context.name) extractedParams.name = context.name;
    if (context.company) extractedParams.company = context.company;
    if (context.email) extractedParams.email = context.email;
    if (context.phone) extractedParams.phone = context.phone;

    return {
      objective: OrchestrationObjective.LEAD_ENRICHMENT,
      requiredTools,
      extractedParams,
      confidence: 0.85,
    };
  }

  /**
   * Analyse custom avec LLM (pour les cas complexes)
   */
  private async analyzeCustomObjective(
    userId: string,
    context: Record<string, any>,
  ): Promise<IntentAnalysis> {
    const schema = `{
  "objective": "prospection | investment_benchmark | property_analysis | lead_enrichment | custom",
  "requiredTools": ["serpapi", "firecrawl", "llm", ...],
  "extractedParams": { ... },
  "suggestions": ["...", ...],
  "confidence": 0.0-1.0
}`;

    const instructions = `Analyse cette demande d'orchestration et détermine :
1. L'objectif principal
2. Les outils nécessaires (serpapi, firecrawl, llm, etc.)
3. Les paramètres clés extraits du contexte
4. Des suggestions d'amélioration si pertinent
5. Un score de confiance`;

    try {
      const analysis = await this.llmService.extractStructuredData<IntentAnalysis>({
        userId,
        content: JSON.stringify(context, null, 2),
        schema,
        instructions,
      });

      this.logger.log(`Custom intent analysis completed with confidence ${analysis.confidence}`);

      return analysis;
    } catch (error) {
      this.logger.error('Custom intent analysis failed:', error);

      // Fallback : retour basique
      return {
        objective: OrchestrationObjective.CUSTOM,
        requiredTools: ['llm'],
        extractedParams: context,
        confidence: 0.5,
      };
    }
  }

  /**
   * Calculer le niveau de confiance basé sur les paramètres extraits
   */
  private calculateConfidence(params: Record<string, any>): number {
    const requiredKeys = ['zone', 'targetType'];
    const optionalKeys = ['budget', 'keywords', 'propertyType'];

    let score = 0.5; // Base

    // +0.25 pour chaque paramètre requis présent
    for (const key of requiredKeys) {
      if (params[key]) score += 0.25;
    }

    // +0.05 pour chaque paramètre optionnel présent (max +0.15)
    let optionalScore = 0;
    for (const key of optionalKeys) {
      if (params[key]) optionalScore += 0.05;
    }

    return Math.min(score + Math.min(optionalScore, 0.15), 1.0);
  }
}
