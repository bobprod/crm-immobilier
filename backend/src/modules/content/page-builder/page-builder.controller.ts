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
} from '@nestjs/common';
import { PageBuilderService } from './page-builder.service';
import { PageDto } from './dto';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';

/**
 * Controller pour le Page Builder
 */

// ========================================
// PARTIE PRIVÉE - Agent authentifié
// ========================================

@Controller('page-builder')
@UseGuards(JwtAuthGuard)
export class PageBuilderController {
  constructor(private readonly pageBuilderService: PageBuilderService) {}

  /**
   * Récupérer toutes les pages
   * GET /page-builder/pages
   */
  @Get('pages')
  async getPages(@Request() req) {
    return this.pageBuilderService.getPages(req.user.userId);
  }

  /**
   * Récupérer une page
   * GET /page-builder/pages/:id
   */
  @Get('pages/:id')
  async getPage(@Request() req, @Param('id') id: string) {
    return this.pageBuilderService.getPage(req.user.userId, id);
  }

  /**
   * Créer une page
   * POST /page-builder/pages
   */
  @Post('pages')
  async createPage(@Request() req, @Body() dto: PageDto) {
    return this.pageBuilderService.createPage(req.user.userId, dto);
  }

  /**
   * Mettre à jour une page
   * PUT /page-builder/pages/:id
   */
  @Put('pages/:id')
  async updatePage(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: Partial<PageDto>,
  ) {
    return this.pageBuilderService.updatePage(req.user.userId, id, dto);
  }

  /**
   * Supprimer une page
   * DELETE /page-builder/pages/:id
   */
  @Delete('pages/:id')
  async deletePage(@Request() req, @Param('id') id: string) {
    return this.pageBuilderService.deletePage(req.user.userId, id);
  }

  /**
   * Publier/dépublier une page
   * POST /page-builder/pages/:id/toggle-publish
   */
  @Post('pages/:id/toggle-publish')
  async togglePublish(
    @Request() req,
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.pageBuilderService.togglePublish(req.user.userId, id, isPublished);
  }

  /**
   * Dupliquer une page
   * POST /page-builder/pages/:id/duplicate
   */
  @Post('pages/:id/duplicate')
  async duplicatePage(@Request() req, @Param('id') id: string) {
    return this.pageBuilderService.duplicatePage(req.user.userId, id);
  }

  /**
   * Récupérer les templates
   * GET /page-builder/templates
   */
  @Get('templates')
  getTemplates() {
    return this.pageBuilderService.getTemplates();
  }

  /**
   * Créer une page depuis un template
   * POST /page-builder/templates/:templateId
   */
  @Post('templates/:templateId')
  async createFromTemplate(
    @Request() req,
    @Param('templateId') templateId: string,
    @Body('title') title?: string,
  ) {
    return this.pageBuilderService.createFromTemplate(req.user.userId, templateId, title);
  }
}

// ========================================
// PARTIE PUBLIQUE - Sans authentification
// ========================================

@Controller('public-pages')
export class PublicPagesController {
  constructor(private readonly pageBuilderService: PageBuilderService) {}

  /**
   * Récupérer une page publique par slug
   * GET /public-pages/:slug?userId=xxx
   */
  @Get(':slug')
  async getPublicPage(
    @Query('userId') userId: string,
    @Param('slug') slug: string,
  ) {
    return this.pageBuilderService.getPublicPage(userId, slug);
  }
}
