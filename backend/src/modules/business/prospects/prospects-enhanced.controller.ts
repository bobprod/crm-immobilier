import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProspectsEnhancedService } from './prospects-enhanced.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';

@ApiTags('prospects-enhanced')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects-enhanced')
export class ProspectsEnhancedController {
  constructor(private prospectsEnhancedService: ProspectsEnhancedService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un prospect enrichi' })
  createProspectEnhanced(@Request() req, @Body() data: any) {
    return this.prospectsEnhancedService.createProspectEnhanced(req.user.userId, data);
  }

  @Get(':id/full')
  @ApiOperation({ summary: 'Récupérer un prospect avec toutes ses relations' })
  getProspectFull(@Request() req, @Param('id') id: string) {
    return this.prospectsEnhancedService.getProspectFull(id, req.user.userId);
  }

  @Post(':id/interactions')
  @ApiOperation({ summary: 'Ajouter une interaction' })
  addInteraction(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.prospectsEnhancedService.addInteraction(id, req.user.userId, data);
  }

  @Post(':id/preferences')
  @ApiOperation({ summary: 'Définir une préférence' })
  setPreference(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.prospectsEnhancedService.setPreference(id, req.user.userId, data);
  }

  @Get(':id/preferences')
  @ApiOperation({ summary: 'Récupérer les préférences' })
  getPreferences(@Request() req, @Param('id') id: string) {
    return this.prospectsEnhancedService.getPreferences(id, req.user.userId);
  }

  @Post(':id/properties-shown')
  @ApiOperation({ summary: 'Enregistrer un bien montré' })
  recordPropertyShown(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.prospectsEnhancedService.recordPropertyShown(id, req.user.userId, data);
  }

  @Put(':id/stage')
  @ApiOperation({ summary: "Changer l'étape du funnel" })
  changeStage(@Request() req, @Param('id') id: string, @Body('stage') stage: string) {
    return this.prospectsEnhancedService.changeStage(id, req.user.userId, stage);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Récupérer les prospects par type' })
  getProspectsByType(@Request() req, @Param('type') type: string) {
    return this.prospectsEnhancedService.getProspectsByType(req.user.userId, type);
  }

  @Get('actions/today')
  @ApiOperation({ summary: 'Récupérer les actions du jour' })
  getActionsToday(@Request() req) {
    return this.prospectsEnhancedService.getActionsToday(req.user.userId);
  }

  @Get('stats/by-type')
  @ApiOperation({ summary: 'Statistiques par type de prospect' })
  getStatsByType(@Request() req) {
    return this.prospectsEnhancedService.getStatsByType(req.user.userId);
  }

  @Post('search')
  @ApiOperation({ summary: 'Recherche intelligente' })
  smartSearch(@Request() req, @Body() criteria: any) {
    return this.prospectsEnhancedService.smartSearch(req.user.userId, criteria);
  }

  @Get(':id/recommended-properties')
  @ApiOperation({ summary: 'Propriétés recommandées pour un prospect' })
  getRecommendedProperties(
    @Request() req,
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.prospectsEnhancedService.getRecommendedProperties(id, req.user.userId, limit || 10);
  }

  @Post(':prospectId/match/:propertyId')
  @ApiOperation({ summary: 'Vérifier le match prospect/propriété' })
  checkPropertyMatch(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Param('propertyId') propertyId: string,
  ) {
    return this.prospectsEnhancedService.checkPropertyMatch(
      prospectId,
      propertyId,
      req.user.userId,
    );
  }
}
