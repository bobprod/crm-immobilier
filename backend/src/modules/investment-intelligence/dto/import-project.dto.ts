/**
 * DTOs for Investment Intelligence Module
 */

import {
  IsString,
  IsUrl,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvestmentProjectSource, InvestmentProjectStatus } from '@prisma/client';

// ============================================
// Import DTOs
// ============================================

export class ImportProjectDto {
  @IsUrl()
  url: string;

  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean;

  @IsOptional()
  @IsBoolean()
  forceUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  analyzeImmediately?: boolean;
}

export class ImportBatchDto {
  @IsArray()
  @IsUrl({}, { each: true })
  urls: string[];

  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean;

  @IsOptional()
  @IsBoolean()
  analyzeImmediately?: boolean;
}

export class SyncProjectDto {
  @IsString()
  projectId: string;
}

// ============================================
// Analysis DTOs
// ============================================

export class AnalyzeProjectDto {
  @IsString()
  projectId: string;
}

// ============================================
// Comparison DTOs
// ============================================

export class ComparisonWeightsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  location?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  yield?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  risk?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  liquidity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ticket?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  duration?: number;
}

export class ComparisonFiltersDto {
  @IsOptional()
  @IsNumber()
  minYield?: number;

  @IsOptional()
  @IsNumber()
  maxTicket?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyTypes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];
}

export class CompareProjectsDto {
  @IsArray()
  @IsString({ each: true })
  projectIds: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ComparisonWeightsDto)
  weights?: ComparisonWeightsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComparisonFiltersDto)
  filters?: ComparisonFiltersDto;

  @IsOptional()
  @IsString()
  name?: string;
}

// ============================================
// Alert DTOs
// ============================================

export class AlertCriteriaDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cities?: string[];

  @IsOptional()
  @IsNumber()
  minYield?: number;

  @IsOptional()
  @IsNumber()
  maxYield?: number;

  @IsOptional()
  @IsNumber()
  minTicket?: number;

  @IsOptional()
  @IsNumber()
  maxTicket?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  currencies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  propertyTypes?: string[];

  @IsOptional()
  @IsNumber()
  minDuration?: number;

  @IsOptional()
  @IsNumber()
  maxDuration?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(InvestmentProjectSource, { each: true })
  sources?: InvestmentProjectSource[];

  @IsOptional()
  @IsArray()
  @IsEnum(InvestmentProjectStatus, { each: true })
  statuses?: InvestmentProjectStatus[];
}

export class NotificationConfigDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}

export class NotificationChannelDto {
  @IsEnum(['email', 'webhook', 'in_app'])
  type: 'email' | 'webhook' | 'in_app';

  @ValidateNested()
  @Type(() => NotificationConfigDto)
  config: NotificationConfigDto;
}

export class CreateAlertDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => AlertCriteriaDto)
  criteria: AlertCriteriaDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationChannelDto)
  notificationChannels: NotificationChannelDto[];

  @IsOptional()
  @IsEnum(['immediate', 'daily', 'weekly'])
  frequency?: string;
}

export class UpdateAlertDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AlertCriteriaDto)
  criteria?: AlertCriteriaDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationChannelDto)
  notificationChannels?: NotificationChannelDto[];

  @IsOptional()
  @IsEnum(['immediate', 'daily', 'weekly'])
  frequency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// Query DTOs
// ============================================

export class ListProjectsDto {
  @IsOptional()
  @IsEnum(InvestmentProjectSource)
  source?: InvestmentProjectSource;

  @IsOptional()
  @IsEnum(InvestmentProjectStatus)
  status?: InvestmentProjectStatus;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minYield?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxTicket?: number;
}
