import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { VitrineBuilderService } from '../services/vitrine-builder.service';
import { CreateVitrinePageDto, UpdateVitrinePageDto, ReorderPagesDto } from '../dto';

const uploadDir = './uploads/vitrine';

@ApiTags('Vitrine Builder')
@Controller('vitrine/builder')
export class VitrineBuilderController {
  constructor(private readonly builderService: VitrineBuilderService) {}

  // ============================================
  // TEMPLATES (auth)
  // ============================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('templates')
  @ApiOperation({ summary: 'List available templates' })
  async getTemplates() {
    return this.builderService.getTemplates();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('templates/:slug')
  @ApiOperation({ summary: 'Get template details' })
  async getTemplate(@Param('slug') slug: string) {
    return this.builderService.getTemplateBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('templates/:slug/apply')
  @ApiOperation({ summary: 'Apply a template to your vitrine' })
  async applyTemplate(@Request() req, @Param('slug') slug: string) {
    return this.builderService.applyTemplate(req.user.userId, slug);
  }

  // ============================================
  // PAGES (auth)
  // ============================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pages')
  @ApiOperation({ summary: 'List all vitrine pages' })
  async getPages(@Request() req) {
    return this.builderService.getPages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('pages/:id')
  @ApiOperation({ summary: 'Get a page with Puck data' })
  async getPage(@Request() req, @Param('id') id: string) {
    return this.builderService.getPage(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('pages')
  @ApiOperation({ summary: 'Create a new page' })
  async createPage(@Request() req, @Body() dto: CreateVitrinePageDto) {
    return this.builderService.createPage(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('pages/:id')
  @ApiOperation({ summary: 'Update page metadata' })
  async updatePage(@Request() req, @Param('id') id: string, @Body() dto: UpdateVitrinePageDto) {
    return this.builderService.updatePage(req.user.userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('pages/:id/puck-data')
  @ApiOperation({ summary: 'Save Puck editor data for a page' })
  async savePuckData(@Request() req, @Param('id') id: string, @Body() body: { puckData: Record<string, any> }) {
    return this.builderService.savePuckData(req.user.userId, id, body.puckData);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('pages/:id')
  @ApiOperation({ summary: 'Delete a page' })
  async deletePage(@Request() req, @Param('id') id: string) {
    return this.builderService.deletePage(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('pages/reorder')
  @ApiOperation({ summary: 'Reorder pages' })
  async reorderPages(@Request() req, @Body() dto: ReorderPagesDto) {
    return this.builderService.reorderPages(req.user.userId, dto.pages);
  }

  // ============================================
  // IMAGE UPLOAD (auth)
  // ============================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('upload')
  @ApiOperation({ summary: 'Upload an image for the page builder' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
        const ext = extname(file.originalname).toLowerCase();
        cb(null, `builder-${uniqueSuffix}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
      if (allowed.test(extname(file.originalname))) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    },
  }))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/vitrine/${file.filename}`,
      filename: file.filename,
      size: file.size,
    };
  }

  // ============================================
  // PUBLIC ROUTES (no auth - for renderer)
  // ============================================

  @Get('public/:slug/pages')
  @ApiOperation({ summary: 'Get public page list for a site' })
  async getPublicPages(@Param('slug') slug: string) {
    return this.builderService.getPublicPages(slug);
  }

  @Get('public/:slug/pages/:pageSlug')
  @ApiOperation({ summary: 'Get public page Puck data' })
  async getPublicPage(@Param('slug') slug: string, @Param('pageSlug') pageSlug: string) {
    return this.builderService.getPublicPage(slug, pageSlug);
  }
}
