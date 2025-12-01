import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { createWorker } from 'tesseract.js';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private prisma: PrismaService) {}

  async processDocument(userId: string, documentId: string, language: string = 'fra+eng') {
    this.logger.log(`Processing OCR for document: ${documentId}`);

    const document = await this.prisma.documents.findFirst({
      where: { id: documentId, userId },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    // Vérifier si le document est une image
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'];
    if (!imageExtensions.includes(document.extension.toLowerCase())) {
      throw new Error('OCR disponible uniquement pour les images');
    }

    try {
      const worker = await createWorker(language);
      const { data } = await worker.recognize(document.filePath);
      await worker.terminate();

      const ocrResult = await this.prisma.ocr_results.create({
        data: {
          documentId,
          userId,
          imageUrl: document.fileUrl, // ✅ AJOUTÉ: champ requis
          extractedText: data.text, // ✅ AJOUTÉ: champ principal
          text: data.text, // Alias pour compatibilité
          confidence: data.confidence,
          language,
          engine: 'tesseract',
          metadata: {
            words: data.words.length,
            lines: data.lines.length,
          },
        },
      });

      await this.prisma.documents.update({
        where: { id: documentId },
        data: {
          ocrProcessed: true,
          ocrText: data.text,
        },
      });

      this.logger.log(`OCR completed for document: ${documentId}`);

      return {
        success: true,
        text: data.text,
        confidence: data.confidence,
        ocrResultId: ocrResult.id,
        words: data.words.length,
        lines: data.lines.length,
      };
    } catch (error) {
      this.logger.error(`OCR error: ${error.message}`);
      throw new Error(`Erreur lors du traitement OCR: ${error.message}`);
    }
  }

  async getHistory(userId: string, limit: number = 50) {
    return this.prisma.ocr_results.findMany({
      where: { userId },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            originalName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async searchInOcrText(userId: string, query: string) {
    return this.prisma.documents.findMany({
      where: {
        userId,
        ocrProcessed: true,
        ocrText: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        ocrText: true,
        fileUrl: true,
        createdAt: true,
      },
      take: 20,
    });
  }
}
