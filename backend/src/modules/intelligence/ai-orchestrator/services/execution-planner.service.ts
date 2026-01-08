import { Injectable, Logger } from '@nestjs/common';
import { IntentAnalysis } from './intent-analyzer.service';
import { OrchestrationObjective } from '../dto';
import { ExecutionPlan, ToolCall } from '../types';
import { ProviderSelectorService } from './provider-selector.service';

/**
 * Service de planification d'exécution
 *
 * Génère un plan d'exécution (suite de ToolCalls) à partir de l'analyse d'intention
 */
@Injectable()
export class ExecutionPlannerService {
  private readonly logger = new Logger(ExecutionPlannerService.name);

  constructor(private readonly providerSelector: ProviderSelectorService) { }

  /**
   * Créer un plan d'exécution à partir de l'analyse d'intention
   */
  async createPlan(params: {
    tenantId: string;
    userId: string;
    intentAnalysis: IntentAnalysis;
    context: Record<string, any>;
  }): Promise<ExecutionPlan> {
    const { tenantId, userId, intentAnalysis, context } = params;

    this.logger.log(`Creating execution plan for objective: ${intentAnalysis.objective}`);

    // Planifier selon l'objectif
    switch (intentAnalysis.objective) {
      case OrchestrationObjective.PROSPECTION:
        return await this.planProspection(tenantId, userId, intentAnalysis, context);

      case OrchestrationObjective.INVESTMENT_BENCHMARK:
        return this.planInvestmentBenchmark(tenantId, userId, intentAnalysis, context);

      case OrchestrationObjective.PROPERTY_ANALYSIS:
        return this.planPropertyAnalysis(tenantId, userId, intentAnalysis, context);

      case OrchestrationObjective.LEAD_ENRICHMENT:
        return this.planLeadEnrichment(tenantId, userId, intentAnalysis, context);

      default:
        return this.planCustom(tenantId, userId, intentAnalysis, context);
    }
  }

  /**
   * Plan pour la prospection
   *
   * Workflow:
   * 1. SerpAPI : rechercher des pages pertinentes
   * 2. Firecrawl : scraper les pages trouvées
   * 3. LLM : extraire les leads des contenus scrapés
   */
  private async planProspection(
    tenantId: string,
    userId: string,
    analysis: IntentAnalysis,
    context: Record<string, any>,
  ): Promise<ExecutionPlan> {
    const toolCalls: ToolCall[] = [];

    // Construire la query de recherche
    const searchQuery = this.buildProspectionSearchQuery(context);

    // Étape 1 : Recherche (provider dynamique via ProviderSelector)
    const strategy = await this.providerSelector.selectOptimalStrategy(userId, context.agencyId || tenantId);
    const searchProvider = strategy.search[0] || 'serpapi';

    toolCalls.push({
      id: 'search-prospects',
      tool: searchProvider,
      action: 'search',
      params: {
        tenantId,
        userId,
        query: searchQuery,
        location: context.zone || 'France',
        numResults: context.maxResults || 20,
      },
      metadata: {
        description: `Rechercher des prospects potentiels (${searchProvider})`,
        priority: 1,
      },
    });

    // Étape 2 : Scraper les URLs trouvées
    const scrapeProvider = strategy.scrape[0] || 'firecrawl';
    toolCalls.push({
      id: 'scrape-pages',
      tool: scrapeProvider,
      action: 'scrapeBatch',
      params: {
        tenantId,
        userId,
        // Les URLs viendront du résultat de l'étape 1
        formats: ['markdown'],
      },
      dependsOn: 'search-prospects',
      metadata: {
        description: `Scraper les pages trouvées (${scrapeProvider})`,
        priority: 2,
      },
    });

    // Étape 3 : Extraire les leads avec LLM
    toolCalls.push({
      id: 'extract-leads',
      tool: 'llm',
      action: 'extractStructuredData',
      params: {
        userId,
        schema: this.getProspectionLeadSchema(),
        instructions: 'Extrais tous les contacts potentiels (nom, email, téléphone, entreprise, contexte)',
      },
      dependsOn: 'scrape-pages',
      metadata: {
        description: 'Extraire les leads structurés',
        priority: 3,
      },
    });

    return {
      toolCalls,
      description: `Plan de prospection: ${searchQuery}`,
      estimatedCost: 0.5, // Estimation
    };
  }

  /**
   * Plan pour l'import de benchmark d'investissement
   *
   * Workflow:
   * 1. Firecrawl : scraper la page du projet
   * 2. LLM : extraire les données structurées du projet
   */
  private planInvestmentBenchmark(
    tenantId: string,
    userId: string,
    analysis: IntentAnalysis,
    context: Record<string, any>,
  ): ExecutionPlan {
    const toolCalls: ToolCall[] = [];

    // Étape 1 : Scraper la page du projet
    toolCalls.push({
      id: 'scrape-project',
      tool: 'firecrawl',
      action: 'scrape',
      params: {
        tenantId,
        url: context.url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      },
      metadata: {
        description: `Scraper le projet ${analysis.extractedParams.source}`,
        priority: 1,
      },
    });

    // Étape 2 : Extraire les données structurées
    toolCalls.push({
      id: 'extract-benchmark-data',
      tool: 'llm',
      action: 'extractStructuredData',
      params: {
        userId,
        schema: this.getInvestmentBenchmarkSchema(),
        instructions: `Extrais les données du projet d'investissement (source: ${analysis.extractedParams.source || 'unknown'})`,
      },
      dependsOn: 'scrape-project',
      metadata: {
        description: 'Extraire les données du projet',
        priority: 2,
      },
    });

    return {
      toolCalls,
      description: `Import benchmark: ${context.url}`,
      estimatedCost: 0.15,
    };
  }

  /**
   * Plan pour l'analyse de propriété
   */
  private planPropertyAnalysis(
    tenantId: string,
    userId: string,
    analysis: IntentAnalysis,
    context: Record<string, any>,
  ): ExecutionPlan {
    const toolCalls: ToolCall[] = [];

    // Recherche d'infos sur la propriété
    toolCalls.push({
      id: 'search-property-info',
      tool: 'serpapi',
      action: 'search',
      params: {
        tenantId,
        query: `"${context.address}" prix immobilier`,
        location: context.zone || 'France',
        numResults: 10,
      },
      metadata: {
        description: 'Rechercher des infos sur la propriété',
      },
    });

    // Analyse avec LLM
    toolCalls.push({
      id: 'analyze-property',
      tool: 'llm',
      action: 'analyze',
      params: {
        userId,
        analysisType: 'property_analysis',
        instructions: 'Analyse le marché, estime le prix, et donne des recommandations',
      },
      dependsOn: 'search-property-info',
      metadata: {
        description: 'Analyser la propriété',
      },
    });

    return {
      toolCalls,
      description: `Analyse de propriété: ${context.address}`,
      estimatedCost: 0.25,
    };
  }

  /**
   * Plan pour l'enrichissement de lead
   */
  private planLeadEnrichment(
    tenantId: string,
    userId: string,
    analysis: IntentAnalysis,
    context: Record<string, any>,
  ): ExecutionPlan {
    const toolCalls: ToolCall[] = [];

    const searchQuery = `"${context.name}" ${context.company || ''} ${context.email || ''}`.trim();

    // Rechercher des infos sur le lead
    toolCalls.push({
      id: 'search-lead-info',
      tool: 'serpapi',
      action: 'search',
      params: {
        tenantId,
        query: searchQuery,
        numResults: 10,
      },
      metadata: {
        description: 'Rechercher des infos sur le lead',
      },
    });

    // Scraper les pages pertinentes
    toolCalls.push({
      id: 'scrape-lead-pages',
      tool: 'firecrawl',
      action: 'scrapeBatch',
      params: {
        tenantId,
        formats: ['markdown'],
      },
      dependsOn: 'search-lead-info',
      metadata: {
        description: 'Scraper les pages du lead',
      },
    });

    // Enrichir avec LLM
    toolCalls.push({
      id: 'enrich-lead',
      tool: 'llm',
      action: 'extractStructuredData',
      params: {
        userId,
        schema: this.getLeadEnrichmentSchema(),
        instructions: 'Enrichis les données du lead (poste, entreprise, réseaux sociaux, etc.)',
      },
      dependsOn: 'scrape-lead-pages',
      metadata: {
        description: 'Enrichir le lead',
      },
    });

    return {
      toolCalls,
      description: `Enrichissement de lead: ${context.name}`,
      estimatedCost: 0.3,
    };
  }

  /**
   * Plan custom (fallback)
   */
  private planCustom(
    tenantId: string,
    userId: string,
    analysis: IntentAnalysis,
    context: Record<string, any>,
  ): ExecutionPlan {
    // Plan basique : appel LLM direct
    const toolCalls: ToolCall[] = [
      {
        id: 'custom-task',
        tool: 'llm',
        action: 'analyze',
        params: {
          userId,
          analysisType: 'custom',
          instructions: JSON.stringify(context),
        },
      },
    ];

    return {
      toolCalls,
      description: 'Tâche personnalisée',
      estimatedCost: 0.1,
    };
  }

  // ========================================
  // HELPERS
  // ========================================

  private buildProspectionSearchQuery(context: Record<string, any>): string {
    const parts: string[] = [];

    if (context.targetType) {
      parts.push(context.targetType);
    }

    if (context.propertyType) {
      parts.push(context.propertyType);
    }

    if (context.zone) {
      parts.push(context.zone);
    }

    if (context.keywords) {
      parts.push(context.keywords);
    }

    return parts.join(' ') || 'prospects immobilier';
  }

  private getProspectionLeadSchema(): string {
    return `{
  "leads": [
    {
      "name": "string",
      "email": "string | null",
      "phone": "string | null",
      "company": "string | null",
      "role": "string | null",
      "context": "string",
      "source": "string (URL)"
    }
  ]
}`;
  }

  private getInvestmentBenchmarkSchema(): string {
    return `{
  "title": "string",
  "city": "string",
  "country": "string",
  "propertyType": "string",
  "totalPrice": "number",
  "minTicket": "number",
  "grossYield": "number",
  "netYield": "number | null",
  "durationMonths": "number",
  "status": "string",
  "description": "string",
  "additionalInfo": {}
}`;
  }

  private getLeadEnrichmentSchema(): string {
    return `{
  "fullName": "string",
  "company": "string | null",
  "position": "string | null",
  "linkedin": "string | null",
  "twitter": "string | null",
  "website": "string | null",
  "bio": "string | null",
  "additionalInfo": {}
}`;
  }
}
