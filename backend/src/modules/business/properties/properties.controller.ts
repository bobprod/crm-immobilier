import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CreatePropertyDto, UpdatePropertyDto } from './dto';

@ApiTags('properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private propertiesService: PropertiesService) { }

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
}
