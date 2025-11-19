import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { ProspectingService } from './prospecting.service';

@ApiTags('Prospecting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospecting')
export class ProspectingController {
  constructor(private readonly prospectingService: ProspectingService) {}

  @Get('campaigns')
  @ApiOperation({ summary: 'Obtenir les campagnes' })
  getCampaigns(@Request() req) {
    return this.prospectingService.getCampaigns(req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de prospection' })
  getStats(@Request() req) {
    return this.prospectingService.getGlobalStats(req.user.userId);
  }
}
