import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OrchestrationRequestDto, OrchestrationResponseDto, OrchestrationStatus } from '../dto';
import { IntentAnalyzerService } from './intent-analyzer.service';
import { ExecutionPlannerService } from './execution-planner.service';
import { ToolExecutorService } from './tool-executor.service';
import { BudgetTrackerService } from './budget-tracker.service';

/**
 * Service principal de l'orchestrateur IA
 *
 * Orchestre l'ensemble du workflow :
 * 1. Analyse de l'intention
 * 2. Planification de l'exécution
 * 3. Exécution des outils
 * 4. Synthèse des résultats
 */
@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly intentAnalyzer: IntentAnalyzerService,
    private readonly executionPlanner: ExecutionPlannerService,
    private readonly toolExecutor: ToolExecutorService,
    private readonly budgetTracker: BudgetTrackerService,
  ) { }

  /**
   * Point d'entrée principal : orchestrer une demande
   */
  async orchestrate(request: OrchestrationRequestDto): Promise<OrchestrationResponseDto> {
    const startTime = Date.now();

    this.logger.log(`Orchestrating request: ${request.objective}`);
    this.logger.log(`Tenant: ${request.tenantId}, User: ${request.userId || 'N/A'}`);

    try {
      // 0. Vérifier le budget avant d'exécuter
      const budgetCheck = await this.budgetTracker.checkBudget(
        request.tenantId,
        request.options?.maxCost || 0.5,
      );

      if (!budgetCheck.allowed) {
        throw new BadRequestException(budgetCheck.reason);
      }

      this.logger.log(`Budget OK. Remaining: ${budgetCheck.remaining?.toFixed(2)}$`);

      // 1. Analyse de l'intention
      this.logger.log('Step 1: Analyzing intent...');
      const intentAnalysis = await this.intentAnalyzer.analyze({
        userId: request.userId || request.tenantId,
        objective: request.objective,
        context: request.context,
      });

      this.logger.log(`Intent analyzed. Confidence: ${intentAnalysis.confidence}`);
      this.logger.log(`Required tools: ${intentAnalysis.requiredTools.join(', ')}`);

      // 2. Planification de l'exécution
      this.logger.log('Step 2: Creating execution plan...');
      const executionPlan = await this.executionPlanner.createPlan({
        tenantId: request.tenantId,
        userId: request.userId || request.tenantId,
        intentAnalysis,
        context: request.context,
      });

      this.logger.log(`Execution plan created with ${executionPlan.toolCalls.length} tool calls`);

      // Si mode manual, retourner juste le plan
      if (request.options?.executionMode === 'manual') {
        return {
          status: OrchestrationStatus.PLANNING,
          plan: executionPlan,
          metrics: {
            totalDurationMs: Date.now() - startTime,
            successfulCalls: 0,
            failedCalls: 0,
          },
        };
      }

      // 3. Exécution du plan
      this.logger.log('Step 3: Executing plan...');
      const results = await this.toolExecutor.executePlan(executionPlan);

      const successfulCalls = results.filter((r) => r.success).length;
      const failedCalls = results.filter((r) => !r.success).length;

      this.logger.log(`Execution completed. Success: ${successfulCalls}, Failed: ${failedCalls}`);

      // 4. Synthèse des résultats
      const finalResult = this.synthesizeResults(request.objective, results);

      // Calculer les métriques
      const totalDurationMs = Date.now() - startTime;
      const totalTokensUsed = results.reduce((sum, r) => sum + (r.metrics?.tokensUsed || 0), 0);
      const totalCost = results.reduce((sum, r) => sum + (r.metrics?.cost || 0), 0);

      // Déterminer le statut
      let status: OrchestrationStatus;
      if (failedCalls === 0) {
        status = OrchestrationStatus.COMPLETED;
      } else if (successfulCalls > 0) {
        status = OrchestrationStatus.PARTIAL;
      } else {
        status = OrchestrationStatus.FAILED;
      }

      const errors = results.filter((r) => !r.success).map((r) => r.error!);

      // Enregistrer les dépenses (async, ne pas bloquer la réponse)
      if (totalCost > 0) {
        this.budgetTracker
          .recordSpending({
            tenantId: request.tenantId,
            userId: request.userId || request.tenantId,
            orchestrationId: `orch-${Date.now()}`,
            provider: 'orchestrator',
            cost: totalCost,
            tokensUsed: totalTokensUsed,
            details: {
              objective: request.objective,
              toolCalls: executionPlan.toolCalls.length,
              successfulCalls,
              failedCalls,
            },
          })
          .catch((err) => this.logger.error('Failed to record spending:', err));
      }

      return {
        status,
        plan: executionPlan,
        results,
        finalResult,
        metrics: {
          totalDurationMs,
          totalTokensUsed,
          totalCost,
          successfulCalls,
          failedCalls,
        },
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Orchestration failed:', error);

      return {
        status: OrchestrationStatus.FAILED,
        errors: [error?.message || String(error)],
        metrics: {
          totalDurationMs: Date.now() - startTime,
          successfulCalls: 0,
          failedCalls: 0,
        },
      };
    }
  }

  /**
   * Synthétiser les résultats en fonction de l'objectif
   */
  private synthesizeResults(objective: string, results: any[]): any {
    // Trouver le dernier résultat réussi (souvent le plus pertinent)
    const lastSuccess = [...results].reverse().find((r) => r.success);

    if (!lastSuccess) {
      return null;
    }

    switch (objective) {
      case 'prospection':
        return this.synthesizeProspectionResults(lastSuccess.data);

      case 'investment_benchmark':
        return this.synthesizeInvestmentResults(lastSuccess.data);

      case 'property_analysis':
        return this.synthesizePropertyAnalysisResults(lastSuccess.data);

      case 'lead_enrichment':
        return this.synthesizeLeadEnrichmentResults(lastSuccess.data);

      default:
        return lastSuccess.data;
    }
  }

  /**
   * Synthèse pour la prospection
   */
  private synthesizeProspectionResults(data: any): any {
    // Le dernier résultat devrait être l'extraction de leads par LLM
    if (data.text) {
      try {
        const parsed = JSON.parse(data.text);
        return {
          leads: parsed.leads || [],
          count: parsed.leads?.length || 0,
        };
      } catch {
        return { leads: [], count: 0 };
      }
    }

    return data;
  }

  /**
   * Synthèse pour l'investment benchmark
   */
  private synthesizeInvestmentResults(data: any): any {
    // Le résultat devrait déjà être structuré par extractStructuredData
    return {
      benchmark: data,
      ready: true,
    };
  }

  /**
   * Synthèse pour l'analyse de propriété
   */
  private synthesizePropertyAnalysisResults(data: any): any {
    return {
      analysis: data.text || data,
    };
  }

  /**
   * Synthèse pour l'enrichissement de lead
   */
  private synthesizeLeadEnrichmentResults(data: any): any {
    return {
      enrichedData: data,
    };
  }
}
