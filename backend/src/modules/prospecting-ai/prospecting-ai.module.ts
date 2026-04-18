import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/database/prisma.module';
import { AiOrchestratorModule } from '../intelligence/ai-orchestrator/ai-orchestrator.module';
import { ScrapingModule } from '../scraping/scraping.module';
import { ValidationModule } from '../../shared/validation/validation.module';
import { CacheModule } from '../cache/cache.module';

// Services
import { ProspectionService } from './services/prospection.service';
import { ProspectionExportService } from './services/prospection-export.service';

// Controller
import { ProspectingAiController } from './prospecting-ai.controller';

@Module({
  imports: [
    PrismaModule,
    AiOrchestratorModule,
    ScrapingModule,
    ValidationModule,
    CacheModule, // Pour persister les résultats en Redis
  ],
  providers: [ProspectionService, ProspectionExportService],
  controllers: [ProspectingAiController],
  exports: [ProspectionService, ProspectionExportService],
})
export class ProspectingAiModule {}
