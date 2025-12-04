import { Controller, Get, Query, UseGuards, Request, Res, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AIMetricsService } from './ai-metrics.service';
import { ProspectingMetricsService } from './prospecting-metrics.service';
import {
  ProspectingMetricsQueryDto,
  TimelineQueryDto,
  TopPerformersQueryDto,
  ExportQueryDto,
} from './dto/prospecting-metrics.dto';

@ApiTags('AI Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-metrics')
export class AIMetricsController {
  constructor(
    private aiMetricsService: AIMetricsService,
    private prospectingMetricsService: ProspectingMetricsService,
  ) {}

  // ============================================
  // EXISTING LLM COST TRACKING ROUTES
  // ============================================

  @Get('by-agent')
  @ApiOperation({ summary: 'Obtenir les métriques par agent IA' })
  getMetricsByAgent(@Request() req) {
    return this.aiMetricsService.getMetricsByAgent(req.user.userId);
  }

  @Get('roi')
  @ApiOperation({ summary: "Calculer le ROI de l'IA" })
  getAIROI(@Request() req) {
    return this.aiMetricsService.getAIROI(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtenir les statistiques globales' })
  getGlobalStats(@Request() req) {
    return this.aiMetricsService.getGlobalStats(req.user.userId);
  }

  @Get('history')
  @ApiOperation({ summary: "Obtenir l'historique d'utilisation" })
  getUsageHistory(@Request() req, @Query('days') days?: string) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.aiMetricsService.getUsageHistory(req.user.userId, daysNumber);
  }

  @Get('conversions')
  @ApiOperation({ summary: 'Obtenir les conversions récentes' })
  getRecentConversions(@Request() req, @Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.aiMetricsService.getRecentConversions(req.user.userId, limitNumber);
  }

  // ============================================
  // PROSPECTING AI ANALYTICS ROUTES
  // ============================================

  @Get('prospecting/overview')
  @ApiOperation({ summary: 'Résumé global de la prospection IA (KPIs principaux)' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'Date ISO début' })
  @ApiQuery({ name: 'to', required: false, description: 'Date ISO fin' })
  getProspectingOverview(@Request() req, @Query() query: ProspectingMetricsQueryDto) {
    return this.prospectingMetricsService.getOverview(req.user.userId, query);
  }

  @Get('prospecting/by-source')
  @ApiOperation({ summary: 'Statistiques agrégées par source de scraping' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProspectingBySource(@Request() req, @Query() query: ProspectingMetricsQueryDto) {
    return this.prospectingMetricsService.getBySource(req.user.userId, query);
  }

  @Get('prospecting/by-campaign')
  @ApiOperation({ summary: 'Statistiques agrégées par campagne' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProspectingByCampaign(@Request() req, @Query() query: ProspectingMetricsQueryDto) {
    return this.prospectingMetricsService.getByCampaign(req.user.userId, query);
  }

  @Get('prospecting/quality')
  @ApiOperation({ summary: "Précision de l'IA (spam detection, lead validation)" })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProspectingQuality(@Request() req, @Query() query: ProspectingMetricsQueryDto) {
    return this.prospectingMetricsService.getQuality(req.user.userId, query);
  }

  @Get('prospecting/score-distribution')
  @ApiOperation({ summary: 'Distribution des scores (seriousness + match)' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProspectingScoreDistribution(@Request() req, @Query() query: ProspectingMetricsQueryDto) {
    return this.prospectingMetricsService.getScoreDistribution(req.user.userId, query);
  }

  @Get('prospecting/timeline')
  @ApiOperation({ summary: 'Évolution temporelle des métriques' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day', 'week', 'month'] })
  getProspectingTimeline(@Request() req, @Query() query: TimelineQueryDto) {
    return this.prospectingMetricsService.getTimeline(
      req.user.userId,
      query,
      query.granularity || 'day',
    );
  }

  @Get('prospecting/top-performers')
  @ApiOperation({ summary: 'Top 5 campagnes, sources et villes' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre de résultats (défaut: 5)' })
  getProspectingTopPerformers(@Request() req, @Query() query: TopPerformersQueryDto) {
    const limit = query.limit ? parseInt(query.limit) : 5;
    return this.prospectingMetricsService.getTopPerformers(req.user.userId, query, limit);
  }

  @Get('prospecting/insights')
  @ApiOperation({ summary: 'Insights et recommandations automatiques' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getProspectingInsights(@Request() req, @Query() query: ProspectingMetricsQueryDto) {
    return this.prospectingMetricsService.getInsights(req.user.userId, query);
  }

  @Get('prospecting/export')
  @ApiOperation({ summary: 'Export CSV des métriques' })
  @ApiQuery({ name: 'agencyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx'] })
  @Header('Content-Type', 'text/csv')
  async exportProspectingData(
    @Request() req,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const result = await this.prospectingMetricsService.exportData(req.user.userId, query);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Type', result.mimeType);
    res.send(result.content);
  }
}
