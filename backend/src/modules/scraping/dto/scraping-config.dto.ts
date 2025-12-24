import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional, IsNumber } from 'class-validator';

export class ApiConfig {
  @ApiProperty({ description: 'Whether the API is enabled' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'API key for authentication' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: 'API endpoint URL' })
  @IsString()
  @IsOptional()
  endpoint?: string;

  @ApiPropertyOptional({ description: 'Rate limit per minute' })
  @IsNumber()
  @IsOptional()
  rateLimit?: number;
}

export interface ScrapingConfigDto {
  pica?: ApiConfig;
  serpApi?: ApiConfig;
  scrapingBee?: ApiConfig;
  browserless?: ApiConfig;
}

export class UpdateScrapingConfigDto implements ScrapingConfigDto {
  @ApiPropertyOptional({ description: 'PICA API configuration', type: () => ApiConfig })
  @IsOptional()
  pica?: ApiConfig;

  @ApiPropertyOptional({ description: 'SerpAPI configuration', type: () => ApiConfig })
  @IsOptional()
  serpApi?: ApiConfig;

  @ApiPropertyOptional({ description: 'ScrapingBee API configuration', type: () => ApiConfig })
  @IsOptional()
  scrapingBee?: ApiConfig;

  @ApiPropertyOptional({ description: 'Browserless API configuration', type: () => ApiConfig })
  @IsOptional()
  browserless?: ApiConfig;
}
