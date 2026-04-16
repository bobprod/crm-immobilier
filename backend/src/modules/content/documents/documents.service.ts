import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { AiService } from './ai.service';
import { OcrService } from './ocr.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly uploadDir = './uploads/documents';

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private ocrService: OcrService,
  ) {
    // Créer le dossier d'upload s'il n'existe pas
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Uploader un document
   */
  async uploadDocument(userId: string, file: any, data: any) {
    this.logger.log(`Uploading document: ${file.originalname}`);

    const fileHash = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    const filename = `${fileHash}${extension}`;
    const filePath = path.join(this.uploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    const document = await this.prisma.documents.create({
      data: {
        userId,
        name: data.name || file.originalname,
        originalName: file.originalname,
        description: data.description,
        fileUrl: `/uploads/documents/${filename}`,
        filePath,
        mimeType: file.mimetype,
        fileSize: file.size,
        extension: extension.substring(1),
        categoryId: data.categoryId,
        prospectId: data.prospectId,
        propertyId: data.propertyId,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        tags: data.tags || [],
        isPublic: data.isPublic || false,
        isTemplate: data.isTemplate || false,
      },
      include: {
        category: true,
        prospects: true,
        properties: true,
      },
    });

    this.logger.log(`Document uploaded successfully: ${document.id}`);
    return document;
  }

  /**
   * Récupérer tous les documents
   */
  async getDocuments(userId: string, filters: any = {}) {
    const where: any = { userId };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.prospectId) where.prospectId = filters.prospectId;
    if (filters.propertyId) where.propertyId = filters.propertyId;
    if (filters.relatedType) where.relatedType = filters.relatedType;
    if (filters.isTemplate !== undefined) where.isTemplate = filters.isTemplate === 'true';
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { ocrText: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.documents.findMany({
      where,
      include: {
        category: true,
        prospects: { select: { id: true, firstName: true, lastName: true } },
        properties: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: filters.limit ? parseInt(filters.limit) : 50,
      skip: filters.skip ? parseInt(filters.skip) : 0,
    });
  }

  async getDocumentById(userId: string, documentId: string) {
    const document = await this.prisma.documents.findFirst({
      where: { id: documentId, userId },
      include: {
        category: true,
        prospects: true,
        properties: true,
        aiGeneration: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Document non trouvé');
    }

    return document;
  }

  async downloadDocument(userId: string, documentId: string) {
    const document = await this.getDocumentById(userId, documentId);

    if (!fs.existsSync(document.filePath)) {
      throw new NotFoundException('Fichier non trouvé sur le serveur');
    }

    return {
      filePath: document.filePath,
      filename: document.originalName,
      mimeType: document.mimeType,
    };
  }

  async updateDocument(userId: string, documentId: string, data: any) {
    await this.getDocumentById(userId, documentId);

    return this.prisma.documents.update({
      where: { id: documentId },
      data: {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        tags: data.tags,
        isPublic: data.isPublic,
      },
      include: { category: true },
    });
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await this.getDocumentById(userId, documentId);

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await this.prisma.documents.delete({ where: { id: documentId } });

    return { success: true, message: 'Document supprimé avec succès' };
  }

  async generateDocument(userId: string, data: any) {
    this.logger.log('Generating document with AI');

    const result = await this.aiService.generateText(userId, {
      prompt: data.prompt,
      provider: data.provider,
      model: data.model,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
      documentType: data.documentType,
      prospectId: data.prospectId,
      propertyId: data.propertyId,
    });

    if (data.saveAsDocument !== false) {
      const filename = `ai-generated-${Date.now()}.html`;
      const filePath = path.join(this.uploadDir, filename);

      fs.writeFileSync(filePath, result.response, 'utf8');

      const document = await this.prisma.documents.create({
        data: {
          userId,
          name: data.documentType || 'Document AI',
          originalName: filename,
          description: `Généré par ${result.provider} (${result.model})`,
          fileUrl: `/uploads/documents/${filename}`,
          filePath,
          mimeType: 'text/html',
          fileSize: Buffer.byteLength(result.response, 'utf8'),
          extension: 'html',
          prospectId: data.prospectId,
          propertyId: data.propertyId,
          aiGenerated: true,
          aiGenerationId: result.generationId,
        },
      });

      return { ...result, document };
    }

    return result;
  }

  async processOcr(userId: string, documentId: string, language?: string) {
    return this.ocrService.processDocument(userId, documentId, language);
  }

  // ============================================
  // CATÉGORIES
  // ============================================

  async createCategory(userId: string, data: any) {
    return this.prisma.document_categories.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
        icon: data.icon,
        parentId: data.parentId,
      },
    });
  }

  async getCategories(userId: string) {
    return this.prisma.document_categories.findMany({
      include: {
        parent: true,
        children: true,
        _count: { select: { documents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateCategory(userId: string, categoryId: string, data: any) {
    return this.prisma.document_categories.update({
      where: { id: categoryId },
      data,
    });
  }

  async deleteCategory(userId: string, categoryId: string) {
    const count = await this.prisma.documents.count({ where: { categoryId } });

    if (count > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une catégorie contenant des documents',
      );
    }

    await this.prisma.document_categories.delete({ where: { id: categoryId } });
    return { success: true };
  }

  // ============================================
  // TEMPLATES
  // ============================================

  async createTemplate(userId: string, data: any) {
    return this.prisma.document_templates.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        content: data.content,
        variables: data.variables || [],
        category: data.category,
        mimeType: data.mimeType || 'text/html',
        isPublic: data.isPublic || false,
      },
    });
  }

  async getTemplates(userId: string, category?: string) {
    const where: any = { OR: [{ userId }, { isPublic: true }] };
    if (category) where.category = category;

    return this.prisma.document_templates.findMany({
      where,
      orderBy: { usageCount: 'desc' },
    });
  }

  async getTemplateById(userId: string, templateId: string) {
    return this.prisma.document_templates.findFirst({
      where: {
        id: templateId,
        OR: [{ userId }, { isPublic: true }],
      },
    });
  }

  async updateTemplate(userId: string, templateId: string, data: any) {
    return this.prisma.document_templates.update({
      where: { id: templateId, userId },
      data,
    });
  }

  async deleteTemplate(userId: string, templateId: string) {
    await this.prisma.document_templates.delete({
      where: { id: templateId, userId },
    });
    return { success: true };
  }

  async generateFromTemplate(userId: string, templateId: string, variables: Record<string, any>) {
    const template = await this.getTemplateById(userId, templateId);

    if (!template) {
      throw new NotFoundException('Template non trouvé');
    }

    let content = template.content;
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, variables[key]);
    });

    await this.prisma.document_templates.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });

    const filename = `template-${Date.now()}.html`;
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, content, 'utf8');

    const document = await this.prisma.documents.create({
      data: {
        userId,
        name: template.name,
        originalName: filename,
        description: `Généré depuis le template: ${template.name}`,
        fileUrl: `/uploads/documents/${filename}`,
        filePath,
        mimeType: template.mimeType,
        fileSize: Buffer.byteLength(content, 'utf8'),
        extension: 'html',
        isTemplate: false,
      },
    });

    return document;
  }

  // ============================================
  // SMART WIZARD (OCR → AI)
  // ============================================

  /**
   * Génération intelligente : combine les textes OCR extraits de documents scannés
   * et l'instruction en langage naturel de l'agent pour produire un document
   * immobilier complet via IA.
   */
  async smartGenerateDocument(userId: string, data: any) {
    this.logger.log('Smart wizard: OCR → AI document generation');

    // Build context from scanned documents
    let scannedContext = '';
    if (data.scannedDocuments && data.scannedDocuments.length > 0) {
      scannedContext = data.scannedDocuments
        .map(
          (doc: { docType: string; text: string }, idx: number) =>
            `--- Document scanné #${idx + 1} (${doc.docType}) ---\n${doc.text}`,
        )
        .join('\n\n');
    }

    const documentTypeLabel = data.documentType || 'document immobilier';

    const prompt = [
      'Tu es un expert juridique spécialisé en droit immobilier français et maghrébin.',
      'Tu rédiges des documents immobiliers professionnels, clairs et juridiquement corrects.',
      '',
      scannedContext
        ? `### Informations extraites des documents scannés\n${scannedContext}`
        : '',
      '',
      `### Instruction de l'agent`,
      data.userInstruction,
      '',
      `### Tâche`,
      `Génère un ${documentTypeLabel} complet en français.`,
      "Utilise les informations extraites des documents scannés ci-dessus pour renseigner automatiquement les champs (noms, adresses, numéros de pièce d'identité, etc.).",
      "Si une information est manquante dans les documents scannés, utilise l'instruction de l'agent ou laisse un espace '[À COMPLÉTER]'.",
      'Le document doit inclure : en-tête, articles numérotés, clauses légales adaptées, signatures des parties.',
      'Formate la réponse en HTML propre et professionnel.',
    ]
      .filter(Boolean)
      .join('\n');

    const result = await this.aiService.generateText(userId, {
      prompt,
      provider: data.provider,
      model: data.model,
      temperature: 0.4,
      maxTokens: 4000,
      documentType: documentTypeLabel,
      prospectId: data.prospectId,
      propertyId: data.propertyId,
    });

    const filename = `smart-${documentTypeLabel.replace(/\s+/g, '_')}-${Date.now()}.html`;
    const filePath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filePath, result.response, 'utf8');

    const document = await this.prisma.documents.create({
      data: {
        userId,
        name: documentTypeLabel,
        originalName: filename,
        description: `Généré par Wizard IA — ${result.provider}`,
        fileUrl: `/uploads/documents/${filename}`,
        filePath,
        mimeType: 'text/html',
        fileSize: Buffer.byteLength(result.response, 'utf8'),
        extension: 'html',
        prospectId: data.prospectId,
        propertyId: data.propertyId,
        aiGenerated: true,
        aiGenerationId: result.generationId,
      },
    });

    return { ...result, document };
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  async getStats(userId: string) {
    const [total, byCategory, totalSize, ocrProcessed, aiGenerated] = await Promise.all([
      this.prisma.documents.count({ where: { userId } }),
      this.prisma.documents.groupBy({
        by: ['categoryId'],
        where: { userId },
        _count: true,
      }),
      this.prisma.documents.aggregate({
        where: { userId },
        _sum: { fileSize: true },
      }),
      this.prisma.documents.count({ where: { userId, ocrProcessed: true } }),
      this.prisma.documents.count({ where: { userId, aiGenerated: true } }),
    ]);

    return {
      total,
      byCategory,
      totalSize: totalSize._sum.fileSize || 0,
      ocrProcessed,
      aiGenerated,
    };
  }
}
