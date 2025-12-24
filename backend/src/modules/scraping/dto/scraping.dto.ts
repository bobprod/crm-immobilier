import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebDataProviderEnum {
  FIRECRAWL = 'firecrawl',
  CHEERIO = 'cheerio',
  PUPPETEER = 'puppeteer',
}

export class ScrapeUrlDto {
  @ApiProperty({
    description: 'URL à scraper',
    example: 'https://example.com',
  })
  @IsString()
  url: string;

  @ApiPropertyOptional({
    description: 'Provider de scraping à utiliser',
    enum: WebDataProviderEnum,
    example: WebDataProviderEnum.CHEERIO,
  })
  @IsOptional()
  @IsEnum(WebDataProviderEnum)
  provider?: WebDataProviderEnum;

  @ApiPropertyOptional({
    description: 'Temps d\'attente en millisecondes avant le scraping',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  waitFor?: number;

  @ApiPropertyOptional({
    description: 'Prendre une capture d\'écran (Puppeteer uniquement)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  screenshot?: boolean;

  @ApiPropertyOptional({
    description: 'Prompt d\'extraction pour l\'IA (Firecrawl uniquement)',
    example: 'Extraire le nom, email et téléphone du contact',
  })
  @IsOptional()
  @IsString()
  extractionPrompt?: string;

  @ApiPropertyOptional({
    description: 'Forcer l\'utilisation du provider sans fallback',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  forceProvider?: boolean;
}

export class ScrapeMultipleUrlsDto {
  @ApiProperty({
    description: 'Liste des URLs à scraper',
    type: [String],
    example: ['https://example.com', 'https://example.org'],
  })
  @IsString({ each: true })
  urls: string[];

  @ApiPropertyOptional({
    description: 'Provider de scraping à utiliser pour toutes les URLs',
    enum: WebDataProviderEnum,
  })
  @IsOptional()
  @IsEnum(WebDataProviderEnum)
  provider?: WebDataProviderEnum;

  @ApiPropertyOptional({
    description: 'Temps d\'attente en millisecondes',
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  waitFor?: number;
}

export class ExtractStructuredDataDto {
  @ApiProperty({
    description: 'URL de la page à analyser',
    example: 'https://example.com/contact',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'Prompt d\'extraction pour l\'IA',
    example: 'Extraire toutes les informations immobilières: prix, surface, localisation',
  })
  @IsString()
  extractionPrompt: string;
}

export class TestProviderDto {
  @ApiProperty({
    description: 'Provider à tester',
    enum: WebDataProviderEnum,
    example: WebDataProviderEnum.FIRECRAWL,
  })
  @IsEnum(WebDataProviderEnum)
  provider: WebDataProviderEnum;
}
