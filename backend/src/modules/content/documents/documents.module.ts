import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AiService } from './ai.service';
import { OcrService } from './ocr.service';
import { PrismaModule } from '../../../shared/database/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, AiService, OcrService],
  exports: [DocumentsService, AiService, OcrService],
})
export class DocumentsModule {}
