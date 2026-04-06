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
import { CacheInterceptor } from '@nestjs/cache-manager';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CreatePropertyDto, UpdatePropertyDto, PaginationQueryDto } from './dto';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) {}

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

  @Get('paginated')
  @ApiOperation({
    summary: 'Get paginated properties with cursor-based pagination for infinite scroll',
  })
  findAllPaginated(@Request() req, @Query() pagination: PaginationQueryDto, @Query() filters: any) {
    return this.propertiesService.findAllPaginated(req.user.userId, pagination, filters);
  }

  @Get('trashed')
  @ApiOperation({ summary: 'Get all soft-deleted (trashed) properties' })
  getTrashed(@Request() req) {
    return this.propertiesService.getTrashed(req.user.userId);
  }

  @Get('featured')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get featured properties (cached)' })
  getFeatured(@Request() req) {
    return this.propertiesService.getFeatured(req.user.userId);
  }

  @Get('stats')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get properties statistics (cached)' })
  getStats(@Request() req) {
    return this.propertiesService.getStats(req.user.userId);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby properties by geolocation' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in km (default: 5)',
  })
  findNearby(
    @Request() req,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 5;
    return this.propertiesService.findNearby(req.user.userId, latitude, longitude, radiusKm);
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

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.propertiesService.findOne(id, req.user.userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get property change history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(@Request() req, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.propertiesService.getHistory(id, limit ? parseInt(limit) : 50);
  }

  @Get('user/:userId/activity')
  @ApiOperation({ summary: 'Get user activity across all properties' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserActivity(@Request() req, @Param('userId') userId: string, @Query('limit') limit?: string) {
    return this.propertiesService.getUserActivity(userId, limit ? parseInt(limit) : 50);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update property' })
  @ApiBody({ type: UpdatePropertyDto })
  update(@Request() req, @Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto) {
    return this.propertiesService.update(id, req.user.userId, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete property (move to trash)' })
  delete(@Request() req, @Param('id') id: string) {
    return this.propertiesService.delete(id, req.user.userId);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted property' })
  restore(@Request() req, @Param('id') id: string) {
    return this.propertiesService.restore(id, req.user.userId);
  }

  @Delete(':id/permanent')
  @ApiOperation({ summary: 'Permanently delete property (cannot be undone)' })
  permanentDelete(@Request() req, @Param('id') id: string) {
    return this.propertiesService.permanentDelete(id, req.user.userId);
  }

  @Put(':id/sync-wordpress')
  @ApiOperation({ summary: 'Sync property with WordPress' })
  syncWordPress(@Request() req, @Param('id') id: string, @Body() body: { wpSyncId: string }) {
    return this.propertiesService.syncWithWordPress(id, req.user.userId, body.wpSyncId);
  }

  @Post(':id/images')
  @ApiOperation({ summary: 'Upload property images' })
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: diskStorage({
        destination: (req: any, _file: any, cb: any) => {
          const dir = `./uploads/properties/${req.params.id}`;
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req: any, file: any, cb: any) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
          cb(null, `img-${unique}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(extname(file.originalname))) {
          cb(null, true);
        } else {
          cb(new Error('Seules les images sont acceptées (jpg, png, webp)'), false);
        }
      },
    }),
  )
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

  @Post('search')
  @ApiOperation({ summary: 'Advanced property search' })
  search(@Request() req, @Body() criteria: any) {
    return this.propertiesService.search(req.user.userId, criteria);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar properties' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSimilar(@Request() req, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.propertiesService.getSimilar(id, req.user.userId, limit ? parseInt(limit) : 5);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export properties to CSV' })
  async exportCSV(@Request() req, @Query() filters: any) {
    return this.propertiesService.exportCSV(req.user.userId, filters);
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
}
