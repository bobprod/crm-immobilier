import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { ScrapingQueueService } from './scraping-queue.service';
import { BehavioralSignalsService } from './behavioral-signals.service';
import { FacebookMarketplaceSearch } from './browserless.service';

/**
 * Controller pour la prospection comportementale
 *
 * Endpoints pour:
 * - Scraping Facebook Marketplace avec intention d'achat
 * - Scoring comportemental des prospects
 * - Suivi des jobs de scraping/scoring
 */

class FacebookMarketplaceSearchDto implements FacebookMarketplaceSearch {
  query: string;
  location: string;
  minPrice?: number;
  maxPrice?: number;
  category?: 'property_for_sale' | 'property_rentals';
  radius?: number;
  limit?: number;
}

class GenericScrapingDto {
  url: string;
  selectors: { [key: string]: string };
}

class BehavioralScoringDto {
  prospectId: string;
  forceRecalculate?: boolean;
}

@ApiTags('Behavioral Prospecting')
@ApiBearerAuth()
@Controller('prospecting/behavioral')
@UseGuards(JwtAuthGuard)
export class BehavioralProspectingController {
  constructor(
    private readonly scrapingQueueService: ScrapingQueueService,
    private readonly behavioralSignalsService: BehavioralSignalsService,
  ) { }

  /**
   * ==================== SCRAPING ====================
   */

  /**
   * Lancer un scraping Facebook Marketplace avec scoring comportemental
   */
  @Post('scrape/facebook-marketplace')
  @ApiOperation({
    summary: 'Scraper Facebook Marketplace et scorer les prospects',
    description:
      'Lance un job de scraping sur Facebook Marketplace pour trouver des annonces immobilières, puis calcule automatiquement le score d\'intention d\'achat pour chaque prospect trouvé.',
  })
  @ApiBody({ type: FacebookMarketplaceSearchDto })
  @ApiResponse({
    status: 201,
    description: 'Job de scraping créé avec succès',
    schema: {
      example: {
        jobId: '123',
        status: 'waiting',
        message: 'Scraping job queued successfully',
        estimatedProspects: '20-50',
      },
    },
  })
  async scrapeFacebookMarketplace(
    @Request() req,
    @Body() search: FacebookMarketplaceSearchDto,
  ) {
    const job = await this.scrapingQueueService.queueFacebookMarketplaceScraping(
      search,
      req.user.userId,
    );

    return {
      jobId: job.id,
      status: await job.getState(),
      message: 'Facebook Marketplace scraping job queued successfully',
      search: {
        query: search.query,
        location: search.location,
        category: search.category,
        priceRange: search.minPrice
          ? `${search.minPrice} - ${search.maxPrice || '∞'}`
          : 'Any',
      },
      estimatedDuration: '1-3 minutes',
      estimatedProspects: search.limit || 20,
    };
  }

  /**
   * Lancer un scraping générique avec sélecteurs custom
   */
  @Post('scrape/generic')
  @ApiOperation({
    summary: 'Scraper un site web avec sélecteurs personnalisés',
  })
  @ApiBody({ type: GenericScrapingDto })
  @ApiResponse({ status: 201, description: 'Job de scraping créé' })
  async scrapeGeneric(@Request() req, @Body() data: GenericScrapingDto) {
    const job = await this.scrapingQueueService.queueGenericScraping(
      data.url,
      data.selectors,
      req.user.userId,
    );

    return {
      jobId: job.id,
      status: await job.getState(),
      message: 'Generic scraping job queued successfully',
      url: data.url,
    };
  }

  /**
   * ==================== SCORING ====================
   */

  /**
   * Calculer le score comportemental d'un prospect
   */
  @Post('score/:prospectId')
  @ApiOperation({
    summary: 'Calculer le score d\'intention d\'achat d\'un prospect',
    description:
      'Analyse les signaux comportementaux d\'un prospect (activité, messages, engagement) et calcule un score d\'intention d\'achat de 0 à 100.',
  })
  @ApiParam({ name: 'prospectId', description: 'ID du prospect' })
  @ApiBody({ type: BehavioralScoringDto })
  @ApiResponse({
    status: 201,
    description: 'Job de scoring créé',
    schema: {
      example: {
        jobId: '456',
        prospectId: 'abc123',
        status: 'waiting',
        message: 'Scoring job queued',
      },
    },
  })
  async scoreProspect(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() data: BehavioralScoringDto,
  ) {
    const job = await this.scrapingQueueService.queueBehavioralScoring(
      prospectId,
      req.user.userId,
      data.forceRecalculate,
    );

    return {
      jobId: job.id,
      prospectId,
      status: await job.getState(),
      message: 'Behavioral scoring job queued successfully',
      forceRecalculate: data.forceRecalculate || false,
    };
  }

  /**
   * Calculer le score pour plusieurs prospects en batch
   */
  @Post('score/batch')
  @ApiOperation({ summary: 'Scorer plusieurs prospects en batch' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prospectIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['abc123', 'def456', 'ghi789'],
        },
        forceRecalculate: { type: 'boolean', default: false },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Jobs de scoring créés' })
  async scoreProspectsBatch(
    @Request() req,
    @Body() data: { prospectIds: string[]; forceRecalculate?: boolean },
  ) {
    const jobs = await Promise.all(
      data.prospectIds.map((prospectId) =>
        this.scrapingQueueService.queueBehavioralScoring(
          prospectId,
          req.user.userId,
          data.forceRecalculate,
        ),
      ),
    );

    return {
      message: `${jobs.length} scoring jobs queued successfully`,
      jobs: jobs.map((job) => ({
        jobId: job.id,
        prospectId: job.data.prospectId,
      })),
      totalJobs: jobs.length,
    };
  }

  /**
   * ==================== JOBS MONITORING ====================
   */

  /**
   * Obtenir le statut d'un job
   */
  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Obtenir le statut d\'un job de scraping/scoring' })
  @ApiParam({ name: 'jobId', description: 'ID du job' })
  @ApiResponse({
    status: 200,
    description: 'Statut du job',
    schema: {
      example: {
        jobId: '123',
        type: 'facebook_marketplace',
        status: 'completed',
        progress: 100,
        result: {
          success: true,
          prospectsFound: 25,
          prospectsScored: 25,
          hotLeads: 3,
          warmLeads: 8,
        },
        createdAt: '2025-12-07T10:00:00Z',
        completedAt: '2025-12-07T10:02:30Z',
        duration: '2m 30s',
      },
    },
  })
  async getJobStatus(@Param('jobId') jobId: string) {
    // Note: Nécessite d'injecter les queues directement pour accéder aux jobs
    // Pour l'instant, retour d'une structure de base
    return {
      jobId,
      message: 'Job status endpoint - implementation in progress',
      note: 'This endpoint will return detailed job status including progress, results, and errors',
    };
  }

  /**
   * Obtenir les statistiques des queues
   */
  @Get('stats/queues')
  @ApiOperation({ summary: 'Statistiques des queues de scraping et scoring' })
  @ApiResponse({
    status: 200,
    description: 'Statistiques des queues',
    schema: {
      example: {
        scraping: {
          waiting: 5,
          active: 2,
          completed: 142,
          failed: 3,
        },
        scoring: {
          waiting: 12,
          active: 5,
          completed: 856,
          failed: 8,
        },
        timestamp: '2025-12-07T10:00:00Z',
      },
    },
  })
  async getQueueStats() {
    return this.scrapingQueueService.getQueueStats();
  }

  /**
   * ==================== ANALYTICS ====================
   */

  /**
   * Obtenir les leads à forte intention d'achat (hot leads)
   */
  @Get('leads/hot')
  @ApiOperation({
    summary: 'Obtenir les prospects à forte intention d\'achat',
    description: 'Liste des prospects avec score d\'intention ≥ 80/100 (hot leads)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Nombre de résultats',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des hot leads',
    schema: {
      example: {
        leads: [
          {
            id: 'abc123',
            name: 'Jean Dupont',
            score: 92,
            quality: 'hot',
            signals: [
              'Budget mentionné',
              'Critères précis',
              'Contact fréquent',
              'Urgence élevée',
            ],
            lastActivity: '2025-12-07T09:45:00Z',
            recommendedAction: 'Appel téléphonique immédiat',
            responseTime: 'Under 1 hour',
          },
        ],
        total: 8,
        averageScore: 86.5,
      },
    },
  })
  async getHotLeads(@Request() req, @Query('limit') limit?: string) {
    // Cette méthode nécessiterait le PrismaService pour requêter la DB
    // Pour l'instant, retour d'une structure de base
    return {
      message: 'Hot leads endpoint - implementation in progress',
      note: 'This endpoint will return prospects with intention score >= 80',
      filter: {
        quality: 'hot',
        minScore: 80,
        limit: limit ? parseInt(limit) : 20,
      },
    };
  }

  /**
   * Obtenir les signaux comportementaux détectés
   */
  @Get('signals/:prospectId')
  @ApiOperation({
    summary: 'Obtenir les signaux comportementaux d\'un prospect',
    description:
      'Liste détaillée des signaux d\'intention d\'achat détectés pour un prospect',
  })
  @ApiParam({ name: 'prospectId', description: 'ID du prospect' })
  @ApiResponse({
    status: 200,
    description: 'Signaux comportementaux',
    schema: {
      example: {
        prospectId: 'abc123',
        score: 85,
        quality: 'hot',
        signals: [
          {
            type: 'financial_indicators',
            detected: true,
            impact: '+30',
            evidence: ['Budget de 250k TND mentionné', 'Apport de 50k'],
          },
          {
            type: 'urgency',
            detected: true,
            impact: 'x1.3',
            evidence: ['Mots-clés: urgent, cette semaine'],
          },
          {
            type: 'precise_criteria',
            detected: true,
            impact: '+25',
            evidence: ['3 pièces', '100m²', 'parking', 'jardin'],
          },
        ],
        breakdown: {
          baseScore: 15,
          behavioralScore: 35,
          contextualScore: 20,
          urgencyMultiplier: 1.3,
          financialBonus: 20,
          negativePenalty: 0,
        },
        recommendations: [
          'Appel téléphonique dans l\'heure',
          'Préparer sélection de biens correspondants',
          'Vérifier disponibilité pour visite cette semaine',
        ],
      },
    },
  })
  async getProspectSignals(@Param('prospectId') prospectId: string) {
    return {
      message: 'Prospect signals endpoint - implementation in progress',
      prospectId,
      note: 'This endpoint will return detailed behavioral signals analysis',
    };
  }

  /**
   * Obtenir un dashboard de prospection comportementale
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Dashboard de prospection comportementale',
    description:
      'Vue d\'ensemble des performances de prospection avec signaux comportementaux',
  })
  @ApiResponse({
    status: 200,
    description: 'Données du dashboard',
    schema: {
      example: {
        overview: {
          totalProspects: 1247,
          hotLeads: 42,
          warmLeads: 186,
          qualifiedLeads: 312,
          averageScore: 38.5,
        },
        scrapingSources: {
          facebook_marketplace: {
            prospectsFound: 856,
            hotLeadsRate: '4.2%',
            averageScore: 41.2,
          },
          pica: { prospectsFound: 245, hotLeadsRate: '2.8%', averageScore: 35.8 },
          serp: { prospectsFound: 146, hotLeadsRate: '1.4%', averageScore: 28.3 },
        },
        topSignals: [
          { signal: 'Budget mentionné', count: 324, avgScoreImpact: '+28' },
          { signal: 'Critères précis', count: 512, avgScoreImpact: '+22' },
          { signal: 'Urgence élevée', count: 89, avgScoreImpact: 'x1.4' },
        ],
        recentActivity: {
          last24h: {
            prospectsScraped: 125,
            prospectsScored: 125,
            hotLeadsFound: 5,
          },
          last7days: {
            prospectsScraped: 634,
            prospectsScored: 634,
            hotLeadsFound: 23,
          },
        },
        queueStatus: {
          scrapingJobsPending: 3,
          scoringJobsPending: 8,
          activeJobs: 2,
        },
      },
    },
  })
  async getDashboard(@Request() req) {
    return {
      message: 'Behavioral prospecting dashboard - implementation in progress',
      note: 'This endpoint will return comprehensive prospecting analytics',
    };
  }
}
