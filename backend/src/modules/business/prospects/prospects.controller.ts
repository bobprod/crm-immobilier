import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProspectsService } from './prospects.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CreateProspectDto, UpdateProspectDto } from './dto';

@ApiTags('prospects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects')
export class ProspectsController {
  constructor(private prospectsService: ProspectsService) { }

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

  @Get(':id')
  @ApiOperation({ summary: 'Get prospect by ID' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.prospectsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update prospect' })
  @ApiBody({ type: UpdateProspectDto })
  update(@Request() req, @Param('id') id: string, @Body() updateProspectDto: UpdateProspectDto) {
    return this.prospectsService.update(id, req.user.userId, updateProspectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete prospect' })
  delete(@Request() req, @Param('id') id: string) {
    return this.prospectsService.delete(id, req.user.userId);
  }

  @Post(':id/interactions')
  async addInteraction(@Param('id') id: string, @Request() req, @Body() interactionData: any) {
    return this.prospectsService.addInteraction(id, req.user.userId, interactionData);
  }

  @Get(':id/interactions')
  async getInteractions(@Param('id') id: string, @Request() req) {
    return this.prospectsService.getInteractions(id, req.user.userId);
  }
}
