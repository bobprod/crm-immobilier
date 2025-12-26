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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
}
