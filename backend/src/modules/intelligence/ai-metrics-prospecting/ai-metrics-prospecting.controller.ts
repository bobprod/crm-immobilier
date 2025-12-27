import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AIMetricsProspectingService } from './ai-metrics-prospecting.service';
import {
  ProspectingMetricsQueryDto,
  TimeSeriesQueryDto,
  ProspectingOverviewDto,
  LLMQualityMetricsDto,
  MatchingPerformanceDto,
  TimeSeriesDataPointDto,
  SourcePerformanceDto,
  CampaignPerformanceDto,
  ContactValidationMetricsDto,
  LocationPerformanceDto,
  BudgetAnalysisDto,
  TopPerformersDto,
  // Sales / Pipeline
  SalesFunnelDto,
  AppointmentsPerformanceDto,
  ConversionMetricsDto,
  ProspectsPerformanceDto,
  // Matching / Properties
  CRMMatchingPerformanceDto,
  PropertiesPerformanceDto,
  TopPropertiesDto,
  // Unified ROI
  UnifiedROIDto,
  UnifiedDashboardDto,
} from './dto';

@ApiTags('AI Metrics - Prospecting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-metrics/prospecting')
export class AIMetricsProspectingController {
  constructor(private readonly metricsService: AIMetricsProspectingService) {}

  // ============================================
  // 1. OVERVIEW - Vue d'ensemble
  // ============================================

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Vue d'ensemble des performances IA prospection",
    description:
      "Retourne les métriques clés de performance de l'IA pour la prospection : taux de couverture LLM, matches qualifiés, conversions, etc.",
  })
  @ApiResponse({ status: 200, type: ProspectingOverviewDto })
  async getOverview(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<ProspectingOverviewDto> {
    return this.metricsService.getOverview(req.user.userId, query);
  }

  // ============================================
  // 2. DISTRIBUTIONS
  // ============================================

  @Get('distributions/lead-type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Distribution des types de leads',
    description:
      'Retourne la répartition des leads par type (mandat, requete, inconnu)',
  })
  async getLeadTypeDistribution(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ) {
    return this.metricsService.getLeadTypeDistribution(req.user.userId, query);
  }

  @Get('distributions/intention')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Distribution des intentions',
    description:
      'Retourne la répartition des leads par intention (acheter, louer, vendre, investir, inconnu)',
  })
  async getIntentionDistribution(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ) {
    return this.metricsService.getIntentionDistribution(req.user.userId, query);
  }

  @Get('distributions/urgency')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Distribution des niveaux d'urgence",
    description:
      "Retourne la répartition des leads par niveau d'urgence (basse, moyenne, haute, inconnu)",
  })
  async getUrgencyDistribution(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ) {
    return this.metricsService.getUrgencyDistribution(req.user.userId, query);
  }

  @Get('distributions/validation-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Distribution des statuts de validation',
    description:
      'Retourne la répartition des leads par statut de validation (pending, valid, suspicious, spam)',
  })
  async getValidationStatusDistribution(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ) {
    return this.metricsService.getValidationStatusDistribution(req.user.userId, query);
  }

  // ============================================
  // 3. LLM QUALITY METRICS
  // ============================================

  @Get('llm-quality')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Métriques de qualité de l'analyse LLM",
    description:
      "Retourne les métriques de qualité de l'extraction LLM : distribution des scores de sériousness, taux de détection spam, complétude des données",
  })
  @ApiResponse({ status: 200, type: LLMQualityMetricsDto })
  async getLLMQualityMetrics(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<LLMQualityMetricsDto> {
    return this.metricsService.getLLMQualityMetrics(req.user.userId, query);
  }

  // ============================================
  // 4. MATCHING PERFORMANCE
  // ============================================

  @Get('matching')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance du matching',
    description:
      'Retourne les métriques de performance du matching : scores, taux de qualification, funnel de conversion des matches',
  })
  @ApiResponse({ status: 200, type: MatchingPerformanceDto })
  async getMatchingPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<MatchingPerformanceDto> {
    return this.metricsService.getMatchingPerformance(req.user.userId, query);
  }

  // ============================================
  // 5. TIME SERIES
  // ============================================

  @Get('time-series')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Données temporelles',
    description:
      'Retourne les métriques de prospection agrégées par période (jour, semaine, mois)',
  })
  @ApiQuery({
    name: 'granularity',
    enum: ['day', 'week', 'month'],
    required: false,
    description: 'Granularité temporelle (défaut: day)',
  })
  @ApiResponse({ status: 200, type: [TimeSeriesDataPointDto] })
  async getTimeSeries(
    @Request() req,
    @Query() query: TimeSeriesQueryDto,
  ): Promise<TimeSeriesDataPointDto[]> {
    return this.metricsService.getTimeSeries(req.user.userId, query);
  }

  // ============================================
  // 6. SOURCE PERFORMANCE
  // ============================================

  @Get('sources')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance par source',
    description:
      'Retourne les métriques de performance par source de données (pica, serp, meta, linkedin, firecrawl, website)',
  })
  @ApiResponse({ status: 200, type: [SourcePerformanceDto] })
  async getSourcePerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<SourcePerformanceDto[]> {
    return this.metricsService.getSourcePerformance(req.user.userId, query);
  }

  // ============================================
  // 7. CAMPAIGN PERFORMANCE
  // ============================================

  @Get('campaigns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance par campagne',
    description:
      "Retourne les métriques de performance pour chaque campagne de prospection avec un score d'efficacité global",
  })
  @ApiResponse({ status: 200, type: [CampaignPerformanceDto] })
  async getCampaignPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<CampaignPerformanceDto[]> {
    return this.metricsService.getCampaignPerformance(req.user.userId, query);
  }

  // ============================================
  // 8. CONTACT VALIDATION METRICS
  // ============================================

  @Get('validations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Métriques de validation contact',
    description:
      'Retourne les statistiques de validation des contacts (emails/téléphones) : taux de validité, spam, disposable, etc.',
  })
  @ApiResponse({ status: 200, type: ContactValidationMetricsDto })
  async getContactValidationMetrics(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<ContactValidationMetricsDto> {
    return this.metricsService.getContactValidationMetrics(req.user.userId, query);
  }

  // ============================================
  // 9. LOCATION PERFORMANCE
  // ============================================

  @Get('locations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance par localisation',
    description:
      'Retourne les métriques de performance groupées par ville/pays',
  })
  @ApiResponse({ status: 200, type: [LocationPerformanceDto] })
  async getLocationPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<LocationPerformanceDto[]> {
    return this.metricsService.getLocationPerformance(req.user.userId, query);
  }

  // ============================================
  // 10. BUDGET ANALYSIS
  // ============================================

  @Get('budget')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Analyse des budgets',
    description:
      'Retourne les statistiques de budget des leads : moyennes, distribution par tranche, taux de couverture',
  })
  @ApiResponse({ status: 200, type: BudgetAnalysisDto })
  async getBudgetAnalysis(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<BudgetAnalysisDto> {
    return this.metricsService.getBudgetAnalysis(req.user.userId, query);
  }

  // ============================================
  // 11. TOP PERFORMERS
  // ============================================

  @Get('top-performers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Top performers',
    description:
      'Retourne les meilleurs leads (par seriousnessScore), matches (par score) et campagnes (par efficacité)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de résultats par catégorie (défaut: 10)',
  })
  @ApiResponse({ status: 200, type: TopPerformersDto })
  async getTopPerformers(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
    @Query('limit') limit?: string,
  ): Promise<TopPerformersDto> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.metricsService.getTopPerformers(req.user.userId, query, limitNumber);
  }

  // ============================================
  // 12. GLOBAL SUMMARY
  // ============================================

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Résumé global',
    description:
      'Retourne un résumé complet combinant overview, distributions, qualité LLM et performance matching en un seul appel',
  })
  async getGlobalSummary(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ) {
    return this.metricsService.getGlobalSummary(req.user.userId, query);
  }

  // ============================================
  // SALES / PIPELINE ENDPOINTS
  // ============================================

  @Get('sales/funnel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Funnel de conversion complet',
    description:
      'Retourne le funnel complet : Leads → Prospects → RDVs → Visites → Offres → Contrats avec taux de conversion par étape',
  })
  @ApiResponse({ status: 200, type: SalesFunnelDto })
  async getSalesFunnel(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<SalesFunnelDto> {
    return this.metricsService.getSalesFunnel(req.user.userId, query);
  }

  @Get('sales/appointments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance des rendez-vous',
    description:
      'Retourne les métriques de RDVs : distribution par type/statut, taux de présence, note moyenne, conversions',
  })
  @ApiResponse({ status: 200, type: AppointmentsPerformanceDto })
  async getAppointmentsPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<AppointmentsPerformanceDto> {
    return this.metricsService.getAppointmentsPerformance(req.user.userId, query);
  }

  @Get('sales/conversions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Métriques de conversion',
    description:
      'Retourne les événements de conversion : total, valeur, distribution par type et source',
  })
  @ApiResponse({ status: 200, type: ConversionMetricsDto })
  async getConversionMetrics(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<ConversionMetricsDto> {
    return this.metricsService.getConversionMetrics(req.user.userId, query);
  }

  @Get('sales/prospects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance des prospects',
    description:
      'Retourne les métriques du pipeline CRM : distribution par statut/type, scores, taux de conversion',
  })
  @ApiResponse({ status: 200, type: ProspectsPerformanceDto })
  async getProspectsPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<ProspectsPerformanceDto> {
    return this.metricsService.getProspectsPerformance(req.user.userId, query);
  }

  // ============================================
  // MATCHING / PROPERTIES ENDPOINTS
  // ============================================

  @Get('crm-matching')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance du matching CRM',
    description:
      'Retourne les métriques de matching prospects ↔ propriétés : scores, distribution, corrélation score/conversion',
  })
  @ApiResponse({ status: 200, type: CRMMatchingPerformanceDto })
  async getCRMMatchingPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<CRMMatchingPerformanceDto> {
    return this.metricsService.getCRMMatchingPerformance(req.user.userId, query);
  }

  @Get('properties')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Performance des propriétés',
    description:
      'Retourne les statistiques des propriétés : distribution par statut/type/catégorie, prix moyens, taux de vente',
  })
  @ApiResponse({ status: 200, type: PropertiesPerformanceDto })
  async getPropertiesPerformance(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<PropertiesPerformanceDto> {
    return this.metricsService.getPropertiesPerformance(req.user.userId, query);
  }

  @Get('properties/top')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Top propriétés',
    description:
      'Retourne les meilleures propriétés par nombre de matches, score moyen, et récemment vendues/louées',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de résultats par catégorie (défaut: 10)',
  })
  @ApiResponse({ status: 200, type: TopPropertiesDto })
  async getTopProperties(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
    @Query('limit') limit?: string,
  ): Promise<TopPropertiesDto> {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.metricsService.getTopProperties(req.user.userId, query, limitNumber);
  }

  // ============================================
  // UNIFIED ROI / DASHBOARD ENDPOINTS
  // ============================================

  @Get('roi')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ROI unifié multi-modules',
    description:
      'Retourne le ROI global de l\'IA : coûts par module, revenus générés, coût par lead/prospect/conversion',
  })
  @ApiResponse({ status: 200, type: UnifiedROIDto })
  async getUnifiedROI(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<UnifiedROIDto> {
    return this.metricsService.getUnifiedROI(req.user.userId, query);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dashboard unifié AI Metrics',
    description:
      'Retourne un dashboard complet combinant : prospecting overview, sales funnel, CRM matching, properties et ROI avec alertes automatiques',
  })
  @ApiResponse({ status: 200, type: UnifiedDashboardDto })
  async getUnifiedDashboard(
    @Request() req,
    @Query() query: ProspectingMetricsQueryDto,
  ): Promise<UnifiedDashboardDto> {
    return this.metricsService.getUnifiedDashboard(req.user.userId, query);
  }
}
