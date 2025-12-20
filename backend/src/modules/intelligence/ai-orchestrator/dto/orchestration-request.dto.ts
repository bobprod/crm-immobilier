import { IsString, IsObject, IsOptional, IsEnum } from 'class-validator';

/**
 * Objectifs d'orchestration supportés
 */
export enum OrchestrationObjective {
  PROSPECTION = 'prospection',
  INVESTMENT_BENCHMARK = 'investment_benchmark',
  PROPERTY_ANALYSIS = 'property_analysis',
  LEAD_ENRICHMENT = 'lead_enrichment',
  CUSTOM = 'custom',
}

/**
 * DTO pour une demande d'orchestration IA
 */
export class OrchestrationRequestDto {
  /**
   * Objectif de l'orchestration
   * @example 'prospection'
   */
  @IsEnum(OrchestrationObjective)
  objective: OrchestrationObjective;

  /**
   * Contexte métier pour l'orchestration
   * Ex: { zone: 'Paris 15', targetType: 'vendeurs', budget: '300k-500k' }
   * Ex: { url: 'https://bricks.co/project/123' }
   */
  @IsObject()
  context: Record<string, any>;

  /**
   * ID du tenant (agence)
   */
  @IsString()
  tenantId: string;

  /**
   * ID de l'utilisateur (agent)
   */
  @IsString()
  @IsOptional()
  userId?: string;

  /**
   * Options d'exécution
   */
  @IsObject()
  @IsOptional()
  options?: {
    /**
     * Mode d'exécution : 'auto' (défaut) ou 'manual' (retourne le plan sans l'exécuter)
     */
    executionMode?: 'auto' | 'manual';

    /**
     * Budget max en tokens/coût
     */
    maxCost?: number;

    /**
     * Timeout en ms
     */
    timeout?: number;
  };
}
