import { IsEnum, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ScrapingProvider } from '../services/provider-selector.service';

/**
 * DTO pour les préférences utilisateur de providers
 */
export class ProviderPreferencesDto {
    /**
     * Providers préférés pour la recherche (dans l'ordre)
     */
    @IsArray()
    @IsEnum(ScrapingProvider, { each: true })
    @IsOptional()
    searchProviders?: ScrapingProvider[];

    /**
     * Providers préférés pour le scraping (dans l'ordre)
     */
    @IsArray()
    @IsEnum(ScrapingProvider, { each: true })
    @IsOptional()
    scrapingProviders?: ScrapingProvider[];

    /**
     * Activer le fallback automatique si un provider échoue
     */
    @IsBoolean()
    @IsOptional()
    autoFallback?: boolean = true;

    /**
     * Forcer un provider spécifique (override les préférences)
     */
    @IsEnum(ScrapingProvider)
    @IsOptional()
    forceProvider?: ScrapingProvider;
}

/**
 * Info sur un provider disponible
 */
export interface ProviderInfoDto {
    provider: ScrapingProvider;
    available: boolean;
    requiresApiKey: boolean;
    priority: number;
    description: string;
    tier: 'search' | 'scraping' | 'enrichment';
}

/**
 * Réponse avec les providers disponibles et les préférences
 */
export interface AvailableProvidersResponseDto {
    available: ProviderInfoDto[];
    preferences: ProviderPreferencesDto;
    strategy: {
        search: ScrapingProvider[];
        scrape: ScrapingProvider[];
    };
}
