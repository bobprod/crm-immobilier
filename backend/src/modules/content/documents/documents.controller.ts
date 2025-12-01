import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { AiService } from './ai.service';
import { OcrService } from './ocr.service';
import {
  UploadDocumentDto,
  GenerateDocumentDto,
  OcrDocumentDto,
  CreateCategoryDto,
  CreateDocumentTemplateDto,
  UpdateAiSettingsDto,
  UpdateDocumentDto,
} from './dto';
import { Response } from 'express';
import * as fs from 'fs';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private documentsService: DocumentsService,
    private aiService: AiService,
    private ocrService: OcrService,
  ) {}

  // ============================================
  // DOCUMENTS
  // ============================================

  @Post('upload')
  @ApiOperation({ summary: 'Uploader un document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@Request() req, @UploadedFile() file: any, @Body() dto: UploadDocumentDto) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    return this.documentsService.uploadDocument(req.user.userId, file, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les documents' })
  async getDocuments(@Request() req, @Query() filters: any) {
    return this.documentsService.getDocuments(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un document par ID' })
  async getDocument(@Request() req, @Param('id') id: string) {
    return this.documentsService.getDocumentById(req.user.userId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Télécharger un document' })
  async downloadDocument(@Request() req, @Param('id') id: string, @Res() res: Response) {
    const { filePath, filename, mimeType } = await this.documentsService.downloadDocument(
      req.user.userId,
      id,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un document' })
  async updateDocument(@Request() req, @Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.updateDocument(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un document' })
  async deleteDocument(@Request() req, @Param('id') id: string) {
    return this.documentsService.deleteDocument(req.user.userId, id);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Statistiques des documents' })
  async getStats(@Request() req) {
    return this.documentsService.getStats(req.user.userId);
  }

  // ============================================
  // GÉNÉRATION AI
  // ============================================

  @Post('ai/generate')
  @ApiOperation({ summary: 'Générer un document avec AI' })
  async generateDocument(@Request() req, @Body() dto: GenerateDocumentDto) {
    return this.documentsService.generateDocument(req.user.userId, dto);
  }

  @Get('ai/history')
  @ApiOperation({ summary: 'Historique des générations AI' })
  async getAiHistory(@Request() req, @Query('limit') limit?: number) {
    return this.aiService.getHistory(req.user.userId, limit);
  }

  @Get('ai/stats')
  @ApiOperation({ summary: 'Statistiques AI' })
  async getAiStats(@Request() req) {
    return this.aiService.getStats(req.user.userId);
  }

  @Get('ai/settings')
  @ApiOperation({ summary: 'Récupérer les paramètres AI' })
  async getAiSettings(@Request() req) {
    return this.aiService.getSettings(req.user.userId);
  }

  @Post('ai/settings')
  @ApiOperation({ summary: 'Configurer les paramètres AI' })
  async updateAiSettings(@Request() req, @Body() dto: UpdateAiSettingsDto) {
    return this.aiService.updateSettings(req.user.userId, dto);
  }

  // ============================================
  // OCR
  // ============================================

  @Post(':id/ocr')
  @ApiOperation({ summary: "Extraire le texte d'un document avec OCR" })
  async processOcr(@Request() req, @Param('id') id: string, @Body() dto: OcrDocumentDto) {
    return this.documentsService.processOcr(req.user.userId, id, dto.language);
  }

  @Get('ocr/history')
  @ApiOperation({ summary: 'Historique OCR' })
  async getOcrHistory(@Request() req, @Query('limit') limit?: number) {
    return this.ocrService.getHistory(req.user.userId, limit);
  }

  @Get('ocr/search')
  @ApiOperation({ summary: 'Rechercher dans les textes OCR' })
  async searchOcr(@Request() req, @Query('query') query: string) {
    return this.ocrService.searchInOcrText(req.user.userId, query);
  }

  // ============================================
  // CATÉGORIES
  // ============================================

  @Post('categories')
  @ApiOperation({ summary: 'Créer une catégorie' })
  async createCategory(@Request() req, @Body() dto: CreateCategoryDto) {
    return this.documentsService.createCategory(req.user.userId, dto);
  }

  @Get('categories/list')
  @ApiOperation({ summary: 'Récupérer toutes les catégories' })
  async getCategories(@Request() req) {
    return this.documentsService.getCategories(req.user.userId);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie' })
  async updateCategory(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.documentsService.updateCategory(req.user.userId, id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  async deleteCategory(@Request() req, @Param('id') id: string) {
    return this.documentsService.deleteCategory(req.user.userId, id);
  }

  // ============================================
  // TEMPLATES
  // ============================================

  @Post('templates')
  @ApiOperation({ summary: 'Créer un template' })
  async createTemplate(@Request() req, @Body() dto: CreateDocumentTemplateDto) {
    return this.documentsService.createTemplate(req.user.userId, dto);
  }

  @Get('templates/list')
  @ApiOperation({ summary: 'Récupérer tous les templates' })
  async getTemplates(@Request() req, @Query('category') category?: string) {
    return this.documentsService.getTemplates(req.user.userId, category);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Récupérer un template par ID' })
  async getTemplate(@Request() req, @Param('id') id: string) {
    return this.documentsService.getTemplateById(req.user.userId, id);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Mettre à jour un template' })
  async updateTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: Partial<CreateDocumentTemplateDto>,
  ) {
    return this.documentsService.updateTemplate(req.user.userId, id, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Supprimer un template' })
  async deleteTemplate(@Request() req, @Param('id') id: string) {
    return this.documentsService.deleteTemplate(req.user.userId, id);
  }

  @Post('templates/:id/generate')
  @ApiOperation({ summary: 'Générer un document depuis un template' })
  async generateFromTemplate(
    @Request() req,
    @Param('id') id: string,
    @Body('variables') variables: Record<string, any>,
  ) {
    return this.documentsService.generateFromTemplate(req.user.userId, id, variables);
  }
}
