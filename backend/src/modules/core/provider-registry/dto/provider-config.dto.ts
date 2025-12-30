import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderType, ProviderCategory, ProviderStatus } from '@prisma/client';

export class CreateProviderConfigDto {
  @ApiProperty({ description: 'Type de provider', enum: ProviderType })
  @IsEnum(ProviderType)
  type: ProviderType;

  @ApiProperty({ description: 'Catégorie de provider', enum: ProviderCategory })
  @IsEnum(ProviderCategory)
  category: ProviderCategory;

  @ApiProperty({ description: 'Nom technique du provider (ex: firecrawl, anthropic)' })
  @IsString()
  provider: string;

  @ApiProperty({ description: 'Nom affiché (ex: Firecrawl API, Claude 3.5 Sonnet)' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description du provider' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Clé API (sera cryptée)' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Secret API (sera crypté)' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ description: 'Endpoint personnalisé' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Configuration additionnelle (JSON)' })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiPropertyOptional({ description: 'Priorité (0 = plus haute)', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Budget mensuel (en $)' })
  @IsOptional()
  @IsNumber()
  monthlyBudget?: number;

  @ApiPropertyOptional({ description: 'Budget journalier (en $)' })
  @IsOptional()
  @IsNumber()
  dailyBudget?: number;

  @ApiPropertyOptional({ description: 'Limite de requêtes par minute' })
  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Nombre max de requêtes simultanées' })
  @IsOptional()
  @IsNumber()
  maxConcurrent?: number;

  @ApiPropertyOptional({ description: 'Tags pour filtrage', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateProviderConfigDto {
  @ApiPropertyOptional({ description: 'Nom affiché' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Statut du provider', enum: ProviderStatus })
  @IsOptional()
  @IsEnum(ProviderStatus)
  status?: ProviderStatus;

  @ApiPropertyOptional({ description: 'Activer/désactiver le provider' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Clé API' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Secret API' })
  @IsOptional()
  @IsString()
  apiSecret?: string;

  @ApiPropertyOptional({ description: 'Endpoint' })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Configuration' })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiPropertyOptional({ description: 'Priorité' })
  @IsOptional()
  @IsNumber()
  priority?: number;

  @ApiPropertyOptional({ description: 'Budget mensuel' })
  @IsOptional()
  @IsNumber()
  monthlyBudget?: number;

  @ApiPropertyOptional({ description: 'Budget journalier' })
  @IsOptional()
  @IsNumber()
  dailyBudget?: number;

  @ApiPropertyOptional({ description: 'Rate limit' })
  @IsOptional()
  @IsNumber()
  rateLimit?: number;

  @ApiPropertyOptional({ description: 'Max concurrent' })
  @IsOptional()
  @IsNumber()
  maxConcurrent?: number;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class TestProviderDto {
  @ApiProperty({ description: 'ID du provider à tester' })
  @IsString()
  providerId: string;
}

export class ProviderUsageDto {
  @ApiProperty({ description: 'Type d\'opération' })
  @IsString()
  operationType: string;

  @ApiPropertyOptional({ description: 'Code d\'opération spécifique' })
  @IsOptional()
  @IsString()
  operationCode?: string;

  @ApiPropertyOptional({ description: 'Données de la requête' })
  @IsOptional()
  @IsObject()
  requestData?: any;

  @ApiPropertyOptional({ description: 'Données de la réponse' })
  @IsOptional()
  @IsObject()
  responseData?: any;

  @ApiPropertyOptional({ description: 'Tokens d\'entrée (LLM)' })
  @IsOptional()
  @IsNumber()
  tokensInput?: number;

  @ApiPropertyOptional({ description: 'Tokens de sortie (LLM)' })
  @IsOptional()
  @IsNumber()
  tokensOutput?: number;

  @ApiPropertyOptional({ description: 'Latence en ms' })
  @IsOptional()
  @IsNumber()
  latencyMs?: number;

  @ApiPropertyOptional({ description: 'Coût de l\'opération' })
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional({ description: 'Succès de l\'opération', default: true })
  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @ApiPropertyOptional({ description: 'Message d\'erreur' })
  @IsOptional()
  @IsString()
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Code d\'erreur' })
  @IsOptional()
  @IsString()
  errorCode?: string;
}
