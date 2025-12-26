import { Controller, Get, Post, Put, Body, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { AgencyAdminGuard } from '../../shared/guards/agency-admin.guard';
import { SuperAdminGuard } from '../../shared/guards/super-admin.guard';
import { AiCreditsService } from '../../shared/services/ai-credits.service';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  AddCreditsDto,
  SetQuotaDto,
  CreditsBalanceResponseDto,
  CreditsStatsResponseDto,
} from './dto';

@ApiTags('AI Billing - Credits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-billing/credits')
export class AiCreditsController {
  constructor(
    private aiCreditsService: AiCreditsService,
    private prisma: PrismaService,
  ) {}

  /**
   * ═══════════════════════════════════════════════════════════
   * CONSULTATION DU SOLDE
   * ═══════════════════════════════════════════════════════════
   */

  @Get('balance')
  @ApiOperation({ summary: 'Récupérer mon solde de crédits' })
  @ApiResponse({ status: 200, type: CreditsBalanceResponseDto })
  async getMyBalance(@Request() req): Promise<CreditsBalanceResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    const balance = await this.aiCreditsService.getBalance(req.user.userId, user?.agencyId);

    // Calculer le pourcentage d'utilisation si quota défini
    let usagePercentage = 0;
    if (balance.quotaMonthly) {
      usagePercentage = Math.round((balance.consumed / balance.quotaMonthly) * 100);
    }

    return {
      balance: balance.balance,
      consumed: balance.consumed,
      quotaMonthly: balance.quotaMonthly,
      quotaDaily: balance.quotaDaily,
      isAgency: balance.isAgency,
      alertThreshold: balance.alertThreshold,
      alertSent: balance.alertSent,
      usagePercentage,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de consommation de crédits' })
  @ApiResponse({ status: 200, type: CreditsStatsResponseDto })
  async getMyStats(@Request() req): Promise<CreditsStatsResponseDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (user?.agencyId) {
      return await this.aiCreditsService.getAgencyStats(user.agencyId);
    } else {
      return await this.aiCreditsService.getUserStats(req.user.userId);
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * GESTION DES QUOTAS (ADMIN AGENCE)
   * ═══════════════════════════════════════════════════════════
   */

  @Put('quota/agency')
  @UseGuards(AgencyAdminGuard)
  @ApiOperation({ summary: 'Configurer le quota de crédits de mon agence (admin agence)' })
  @ApiResponse({ status: 200, description: 'Quota configuré' })
  async setAgencyQuota(@Request() req, @Body() dto: SetQuotaDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    if (!user || !user.agencyId) {
      return {
        success: false,
        message: 'Utilisateur sans agence',
      };
    }

    await this.aiCreditsService.setAgencyQuota(
      user.agencyId,
      dto.quotaMonthly,
      dto.quotaDaily,
      dto.resetFrequency,
    );

    return {
      success: true,
      message: 'Quota de l\'agence configuré avec succès',
    };
  }

  @Put('quota/user/:userId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Configurer le quota d\'un utilisateur indépendant (super admin)' })
  @ApiResponse({ status: 200, description: 'Quota configuré' })
  async setUserQuota(@Param('userId') userId: string, @Body() dto: SetQuotaDto) {
    await this.aiCreditsService.setUserQuota(
      userId,
      dto.quotaMonthly,
      dto.quotaDaily,
      dto.resetFrequency,
    );

    return {
      success: true,
      message: 'Quota utilisateur configuré avec succès',
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * AJOUT DE CRÉDITS (SUPER ADMIN)
   * ═══════════════════════════════════════════════════════════
   */

  @Post('add/agency/:agencyId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Ajouter des crédits à une agence (super admin)' })
  @ApiResponse({ status: 200, description: 'Crédits ajoutés' })
  async addCreditsToAgency(
    @Param('agencyId') agencyId: string,
    @Body() dto: AddCreditsDto,
  ) {
    await this.aiCreditsService.addCreditsToAgency(agencyId, dto.credits);

    return {
      success: true,
      message: `${dto.credits} crédits ajoutés à l'agence avec succès`,
    };
  }

  @Post('add/user/:userId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Ajouter des crédits à un utilisateur indépendant (super admin)' })
  @ApiResponse({ status: 200, description: 'Crédits ajoutés' })
  async addCreditsToUser(@Param('userId') userId: string, @Body() dto: AddCreditsDto) {
    await this.aiCreditsService.addCreditsToUser(userId, dto.credits);

    return {
      success: true,
      message: `${dto.credits} crédits ajoutés à l'utilisateur avec succès`,
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * ALERTES DE SEUIL
   * ═══════════════════════════════════════════════════════════
   */

  @Get('alert/check')
  @ApiOperation({ summary: 'Vérifier si je dois recevoir une alerte de seuil' })
  @ApiResponse({ status: 200, description: 'Statut de l\'alerte' })
  async checkMyAlert(@Request() req) {
    const user = await this.prisma.users.findUnique({
      where: { id: req.user.userId },
      select: { agencyId: true },
    });

    const alert = await this.aiCreditsService.checkAlertThreshold(
      req.user.userId,
      user?.agencyId,
    );

    return {
      shouldAlert: alert.shouldAlert,
      balance: alert.balance,
      threshold: alert.threshold,
      message: alert.shouldAlert
        ? `Attention : votre solde (${alert.balance} crédits) est en dessous du seuil d'alerte (${alert.threshold} crédits)`
        : 'Solde OK',
    };
  }

  /**
   * ═══════════════════════════════════════════════════════════
   * STATISTIQUES GLOBALES (SUPER ADMIN)
   * ═══════════════════════════════════════════════════════════
   */

  @Get('stats/agency/:agencyId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Statistiques d\'une agence (super admin)' })
  @ApiResponse({ status: 200, type: CreditsStatsResponseDto })
  async getAgencyStats(@Param('agencyId') agencyId: string): Promise<CreditsStatsResponseDto> {
    return await this.aiCreditsService.getAgencyStats(agencyId);
  }

  @Get('stats/user/:userId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Statistiques d\'un utilisateur (super admin)' })
  @ApiResponse({ status: 200, type: CreditsStatsResponseDto })
  async getUserStats(@Param('userId') userId: string): Promise<CreditsStatsResponseDto> {
    return await this.aiCreditsService.getUserStats(userId);
  }
}
