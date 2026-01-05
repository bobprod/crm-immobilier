import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { AITrackingInsightsService } from './ai-tracking-insights.service';

@ApiTags('AI Tracking Insights')
@Controller('marketing-tracking/ai-insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AITrackingInsightsController {
  constructor(
    private readonly aiInsightsService: AITrackingInsightsService,
  ) {}

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Generate AI insights for a specific property' })
  async getPropertyInsights(
    @Request() req,
    @Param('propertyId') propertyId: string,
  ) {
    return this.aiInsightsService.generatePropertyInsights(
      req.user.userId,
      propertyId,
    );
  }

  @Get('global')
  @ApiOperation({ summary: 'Generate global AI insights for all properties' })
  async getGlobalInsights(@Request() req) {
    return this.aiInsightsService.generateGlobalInsights(req.user.userId);
  }

  @Get('anomalies')
  @ApiOperation({ summary: 'Detect anomalies in visitor behavior' })
  async detectAnomalies(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    return this.aiInsightsService.detectAnomalies(
      req.user.userId,
      period || 'week',
    );
  }

  @Get('predictions/conversions')
  @ApiOperation({ summary: 'Predict potential conversions from active sessions' })
  async predictConversions(@Request() req) {
    return this.aiInsightsService.predictConversions(req.user.userId);
  }
}
