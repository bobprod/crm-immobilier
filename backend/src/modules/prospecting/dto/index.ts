import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProspectingCampaignConfig, LeadMetadata } from '../../../shared/types/relation-summaries';

/**
 * DTO pour créer une campagne
 */
export class CreateCampaignDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['geographic', 'demographic', 'behavioral', 'mixed'] })
  @IsEnum(['geographic', 'demographic', 'behavioral', 'mixed'])
  type: string;

  @ApiPropertyOptional({ description: 'Configuration de la campagne' })
  @IsOptional()
  @IsObject()
  config?: ProspectingCampaignConfig;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  targetCount?: number;
}

/**
 * DTO pour configuration du funnel
 */
export class FunnelConfigDto {
  @ApiProperty()
  @IsString()
  location: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  propertyType: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  targetType: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  sources?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minLeadScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requirePhone?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxLeadsPerSource?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  useAI?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiProvider?: string;
}

/**
 * DTO pour mise à jour d'un lead
 */
export class UpdateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qualificationNotes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budgetMax?: number;

  @ApiPropertyOptional({ description: 'Métadonnées du lead' })
  @IsOptional()
  @IsObject()
  metadata?: LeadMetadata;
}

/**
 * DTO pour critères de qualification
 */
export class QualificationCriteriaDto {
  @ApiPropertyOptional({ default: 70 })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requirePhone?: boolean;
}

/**
 * DTO pour validation d'emails
 */
export class ValidateEmailsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  emails: string[];
}

// Export LLM Prospecting types
export * from './llm-prospecting.dto';

// Export Matching types
export * from './matching.dto';
