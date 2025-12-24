import { Controller, Post, Get, Body, Query, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WebDataService } from './services/web-data.service';
import {
  ScrapeUrlDto,
  ScrapeMultipleUrlsDto,
  ExtractStructuredDataDto,
  TestProviderDto,
} from './dto';

/**
 * Contrôleur pour le scraping web unifié
 * 
 * Endpoints:
 * - POST /scraping/scrape - Scraper une URL
 * - POST /scraping/scrape-multiple - Scraper plusieurs URLs
 * - POST /scraping/extract - Extraire des données structurées avec IA
 * - POST /scraping/test-provider - Tester un provider
 * - GET /scraping/providers - Liste des providers disponibles
 */
@ApiTags('scraping')
@Controller('scraping')
// @UseGuards(JwtAuthGuard) // Décommenter pour activer l'authentification
@ApiBearerAuth()
export class ScrapingController {
  private readonly logger = new Logger(ScrapingController.name);

  constructor(private readonly webDataService: WebDataService) {}

  @Post('scrape')
  @ApiOperation({
    summary: 'Scraper une URL',
    description:
      'Récupère le contenu d\'une URL avec sélection automatique du meilleur provider de scraping',
  })
  @ApiResponse({
    status: 200,
    description: 'Scraping réussi',
  })
  @ApiResponse({
    status: 400,
    description: 'Paramètres invalides',
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur lors du scraping',
  })
  async scrapeUrl(@Body() dto: ScrapeUrlDto, @Req() req?: any) {
    this.logger.log(`Requête de scraping pour: ${dto.url}`);

    const tenantId = req?.user?.id; // Récupérer l'ID utilisateur depuis le token JWT

    const result = await this.webDataService.fetchHtml(dto.url, {
      provider: dto.provider as any,
      tenantId,
      waitFor: dto.waitFor,
      screenshot: dto.screenshot,
      extractionPrompt: dto.extractionPrompt,
      forceProvider: dto.forceProvider,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('scrape-multiple')
  @ApiOperation({
    summary: 'Scraper plusieurs URLs',
    description: 'Récupère le contenu de plusieurs URLs en parallèle',
  })
  @ApiResponse({
    status: 200,
    description: 'Scraping réussi',
  })
  async scrapeMultipleUrls(@Body() dto: ScrapeMultipleUrlsDto, @Req() req?: any) {
    this.logger.log(`Requête de scraping multiple pour ${dto.urls.length} URLs`);

    const tenantId = req?.user?.id;

    const results = await this.webDataService.fetchMultipleUrls(dto.urls, {
      provider: dto.provider as any,
      tenantId,
      waitFor: dto.waitFor,
    });

    return {
      success: true,
      count: results.length,
      data: results,
    };
  }

  @Post('extract')
  @ApiOperation({
    summary: 'Extraire des données structurées avec IA',
    description:
      'Utilise l\'IA (Firecrawl) pour extraire des données structurées depuis une URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Extraction réussie',
  })
  async extractStructuredData(@Body() dto: ExtractStructuredDataDto, @Req() req?: any) {
    this.logger.log(`Extraction structurée pour: ${dto.url}`);

    const tenantId = req?.user?.id;

    const result = await this.webDataService.extractStructuredData(
      dto.url,
      dto.extractionPrompt,
      tenantId,
    );

    return {
      success: true,
      data: result,
    };
  }

  @Post('test-provider')
  @ApiOperation({
    summary: 'Tester un provider de scraping',
    description: 'Vérifie si un provider est disponible et configuré correctement',
  })
  @ApiResponse({
    status: 200,
    description: 'Test réussi',
  })
  async testProvider(@Body() dto: TestProviderDto, @Req() req?: any) {
    this.logger.log(`Test du provider: ${dto.provider}`);

    const tenantId = req?.user?.id;

    const isAvailable = await this.webDataService.testProvider(dto.provider as any, tenantId);

    return {
      success: true,
      provider: dto.provider,
      available: isAvailable,
    };
  }

  @Get('providers')
  @ApiOperation({
    summary: 'Liste des providers de scraping disponibles',
    description: 'Retourne la liste des providers avec leur statut et description',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des providers',
  })
  async getProviders(@Req() req?: any) {
    this.logger.log('Récupération de la liste des providers');

    const tenantId = req?.user?.id;

    const providers = await this.webDataService.getAvailableProviders(tenantId);

    return {
      success: true,
      providers,
    };
  }
}
