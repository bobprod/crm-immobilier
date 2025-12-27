import { ExecutionPlan, ToolCallResult } from '../types/tool-call.type';

/**
 * Statut de l'orchestration
 */
export enum OrchestrationStatus {
  PENDING = 'pending',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial', // Certains appels ont échoué mais pas tous
}

/**
 * DTO de réponse pour une orchestration IA
 */
export class OrchestrationResponseDto {
  /**
   * Statut de l'orchestration
   */
  status: OrchestrationStatus;

  /**
   * Plan d'exécution généré (si executionMode = 'manual' ou pour debug)
   */
  plan?: ExecutionPlan;

  /**
   * Résultats des appels d'outils
   */
  results?: ToolCallResult[];

  /**
   * Résultat final synthétisé (dépend de l'objectif)
   * Ex: pour prospection → { leads: [...] }
   * Ex: pour investment_benchmark → { benchmark: {...} }
   */
  finalResult?: any;

  /**
   * Métriques globales
   */
  metrics?: {
    totalDurationMs: number;
    totalTokensUsed?: number;
    totalCost?: number;
    successfulCalls: number;
    failedCalls: number;
  };

  /**
   * Messages d'erreur (si status = failed ou partial)
   */
  errors?: string[];

  /**
   * Warnings éventuels
   */
  warnings?: string[];
}
