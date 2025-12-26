import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IntegrationsService, CreateIntegrationDto, UpdateIntegrationDto } from './integrations.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

/**
 * 🔌 Contrôleur pour la gestion des intégrations API utilisateur
 *
 * Permet à chaque utilisateur de configurer ses propres clés API pour:
 * - Email (Resend, SendGrid)
 * - SMS/WhatsApp (Twilio)
 * - Push (Firebase)
 *
 * Toutes les routes sont protégées par authentification JWT
 */

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * 📋 Lister toutes les intégrations de l'utilisateur
   * GET /integrations
   */
  @Get()
  async getUserIntegrations(@Request() req) {
    const userId = req.user.userId || req.user.sub;
    return this.integrationsService.getUserIntegrations(userId);
  }

  /**
   * 🔍 Récupérer une intégration spécifique
   * GET /integrations/:provider
   */
  @Get(':provider')
  async getUserIntegration(@Request() req, @Param('provider') provider: string) {
    const userId = req.user.userId || req.user.sub;
    return this.integrationsService.getUserIntegration(userId, provider);
  }

  /**
   * ➕ Créer une nouvelle intégration
   * POST /integrations
   *
   * Body:
   * {
   *   provider: 'resend' | 'sendgrid' | 'twilio' | 'firebase',
   *   config: {
   *     resendApiKey?: string,
   *     sendgridApiKey?: string,
   *     twilioAccountSid?: string,
   *     twilioAuthToken?: string,
   *     twilioPhoneNumber?: string,
   *     twilioWhatsappNumber?: string,
   *     firebaseServerKey?: string,
   *     firebaseProjectId?: string
   *   },
   *   label?: string,
   *   monthlyQuota?: number
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createIntegration(@Request() req, @Body() data: CreateIntegrationDto) {
    const userId = req.user.userId || req.user.sub;
    return this.integrationsService.createIntegration(userId, data);
  }

  /**
   * 📝 Mettre à jour une intégration
   * PUT /integrations/:provider
   *
   * Body:
   * {
   *   config?: { ... },
   *   label?: string,
   *   monthlyQuota?: number,
   *   isActive?: boolean
   * }
   */
  @Put(':provider')
  async updateIntegration(
    @Request() req,
    @Param('provider') provider: string,
    @Body() data: UpdateIntegrationDto,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.integrationsService.updateIntegration(userId, provider, data);
  }

  /**
   * 🗑️ Supprimer une intégration
   * DELETE /integrations/:provider
   */
  @Delete(':provider')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIntegration(@Request() req, @Param('provider') provider: string) {
    const userId = req.user.userId || req.user.sub;
    await this.integrationsService.deleteIntegration(userId, provider);
  }

  /**
   * 🧪 Tester une intégration
   * POST /integrations/:provider/test
   *
   * Vérifie que les credentials sont valides sans envoyer de message réel
   */
  @Post(':provider/test')
  async testIntegration(@Request() req, @Param('provider') provider: string) {
    const userId = req.user.userId || req.user.sub;
    return this.integrationsService.testIntegration(userId, provider);
  }

  /**
   * 📊 Obtenir les statistiques d'usage
   * GET /integrations/:provider/usage
   */
  @Get(':provider/usage')
  async getIntegrationUsage(@Request() req, @Param('provider') provider: string) {
    const userId = req.user.userId || req.user.sub;
    const integration = await this.integrationsService.getUserIntegration(userId, provider);

    return {
      provider: integration.provider,
      currentUsage: integration.currentUsage,
      monthlyQuota: integration.monthlyQuota,
      usagePercentage: integration.monthlyQuota
        ? Math.round((integration.currentUsage / integration.monthlyQuota) * 100)
        : null,
      lastResetAt: integration.lastResetAt,
      willResetAt: this.getNextResetDate(integration.lastResetAt),
    };
  }

  /**
   * 🔄 Réinitialiser l'usage mensuel manuellement (admin uniquement)
   * POST /integrations/reset-usage
   *
   * Note: Normalement cela devrait être un CRON job
   */
  @Post('admin/reset-usage')
  @HttpCode(HttpStatus.OK)
  async resetMonthlyUsage(@Request() req) {
    // TODO: Ajouter une vérification de rôle admin
    // if (!req.user.isAdmin) throw new ForbiddenException();

    return this.integrationsService.resetMonthlyUsage();
  }

  /**
   * 🗓️ Calculer la prochaine date de reset (début du mois prochain)
   */
  private getNextResetDate(lastResetAt: Date): Date {
    const nextReset = new Date(lastResetAt);
    nextReset.setMonth(nextReset.getMonth() + 1);
    return nextReset;
  }
}
