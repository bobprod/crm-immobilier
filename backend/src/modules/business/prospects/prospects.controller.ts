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
  Patch,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import { ProspectsService } from './prospects.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CreateProspectDto, UpdateProspectDto, PaginationQueryDto } from './dto';

@ApiTags('prospects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects')
export class ProspectsController {
  constructor(private prospectsService: ProspectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create prospect' })
  @ApiBody({ type: CreateProspectDto })
  create(@Request() req, @Body() createProspectDto: CreateProspectDto) {
    return this.prospectsService.create(req.user.userId, createProspectDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all prospects with filters' })
  findAll(@Request() req, @Query() filters: any) {
    return this.prospectsService.findAll(req.user.userId, filters);
  }

  @Get('paginated')
  @ApiOperation({ summary: 'Get prospects with cursor-based pagination' })
  findAllPaginated(
    @Request() req,
    @Query() paginationQuery: PaginationQueryDto,
    @Query() filters: any,
  ) {
    return this.prospectsService.findAllPaginated(req.user.userId, paginationQuery, filters);
  }

  @Get('trashed')
  @ApiOperation({ summary: 'Get trashed prospects' })
  getTrashed(@Request() req) {
    return this.prospectsService.getTrashed(req.user.userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search prospects' })
  search(@Request() req, @Query('q') query: string) {
    return this.prospectsService.search(req.user.userId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get prospect statistics' })
  getStats(@Request() req) {
    return this.prospectsService.getStats(req.user.userId);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get prospects grouped by pipeline stage (Bitrix24/Odoo style)' })
  getPipeline(@Request() req) {
    return this.prospectsService.getPipeline(req.user.userId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export prospects to CSV' })
  async exportCSV(@Request() req, @Query() filters: any, @Res() res: Response) {
    const { content, filename, mimeType } = await this.prospectsService.exportCSV(
      req.user.userId,
      filters,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prospect by ID' })
  findOne(@Request() req, @Param('id') id: string, @Query('include') include?: string) {
    const includes = include ? include.split(',') : undefined;
    return this.prospectsService.findOne(id, req.user.userId, includes);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update prospect' })
  @ApiBody({ type: UpdateProspectDto })
  update(@Request() req, @Param('id') id: string, @Body() updateProspectDto: UpdateProspectDto) {
    return this.prospectsService.update(id, req.user.userId, updateProspectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete prospect (soft delete)' })
  delete(@Request() req, @Param('id') id: string) {
    return this.prospectsService.delete(id, req.user.userId);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore prospect from trash' })
  restore(@Request() req, @Param('id') id: string) {
    return this.prospectsService.restore(id, req.user.userId);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete prospect (admin only)' })
  permanentDelete(@Request() req, @Param('id') id: string) {
    return this.prospectsService.permanentDelete(id, req.user.userId);
  }

  @Post(':id/interactions')
  @ApiOperation({ summary: 'Add interaction to prospect' })
  async addInteraction(@Param('id') id: string, @Request() req, @Body() interactionData: any) {
    return this.prospectsService.addInteraction(id, req.user.userId, interactionData);
  }

  @Get(':id/interactions')
  @ApiOperation({ summary: 'Get prospect interactions' })
  async getInteractions(@Param('id') id: string, @Request() req) {
    return this.prospectsService.getInteractions(id, req.user.userId);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: 'Upload prospect avatar' })
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req: any, _file: any, cb: any) => {
          const dir = './uploads/prospects/avatars';
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const id = req.params.id;
          const unique = Date.now();
          cb(null, `avatar-${id}-${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(new Error('Seules les images sont acceptées'), false);
        }
      },
    }),
  )
  uploadAvatar(@Request() req, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.prospectsService.uploadAvatar(id, req.user.userId, file);
  }

  // ===================== BULK ACTIONS =====================

  @Patch('bulk/update')
  @ApiOperation({ summary: 'Bulk update prospects (status, tags, etc.)' })
  bulkUpdate(@Request() req, @Body() body: { ids: string[]; data: Record<string, any> }) {
    return this.prospectsService.bulkUpdate(req.user.userId, body.ids, body.data);
  }

  @Delete('bulk/delete')
  @ApiOperation({ summary: 'Bulk soft-delete prospects' })
  bulkDelete(@Request() req, @Body() body: { ids: string[] }) {
    return this.prospectsService.bulkDelete(req.user.userId, body.ids);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a prospect' })
  duplicate(@Request() req, @Param('id') id: string) {
    return this.prospectsService.duplicate(id, req.user.userId);
  }

  @Patch(':id/tags')
  @ApiOperation({ summary: 'Update tags on a prospect' })
  updateTags(@Request() req, @Param('id') id: string, @Body('tags') tags: string[]) {
    return this.prospectsService.updateTags(id, req.user.userId, tags);
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Import prospects from CSV' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_, __, cb) => cb(null, './uploads/temp'),
        filename: (_, f, cb) => cb(null, `import-${Date.now()}${extname(f.originalname)}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async importCSV(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new Error('Fichier manquant');
    return this.prospectsService.importCSV(req.user.userId, file);
  }
}
