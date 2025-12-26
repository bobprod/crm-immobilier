import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmailAIResponseService } from './email-ai-response.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AnalyzeEmailDto, GenerateDraftDto, ApproveAndSendDto } from './dto';

@ApiTags('Email AI Auto-Response')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('email-ai-response')
export class EmailAIResponseController {
  constructor(private readonly emailAIService: EmailAIResponseService) {}

  @Post('analyze')
  @ApiOperation({ summary: 'Analyser un email entrant et détecter l\'intention' })
  analyzeEmail(@Request() req, @Body() dto: AnalyzeEmailDto) {
    return this.emailAIService.analyzeEmail(req.user.userId, dto);
  }

  @Post('generate-draft')
  @ApiOperation({ summary: 'Générer un draft de réponse avec IA' })
  generateDraft(@Request() req, @Body() dto: GenerateDraftDto) {
    return this.emailAIService.generateDraft(req.user.userId, dto);
  }

  @Post('approve-and-send')
  @ApiOperation({ summary: 'Approuver et envoyer un draft' })
  approveAndSend(@Request() req, @Body() dto: ApproveAndSendDto) {
    return this.emailAIService.approveAndSend(req.user.userId, dto);
  }

  @Get('drafts')
  @ApiOperation({ summary: 'Lister les drafts en attente' })
  @ApiQuery({ name: 'status', required: false })
  getDrafts(@Request() req, @Query('status') status?: string) {
    return this.emailAIService.getDrafts(req.user.userId, status);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des analyses et réponses' })
  getHistory(@Request() req, @Query() filters: any) {
    return this.emailAIService.getHistory(req.user.userId, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des réponses automatiques' })
  getStats(@Request() req) {
    return this.emailAIService.getStats(req.user.userId);
  }
}
