import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AiService } from './ai.service';
import { OcrService } from './ocr.service';
import { DocumentsIntelligenceSyncService } from './documents-intelligence-sync.service';
import { RealEstateDocumentGeneratorService } from './real-estate-document-generator.service';
import { PrismaModule } from '../../../shared/database/prisma.module';
import { AiOrchestratorModule } from '../../intelligence/ai-orchestrator/ai-orchestrator.module';

@Module({
  imports: [
    PrismaModule,
    AiOrchestratorModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    AiService,
    OcrService,
    DocumentsIntelligenceSyncService,
    RealEstateDocumentGeneratorService,
  ],
  exports: [
    DocumentsService,
    AiService,
    OcrService,
    DocumentsIntelligenceSyncService,
    RealEstateDocumentGeneratorService,
  ],
})
export class DocumentsModule {}
