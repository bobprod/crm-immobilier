import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour mettre à jour la configuration LLM
 */
export class UpdateLLMConfigDto {
  @ApiProperty({
    description: 'Provider LLM (anthropic, openai, gemini, deepseek, openrouter)',
    example: 'anthropic',
  })
  @IsNotEmpty()
  @IsString()
  provider: string;

  @ApiProperty({
    description: 'Modèle à utiliser',
    example: 'claude-sonnet-4-20250514',
  })
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty({
    description: 'Clé API du provider',
    example: 'sk-ant-...',
  })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({
    description: 'URL de base personnalisée (pour OpenRouter, etc.)',
    example: 'https://openrouter.ai/api/v1',
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({
    description: 'Température (0-2)',
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Tokens maximum',
    example: 4096,
  })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;
}

/**
 * DTO de réponse pour la configuration LLM
 */
export class LLMConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  model: string;

  @ApiProperty({ description: 'Clé API masquée (***xxxx)' })
  apiKey: string;

  @ApiPropertyOptional()
  baseUrl?: string;

  @ApiPropertyOptional()
  temperature?: number;

  @ApiPropertyOptional()
  maxTokens?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * DTO pour les providers disponibles
 */
export class ProviderInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  models: string[];

  @ApiProperty()
  description: string;

  @ApiProperty()
  pricing: string;

  @ApiProperty()
  keyFormat: string;

  @ApiProperty()
  website: string;
}

/**
 * DTO de réponse pour test de configuration
 */
export class TestLLMConfigResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  provider: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  message: string;
}

/**
 * DTO pour les statistiques d'utilisation
 */
export class UsageStatsDto {
  @ApiProperty()
  totalTokens: number;

  @ApiProperty()
  totalCost: number;

  @ApiProperty()
  requestCount: number;

  @ApiPropertyOptional()
  lastUsed?: Date;
}

/**
 * DTO pour les métriques du dashboard
 */
export class DashboardMetricsDto {
  @ApiProperty({ description: 'Nombre total de tokens utilisés' })
  totalTokens: number;

  @ApiProperty({ description: 'Coût total en USD' })
  totalCost: number;

  @ApiProperty({ description: 'Nombre total de requêtes' })
  requestCount: number;

  @ApiProperty({ description: 'Coût moyen par requête' })
  averageCostPerRequest: number;

  @ApiProperty({ description: 'Provider actuellement configuré' })
  currentProvider: string;

  @ApiProperty({ description: 'Modèle actuellement configuré' })
  currentModel: string;

  @ApiPropertyOptional({ description: 'Date de dernière utilisation' })
  lastUsed?: Date;

  @ApiProperty({
    description: 'Statistiques par jour (7 derniers jours)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        date: { type: 'string' },
        requests: { type: 'number' },
        tokens: { type: 'number' },
        cost: { type: 'number' },
      }
    }
  })
  dailyStats: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;

  @ApiProperty({
    description: 'Répartition par provider',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        provider: { type: 'string' },
        requests: { type: 'number' },
        percentage: { type: 'number' },
      }
    }
  })
  providerDistribution: Array<{
    provider: string;
    requests: number;
    percentage: number;
  }>;
}

/**
 * DTO pour la vérification du budget
 */
export class BudgetCheckDto {
  @ApiProperty({ description: 'Budget limite en USD' })
  budgetLimit: number;

  @ApiProperty({ description: 'Dépenses actuelles en USD' })
  currentSpend: number;

  @ApiProperty({ description: 'Budget restant en USD' })
  remaining: number;

  @ApiProperty({ description: 'Pourcentage du budget utilisé (0-100)' })
  percentageUsed: number;

  @ApiProperty({ description: 'Statut du budget (safe, warning, danger)' })
  status: 'safe' | 'warning' | 'danger';

  @ApiProperty({ description: 'Message d\'alerte si applicable' })
  message: string;

  @ApiProperty({ description: 'Budget dépassé ou non' })
  isOverBudget: boolean;

  @ApiProperty({ description: 'Projection des dépenses pour le mois' })
  projectedMonthlySpend: number;
}

