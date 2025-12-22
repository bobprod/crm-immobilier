import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { MatchingService } from './matching.service';
import { GenerateMatchesDto, MatchActionDto, UpdateMatchStatusDto, MatchFiltersDto } from './dto';

@ApiTags('Matching')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matching')
export class MatchingController {
  constructor(private matchingService: MatchingService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Générer tous les matchs' })
  @ApiResponse({ status: 200, description: 'Matchs générés avec succès' })
  generateMatches(@Request() req, @Body() dto: GenerateMatchesDto) {
    return this.matchingService.generateMatches(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Liste des matchs' })
  findAll(@Request() req, @Query() filters: MatchFiltersDto) {
    return this.matchingService.findAll(req.user.userId, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des matchs' })
  getStats(@Request() req) {
    return this.matchingService.getStats(req.user.userId);
  }

  @Get('interactions')
  @ApiOperation({ summary: 'Historique des interactions' })
  getInteractions(@Request() req) {
    return this.matchingService.getInteractions(req.user.userId);
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: "Matchs d'un prospect" })
  getProspectMatches(@Request() req, @Param('prospectId') prospectId: string) {
    return this.matchingService.getProspectMatches(req.user.userId, prospectId);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: "Matchs d'une propriété" })
  getPropertyMatches(@Request() req, @Param('propertyId') propertyId: string) {
    return this.matchingService.getPropertyMatches(req.user.userId, propertyId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un match manuel' })
  createMatch(@Request() req, @Body() body: { prospectId: string; propertyId: string }) {
    return this.matchingService.createManualMatch(
      req.user.userId,
      body.prospectId,
      body.propertyId,
    );
  }

  @Post('find/:prospectId')
  @ApiOperation({ summary: 'Trouver des matchs pour un prospect' })
  findMatchesForProspect(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() filters?: MatchFiltersDto,
  ) {
    return this.matchingService.findMatchesForProspect(req.user.userId, prospectId, filters);
  }

  @Post('find-property/:propertyId')
  @ApiOperation({ summary: 'Trouver des prospects pour une propriété' })
  findMatchesForProperty(
    @Request() req,
    @Param('propertyId') propertyId: string,
    @Body() filters?: MatchFiltersDto,
  ) {
    return this.matchingService.findMatchesForProperty(req.user.userId, propertyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un match" })
  findOne(@Request() req, @Param('id') id: string) {
    return this.matchingService.findOne(req.user.userId, id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateMatchStatusDto) {
    return this.matchingService.updateStatus(id, dto.status);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Effectuer une action sur un match' })
  performAction(@Request() req, @Param('id') id: string, @Body() action: MatchActionDto) {
    return this.matchingService.performAction(id, req.user.userId, action);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un match' })
  deleteMatch(@Request() req, @Param('id') id: string) {
    return this.matchingService.deleteMatch(req.user.userId, id);
  }
}
