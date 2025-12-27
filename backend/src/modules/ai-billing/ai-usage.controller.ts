import { Controller, Get, Query, UseGuards, Request, Param, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../shared/guards/super-admin.guard';
import { AiErrorLogService } from '../../shared/services/ai-error-log.service';
import { PrismaService } from '../../shared/database/prisma.service';

@ApiTags('AI Billing - Usage & Errors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-billing/usage')
export class AiUsageController {
  constructor(
    private aiErrorLogService: AiErrorLogService,
    private prisma: PrismaService,
  ) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * HISTORIQUE DE CONSOMMATION
   * ═══════════════════════════════════════════════════════════
   */

  @Get('history')
  @ApiOperation({ summary: 'Mon historique de consommation AI' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats (défaut: 50)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset de pagination (défaut: 0)' })
  @ApiResponse({ status: 200, description: 'Historique de consommation' })
  async getMyUsageHistory(
    @Request() req,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    const usage = await this.prisma.aiUsage.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        actionCode: true,
        actionName: true,
        creditsUsed: true,
        creditsBalance: true,
        provider: true,
        model: true,
        tokensUsed: true,
        realCostUsd: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    });

    const total = await this.prisma.aiUsage.count({
      where: { userId: req.user.userId },
    });

    return {
      data: usage,
      total,
      limit,
      offset,
    };
  }

  @Get('stats/by-action')
  @ApiOperation({ summary: 'Statistiques de consommation par action AI' })
  @ApiResponse({ status: 200, description: 'Consommation groupée par action' })
  async getMyStatsByAction(@Request() req) {
    const stats = await this.prisma.aiUsage.groupBy({
      by: ['actionCode', 'actionName'],
      where: { userId: req.user.userId },
      _sum: {
        creditsUsed: true,
        tokensUsed: true,
        realCostUsd: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          creditsUsed: 'desc',
        },
      },
    });

    return stats.map((stat) => ({
      actionCode: stat.actionCode,
      actionName: stat.actionName,
      totalCredits: stat._sum.creditsUsed || 0,
      totalTokens: stat._sum.tokensUsed || 0,
      totalCostUsd: stat._sum.realCostUsd || 0,
      count: stat._count.id,
    }));
  }

  @Get('stats/by-provider')
  @ApiOperation({ summary: 'Statistiques de consommation par provider' })
  @ApiResponse({ status: 200, description: 'Consommation groupée par provider' })
  async getMyStatsByProvider(@Request() req) {
    const stats = await this.prisma.aiUsage.groupBy({
      by: ['provider'],
      where: { userId: req.user.userId },
      _sum: {
        creditsUsed: true,
        tokensUsed: true,
        realCostUsd: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          creditsUsed: 'desc',
        },
      },
    });

    return stats.map((stat) => ({
      provider: stat.provider,
      totalCredits: stat._sum.creditsUsed || 0,
      totalTokens: stat._sum.tokensUsed || 0,
      totalCostUsd: stat._sum.realCostUsd || 0,
      count: stat._count.id,
    }));
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * LOGS D'ERREURS
   * ═══════════════════════════════════════════════════════════
   */

  @Get('errors')
  @ApiOperation({ summary: 'Mes erreurs AI récentes' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats (défaut: 50)' })
  @ApiResponse({ status: 200, description: 'Erreurs récentes' })
  async getMyErrors(
    @Request() req,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return await this.aiErrorLogService.getUserErrors(req.user.userId, limit);
  }

  @Get('errors/stats')
  @ApiOperation({ summary: 'Statistiques de mes erreurs AI' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Nombre de jours (défaut: 30)' })
  @ApiResponse({ status: 200, description: 'Statistiques d\'erreurs' })
  async getMyErrorStats(
    @Request() req,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return await this.aiErrorLogService.getUserErrorStats(req.user.userId, days);
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * STATISTIQUES GLOBALES (SUPER ADMIN)
   * ═══════════════════════════════════════════════════════════
   */

  @Get('admin/global-stats')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Statistiques globales d\'utilisation (super admin)' })
  @ApiResponse({ status: 200, description: 'Statistiques globales' })
  async getGlobalUsageStats() {
    const totalCredits = await this.prisma.aiUsage.aggregate({
      _sum: {
        creditsUsed: true,
        tokensUsed: true,
        realCostUsd: true,
      },
      _count: {
        id: true,
      },
    });

    const byAgency = await this.prisma.aiUsage.groupBy({
      by: ['agencyId'],
      _sum: {
        creditsUsed: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          creditsUsed: 'desc',
        },
      },
      take: 10,
    });

    const byAction = await this.prisma.aiUsage.groupBy({
      by: ['actionCode', 'actionName'],
      _sum: {
        creditsUsed: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          creditsUsed: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalUsage: {
        totalCredits: totalCredits._sum.creditsUsed || 0,
        totalTokens: totalCredits._sum.tokensUsed || 0,
        totalCostUsd: totalCredits._sum.realCostUsd || 0,
        totalRequests: totalCredits._count.id,
      },
      topAgencies: byAgency,
      topActions: byAction,
    };
  }

  @Get('admin/errors/global')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Statistiques globales d\'erreurs (super admin)' })
  @ApiResponse({ status: 200, description: 'Statistiques d\'erreurs globales' })
  async getGlobalErrorStats() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return await this.aiErrorLogService.getGlobalErrorStats(last30Days, now);
  }

  @Get('admin/agency/:agencyId/usage')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Historique d\'utilisation d\'une agence (super admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Historique agence' })
  async getAgencyUsageHistory(
    @Param('agencyId') agencyId: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return await this.prisma.aiUsage.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  @Get('admin/agency/:agencyId/errors')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Erreurs d\'une agence (super admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Erreurs agence' })
  async getAgencyErrors(
    @Param('agencyId') agencyId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return await this.aiErrorLogService.getAgencyErrors(agencyId, limit);
  }
}
