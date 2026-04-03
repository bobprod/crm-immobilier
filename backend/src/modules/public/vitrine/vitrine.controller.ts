import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { VitrineService } from './vitrine.service';
import { VitrineTrackingService } from './services/vitrine-tracking.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto, SubmitLeadDto } from './dto';

@ApiTags('Vitrine Publique')
@Controller('vitrine')
export class VitrineController {
  constructor(
    private readonly vitrineService: VitrineService,
    private readonly vitrineTrackingService: VitrineTrackingService,
  ) {}

  // ============================================
  // ROUTES PRIVÉES (Authentifiées)
  // ============================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('config')
  @ApiOperation({ summary: 'Get vitrine configuration' })
  async getConfig(@Request() req) {
    return this.vitrineService.getConfig(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('config')
  @ApiOperation({ summary: 'Update vitrine configuration' })
  async updateConfig(@Request() req, @Body() dto: UpdateVitrineConfigDto) {
    return this.vitrineService.updateConfig(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('published-properties')
  @ApiOperation({ summary: 'Get published properties' })
  async getPublishedProperties(@Request() req) {
    return this.vitrineService.getPublishedProperties(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('properties/:id/publish')
  @ApiOperation({ summary: 'Publish a property' })
  async publishProperty(
    @Request() req,
    @Param('id') propertyId: string,
    @Body() dto: UpdatePublishedPropertyDto,
  ) {
    return this.vitrineService.publishProperty(req.user.userId, propertyId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('properties/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish a property' })
  async unpublishProperty(@Request() req, @Param('id') propertyId: string) {
    return this.vitrineService.unpublishProperty(req.user.userId, propertyId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('analytics')
  @ApiOperation({ summary: 'Get vitrine analytics' })
  async getAnalytics(@Request() req, @Query('period') period?: string) {
    return this.vitrineService.getAnalytics(req.user.userId, period);
  }

  // ============================================
  // ROUTES PUBLIQUES (Sans authentification)
  // ============================================

  @Get('public/:userId')
  @ApiOperation({ summary: 'Get public vitrine (no auth required)' })
  async getPublicVitrine(@Param('userId') userId: string) {
    return this.vitrineService.getPublicVitrine(userId);
  }

  @Get('tracking-script/:userId')
  @ApiOperation({
    summary: 'Get tracking pixels script for vitrine (no auth required)',
    description:
      'Retourne le script JavaScript contenant tous les pixels de tracking configurés pour cette agence',
  })
  async getTrackingScript(@Param('userId') userId: string, @Res() res: Response) {
    const script = await this.vitrineTrackingService.generateTrackingScript(userId);

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache 5 minutes
    res.status(HttpStatus.OK).send(script);
  }

  @Post('track-event')
  @ApiOperation({
    summary: 'Track a vitrine event (no auth required)',
    description: 'Enregistre un événement de tracking depuis une page vitrine publique',
  })
  async trackEvent(
    @Body()
    body: {
      userId: string;
      eventName: string;
      eventData: Record<string, any>;
      sessionId?: string;
    },
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    await this.vitrineTrackingService.trackVitrineEvent(body.userId, body.eventName, {
      ...body.eventData,
      sessionId: body.sessionId,
      userAgent,
      ipAddress,
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('tracking-stats')
  @ApiOperation({ summary: 'Get vitrine tracking statistics' })
  async getTrackingStats(@Request() req, @Query('period') period?: 'day' | 'week' | 'month') {
    return this.vitrineTrackingService.getVitrineTrackingStats(req.user.userId, period);
  }

  // ============================================================
  // GESTION AGENTS PUBLICS (Dashboard SaaS)
  // ============================================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('agents')
  @ApiOperation({ summary: 'Lister les profils agents publics' })
  async getAgentProfiles(@Request() req) {
    return this.vitrineService.getAgentProfiles(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('agents')
  @ApiOperation({ summary: 'Créer/modifier un profil agent public' })
  async upsertAgentProfile(@Request() req, @Body() data: any) {
    return this.vitrineService.upsertAgentProfile(req.user.userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('agents/:id')
  @ApiOperation({ summary: 'Supprimer un profil agent public' })
  async deleteAgentProfile(@Request() req, @Param('id') agentId: string) {
    return this.vitrineService.deleteAgentProfile(req.user.userId, agentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('public-leads')
  @ApiOperation({ summary: 'Leads capturés via la vitrine publique' })
  async getPublicLeads(@Request() req) {
    return this.vitrineService.getPublicLeads(req.user.userId);
  }

  // ============================================================
  // ROUTES PUBLIQUES PAR SLUG (Sans authentification)
  // ============================================================

  @Get('public/slug/:slug')
  @ApiOperation({ summary: 'Accueil vitrine publique par slug' })
  async getPublicVitrineBySlug(@Param('slug') slug: string) {
    return this.vitrineService.getPublicVitrineBySlug(slug);
  }

  @Get('public/slug/:slug/properties')
  @ApiOperation({ summary: 'Biens publiés avec filtres' })
  async getPublicProperties(
    @Param('slug') slug: string,
    @Query()
    filters: {
      type?: string;
      category?: string;
      city?: string;
      minPrice?: string;
      maxPrice?: string;
      minArea?: string;
      maxArea?: string;
      bedrooms?: string;
      sort?: string;
      page?: string;
      limit?: string;
    },
  ) {
    return this.vitrineService.getPublicPropertiesBySlug(slug, {
      type: filters.type,
      category: filters.category,
      city: filters.city,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      minArea: filters.minArea ? Number(filters.minArea) : undefined,
      maxArea: filters.maxArea ? Number(filters.maxArea) : undefined,
      bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
      sort: filters.sort,
      page: filters.page ? Number(filters.page) : 1,
      limit: filters.limit ? Number(filters.limit) : 12,
    });
  }

  @Get('public/slug/:slug/properties/:propertyRef')
  @ApiOperation({ summary: "Détail d'un bien (id ou seo slug)" })
  async getPublicPropertyDetail(
    @Param('slug') slug: string,
    @Param('propertyRef') propertyRef: string,
  ) {
    return this.vitrineService.getPublicPropertyDetail(slug, propertyRef);
  }

  @Get('public/slug/:slug/agents')
  @ApiOperation({ summary: "Équipe de l'agence" })
  async getPublicAgents(@Param('slug') slug: string) {
    return this.vitrineService.getPublicAgents(slug);
  }

  @Get('public/slug/:slug/agents/:agentId')
  @ApiOperation({ summary: 'Profil agent individuel' })
  async getPublicAgent(@Param('slug') slug: string, @Param('agentId') agentId: string) {
    return this.vitrineService.getPublicAgent(slug, agentId);
  }

  @Post('public/slug/:slug/contact')
  @ApiOperation({ summary: 'Soumettre un lead (formulaire contact/visite/estimation)' })
  async submitPublicLead(
    @Param('slug') slug: string,
    @Body() dto: SubmitLeadDto,
    @Ip() ipAddress: string,
  ) {
    return this.vitrineService.submitPublicLead(slug, dto, ipAddress);
  }

  @Get('public/slug/:slug/sitemap.xml')
  @ApiOperation({ summary: 'Sitemap XML pour SEO' })
  async getPublicSitemap(@Param('slug') slug: string, @Res() res: Response) {
    const xml = await this.vitrineService.getPublicSitemap(slug);
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(HttpStatus.OK).send(xml);
  }

  @Get('public/slug/:slug/robots.txt')
  @ApiOperation({ summary: 'robots.txt pour SEO' })
  async getRobots(@Param('slug') slug: string, @Res() res: Response) {
    const baseUrl = `https://${slug}.${process.env.APP_DOMAIN || 'app.example.com'}`;
    const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
    res.setHeader('Content-Type', 'text/plain');
    res.status(HttpStatus.OK).send(robots);
  }
}
