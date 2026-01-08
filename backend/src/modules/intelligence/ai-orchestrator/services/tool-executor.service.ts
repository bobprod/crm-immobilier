import { Injectable, Logger } from '@nestjs/common';
import { ToolCall, ToolCallResult, ExecutionPlan } from '../types';
import { LlmService } from './llm.service';
import { SerpApiService } from './serpapi.service';
import { FirecrawlService } from './firecrawl.service';
import { WebDataService } from '../../../scraping/services/web-data.service';
import { ProviderSelectorService } from './provider-selector.service';
import { MetricsService } from '../../../../shared/metrics/metrics.service';

/**
 * Service d'exécution des appels d'outils
 *
 * Exécute les ToolCalls dans l'ordre défini par le plan,
 * en respectant les dépendances entre appels
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly serpApiService: SerpApiService,
    private readonly firecrawlService: FirecrawlService,
    private readonly webDataService: WebDataService,
    private readonly providerSelector: ProviderSelectorService,
    private readonly metricsService: MetricsService,
  ) { }

  /**
   * Exécuter un plan d'exécution complet
   */
  async executePlan(plan: ExecutionPlan): Promise<ToolCallResult[]> {
    this.logger.log(`Executing plan with ${plan.toolCalls.length} tool calls`);

    const results: ToolCallResult[] = [];
    const resultsMap = new Map<string, ToolCallResult>();

    for (const toolCall of plan.toolCalls) {
      const result = await this.executeToolCall(toolCall, resultsMap);
      results.push(result);
      resultsMap.set(toolCall.id, result);

      // Si un appel échoue et qu'il est critique, on peut arrêter
      if (!result.success && toolCall.metadata?.priority === 1) {
        this.logger.error(`Critical tool call ${toolCall.id} failed, stopping execution`);
        break;
      }
    }

    return results;
  }

  /**
   * Exécuter un seul ToolCall
   */
  async executeToolCall(
    toolCall: ToolCall,
    previousResults: Map<string, ToolCallResult>,
  ): Promise<ToolCallResult> {
    const startTime = Date.now();

    this.logger.log(`Executing tool call: ${toolCall.id} (${toolCall.tool}:${toolCall.action})`);

    let resolvedParams: any = {};
    try {
      // Résoudre les dépendances
      resolvedParams = this.resolveParams(toolCall, previousResults);

      // Exécuter selon le type d'outil
      let data: any;

      switch (toolCall.tool) {
        case 'serpapi':
          data = await this.executeSerpApi(toolCall.action, resolvedParams);
          break;

        case 'firecrawl':
          data = await this.executeFirecrawl(toolCall.action, resolvedParams);
          break;

        case 'puppeteer':
          data = await this.executePuppeteer(toolCall.action, resolvedParams);
          break;

        case 'cheerio':
          data = await this.executeCheerio(toolCall.action, resolvedParams);
          break;

        case 'llm':
          data = await this.executeLlm(toolCall.action, resolvedParams, previousResults);
          break;

        default:
          throw new Error(`Unknown tool: ${toolCall.tool}`);
      }

      const durationMs = Date.now() - startTime;

      return {
        toolCallId: toolCall.id,
        success: true,
        data,
        metrics: {
          durationMs,
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logger.error(`Tool call ${toolCall.id} failed:`, error);

      // Attempt simple replanning for scraping providers (one retry)
      const currentRetry = toolCall.metadata?._retryCount || 0;
      const scrapingProviders = ['firecrawl', 'puppeteer', 'cheerio'];

      if (currentRetry < 1 && scrapingProviders.includes(toolCall.tool as string)) {
        try {
          const uid = resolvedParams?.userId || resolvedParams?.user || resolvedParams?.tenantId || 'system';
          const aid = resolvedParams?.agencyId || resolvedParams?.tenantId;
          const strategy = await this.providerSelector.selectOptimalStrategy(uid, aid);
          const alternatives = strategy.scrape.filter(p => p !== (toolCall.tool as any));

            if (alternatives.length > 0) {
              const alt = alternatives[0];
              this.logger.warn(`Retrying ${toolCall.id} with alternative provider: ${alt}`);

              // increment retry metric
              try {
                this.metricsService.increment('tool_executor.retry');
              } catch (merr) {
                this.logger.debug('Metrics increment failed: ' + (merr.message || merr));
              }

              const retryCall: ToolCall = {
                ...toolCall,
                tool: alt as any,
                metadata: {
                  ...(toolCall.metadata || {}),
                  _retryCount: currentRetry + 1,
                },
              };

              // Execute the alternative tool call
              const retryResult = await this.executeToolCall(retryCall, previousResults);
              return retryResult;
            }
        } catch (replanError) {
          this.logger.warn('Replanning failed:', replanError.message || replanError);
        }
      }

      return {
        toolCallId: toolCall.id,
        success: false,
        error: error.message,
        metrics: {
          durationMs,
        },
      };
    }
  }

  /**
   * Exécuter un appel SerpAPI
   */
  private async executeSerpApi(action: string, params: any): Promise<any> {
    switch (action) {
      case 'search':
        return this.serpApiService.search(params);

      case 'localSearch':
        return this.serpApiService.localSearch(params);

      default:
        throw new Error(`Unknown SerpAPI action: ${action}`);
    }
  }

  /**
   * Exécuter un appel Firecrawl
   */
  private async executeFirecrawl(action: string, params: any): Promise<any> {
    switch (action) {
      case 'scrape':
        return await this.webDataService.fetchHtml(params.url, {
          provider: 'firecrawl',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });

      case 'scrapeBatch':
        return await this.webDataService.fetchMultipleUrls(params.urls, {
          provider: 'firecrawl',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });

      case 'extractMainContent':
        return this.firecrawlService.extractMainContent(params);

      default:
        throw new Error(`Unknown Firecrawl action: ${action}`);
    }
  }

  private async executePuppeteer(action: string, params: any): Promise<any> {
    switch (action) {
      case 'scrape':
        return await this.webDataService.fetchHtml(params.url, {
          provider: 'puppeteer',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });

      case 'scrapeBatch':
        return await this.webDataService.fetchMultipleUrls(params.urls, {
          provider: 'puppeteer',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });

      default:
        throw new Error(`Puppeteer action not supported: ${action}`);
    }
  }

  private async executeCheerio(action: string, params: any): Promise<any> {
    switch (action) {
      case 'scrape':
        return await this.webDataService.fetchHtml(params.url, {
          provider: 'cheerio',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });

      case 'scrapeBatch':
        return await this.webDataService.fetchMultipleUrls(params.urls, {
          provider: 'cheerio',
          tenantId: params.tenantId,
          extractionPrompt: params.extractionPrompt,
        });

      default:
        throw new Error(`Cheerio action not supported: ${action}`);
    }
  }

  /**
   * Exécuter un appel LLM
   */
  private async executeLlm(
    action: string,
    params: any,
    previousResults: Map<string, ToolCallResult>,
  ): Promise<any> {
    switch (action) {
      case 'generate':
        return this.llmService.generate(params);

      case 'extractStructuredData':
        // Injecter le contenu depuis les résultats précédents si pas fourni
        if (!params.content && previousResults.size > 0) {
          params.content = this.buildContentFromPreviousResults(previousResults);
        }
        return this.llmService.extractStructuredData(params);

      case 'analyze':
        // Injecter le contenu depuis les résultats précédents si pas fourni
        if (!params.content && previousResults.size > 0) {
          params.content = this.buildContentFromPreviousResults(previousResults);
        }
        return this.llmService.analyze(params);

      default:
        throw new Error(`Unknown LLM action: ${action}`);
    }
  }

  /**
   * Résoudre les paramètres d'un ToolCall en injectant les résultats des dépendances
   */
  private resolveParams(
    toolCall: ToolCall,
    previousResults: Map<string, ToolCallResult>,
  ): any {
    const params = { ...toolCall.params };

    // Si ce ToolCall dépend d'un autre, injecter ses résultats
    if (toolCall.dependsOn) {
      const dependency = previousResults.get(toolCall.dependsOn);

      if (!dependency) {
        throw new Error(`Dependency ${toolCall.dependsOn} not found for ${toolCall.id}`);
      }

      if (!dependency.success) {
        throw new Error(`Dependency ${toolCall.dependsOn} failed`);
      }

      // Injecter les résultats selon le contexte
      params._dependencyResult = dependency.data;

      // Cas spécifique : si l'action est scrapeBatch, injecter les URLs trouvées par la dépendance
      if (toolCall.action === 'scrapeBatch') {
        const searchResults = dependency.data;
        if (Array.isArray(searchResults)) {
          params.urls = searchResults.slice(0, 10).map((r: any) => r.link);
        }
      }
    }

    return params;
  }

  /**
   * Construire le contenu pour le LLM à partir des résultats précédents
   */
  private buildContentFromPreviousResults(
    previousResults: Map<string, ToolCallResult>,
  ): string {
    const parts: string[] = [];

    for (const [id, result] of previousResults.entries()) {
      if (!result.success || !result.data) continue;

      // Si c'est un scrape Firecrawl
      if (Array.isArray(result.data)) {
        for (const item of result.data) {
          if (item.success && item.data?.markdown) {
            parts.push(item.data.markdown);
          }
        }
      }
      // Si c'est un scrape simple
      else if (result.data.data?.markdown) {
        parts.push(result.data.data.markdown);
      }
      // Sinon, stringify
      else {
        parts.push(JSON.stringify(result.data, null, 2));
      }
    }

    return parts.join('\n\n---\n\n');
  }
}
