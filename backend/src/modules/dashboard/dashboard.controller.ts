import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques globales du dashboard' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  getStats(@Request() req) {
    return this.dashboardService.getStats(req.user.userId);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Données pour les graphiques' })
  @ApiResponse({ status: 200, description: 'Données graphiques récupérées' })
  getCharts(@Request() req) {
    return this.dashboardService.getCharts(req.user.userId);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Activités récentes' })
  @ApiResponse({ status: 200, description: 'Activités récentes récupérées' })
  getRecentActivities(@Request() req) {
    return this.dashboardService.getRecentActivities(req.user.userId);
  }

  @Get('top-performers')
  @ApiOperation({ summary: 'Top performers (propriétés, prospects, matchs)' })
  @ApiResponse({ status: 200, description: 'Top performers récupérés' })
  getTopPerformers(@Request() req) {
    return this.dashboardService.getTopPerformers(req.user.userId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Alertes et notifications' })
  @ApiResponse({ status: 200, description: 'Alertes récupérées' })
  getAlerts(@Request() req) {
    return this.dashboardService.getAlerts(req.user.userId);
  }
}
