import { IsString, IsObject, IsOptional, IsEnum, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
 * Options d'exécution de l'orchestration
 */
export class OrchestrationOptionsDto {
  /**
   * Mode d'exécution : 'auto' (défaut) ou 'manual' (retourne le plan sans l'exécuter)
   */
  @IsOptional()
  @IsEnum(['auto', 'manual'])
  executionMode?: 'auto' | 'manual';

  /**
   * Budget max en USD (défaut: 5$)
   */
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  maxCost?: number;

  /**
   * Timeout en ms (défaut: 120000ms = 2min, max: 600000ms = 10min)
   */
  @IsOptional()
  @IsNumber()
  @Min(5000) // Min 5 secondes
  @Max(600000) // Max 10 minutes
  timeout?: number;

  /**
   * Nombre max de résultats (pour recherches)
   */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxResults?: number;
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
  @IsOptional()
  @ValidateNested()
  @Type(() => OrchestrationOptionsDto)
  options?: OrchestrationOptionsDto;
}
