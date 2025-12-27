import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ApiKeysService } from '../../shared/services/api-keys.service';
import { AiCreditsService } from '../../shared/services/ai-credits.service';
import { AiPricingService } from '../../shared/services/ai-pricing.service';
import { AiErrorLogService } from '../../shared/services/ai-error-log.service';
import { ApiKeysController } from './api-keys.controller';
import { AiCreditsController } from './ai-credits.controller';
import { AiUsageController } from './ai-usage.controller';

/**
 * ═════════════════════════════════════════════════════════════════════
 * AI BILLING MODULE - Phase 2 Backend
 * ═════════════════════════════════════════════════════════════════════
 *
 * Module complet pour la gestion du système AI Billing :
 *
 * CONTROLLERS :
 * - ApiKeysController     : Gestion des clés API (User, Agency, Super Admin)
 * - AiCreditsController   : Gestion des crédits et quotas
 * - AiUsageController     : Statistiques d'utilisation et logs d'erreurs
 *
 * SERVICES :
 * - ApiKeysService        : Récupération clés API avec fallback 3 niveaux
 * - AiCreditsService      : Gestion balance, consommation, quotas
 * - AiPricingService      : Pricing des actions AI
 * - AiErrorLogService     : Logging centralisé des erreurs
 *
 * ENDPOINTS DISPONIBLES :
 *
 * API Keys :
 * - GET    /ai-billing/api-keys/user                   - Mes clés API (user)
 * - PUT    /ai-billing/api-keys/user                   - Mettre à jour mes clés
 * - GET    /ai-billing/api-keys/agency                 - Clés agence (admin agence)
 * - PUT    /ai-billing/api-keys/agency                 - Mettre à jour clés agence
 * - GET    /ai-billing/api-keys/global                 - Clés globales (super admin)
 * - PUT    /ai-billing/api-keys/global                 - Mettre à jour clés globales
 *
 * Credits :
 * - GET    /ai-billing/credits/balance                 - Mon solde
 * - GET    /ai-billing/credits/stats                   - Mes stats
 * - PUT    /ai-billing/credits/quota/agency            - Config quota agence
 * - PUT    /ai-billing/credits/quota/user/:userId      - Config quota user (super admin)
 * - POST   /ai-billing/credits/add/agency/:agencyId    - Ajouter crédits agence (super admin)
 * - POST   /ai-billing/credits/add/user/:userId        - Ajouter crédits user (super admin)
 * - GET    /ai-billing/credits/alert/check             - Vérifier alertes
 * - GET    /ai-billing/credits/stats/agency/:agencyId  - Stats agence (super admin)
 * - GET    /ai-billing/credits/stats/user/:userId      - Stats user (super admin)
 *
 * Usage & Errors :
 * - GET    /ai-billing/usage/history                   - Mon historique
 * - GET    /ai-billing/usage/stats/by-action           - Stats par action
 * - GET    /ai-billing/usage/stats/by-provider         - Stats par provider
 * - GET    /ai-billing/usage/errors                    - Mes erreurs
 * - GET    /ai-billing/usage/errors/stats              - Stats erreurs
 * - GET    /ai-billing/usage/admin/global-stats        - Stats globales (super admin)
 * - GET    /ai-billing/usage/admin/errors/global       - Erreurs globales (super admin)
 * - GET    /ai-billing/usage/admin/agency/:id/usage    - Usage agence (super admin)
 * - GET    /ai-billing/usage/admin/agency/:id/errors   - Erreurs agence (super admin)
 *
 * SÉCURITÉ :
 * - Tous les endpoints requièrent JWT auth (@UseGuards(JwtAuthGuard))
 * - Endpoints agence protégés par AgencyAdminGuard
 * - Endpoints super admin protégés par SuperAdminGuard
 */
@Module({
  controllers: [ApiKeysController, AiCreditsController, AiUsageController],
  providers: [
    PrismaService,
    ApiKeysService,
    AiCreditsService,
    AiPricingService,
    AiErrorLogService,
  ],
  exports: [
    ApiKeysService,
    AiCreditsService,
    AiPricingService,
    AiErrorLogService,
  ],
})
export class AiBillingModule {}
