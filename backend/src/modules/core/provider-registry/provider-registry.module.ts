import { Module } from '@nestjs/common';
import { ProviderRegistryController } from './provider-registry.controller';
import { ProviderRegistryService } from './services/provider-registry.service';
import { PrismaModule } from '../../../shared/database/prisma.module';

/**
 * Provider Registry Module - Unified Provider Management
 *
 * Centralise la gestion de TOUS les providers (Scraping, LLM, Storage, Email, etc.)
 * Remplace la gestion fragmentée entre settings et userLlmProvider
 *
 * Features:
 * - Configuration unifiée multi-tenant
 * - Routing intelligent avec fallback
 * - Tracking usage et métriques
 * - Health checks automatiques
 * - Budget management par provider
 */
@Module({
  imports: [PrismaModule],
  controllers: [ProviderRegistryController],
  providers: [ProviderRegistryService],
  exports: [ProviderRegistryService], // Export pour utilisation par d'autres modules
})
export class ProviderRegistryModule {}
