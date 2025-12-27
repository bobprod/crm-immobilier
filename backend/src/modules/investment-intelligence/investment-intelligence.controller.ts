/**
 * Investment Intelligence Controller
 * REST API endpoints for investment analysis
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../../shared/decorators/current-user.decorator';
import { InvestmentImportService } from './services/investment-import.service';
import { InvestmentAnalysisService } from './services/investment-analysis.service';
import { InvestmentComparisonService } from './services/investment-comparison.service';
import { InvestmentAlertService } from './services/investment-alert.service';
import { AdapterRegistryService } from './services/adapter-registry.service';
import {
  ImportProjectDto,
  ImportBatchDto,
  AnalyzeProjectDto,
  CompareProjectsDto,
  CreateAlertDto,
  UpdateAlertDto,
  ListProjectsDto,
} from './dto/import-project.dto';

@Controller('api/investment-intelligence')
@UseGuards(JwtAuthGuard)
export class InvestmentIntelligenceController {
  private readonly logger = new Logger(InvestmentIntelligenceController.name);

  constructor(
    private readonly importService: InvestmentImportService,
    private readonly analysisService: InvestmentAnalysisService,
    private readonly comparisonService: InvestmentComparisonService,
    private readonly alertService: InvestmentAlertService,
    private readonly adapterRegistry: AdapterRegistryService,
  ) {}

  // ============================================
  // Platform Detection
  // ============================================

  @Get('detect')
  async detectPlatform(@Query('url') url: string) {
    this.logger.log(`Detecting platform for URL: ${url}`);
    return this.adapterRegistry.detectPlatform(url);
  }

  @Get('platforms')
  async getSupportedPlatforms() {
    return {
      count: this.adapterRegistry.getSupportedPlatformsCount(),
      adapters: this.adapterRegistry.getAllAdapterMetadata(),
      capabilities: this.adapterRegistry.getCapabilitiesSummary(),
    };
  }

  // ============================================
  // Project Import
  // ============================================

  @Post('import')
  async importProject(@Body() dto: ImportProjectDto, @CurrentUser() user: any) {
    this.logger.log(`Importing project from URL: ${dto.url}`);

    const context = {
      userId: user.id,
      tenantId: user.tenantId,
      options: {
        skipValidation: dto.skipValidation,
        forceUpdate: dto.forceUpdate,
        analyzeImmediately: dto.analyzeImmediately,
      },
    };

    const project = await this.importService.importFromUrl(dto.url, context);

    return {
      success: true,
      project,
    };
  }

  @Post('import/batch')
  async importBatch(@Body() dto: ImportBatchDto, @CurrentUser() user: any) {
    this.logger.log(`Batch importing ${dto.urls.length} projects`);

    const context = {
      userId: user.id,
      tenantId: user.tenantId,
      options: {
        skipValidation: dto.skipValidation,
        analyzeImmediately: dto.analyzeImmediately,
      },
    };

    const result = await this.importService.importBatch(dto.urls, context);

    return {
      success: true,
      ...result,
    };
  }

  @Post('sync/:projectId')
  async syncProject(@Param('projectId') projectId: string, @CurrentUser() user: any) {
    this.logger.log(`Syncing project: ${projectId}`);

    const context = {
      userId: user.id,
      tenantId: user.tenantId,
    };

    const project = await this.importService.syncProject(projectId, context);

    return {
      success: true,
      project,
    };
  }

  // ============================================
  // Projects List & Details
  // ============================================

  @Get('projects')
  async listProjects(@Query() filters: ListProjectsDto, @CurrentUser() user: any) {
    const projects = await this.importService.listProjects(
      user.id,
      user.tenantId,
      filters,
    );

    return {
      success: true,
      count: projects.length,
      projects,
    };
  }

  @Get('projects/:projectId')
  async getProject(@Param('projectId') projectId: string) {
    const project = await this.importService.getProjectById(projectId);

    return {
      success: true,
      project,
    };
  }

  @Delete('projects/:projectId')
  async deleteProject(@Param('projectId') projectId: string) {
    await this.importService.deleteProject(projectId);

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  }

  // ============================================
  // Analysis
  // ============================================

  @Post('analyze')
  async analyzeProject(@Body() dto: AnalyzeProjectDto, @CurrentUser() user: any) {
    this.logger.log(`Analyzing project: ${dto.projectId}`);

    const analysis = await this.analysisService.analyzeProject(
      dto.projectId,
      user.id,
      user.tenantId,
    );

    return {
      success: true,
      analysis,
    };
  }

  @Get('analyses/:projectId')
  async getAnalysis(@Param('projectId') projectId: string) {
    const analysis = await this.analysisService.getAnalysis(projectId);

    return {
      success: true,
      analysis,
    };
  }

  @Get('analyses')
  async listAnalyses(@CurrentUser() user: any) {
    const analyses = await this.analysisService.listAnalyses(user.id);

    return {
      success: true,
      count: analyses.length,
      analyses,
    };
  }

  // ============================================
  // Comparison
  // ============================================

  @Post('compare')
  async compareProjects(@Body() dto: CompareProjectsDto, @CurrentUser() user: any) {
    this.logger.log(`Comparing ${dto.projectIds.length} projects`);

    const comparison = await this.comparisonService.compareProjects(
      dto.projectIds,
      {
        weights: dto.weights || {},
        filters: dto.filters || {},
      },
      user.id,
      dto.name,
    );

    return {
      success: true,
      comparison,
    };
  }

  @Get('comparisons/:comparisonId')
  async getComparison(@Param('comparisonId') comparisonId: string) {
    const comparison = await this.comparisonService.getComparison(comparisonId);

    return {
      success: true,
      comparison,
    };
  }

  @Get('comparisons')
  async listComparisons(@CurrentUser() user: any) {
    const comparisons = await this.comparisonService.listComparisons(user.id);

    return {
      success: true,
      count: comparisons.length,
      comparisons,
    };
  }

  @Delete('comparisons/:comparisonId')
  async deleteComparison(@Param('comparisonId') comparisonId: string) {
    await this.comparisonService.deleteComparison(comparisonId);

    return {
      success: true,
      message: 'Comparison deleted successfully',
    };
  }

  // ============================================
  // Alerts
  // ============================================

  @Post('alerts')
  async createAlert(@Body() dto: CreateAlertDto, @CurrentUser() user: any) {
    this.logger.log(`Creating alert: ${dto.name}`);

    const alert = await this.alertService.createAlert(
      user.id,
      user.tenantId,
      dto.name,
      dto.criteria,
      dto.notificationChannels,
      dto.frequency,
    );

    return {
      success: true,
      alert,
    };
  }

  @Put('alerts/:alertId')
  async updateAlert(
    @Param('alertId') alertId: string,
    @Body() dto: UpdateAlertDto,
  ) {
    const alert = await this.alertService.updateAlert(alertId, dto);

    return {
      success: true,
      alert,
    };
  }

  @Get('alerts')
  async listAlerts(@CurrentUser() user: any) {
    const alerts = await this.alertService.listAlerts(user.id);

    return {
      success: true,
      count: alerts.length,
      alerts,
    };
  }

  @Get('alerts/:alertId')
  async getAlert(@Param('alertId') alertId: string) {
    const alert = await this.alertService.getAlert(alertId);

    return {
      success: true,
      alert,
    };
  }

  @Delete('alerts/:alertId')
  async deleteAlert(@Param('alertId') alertId: string) {
    await this.alertService.deleteAlert(alertId);

    return {
      success: true,
      message: 'Alert deleted successfully',
    };
  }

  // ============================================
  // Utility
  // ============================================

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      adapters: this.adapterRegistry.getSupportedPlatformsCount(),
    };
  }
}
