export interface ApiConfig {
  enabled: boolean;
  apiKey: string;
  endpoint?: string;
  rateLimit?: number;
}

export interface ScrapingConfigDto {
  pica?: ApiConfig;
  serpApi?: ApiConfig;
  scrapingBee?: ApiConfig;
  browserless?: ApiConfig;
}

export class UpdateScrapingConfigDto implements ScrapingConfigDto {
  pica?: ApiConfig;
  serpApi?: ApiConfig;
  scrapingBee?: ApiConfig;
  browserless?: ApiConfig;
}
