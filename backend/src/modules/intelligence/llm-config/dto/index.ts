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
