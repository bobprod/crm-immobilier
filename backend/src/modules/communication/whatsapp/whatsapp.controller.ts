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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { WhatsAppService } from './whatsapp.service';
import {
  SendTextMessageDto,
  SendMediaMessageDto,
  SendTemplateMessageDto,
  SendBulkMessageDto,
  MessageResponseDto,
} from './dto/send-message.dto';
import {
  CreateWhatsAppConfigDto,
  UpdateWhatsAppConfigDto,
  WhatsAppConfigResponseDto,
} from './dto/config.dto';
import {
  GetConversationsDto,
  UpdateConversationDto,
  AssignConversationDto,
  ConversationResponseDto,
} from './dto/conversation.dto';

@ApiTags('WhatsApp')
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  // ═══════════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════════

  @Post('config')
  @ApiOperation({ summary: 'Create WhatsApp configuration' })
  @ApiResponse({ status: 201, type: WhatsAppConfigResponseDto })
  async createConfig(@Req() req: any, @Body() dto: CreateWhatsAppConfigDto) {
    return this.whatsappService.createConfig(req.user.id, dto);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get WhatsApp configuration' })
  @ApiResponse({ status: 200, type: WhatsAppConfigResponseDto })
  async getConfig(@Req() req: any) {
    return this.whatsappService.getConfig(req.user.id);
  }

  @Put('config')
  @ApiOperation({ summary: 'Update WhatsApp configuration' })
  @ApiResponse({ status: 200, type: WhatsAppConfigResponseDto })
  async updateConfig(@Req() req: any, @Body() dto: UpdateWhatsAppConfigDto) {
    return this.whatsappService.updateConfig(req.user.id, dto);
  }

  @Delete('config')
  @ApiOperation({ summary: 'Delete WhatsApp configuration' })
  async deleteConfig(@Req() req: any) {
    return this.whatsappService.deleteConfig(req.user.id);
  }

  // ═══════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════

  @Post('messages/text')
  @ApiOperation({ summary: 'Send text message' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendTextMessage(@Req() req: any, @Body() dto: SendTextMessageDto) {
    return this.whatsappService.sendTextMessage(req.user.id, dto);
  }

  @Post('messages/media')
  @ApiOperation({ summary: 'Send media message (image, document, video, audio)' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendMediaMessage(@Req() req: any, @Body() dto: SendMediaMessageDto) {
    return this.whatsappService.sendMediaMessage(req.user.id, dto);
  }

  @Post('messages/template')
  @ApiOperation({ summary: 'Send template message' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendTemplateMessage(@Req() req: any, @Body() dto: SendTemplateMessageDto) {
    return this.whatsappService.sendTemplateMessage(req.user.id, dto);
  }

  @Post('messages/bulk')
  @ApiOperation({ summary: 'Send bulk messages' })
  async sendBulkMessage(@Req() req: any, @Body() dto: SendBulkMessageDto) {
    return this.whatsappService.sendBulkMessage(req.user.id, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════════

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations list' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  async getConversations(@Req() req: any, @Query() filters: GetConversationsDto) {
    return this.whatsappService.getConversations(req.user.id, filters);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  async getConversation(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.getConversation(req.user.id, id);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Update conversation' })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  async updateConversation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.whatsappService.updateConversation(req.user.id, id, dto);
  }

  @Post('conversations/:id/close')
  @ApiOperation({ summary: 'Close conversation' })
  async closeConversation(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.closeConversation(req.user.id, id);
  }

  @Post('conversations/:id/assign')
  @ApiOperation({ summary: 'Assign conversation to user' })
  async assignConversation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.whatsappService.assignConversation(req.user.id, id, dto.userId);
  }
}
