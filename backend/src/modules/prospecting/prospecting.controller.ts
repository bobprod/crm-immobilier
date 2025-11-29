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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { ProspectingService } from './prospecting.service';
import { ProspectingIntegrationService } from './prospecting-integration.service';
import { LLMProspectingService } from './llm-prospecting.service';
import {
  CreateCampaignDto,
  UpdateLeadDto,
  ValidateEmailsDto,
  FunnelConfigDto,
  RawScrapedItem,
} from './dto';

@ApiTags('Prospecting - Prospection Intelligente')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospecting')
export class ProspectingController {
  constructor(
    private readonly prospectingService: ProspectingService,
    private readonly integrationService: ProspectingIntegrationService,
    private readonly llmService: LLMProspectingService,
  ) {}

  // ============================================
  // CAMPAIGNS - Campagnes de prospection
  // ============================================

  @Post('campaigns')
  @ApiOperation({ summary: 'Creer une nouvelle campagne de prospection' })
  createCampaign(@Request() req, @Body() data: CreateCampaignDto) {
    return this.prospectingService.createCampaign(req.user.userId, data);
  }

  @Get('campaigns')
  @ApiOperation({ summary: 'Lister toutes les campagnes' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  getCampaigns(
    @Request() req,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.prospectingService.getCampaigns(req.user.userId, { status, type });
  }

  @Get('campaigns/:id')
  @ApiOperation({ summary: 'Obtenir une campagne par ID' })
  getCampaignById(@Request() req, @Param('id') id: string) {
    return this.prospectingService.getCampaignById(req.user.userId, id);
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: 'Mettre a jour une campagne' })
  updateCampaign(
    @Request() req,
    @Param('id') id: string,
    @Body() data: Partial<CreateCampaignDto>,
  ) {
    return this.prospectingService.updateCampaign(req.user.userId, id, data);
  }

  @Delete('campaigns/:id')
  @ApiOperation({ summary: 'Supprimer une campagne' })
  deleteCampaign(@Request() req, @Param('id') id: string) {
    return this.prospectingService.deleteCampaign(req.user.userId, id);
  }

  @Post('campaigns/:id/start')
  @ApiOperation({ summary: 'Demarrer une campagne de prospection' })
  startCampaign(@Request() req, @Param('id') id: string) {
    return this.prospectingService.startCampaign(req.user.userId, id);
  }

  @Post('campaigns/:id/pause')
  @ApiOperation({ summary: 'Mettre en pause une campagne' })
  pauseCampaign(@Request() req, @Param('id') id: string) {
    return this.prospectingService.pauseCampaign(req.user.userId, id);
  }

  @Post('campaigns/:id/resume')
  @ApiOperation({ summary: 'Reprendre une campagne en pause' })
  resumeCampaign(@Request() req, @Param('id') id: string) {
    return this.prospectingService.startCampaign(req.user.userId, id);
  }

  @Get('campaigns/:id/stats')
  @ApiOperation({ summary: 'Statistiques d une campagne' })
  getCampaignStats(@Request() req, @Param('id') id: string) {
    return this.prospectingService.getCampaignStats(req.user.userId, id);
  }

  // ============================================
  // LEADS - Leads generes
  // ============================================

  @Get('campaigns/:campaignId/leads')
  @ApiOperation({ summary: 'Lister les leads d une campagne' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'minScore', required: false })
  @ApiQuery({ name: 'leadType', required: false, description: 'requete ou mandat' })
  @ApiQuery({ name: 'limit', required: false })
  getLeads(
    @Request() req,
    @Param('campaignId') campaignId: string,
    @Query('status') status?: string,
    @Query('minScore') minScore?: string,
    @Query('leadType') leadType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.prospectingService.getLeads(req.user.userId, campaignId, {
      status,
      minScore,
      leadType,
      limit,
    });
  }

  @Get('leads/:id')
  @ApiOperation({ summary: 'Obtenir un lead par ID' })
  getLeadById(@Request() req, @Param('id') id: string) {
    return this.prospectingService.getLeadById(req.user.userId, id);
  }

  @Put('leads/:id')
  @ApiOperation({ summary: 'Mettre a jour un lead' })
  updateLead(
    @Request() req,
    @Param('id') id: string,
    @Body() data: UpdateLeadDto,
  ) {
    return this.prospectingService.updateLead(req.user.userId, id, data);
  }

  @Delete('leads/:id')
  @ApiOperation({ summary: 'Supprimer un lead' })
  deleteLead(@Request() req, @Param('id') id: string) {
    return this.prospectingService.deleteLead(req.user.userId, id);
  }

  @Post('leads/:id/convert')
  @ApiOperation({ summary: 'Convertir un lead en prospect' })
  convertLead(@Request() req, @Param('id') id: string) {
    return this.prospectingService.convertLeadToProspect(req.user.userId, id);
  }

  @Post('leads/:id/qualify')
  @ApiOperation({ summary: 'Qualifier un lead avec l IA' })
  qualifyLead(@Request() req, @Param('id') id: string) {
    return this.integrationService.qualifyLeadWithAI(req.user.userId, id);
  }

  @Post('leads/:id/enrich')
  @ApiOperation({ summary: 'Enrichir les donnees d un lead' })
  enrichLead(@Request() req, @Param('id') id: string) {
    return this.integrationService.enrichLead(req.user.userId, id);
  }

  // ============================================
  // MATCHING - Correspondances leads/biens
  // ============================================

  @Post('leads/:id/find-matches')
  @ApiOperation({ summary: 'Trouver des biens correspondants pour un lead' })
  findMatches(@Request() req, @Param('id') id: string) {
    return this.prospectingService.findMatchesForLead(req.user.userId, id);
  }

  @Get('leads/:id/matches')
  @ApiOperation({ summary: 'Lister les correspondances d un lead' })
  getLeadMatches(@Request() req, @Param('id') id: string) {
    return this.prospectingService.getLeadMatches(req.user.userId, id);
  }

  @Post('matches/:id/notify')
  @ApiOperation({ summary: 'Notifier un match' })
  notifyMatch(@Request() req, @Param('id') id: string) {
    return this.prospectingService.notifyMatch(req.user.userId, id);
  }

  @Put('matches/:id/status')
  @ApiOperation({ summary: 'Mettre a jour le statut d un match' })
  updateMatchStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.prospectingService.updateMatchStatus(req.user.userId, id, status);
  }

  // ============================================
  // SOURCES - Sources de donnees
  // ============================================

  @Get('sources')
  @ApiOperation({ summary: 'Lister les sources de prospection disponibles' })
  getSources(@Request() req) {
    return this.integrationService.getAvailableSources(req.user.userId);
  }

  @Post('sources/test')
  @ApiOperation({ summary: 'Tester une source de prospection' })
  testSource(@Request() req, @Body('source') source: string) {
    return this.integrationService.testSource(req.user.userId, source);
  }

  // ============================================
  // SCRAPING - Extraction de donnees
  // ============================================

  @Post('scrape/serp')
  @ApiOperation({ summary: 'Scraper via SERP API (Google)' })
  scrapeSERP(@Request() req, @Body() config: FunnelConfigDto) {
    return this.integrationService.scrapeFromSERP(req.user.userId, config);
  }

  @Post('scrape/firecrawl')
  @ApiOperation({ summary: 'Scraper via Firecrawl' })
  scrapeFirecrawl(
    @Request() req,
    @Body() data: { urls: string[]; config?: any },
  ) {
    return this.integrationService.scrapeWithFirecrawl(req.user.userId, data.urls, data.config);
  }

  @Post('scrape/pica')
  @ApiOperation({ summary: 'Scraper via Pica API (SERP + Firecrawl combines)' })
  scrapePica(@Request() req, @Body() config: FunnelConfigDto) {
    return this.integrationService.scrapeWithPica(req.user.userId, config);
  }

  @Post('scrape/social')
  @ApiOperation({ summary: 'Scraper les reseaux sociaux (Meta, LinkedIn)' })
  scrapeSocial(
    @Request() req,
    @Body() data: { platform: string; query: string; config?: any },
  ) {
    return this.integrationService.scrapeFromSocial(req.user.userId, data);
  }

  @Post('scrape/websites')
  @ApiOperation({ summary: 'Scraper des sites web specifiques' })
  scrapeWebsites(
    @Request() req,
    @Body() data: { urls: string[]; selectors?: any },
  ) {
    return this.integrationService.scrapeWebsites(req.user.userId, data.urls, data.selectors);
  }

  // ============================================
  // AI DETECTION - Detection IA
  // ============================================

  @Post('ai/detect-opportunities')
  @ApiOperation({ summary: 'Detecter des opportunites avec l IA' })
  detectOpportunities(@Request() req, @Body() config: FunnelConfigDto) {
    return this.integrationService.detectOpportunitiesWithAI(req.user.userId, config);
  }

  @Post('ai/analyze-content')
  @ApiOperation({ summary: 'Analyser du contenu pour extraire des leads' })
  analyzeContent(
    @Request() req,
    @Body() data: { content: string; source?: string },
  ) {
    return this.integrationService.analyzeContentForLeads(req.user.userId, data.content, data.source);
  }

  @Post('ai/classify-lead')
  @ApiOperation({ summary: 'Classifier un lead (requete/mandat)' })
  classifyLead(@Request() req, @Body() data: { leadId: string }) {
    return this.integrationService.classifyLead(req.user.userId, data.leadId);
  }

  // ============================================
  // LLM PROSPECTING - Pipeline IA structure
  // ============================================

  @Post('llm/analyze-item')
  @ApiOperation({ summary: 'Analyser un element scrappe avec le LLM' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        source: { type: 'string', example: 'facebook' },
        text: { type: 'string', example: 'Je cherche un appartement S+2 a La Marsa...' },
        url: { type: 'string', example: 'https://facebook.com/post/123' },
        title: { type: 'string', example: 'Recherche appartement' },
        authorName: { type: 'string', example: 'Ahmed Ben Ali' },
      },
      required: ['source', 'text'],
    },
  })
  async analyzeRawItem(@Body() item: RawScrapedItem) {
    return this.llmService.analyzeRawItem(item);
  }

  @Post('llm/build-lead')
  @ApiOperation({ summary: 'Construire un lead structure a partir d un element scrappe' })
  async buildLeadFromRaw(@Body() item: RawScrapedItem) {
    return this.llmService.buildProspectingLeadFromRaw(item);
  }

  @Post('llm/analyze-batch')
  @ApiOperation({ summary: 'Analyser un batch d elements scrappes' })
  async analyzeBatch(@Body() data: { items: RawScrapedItem[] }) {
    return this.llmService.analyzeBatch(data.items);
  }

  @Post('campaigns/:campaignId/ingest')
  @ApiOperation({ summary: 'Ingerer des elements scrappes dans une campagne via le pipeline LLM' })
  async ingestScrapedItems(
    @Request() req,
    @Param('campaignId') campaignId: string,
    @Body() data: { items: RawScrapedItem[] },
  ) {
    return this.integrationService.ingestScrapedItems(
      req.user.userId,
      campaignId,
      data.items,
    );
  }

  @Post('campaigns/:campaignId/scrape-and-ingest')
  @ApiOperation({ summary: 'Scraper une source et ingerer les resultats via le pipeline LLM' })
  async scrapeAndIngest(
    @Request() req,
    @Param('campaignId') campaignId: string,
    @Body() data: { source: string; config: any },
  ) {
    return this.integrationService.scrapeAndIngest(
      req.user.userId,
      campaignId,
      data.source,
      data.config,
    );
  }

  // ============================================
  // STATISTICS - Statistiques
  // ============================================

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales de prospection' })
  getStats(@Request() req) {
    return this.prospectingService.getGlobalStats(req.user.userId);
  }

  @Get('stats/sources')
  @ApiOperation({ summary: 'Statistiques par source' })
  getStatsBySource(@Request() req) {
    return this.prospectingService.getStatsBySource(req.user.userId);
  }

  @Get('stats/conversion')
  @ApiOperation({ summary: 'Statistiques de conversion' })
  getConversionStats(@Request() req) {
    return this.prospectingService.getConversionStats(req.user.userId);
  }

  @Get('stats/roi')
  @ApiOperation({ summary: 'ROI de la prospection' })
  getROIStats(@Request() req) {
    return this.prospectingService.getROIStats(req.user.userId);
  }

  // ============================================
  // UTILS - Utilitaires
  // ============================================

  @Post('validate-emails')
  @ApiOperation({ summary: 'Valider une liste d emails' })
  validateEmails(@Request() req, @Body() data: ValidateEmailsDto) {
    return this.prospectingService.validateEmails(data.emails);
  }

  @Post('validate-phones')
  @ApiOperation({ summary: 'Valider une liste de telephones' })
  validatePhones(@Request() req, @Body() data: { phones: string[] }) {
    return this.integrationService.validatePhones(data.phones);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Obtenir les localisations disponibles' })
  getLocations(@Query('country') country?: string) {
    return this.prospectingService.getLocations(country);
  }

  @Post('deduplicate')
  @ApiOperation({ summary: 'Dedupliquer les leads' })
  deduplicateLeads(@Request() req, @Body() data: { campaignId?: string }) {
    return this.prospectingService.deduplicateLeads(req.user.userId, data.campaignId);
  }

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  @Get('export/:campaignId')
  @ApiOperation({ summary: 'Exporter les leads d une campagne' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'xlsx', 'json'] })
  exportLeads(
    @Request() req,
    @Param('campaignId') campaignId: string,
    @Query('format') format = 'csv',
  ) {
    return this.prospectingService.exportLeads(req.user.userId, campaignId, format);
  }

  @Post('import')
  @ApiOperation({ summary: 'Importer des leads' })
  importLeads(
    @Request() req,
    @Body() data: { campaignId: string; leads: any[] },
  ) {
    return this.prospectingService.importLeads(req.user.userId, data.campaignId, data.leads);
  }
}
