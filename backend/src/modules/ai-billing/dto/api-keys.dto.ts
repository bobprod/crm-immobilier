import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour mettre à jour les clés API utilisateur (user-level)
 * Stockées dans ai_settings
 */
export class UpdateUserApiKeysDto {
  @ApiPropertyOptional({ description: 'Clé API Anthropic (Claude)' })
  @IsOptional()
  @IsString()
  anthropicApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API OpenAI (GPT)' })
  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Google Gemini' })
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API DeepSeek' })
  @IsOptional()
  @IsString()
  deepseekApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API OpenRouter' })
  @IsOptional()
  @IsString()
  openrouterApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API SERP (Google Search)' })
  @IsOptional()
  @IsString()
  serpApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Firecrawl' })
  @IsOptional()
  @IsString()
  firecrawlApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Pica' })
  @IsOptional()
  @IsString()
  picaApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Jina Reader' })
  @IsOptional()
  @IsString()
  jinaReaderApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API ScrapingBee' })
  @IsOptional()
  @IsString()
  scrapingBeeApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Browserless' })
  @IsOptional()
  @IsString()
  browserlessApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API RapidAPI' })
  @IsOptional()
  @IsString()
  rapidApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Mistral' })
  @IsOptional()
  @IsString()
  mistralApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Grok (xAI)' })
  @IsOptional()
  @IsString()
  grokApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Cohere' })
  @IsOptional()
  @IsString()
  cohereApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Together AI' })
  @IsOptional()
  @IsString()
  togetherAiApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Replicate' })
  @IsOptional()
  @IsString()
  replicateApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Perplexity' })
  @IsOptional()
  @IsString()
  perplexityApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Hugging Face' })
  @IsOptional()
  @IsString()
  huggingfaceApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Aleph Alpha' })
  @IsOptional()
  @IsString()
  alephAlphaApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API NLP Cloud' })
  @IsOptional()
  @IsString()
  nlpCloudApiKey?: string;

  @ApiPropertyOptional({ description: 'Modèle par défaut sélectionné' })
  @IsOptional()
  @IsString()
  defaultModel?: string;

  @ApiPropertyOptional({ description: 'Provider par défaut (openai, gemini, deepseek, etc.)' })
  @IsOptional()
  @IsString()
  defaultProvider?: string;
}

/**
 * DTO pour mettre à jour les clés API agence (agency-level)
 * Stockées dans agency_api_keys
 */
export class UpdateAgencyApiKeysDto {
  @ApiPropertyOptional({ description: 'Clé API Anthropic (Claude)' })
  @IsOptional()
  @IsString()
  anthropicApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API OpenAI (GPT)' })
  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Google Gemini' })
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API DeepSeek' })
  @IsOptional()
  @IsString()
  deepseekApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API OpenRouter' })
  @IsOptional()
  @IsString()
  openrouterApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API SERP (Google Search)' })
  @IsOptional()
  @IsString()
  serpApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Firecrawl' })
  @IsOptional()
  @IsString()
  firecrawlApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Pica' })
  @IsOptional()
  @IsString()
  picaApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Jina Reader' })
  @IsOptional()
  @IsString()
  jinaReaderApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API ScrapingBee' })
  @IsOptional()
  @IsString()
  scrapingBeeApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Browserless' })
  @IsOptional()
  @IsString()
  browserlessApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API RapidAPI' })
  @IsOptional()
  @IsString()
  rapidApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Mistral' })
  @IsOptional()
  @IsString()
  mistralApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Grok (xAI)' })
  @IsOptional()
  @IsString()
  grokApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Cohere' })
  @IsOptional()
  @IsString()
  cohereApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Together AI' })
  @IsOptional()
  @IsString()
  togetherAiApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Replicate' })
  @IsOptional()
  @IsString()
  replicateApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Perplexity' })
  @IsOptional()
  @IsString()
  perplexityApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Hugging Face' })
  @IsOptional()
  @IsString()
  huggingfaceApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API Aleph Alpha' })
  @IsOptional()
  @IsString()
  alephAlphaApiKey?: string;

  @ApiPropertyOptional({ description: 'Clé API NLP Cloud' })
  @IsOptional()
  @IsString()
  nlpCloudApiKey?: string;

  @ApiPropertyOptional({ description: 'Modèle par défaut sélectionné pour l\'agence' })
  @IsOptional()
  @IsString()
  defaultModel?: string;

  @ApiPropertyOptional({ description: 'Provider par défaut pour l\'agence' })
  @IsOptional()
  @IsString()
  defaultProvider?: string;
}

/**
 * DTO pour mettre à jour les clés API Super Admin (global fallback)
 * Stockées dans global_settings
 */
export class UpdateGlobalApiKeysDto {
  @ApiPropertyOptional({ description: 'Clé API Anthropic (Claude) - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_anthropic_key?: string;

  @ApiPropertyOptional({ description: 'Clé API OpenAI (GPT) - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_openai_key?: string;

  @ApiPropertyOptional({ description: 'Clé API Google Gemini - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_gemini_key?: string;

  @ApiPropertyOptional({ description: 'Clé API DeepSeek - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_deepseek_key?: string;

  @ApiPropertyOptional({ description: 'Clé API OpenRouter - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_openrouter_key?: string;

  @ApiPropertyOptional({ description: 'Clé API SERP - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_serp_key?: string;

  @ApiPropertyOptional({ description: 'Clé API Firecrawl - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_firecrawl_key?: string;

  @ApiPropertyOptional({ description: 'Clé API Pica - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_pica_key?: string;

  @ApiPropertyOptional({ description: 'Clé API Jina Reader - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_jina_key?: string;

  @ApiPropertyOptional({ description: 'Clé API ScrapingBee - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_scrapingbee_key?: string;

  @ApiPropertyOptional({ description: 'Clé API Browserless - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_browserless_key?: string;

  @ApiPropertyOptional({ description: 'Clé API RapidAPI - Fallback Super Admin' })
  @IsOptional()
  @IsString()
  superadmin_rapidapi_key?: string;
}
