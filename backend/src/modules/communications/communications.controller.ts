import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { CommunicationsAIService } from './communications-ai.service';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import {
  SendEmailDto,
  SendSmsDto,
  SendWhatsAppDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  GenerateSmartEmailDto,
  GenerateSmartSMSDto,
  SuggestTemplatesDto,
  GenerateTemplateDto,
  AutoCompleteDto,
  ImproveTextDto,
  TranslateMessageDto,
  CommunicationsSettingsDto,
} from './dto';

@ApiTags('Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(
    private communicationsService: CommunicationsService,
    private communicationsAIService: CommunicationsAIService,
  ) {}

  @Post('email')
  @ApiOperation({ summary: 'Envoyer un email' })
  sendEmail(@Request() req, @Body() dto: SendEmailDto) {
    return this.communicationsService.sendEmail(req.user.userId, dto);
  }

  @Post('sms')
  @ApiOperation({ summary: 'Envoyer un SMS' })
  sendSms(@Request() req, @Body() dto: SendSmsDto) {
    return this.communicationsService.sendSms(req.user.userId, dto);
  }

  @Post('whatsapp')
  @ApiOperation({ summary: 'Envoyer WhatsApp' })
  sendWhatsApp(@Request() req, @Body() dto: SendWhatsAppDto) {
    return this.communicationsService.sendWhatsApp(req.user.userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historique des communications' })
  getHistory(@Request() req, @Query() filters: any) {
    return this.communicationsService.getHistory(req.user.userId, filters);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Liste des templates' })
  getTemplates(@Request() req, @Query('type') type?: string) {
    return this.communicationsService.getTemplates(req.user.userId, type);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Récupérer un template par ID' })
  getTemplateById(@Request() req, @Param('id') id: string) {
    return this.communicationsService.getTemplateById(id, req.user.userId);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Créer un template' })
  createTemplate(@Request() req, @Body() dto: CreateTemplateDto) {
    return this.communicationsService.createTemplate(req.user.userId, dto);
  }

  @Put('templates/:id')
  @ApiOperation({ summary: 'Modifier un template' })
  updateTemplate(@Request() req, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.communicationsService.updateTemplate(id, req.user.userId, dto);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: 'Supprimer un template' })
  deleteTemplate(@Request() req, @Param('id') id: string) {
    return this.communicationsService.deleteTemplate(id, req.user.userId);
  }

  @Get('history/:id')
  @ApiOperation({ summary: 'Récupérer une communication par ID' })
  getCommunicationById(@Request() req, @Param('id') id: string) {
    return this.communicationsService.getCommunicationById(id, req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques communications' })
  getStats(@Request() req) {
    return this.communicationsService.getStats(req.user.userId);
  }

  @Post('smtp/test-connection')
  @ApiOperation({ summary: 'Tester la connexion SMTP' })
  testSmtpConnection() {
    return this.communicationsService.testSmtpConnection();
  }

  @Post('smtp/test-email')
  @ApiOperation({ summary: 'Envoyer un email de test' })
  @ApiBody({
    schema: { type: 'object', properties: { to: { type: 'string', example: 'test@example.com' } } },
  })
  sendTestEmail(@Body() body: { to: string }) {
    return this.communicationsService.sendTestEmail(body.to);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Récupérer la configuration communications (SMTP, Twilio, WhatsApp)' })
  getSettings() {
    return this.communicationsService.getSettings();
  }

  @Put('settings')
  @ApiOperation({ summary: 'Sauvegarder la configuration communications' })
  @ApiBody({ type: CommunicationsSettingsDto })
  saveSettings(@Body() dto: CommunicationsSettingsDto) {
    return this.communicationsService.saveSettings(dto);
  }

  // ========== AI-POWERED ENDPOINTS ==========

  @Post('ai/generate-email')
  @ApiOperation({ summary: 'Générer un email intelligent avec AI' })
  @ApiBody({ type: GenerateSmartEmailDto })
  generateSmartEmail(@Request() req, @Body() dto: GenerateSmartEmailDto) {
    return this.communicationsAIService.generateSmartEmail(req.user.userId, dto);
  }

  @Post('ai/generate-sms')
  @ApiOperation({ summary: 'Générer un SMS intelligent avec AI' })
  @ApiBody({ type: GenerateSmartSMSDto })
  generateSmartSMS(@Request() req, @Body() dto: GenerateSmartSMSDto) {
    return this.communicationsAIService.generateSmartSMS(req.user.userId, dto);
  }

  @Post('ai/suggest-templates')
  @ApiOperation({ summary: 'Suggérer des templates pertinents avec AI' })
  @ApiBody({ type: SuggestTemplatesDto })
  suggestTemplates(@Request() req, @Body() dto: SuggestTemplatesDto) {
    return this.communicationsAIService.suggestTemplates(req.user.userId, dto);
  }

  @Post('ai/generate-template')
  @ApiOperation({ summary: 'Générer un nouveau template avec AI' })
  @ApiBody({ type: GenerateTemplateDto })
  generateTemplate(@Request() req, @Body() dto: GenerateTemplateDto) {
    return this.communicationsAIService.generateTemplate(req.user.userId, dto);
  }

  @Post('ai/auto-complete')
  @ApiOperation({ summary: 'Auto-complétion intelligente pendant la frappe' })
  @ApiBody({ type: AutoCompleteDto })
  autoComplete(@Request() req, @Body() dto: AutoCompleteDto) {
    return this.communicationsAIService.autoComplete(req.user.userId, dto.partialText, {
      type: dto.type,
      prospectId: dto.prospectId,
      propertyId: dto.propertyId,
    });
  }

  @Post('ai/improve-text')
  @ApiOperation({ summary: 'Améliorer un texte existant avec AI' })
  @ApiBody({ type: ImproveTextDto })
  improveText(@Request() req, @Body() dto: ImproveTextDto) {
    return this.communicationsAIService.improveText(req.user.userId, dto.text, dto.improvements);
  }

  @Post('ai/translate')
  @ApiOperation({ summary: 'Traduire un message' })
  @ApiBody({ type: TranslateMessageDto })
  translateMessage(@Request() req, @Body() dto: TranslateMessageDto) {
    return this.communicationsAIService.translateMessage(
      req.user.userId,
      dto.text,
      dto.targetLanguage,
    );
  }
}
