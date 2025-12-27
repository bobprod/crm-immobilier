import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/database/prisma.module';
import { AiOrchestratorModule } from '../intelligence/ai-orchestrator/ai-orchestrator.module';

// Services
import { ProspectionService } from './services/prospection.service';
import { ProspectionExportService } from './services/prospection-export.service';

// Controller
import { ProspectingAiController } from './prospecting-ai.controller';

@Module({
  imports: [
    PrismaModule,
    AiOrchestratorModule, // Pour utiliser l'orchestrateur IA
  ],
  providers: [ProspectionService, ProspectionExportService],
  controllers: [ProspectingAiController],
  exports: [ProspectionService, ProspectionExportService],
})
export class ProspectingAiModule {}
