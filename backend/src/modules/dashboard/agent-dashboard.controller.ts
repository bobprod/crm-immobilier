import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { AgentDashboardService } from './agent-dashboard.service';

@ApiTags('Dashboard - Agent Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard/agent')
export class AgentDashboardController {
  constructor(private readonly agentDashboardService: AgentDashboardService) {}

  @Get('agency')
  @ApiOperation({ summary: 'Dashboard complet de l\'agence : CA vs objectifs, tous les agents' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  getAgencyDashboard(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.agentDashboardService.getAgencyDashboard(
      req.user.userId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Performance de l\'agent connecté' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  getMyPerformance(
    @Request() req,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.agentDashboardService.getAgentPerformance(
      req.user.userId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }

  @Get('agent/:agentId')
  @ApiOperation({ summary: 'Performance d\'un agent spécifique (manager only)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  getAgentPerformance(
    @Param('agentId') agentId: string,
    @Query('year') year?: string,
    @Query('month') month?: string,
  ) {
    return this.agentDashboardService.getAgentPerformance(
      agentId,
      year ? parseInt(year) : undefined,
      month ? parseInt(month) : undefined,
    );
  }
}
