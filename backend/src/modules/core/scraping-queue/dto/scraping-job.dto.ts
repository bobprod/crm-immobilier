import { IsString, IsOptional, IsArray, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ScrapingPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
}

export enum ScrapingJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export class CreateScrapingJobDto {
  @ApiProperty({ description: 'URL(s) à scraper', type: [String] })
  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @ApiPropertyOptional({ description: 'Provider de scraping (auto si non spécifié)' })
  @IsOptional()
  @IsString()
  provider?: 'auto' | 'cheerio' | 'puppeteer' | 'firecrawl';

  @ApiPropertyOptional({ description: 'Priorité du job', enum: ScrapingPriority, default: ScrapingPriority.NORMAL })
  @IsOptional()
  @IsEnum(ScrapingPriority)
  priority?: ScrapingPriority;

  @ApiPropertyOptional({ description: 'Nombre de tentatives en cas d\'échec', default: 3 })
  @IsOptional()
  @IsNumber()
  maxRetries?: number;

  @ApiPropertyOptional({ description: 'Temps d\'attente avant le scraping (ms)' })
  @IsOptional()
  @IsNumber()
  waitFor?: number;

  @ApiPropertyOptional({ description: 'Prendre un screenshot (Puppeteer uniquement)' })
  @IsOptional()
  @IsBoolean()
  screenshot?: boolean;

  @ApiPropertyOptional({ description: 'Prompt d\'extraction (Firecrawl uniquement)' })
  @IsOptional()
  @IsString()
  extractionPrompt?: string;

  @ApiPropertyOptional({ description: 'Forcer le provider sans fallback' })
  @IsOptional()
  @IsBoolean()
  forceProvider?: boolean;

  @ApiPropertyOptional({ description: 'Métadonnées additionnelles' })
  @IsOptional()
  metadata?: any;
}

export class BatchScrapingJobDto {
  @ApiProperty({ description: 'Liste des URLs à scraper', type: [String] })
  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @ApiPropertyOptional({ description: 'Provider de scraping' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Nombre max de URLs à traiter en parallèle', default: 5 })
  @IsOptional()
  @IsNumber()
  maxConcurrency?: number;

  @ApiPropertyOptional({ description: 'Options de scraping' })
  @IsOptional()
  options?: {
    waitFor?: number;
    screenshot?: boolean;
    extractionPrompt?: string;
    forceProvider?: boolean;
  };
}
