import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { TrackingProspectionAiService } from './tracking-prospection-ai.service';

@ApiTags('Tracking Prospection AI')
@Controller('marketing-tracking/prospection')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrackingProspectionAiController {
  constructor(
    private readonly trackingProspectionAiService: TrackingProspectionAiService,
  ) {}

  @Post('qualify-lead')
  @ApiOperation({
    summary: 'Qualifier un lead issu du tracking avec IA',
    description:
      'Analyse le comportement du visiteur et qualifie le lead avec notation A/B/C/D',
  })
  async qualifyLead(
    @Request() req,
    @Body()
    body: {
      leadData: any;
      sessionId: string;
      propertyId?: string;
    },
  ) {
    const userId = req.user.userId;
    return this.trackingProspectionAiService.qualifyTrackingLead(
      userId,
      body.leadData,
    );
  }

  @Post('create-campaign')
  @ApiOperation({
    summary: 'Créer une campagne de prospection basée sur les comportements',
    description:
      'Analyse les comportements des visiteurs et crée une campagne ciblée',
  })
  async createCampaign(
    @Request() req,
    @Body()
    body: {
      criteria: {
        minProperties?: number;
        minTimeSpent?: number;
        minButtonClicks?: number;
        behaviorPattern?: string;
        period?: string;
      };
      campaignName: string;
      campaignType?: string;
    },
  ) {
    const userId = req.user.userId;
    return this.trackingProspectionAiService.createBehaviorBasedCampaign(
      userId,
      body.criteria,
      body.campaignName,
      body.campaignType,
    );
  }

  @Get('recommendations/:sessionId')
  @ApiOperation({
    summary: 'Obtenir des recommandations d\'actions de prospection',
    description:
      'Analyse une session et recommande les meilleures actions à entreprendre',
  })
  async getRecommendations(
    @Request() req,
    @Param('sessionId') sessionId: string,
  ) {
    const userId = req.user.userId;
    return this.trackingProspectionAiService.recommendProspectionActions(
      userId,
      sessionId,
    );
  }

  @Get('hot-leads')
  @ApiOperation({
    summary: 'Obtenir la liste des hot leads actuels',
    description:
      'Retourne les visiteurs actifs avec forte probabilité de conversion',
  })
  async getHotLeads(
    @Request() req,
    @Query('hours') hours?: string,
    @Query('minScore') minScore?: string,
  ) {
    const userId = req.user.userId;
    const hoursNum = hours ? parseInt(hours) : 24;
    const minScoreNum = minScore ? parseInt(minScore) : 70;

    // Récupérer les sessions actives récentes
    const sessions =
      await this.trackingProspectionAiService.getActiveSessions(
        userId,
        hoursNum,
      );

    // Filtrer par score
    const hotLeads = [];
    for (const session of sessions) {
      const recommendations =
        await this.trackingProspectionAiService.recommendProspectionActions(
          userId,
          session.sessionId,
        );

      if (recommendations.leadScore >= minScoreNum) {
        hotLeads.push({
          sessionId: session.sessionId,
          score: recommendations.leadScore,
          metrics: session.metrics,
          recommendations: recommendations.recommendations,
          topProperties: recommendations.topProperties,
        });
      }
    }

    return {
      totalHotLeads: hotLeads.length,
      minScore: minScoreNum,
      period: `${hoursNum}h`,
      hotLeads: hotLeads.sort((a, b) => b.score - a.score),
    };
  }

  @Get('behavior-insights')
  @ApiOperation({
    summary: 'Obtenir les insights comportementaux globaux',
    description: 'Analyse les patterns de comportement des visiteurs',
  })
  async getBehaviorInsights(
    @Request() req,
    @Query('period') period?: string,
  ) {
    const userId = req.user.userId;
    const periodValue = period || 'week';

    // Calculer la date de début selon la période
    const startDate = new Date();
    if (periodValue === 'day') {
      startDate.setDate(startDate.getDate() - 1);
    } else if (periodValue === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (periodValue === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }

    return this.trackingProspectionAiService.getBehaviorInsights(
      userId,
      startDate,
    );
  }
}
