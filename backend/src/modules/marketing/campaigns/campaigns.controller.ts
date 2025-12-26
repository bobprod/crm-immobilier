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

  @Get(':id/stats')
  @ApiOperation({ summary: 'Obtenir les statistiques' })
  getStats(@Param('id') id: string, @Request() req) {
    return this.campaignsService.getStats(id, req.user.userId);
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

  @Post(':id/start')
  @ApiOperation({ summary: 'Démarrer une campagne' })
  startCampaign(@Param('id') id: string, @Request() req) {
    return this.campaignsService.start(id, req.user.userId);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Mettre en pause une campagne' })
  pauseCampaign(@Param('id') id: string, @Request() req) {
    return this.campaignsService.pause(id, req.user.userId);
  }

  @Post(':id/resume')
  @ApiOperation({ summary: 'Reprendre une campagne' })
  resumeCampaign(@Param('id') id: string, @Request() req) {
    return this.campaignsService.resume(id, req.user.userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Terminer une campagne' })
  completeCampaign(@Param('id') id: string, @Request() req) {
    return this.campaignsService.complete(id, req.user.userId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Dupliquer une campagne' })
  duplicateCampaign(@Param('id') id: string, @Body() body: { name: string }, @Request() req) {
    return this.campaignsService.duplicate(id, body.name, req.user.userId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Tester avec échantillon' })
  testCampaign(@Param('id') id: string, @Body() body: { testEmails: string[] }, @Request() req) {
    return this.campaignsService.test(id, body.testEmails, req.user.userId);
  }
}
