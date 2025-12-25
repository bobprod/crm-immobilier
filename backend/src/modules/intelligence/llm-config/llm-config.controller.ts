import { Controller, Get, Put, Post, Delete, Body, UseGuards, Request, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UpdateLLMConfigDto, LLMConfigResponseDto, ProviderInfoDto, TestLLMConfigResponseDto, UsageStatsDto, DashboardMetricsDto, BudgetCheckDto } from './dto';
import { LLMConfigService } from './llm-config.service';
import { LLMRouterService, OperationType } from './llm-router.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

/**
 * Controller pour la configuration LLM et le router intelligent
 */
@ApiTags('LLM Config')
@ApiBearerAuth()
@Controller('llm-config')
@UseGuards(JwtAuthGuard)
export class LLMConfigController {
  constructor(
    private readonly llmConfigService: LLMConfigService,
    private readonly llmRouterService: LLMRouterService,
  ) {}

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
  @ApiOperation({ summary: "Statistiques d'utilisation LLM" })
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

  // ═══════════════════════════════════════════════════════
  // ENDPOINTS LLM ROUTER - Multi-providers
  // ═══════════════════════════════════════════════════════

  /**
   * Liste des providers configurés par l'utilisateur
   */
  @Get('user-providers')
  @ApiOperation({ summary: 'Liste des providers configurés avec stats' })
  async getUserProviders(@Request() req) {
    return this.llmRouterService.getUserProviders(req.user.userId);
  }

  /**
   * Ajouter un nouveau provider
   */
  @Post('user-providers')
  @ApiOperation({ summary: 'Ajouter un nouveau provider' })
  async addUserProvider(@Request() req, @Body() data: any) {
    return this.llmRouterService.addUserProvider(req.user.userId, data);
  }

  /**
   * Mettre à jour un provider
   */
  @Put('user-providers/:provider')
  @ApiOperation({ summary: 'Mettre à jour un provider configuré' })
  async updateUserProvider(
    @Request() req,
    @Param('provider') provider: string,
    @Body() data: any,
  ) {
    return this.llmRouterService.updateUserProvider(req.user.userId, provider, data);
  }

  /**
   * Supprimer un provider
   */
  @Delete('user-providers/:provider')
  @ApiOperation({ summary: 'Supprimer un provider configuré' })
  async deleteUserProvider(@Request() req, @Param('provider') provider: string) {
    return this.llmRouterService.deleteUserProvider(req.user.userId, provider);
  }

  /**
   * Tester un provider
   */
  @Post('user-providers/:provider/test')
  @ApiOperation({ summary: 'Tester la connexion à un provider configuré' })
  async testUserProvider(@Request() req, @Param('provider') provider: string) {
    return this.llmRouterService.testUserProvider(req.user.userId, provider);
  }

  /**
   * Suggérer le meilleur provider pour une opération
   */
  @Get('suggest/:operationType')
  @ApiOperation({ summary: 'Suggérer le meilleur provider pour une opération' })
  async suggestProvider(
    @Request() req,
    @Param('operationType') operationType: OperationType,
  ) {
    return this.llmRouterService.suggestProvider(req.user.userId, operationType);
  }

  /**
   * Analytics d'utilisation
   */
  @Get('analytics')
  @ApiOperation({ summary: "Analytics d'utilisation par provider et opération" })
  async getAnalytics(@Request() req) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const logs = await this.llmRouterService['prisma'].llmUsageLog.groupBy({
      by: ['provider', 'operationType'],
      where: {
        userId: req.user.userId,
        createdAt: { gte: startOfMonth },
      },
      _sum: { cost: true, tokensInput: true, tokensOutput: true },
      _count: true,
      _avg: { latency: true },
    });

    return logs;
  }

  /**
   * Migrer l'ancienne config
   */
  @Post('migrate')
  @ApiOperation({ summary: "Migrer l'ancienne configuration vers le nouveau système" })
  async migrateConfig(@Request() req) {
    return this.llmRouterService.migrateOldConfig(req.user.userId);
  }
}
