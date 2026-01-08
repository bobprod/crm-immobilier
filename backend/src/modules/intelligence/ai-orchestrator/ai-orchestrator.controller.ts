import { Controller, Post, Get, Body, UseGuards, Logger, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { OrchestratorRateLimitGuard } from './guards/orchestrator-rate-limit.guard';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { ProviderSelectorService } from './services/provider-selector.service';
import { FirecrawlService } from './services/firecrawl.service';
import { LlmService } from './services/llm.service';
import { OrchestrationRequestDto, OrchestrationResponseDto } from './dto';
import {
  ProviderPreferencesDto,
  AvailableProvidersResponseDto,
} from './dto/provider-preferences.dto';

/**
 * Controller de l'orchestrateur IA
 */
@ApiTags('ai-orchestrator')
@ApiBearerAuth()
@Controller('ai/orchestrate')
@UseGuards(JwtAuthGuard, OrchestratorRateLimitGuard)
export class AiOrchestratorController {
  private readonly logger = new Logger(AiOrchestratorController.name);

  constructor(
    private readonly orchestratorService: AiOrchestratorService,
    private readonly providerSelector: ProviderSelectorService,
    private readonly firecrawlService: FirecrawlService,
    private readonly llmService: LlmService,
  ) { }

  /**
   * POST /api/ai/orchestrate
   *
   * Orchestrer une demande IA
   */
  @Post()
  @ApiOperation({ summary: 'Orchestrate an AI task' })
  @ApiHeader({ name: 'X-RateLimit-Limit', description: 'Nombre max de requêtes par fenêtre' })
  @ApiHeader({ name: 'X-RateLimit-Remaining', description: 'Nombre de requêtes restantes' })
  @ApiHeader({ name: 'X-RateLimit-Reset', description: 'Date de reset du compteur' })
  async orchestrate(
    @Request() req,
    @Body() request: OrchestrationRequestDto,
  ): Promise<OrchestrationResponseDto> {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId; // Fallback au userId si pas de tenantId

    this.logger.log(`Orchestration request from user ${userId}, tenant ${tenantId}`);

    // Injecter tenantId et userId depuis req.user
    request.tenantId = tenantId;
    request.userId = userId;

    return this.orchestratorService.orchestrate(request);
  }

  /**
   * TEST: Tester Firecrawl seul
   */
  @Post('test-firecrawl')
  @ApiOperation({ summary: 'Test Firecrawl scraping' })
  async testFirecrawl(
    @Request() req,
    @Body() body: { url: string; formats?: ('markdown' | 'html' | 'links')[] }
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;

    try {
      this.logger.log(`Testing Firecrawl for URL: ${body.url}`);
      const result = await this.firecrawlService.scrape({
        userId,
        tenantId,
        url: body.url,
        formats: body.formats || ['markdown']
      });

      return {
        success: true,
        data: result,
        message: 'Firecrawl scraping successful'
      };
    } catch (error) {
      this.logger.error('Firecrawl test failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Firecrawl scraping failed'
      };
    }
  }

  /**
   * TEST: Tester LLM seul
   */
  @Post('test-llm')
  @ApiOperation({ summary: 'Test LLM analysis' })
  async testLlm(
    @Request() req,
    @Body() body: { prompt: string; model?: string }
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId || userId;

    try {
      this.logger.log(`Testing LLM with model: ${body.model || 'default'}`);
      const result = await this.llmService.generate({
        userId,
        prompt: body.prompt,
        model: body.model,
        temperature: 0.7,
        maxTokens: 500
      });

      return {
        success: true,
        response: result,
        message: 'LLM analysis successful'
      };
    } catch (error) {
      this.logger.error('LLM test failed:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'LLM analysis failed'
      };
    }
  }

  /**
   * GET /api/ai/orchestrate/providers/available
   *
   * Obtenir les providers disponibles et les préférences de l'utilisateur
   */
  @Get('providers/available')
  @ApiOperation({ summary: 'Get available scraping and search providers' })
  @ApiResponse({ status: 200, description: 'List of available providers' })
  async getAvailableProviders(@Request() req): Promise<AvailableProvidersResponseDto> {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;

    this.logger.log(`Fetching available providers for userId=${userId}, agencyId=${agencyId}`);

    try {
      const available = await this.providerSelector.getAvailableProviders(userId, agencyId);
      const strategy = await this.providerSelector.selectOptimalStrategy(userId, agencyId);

      // Convertir la Map en array
      const availableArray = Array.from(available.values());

      return {
        available: availableArray,
        preferences: {
          searchProviders: strategy.search,
          scrapingProviders: strategy.scrape,
          autoFallback: true,
        },
        strategy: {
          search: strategy.search,
          scrape: strategy.scrape,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching providers:', error);
      throw error;
    }
  }

  /**
   * POST /api/ai/orchestrate/providers/preferences
   *
   * Sauvegarder les préférences de sélection de providers
   */
  @Post('providers/preferences')
  @ApiOperation({ summary: 'Save user provider preferences' })
  async saveProviderPreferences(
    @Request() req,
    @Body() preferences: ProviderPreferencesDto,
  ) {
    const userId = req.user.userId;
    const agencyId = req.user.agencyId;

    this.logger.log(`Saving provider preferences for userId=${userId}`);

    try {
      // TODO: Persister les préférences en DB
      // Pour maintenant, stocker en mémoire ou en cache Redis

      return {
        success: true,
        message: 'Provider preferences saved successfully',
        preferences,
      };
    } catch (error) {
      this.logger.error('Error saving preferences:', error);
      throw error;
    }
  }
}

