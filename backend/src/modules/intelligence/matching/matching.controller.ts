import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
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

  @Get('interactions')
  @ApiOperation({ summary: 'Historique des interactions' })
  getInteractions(@Request() req) {
    return this.matchingService.getInteractions(req.user.userId);
  }
}
