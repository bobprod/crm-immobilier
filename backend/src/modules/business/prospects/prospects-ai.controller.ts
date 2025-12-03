import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { ProspectsAIService } from './prospects-ai.service';

@ApiTags('prospects-ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('prospects-ai')
export class ProspectsAIController {
  constructor(private prospectsAIService: ProspectsAIService) {}

  @Post(':prospectId/analyze')
  @ApiOperation({ summary: 'Analyser un prospect avec IA' })
  async analyzeProspect(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Query('provider') provider?: string,
  ) {
    return this.prospectsAIService.analyzeProspect(
      req.user.userId,
      prospectId,
      provider,
    );
  }

  @Post(':prospectId/generate-message')
  @ApiOperation({ summary: 'Generer un message personnalise' })
  async generateMessage(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() body: { messageType: string; context?: string; provider?: string },
  ) {
    return this.prospectsAIService.generateMessage(
      req.user.userId,
      prospectId,
      body.messageType,
      body.context,
      body.provider,
    );
  }

  @Post(':prospectId/suggest-actions')
  @ApiOperation({ summary: 'Suggerer les prochaines actions' })
  async suggestActions(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Query('provider') provider?: string,
  ) {
    return this.prospectsAIService.suggestActions(
      req.user.userId,
      prospectId,
      provider,
    );
  }

  @Post(':prospectId/predict-conversion')
  @ApiOperation({ summary: 'Predire la probabilite de conversion' })
  async predictConversion(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Query('provider') provider?: string,
  ) {
    return this.prospectsAIService.predictConversion(
      req.user.userId,
      prospectId,
      provider,
    );
  }

  @Post(':prospectId/extract-preferences')
  @ApiOperation({ summary: 'Extraire les preferences depuis du texte' })
  async extractPreferences(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() body: { text: string; provider?: string },
  ) {
    return this.prospectsAIService.extractPreferences(
      req.user.userId,
      prospectId,
      body.text,
      body.provider,
    );
  }

  @Get(':prospectId/summary')
  @ApiOperation({ summary: 'Generer un resume du prospect' })
  async generateSummary(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Query('provider') provider?: string,
  ) {
    return this.prospectsAIService.generateSummary(
      req.user.userId,
      prospectId,
      provider,
    );
  }

  @Post(':prospectId/explain-match/:propertyId')
  @ApiOperation({ summary: 'Expliquer le matching avec une propriete' })
  async explainMatch(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Param('propertyId') propertyId: string,
    @Query('provider') provider?: string,
  ) {
    return this.prospectsAIService.explainMatch(
      req.user.userId,
      prospectId,
      propertyId,
      provider,
    );
  }

  @Post(':prospectId/generate-follow-up')
  @ApiOperation({ summary: 'Generer un email de relance' })
  async generateFollowUp(
    @Request() req,
    @Param('prospectId') prospectId: string,
    @Body() body: { lastInteraction?: any; provider?: string },
  ) {
    return this.prospectsAIService.generateFollowUp(
      req.user.userId,
      prospectId,
      body.lastInteraction,
      body.provider,
    );
  }
}
