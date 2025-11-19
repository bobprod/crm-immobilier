import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommunicationsService } from './communications.service';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { SendEmailDto, SendSmsDto, SendWhatsAppDto, CreateTemplateDto, UpdateTemplateDto } from './dto';

@ApiTags('Communications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communications')
export class CommunicationsController {
  constructor(private communicationsService: CommunicationsService) {}

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

  @Post('templates')
  @ApiOperation({ summary: 'Créer un template' })
  createTemplate(@Request() req, @Body() dto: CreateTemplateDto) {
    return this.communicationsService.createTemplate(req.user.userId, dto);
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
  sendTestEmail(@Body() body: { to: string }) {
    return this.communicationsService.sendTestEmail(body.to);
  }
}
