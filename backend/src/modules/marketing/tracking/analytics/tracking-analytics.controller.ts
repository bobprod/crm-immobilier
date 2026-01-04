import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { TrackingAnalyticsService } from './tracking-analytics.service';

@ApiTags('Tracking Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketing-tracking/analytics')
export class TrackingAnalyticsController {
  constructor(private analyticsService: TrackingAnalyticsService) {}

  @Get('realtime')
  @ApiOperation({ summary: 'Obtenir événements en temps réel' })
  async getRealTimeEvents(@Request() req, @Query('limit') limit?: number) {
    return this.analyticsService.getRealTimeEvents(req.user.userId, limit ? parseInt(limit) : 20);
  }

  @Get('by-platform')
  @ApiOperation({ summary: 'Événements par plateforme' })
  async getEventsByPlatform(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.analyticsService.getEventsByPlatform(req.user.userId, period || 'week');
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Événements par type' })
  async getEventsByType(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.analyticsService.getEventsByType(req.user.userId, period || 'week');
  }

  @Get('conversion-rate')
  @ApiOperation({ summary: 'Taux de conversion' })
  async getConversionRate(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    const rate = await this.analyticsService.getConversionRate(req.user.userId, period || 'week');
    return { conversionRate: rate };
  }

  @Get('top-events')
  @ApiOperation({ summary: 'Top événements' })
  async getTopEvents(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month',
    @Query('limit') limit?: number
  ) {
    return this.analyticsService.getTopEvents(req.user.userId, period || 'week', limit ? parseInt(limit) : 5);
  }

  @Get('platform-performance')
  @ApiOperation({ summary: 'Performance par plateforme' })
  async getPlatformPerformance(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.analyticsService.getPlatformPerformance(req.user.userId, period || 'week');
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Timeline des événements' })
  async getTimeline(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    return this.analyticsService.getTimelineData(req.user.userId, period || 'week');
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard complet analytics tracking' })
  async getDashboard(
    @Request() req,
    @Query('period') period?: 'day' | 'week' | 'month'
  ) {
    const userId = req.user.userId;
    const selectedPeriod = period || 'week';

    const [
      realTimeEvents,
      eventsByPlatform,
      eventsByType,
      conversionRate,
      topEvents,
      platformPerformance,
      timeline,
    ] = await Promise.all([
      this.analyticsService.getRealTimeEvents(userId, 10),
      this.analyticsService.getEventsByPlatform(userId, selectedPeriod),
      this.analyticsService.getEventsByType(userId, selectedPeriod),
      this.analyticsService.getConversionRate(userId, selectedPeriod),
      this.analyticsService.getTopEvents(userId, selectedPeriod, 5),
      this.analyticsService.getPlatformPerformance(userId, selectedPeriod),
      this.analyticsService.getTimelineData(userId, selectedPeriod),
    ]);

    return {
      realTimeEvents,
      eventsByPlatform,
      eventsByType,
      conversionRate,
      topEvents,
      platformPerformance,
      timeline,
      period: selectedPeriod,
    };
  }
}
