import { Module } from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';
import { AiCreditsService } from '../services/ai-credits.service';
import { AiPricingService } from '../services/ai-pricing.service';
import { AiErrorLogService } from '../services/ai-error-log.service';
import { PrismaModule } from '../database/prisma.module';

/**
 * ═════════════════════════════════════════════════════════════════════
 * AI BILLING MODULE
 * ═════════════════════════════════════════════════════════════════════
 *
 * Ce module centralise tous les services liés au système de facturation AI :
 *
 * 1. ApiKeysService     → Gestion des clés API (User → Agency → Super Admin)
 * 2. AiCreditsService   → Gestion des crédits et consommation
 * 3. AiPricingService   → Gestion du pricing des actions AI
 * 4. AiErrorLogService  → Logging centralisé des erreurs AI
 *
 * UTILISATION :
 * - Importer ce module dans SharedModule ou dans les modules qui en ont besoin
 * - Injecter les services dans vos contrôleurs/services :
 *
 * @example
 * ```typescript
 * import { ApiKeysService, AiCreditsService } from '@shared/ai-billing/...';
 *
 * @Injectable()
 * export class ProspectionService {
 *   constructor(
 *     private apiKeysService: ApiKeysService,
 *     private aiCreditsService: AiCreditsService,
 *   ) {}
 *
 *   async generateProspectDescription(userId: string, agencyId: string) {
 *     // 1. Récupérer la clé API
 *     const apiKey = await this.apiKeysService.getRequiredApiKey(
 *       userId,
 *       'anthropic',
 *       agencyId
 *     );
 *
 *     // 2. Vérifier et consommer les crédits
 *     const credits = await this.aiCreditsService.checkAndConsume(
 *       userId,
 *       10, // coût de l'action
 *       'prospection_description',
 *       agencyId
 *     );
 *
 *     // 3. Appeler le provider AI
 *     // ...
 *   }
 * }
 * ```
 */
@Module({
  imports: [PrismaModule],
  providers: [
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
export class AiBillingModule { }
