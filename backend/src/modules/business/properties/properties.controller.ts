import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CreatePropertyDto, UpdatePropertyDto } from './dto';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

  // ============================================
  // ROUTES SANS PARAMETRES
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create property' })
  @ApiBody({ type: CreatePropertyDto })
  create(@Request() req, @Body() createPropertyDto: CreatePropertyDto) {
    return this.propertiesService.create(req.user.userId, createPropertyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties with filters' })
  findAll(@Request() req, @Query() filters: any) {
    return this.propertiesService.findAll(req.user.userId, filters);
  }

  // ============================================
  // ROUTES SPECIFIQUES (AVANT les routes parametrees :id)
  // ============================================

  @Get('featured')
  @ApiOperation({ summary: 'Get featured properties' })
  getFeatured(@Request() req) {
    return this.propertiesService.getFeatured(req.user.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby properties' })
  getNearby(
    @Request() req,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radiusKm') radiusKm?: number,
  ) {
    return this.propertiesService.getNearby(req.user.userId, latitude, longitude, radiusKm || 5);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get properties statistics' })
  getStats(@Request() req) {
    return this.propertiesService.getStats(req.user.userId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export properties to CSV' })
  async exportCSV(@Request() req, @Query() filters: any) {
    return this.propertiesService.exportCSV(req.user.userId, filters);
  }

  @Post('search')
  @ApiOperation({ summary: 'Advanced property search' })
  search(@Request() req, @Body() criteria: any) {
    return this.propertiesService.search(req.user.userId, criteria);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import properties from CSV' })
  @UseInterceptors(FilesInterceptor('file', 1))
  async importCSV(@Request() req, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new Error('No file uploaded');
    }
    return this.propertiesService.importCSV(req.user.userId, files[0]);
  }

  @Get('assigned/:userId')
  @ApiOperation({ summary: 'Get assigned properties' })
  getAssigned(@Request() req, @Param('userId') assignedTo: string) {
    return this.propertiesService.getAssigned(req.user.userId, assignedTo);
  }

  @Patch('bulk/priority')
  @ApiOperation({ summary: 'Bulk update priority' })
  bulkUpdatePriority(@Request() req, @Body() body: { ids: string[]; priority: string }) {
    return this.propertiesService.bulkUpdatePriority(body.ids, req.user.userId, body.priority);
  }

  @Patch('bulk/status')
  @ApiOperation({ summary: 'Bulk update status' })
  bulkUpdateStatus(@Request() req, @Body() body: { ids: string[]; status: string }) {
    return this.propertiesService.bulkUpdateStatus(body.ids, req.user.userId, body.status);
  }

  @Patch('bulk/assign')
  @ApiOperation({ summary: 'Bulk assign properties' })
  bulkAssign(@Request() req, @Body() body: { ids: string[]; assignedTo: string }) {
    return this.propertiesService.bulkAssign(body.ids, req.user.userId, body.assignedTo);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete properties' })
  bulkDelete(@Request() req, @Body() body: { ids: string[] }) {
    return this.propertiesService.bulkDelete(body.ids, req.user.userId);
  }

  // ============================================
  // ROUTES PARAMETREES (APRES les routes specifiques)
  // ============================================

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.propertiesService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update property' })
  @ApiBody({ type: UpdatePropertyDto })
  update(@Request() req, @Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, req.user.userId, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete property' })
  delete(@Request() req, @Param('id') id: string) {
    return this.propertiesService.delete(id, req.user.userId);
  }

  @Put(':id/sync-wordpress')
  @ApiOperation({ summary: 'Sync property with WordPress' })
  syncWordPress(@Request() req, @Param('id') id: string, @Body() body: { wpSyncId: string }) {
    return this.propertiesService.syncWithWordPress(id, req.user.userId, body.wpSyncId);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload property images' })
  @UseInterceptors(FilesInterceptor('images', 10))
  uploadImages(
    @Request() req,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.propertiesService.uploadImages(id, req.user.userId, files);
  }

  @Delete(':id/images')
  @ApiOperation({ summary: 'Delete property image' })
  deleteImage(@Request() req, @Param('id') id: string, @Body() body: { imageUrl: string }) {
    return this.propertiesService.deleteImage(id, req.user.userId, body.imageUrl);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update property status' })
  updateStatus(@Request() req, @Param('id') id: string, @Body() body: { status: string }) {
    return this.propertiesService.updateStatus(id, req.user.userId, body.status);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar properties' })
  getSimilar(@Request() req, @Param('id') id: string, @Query('limit') limit?: number) {
    return this.propertiesService.getSimilar(id, req.user.userId, limit || 5);
  }
}
