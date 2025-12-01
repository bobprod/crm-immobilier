import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { QueryPeriodDto } from './dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard global' })
  getDashboard(@Request() req) {
    return this.analyticsService.getDashboard(req.user.userId);
  }

  @Get('prospects')
  @ApiOperation({ summary: 'Stats prospects' })
  getProspectsStats(@Request() req) {
    return this.analyticsService.getProspectsStats(req.user.userId);
  }

  @Get('properties')
  @ApiOperation({ summary: 'Stats biens' })
  getPropertiesStats(@Request() req) {
    return this.analyticsService.getPropertiesStats(req.user.userId);
  }

  @Get('communications')
  @ApiOperation({ summary: 'Stats communications' })
  getCommunicationsStats(@Request() req) {
    return this.analyticsService.getCommunicationsStats(req.user.userId);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Stats rendez-vous' })
  getAppointmentsStats(@Request() req) {
    return this.analyticsService.getAppointmentsStats(req.user.userId);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Stats tâches' })
  getTasksStats(@Request() req) {
    return this.analyticsService.getTasksStats(req.user.userId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Activité récente' })
  getRecentActivity(@Request() req, @Query() query: QueryPeriodDto) {
    return this.analyticsService.getRecentActivity(req.user.userId, query.limit || 10);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Tendances temporelles' })
  getTrends(@Request() req, @Query() query: QueryPeriodDto) {
    return this.analyticsService.getTrends(req.user.userId, query.period || 'month');
  }

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs principaux' })
  getKPIs(@Request() req) {
    return this.analyticsService.getKPIs(req.user.userId);
  }
}
