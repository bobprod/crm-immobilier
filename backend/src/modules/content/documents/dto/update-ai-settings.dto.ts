import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAiSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultProvider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  anthropicApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deepseekApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  openrouterApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  customApiKeys?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  preferences?: any;
}
