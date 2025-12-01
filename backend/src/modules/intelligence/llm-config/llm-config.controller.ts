import { Controller, Get, Put, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UpdateLLMConfigDto, LLMConfigResponseDto, ProviderInfoDto, TestLLMConfigResponseDto, UsageStatsDto, DashboardMetricsDto, BudgetCheckDto } from './dto';
import { LLMConfigService } from './llm-config.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

/**
 * Controller pour la configuration LLM
 */
@ApiTags('LLM Config')
@ApiBearerAuth()
@Controller('llm-config')
@UseGuards(JwtAuthGuard)
export class LLMConfigController {
  constructor(private readonly llmConfigService: LLMConfigService) { }

  /**
   * Récupérer la configuration actuelle
   */
  @Get()
  @ApiOperation({ summary: 'Obtenir la configuration LLM' })
  @ApiResponse({ status: 200, type: LLMConfigResponseDto })
  async getConfig(@Request() req) {
    return this.llmConfigService.getConfig(req.user.userId);
  }

  /**
   * Mettre à jour la configuration
   */
  @Put()
  @ApiOperation({ summary: 'Mettre à jour la configuration LLM' })
  @ApiResponse({ status: 200, type: LLMConfigResponseDto })
  async updateConfig(@Request() req, @Body() data: UpdateLLMConfigDto) {
    return this.llmConfigService.updateConfig(req.user.userId, data);
  }

  /**
   * Tester la configuration
   */
  @Post('test')
  @ApiOperation({ summary: 'Tester la connexion au provider LLM' })
  @ApiResponse({ status: 200, type: TestLLMConfigResponseDto })
  async testConfig(@Request() req) {
    return this.llmConfigService.testConfig(req.user.userId);
  }

  /**
   * Liste des providers disponibles
   */
  @Get('providers')
  @ApiOperation({ summary: 'Liste des providers LLM disponibles' })
  @ApiResponse({ status: 200, type: [ProviderInfoDto] })
  getProviders() {
    return this.llmConfigService.getAvailableProviders();
  }

  /**
   * Statistiques d'utilisation
   */
  @Get('usage')
  @ApiOperation({ summary: 'Statistiques d\'utilisation LLM' })
  @ApiResponse({ status: 200, type: UsageStatsDto })
  async getUsage(@Request() req) {
    return this.llmConfigService.getUsageStats(req.user.userId);
  }

  /**
   * Métriques pour le dashboard
   */
  @Get('dashboard-metrics')
  @ApiOperation({ summary: 'Métriques détaillées pour le dashboard' })
  @ApiResponse({ status: 200, type: DashboardMetricsDto })
  async getDashboardMetrics(@Request() req) {
    return this.llmConfigService.getDashboardMetrics(req.user.userId);
  }

  /**
   * Vérification du budget
   */
  @Get('budget-check')
  @ApiOperation({ summary: 'Vérifier l\'utilisation par rapport au budget' })
  @ApiQuery({
    name: 'budget',
    required: false,
    type: Number,
    description: 'Budget limite en USD (par défaut: 100)',
    example: 100,
  })
  @ApiResponse({ status: 200, type: BudgetCheckDto })
  async checkBudget(
    @Request() req,
    @Query('budget') budget?: number,
  ) {
    const budgetLimit = budget ? parseFloat(budget.toString()) : 100;
    return this.llmConfigService.checkBudget(req.user.userId, budgetLimit);
  }
}

