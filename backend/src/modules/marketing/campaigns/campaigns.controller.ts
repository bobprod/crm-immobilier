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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, ConvertLeadDto } from './dto';

@ApiTags('Campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une campagne' })
  create(@Request() req, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les campagnes' })
  findAll(@Request() req, @Query() filters: any) {
    return this.campaignsService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir une campagne' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.campaignsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une campagne' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une campagne' })
  delete(@Request() req, @Param('id') id: string) {
    return this.campaignsService.delete(id, req.user.userId);
  }

  @Put(':id/stats')
  @ApiOperation({ summary: 'Mettre à jour les stats' })
  updateStats(@Param('id') id: string, @Body() stats: any) {
    return this.campaignsService.updateStats(id, stats);
  }

  @Get(':id/leads')
  @ApiOperation({ summary: "Obtenir les leads d'une campagne" })
  getCampaignLeads(@Param('id') id: string, @Request() req) {
    return this.campaignsService.getCampaignLeads(id, req.user.userId);
  }

  @Post('leads/convert')
  @ApiOperation({ summary: 'Convertir un lead en prospect' })
  convertLeadToProspect(@Request() req, @Body() dto: ConvertLeadDto) {
    return this.campaignsService.convertLeadToProspect(req.user.userId, dto);
  }
}
