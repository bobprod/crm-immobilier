import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMetricDto {
  @ApiProperty()
  @IsString()
  metricType: string;

  @ApiProperty({ enum: ['openai', 'gemini', 'anthropic', 'deepseek'] })
  @IsEnum(['openai', 'gemini', 'anthropic', 'deepseek'])
  provider: string;

  @ApiProperty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsNumber()
  tokensUsed: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latencyMs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: any;
}

export class MetricsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metricType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
