import {
  BadRequestException,
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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';
import { WhatsAppService } from './whatsapp.service';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
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
@UseGuards(JwtAuthGuard)
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
    return this.whatsappService.createConfig(req.user.userId, dto);
  }

  @Get('config')
  @ApiOperation({ summary: 'Get WhatsApp configuration' })
  @ApiResponse({ status: 200, type: WhatsAppConfigResponseDto })
  async getConfig(@Req() req: any) {
    return this.whatsappService.getConfig(req.user.userId);
  }

  @Put('config')
  @ApiOperation({ summary: 'Update WhatsApp configuration' })
  @ApiResponse({ status: 200, type: WhatsAppConfigResponseDto })
  async updateConfig(@Req() req: any, @Body() dto: UpdateWhatsAppConfigDto) {
    return this.whatsappService.updateConfig(req.user.userId, dto);
  }

  @Delete('config')
  @ApiOperation({ summary: 'Delete WhatsApp configuration' })
  async deleteConfig(@Req() req: any) {
    return this.whatsappService.deleteConfig(req.user.userId);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test WhatsApp configuration' })
  async testConnection(@Req() req: any) {
    return this.whatsappService.testConnection(req.user.userId);
  }

  // ═══════════════════════════════════════════════════════════════
  // MESSAGES
  // ✅ FIXED: Rate limiting added to prevent abuse
  // ═══════════════════════════════════════════════════════════════

  @Post('messages/text')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 messages per minute
  @ApiOperation({ summary: 'Send text message' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendTextMessage(@Req() req: any, @Body() dto: SendTextMessageDto) {
    return this.whatsappService.sendTextMessage(req.user.userId, dto);
  }

  @Post('messages/media')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 media messages per minute
  @ApiOperation({ summary: 'Send media message (image, document, video, audio)' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendMediaMessage(@Req() req: any, @Body() dto: SendMediaMessageDto) {
    return this.whatsappService.sendMediaMessage(req.user.userId, dto);
  }

  @Post('messages/template')
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // 15 template messages per minute
  @ApiOperation({ summary: 'Send template message' })
  @ApiResponse({ status: 201, type: MessageResponseDto })
  async sendTemplateMessage(@Req() req: any, @Body() dto: SendTemplateMessageDto) {
    return this.whatsappService.sendTemplateMessage(req.user.userId, dto);
  }

  @Post('messages/bulk')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 bulk operations per minute
  @ApiOperation({ summary: 'Send bulk messages' })
  async sendBulkMessage(@Req() req: any, @Body() dto: SendBulkMessageDto) {
    return this.whatsappService.sendBulkMessage(req.user.userId, dto);
  }

  // ═══════════════════════════════════════════════════════════════
  // CONVERSATIONS
  // ═══════════════════════════════════════════════════════════════

  @Post('media/upload')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Upload media file for WhatsApp messages' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, _file: any, cb: any) => {
          const userId = req.user?.userId || 'anonymous';
          const dir = `./uploads/whatsapp/${userId}`;
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req: any, file: any, cb: any) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `wa-media-${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        const allowedExtensions =
          /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|mp4|mov|avi|mp3|wav|ogg|aac)$/i;

        if (allowedExtensions.test(extname(file.originalname))) {
          cb(null, true);
          return;
        }

        cb(new BadRequestException('Unsupported media file type'), false);
      },
    }),
  )
  async uploadMedia(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const relativeUrl = `/uploads/whatsapp/${req.user.userId}/${file.filename}`;
    const configuredBaseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
      process.env.API_URL?.replace(/\/api\/?$/, '') ||
      `${req.protocol}://${req.get('host')}`;

    return {
      url: `${configuredBaseUrl}${relativeUrl}`,
      relativeUrl,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations list' })
  @ApiResponse({ status: 200, type: [ConversationResponseDto] })
  async getConversations(@Req() req: any, @Query() filters: GetConversationsDto) {
    return this.whatsappService.getConversations(req.user.userId, filters);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  async getConversation(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.getConversation(req.user.userId, id);
  }

  @Put('conversations/:id')
  @ApiOperation({ summary: 'Update conversation' })
  @ApiResponse({ status: 200, type: ConversationResponseDto })
  async updateConversation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.whatsappService.updateConversation(req.user.userId, id, dto);
  }

  @Post('conversations/:id/close')
  @ApiOperation({ summary: 'Close conversation' })
  async closeConversation(@Req() req: any, @Param('id') id: string) {
    return this.whatsappService.closeConversation(req.user.userId, id);
  }

  @Post('conversations/:id/assign')
  @ApiOperation({ summary: 'Assign conversation to user' })
  async assignConversation(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.whatsappService.assignConversation(req.user.userId, id, dto.userId);
  }

  @Post('messages/mark-read')
  @ApiOperation({ summary: 'Mark messages as read' })
  async markMessagesAsRead(
    @Req() req: any,
    @Body() body: { messageIds: string[] },
  ) {
    return this.whatsappService.markMessagesAsRead(req.user.userId, body.messageIds || []);
  }
}
