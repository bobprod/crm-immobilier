import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AIMetricsService } from './ai-metrics.service';

@ApiTags('AI Metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-metrics')
export class AIMetricsController {
  constructor(private aiMetricsService: AIMetricsService) {}

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
}
