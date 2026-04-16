import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/core/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto, SendMessageDto, MarkReadDto } from './dto';

@ApiTags('Chat Interne')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Lister les conversations' })
  getConversations(@Req() req: any) {
    return this.chatService.getConversations(req.user.userId);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Créer une conversation' })
  createConversation(@Req() req: any, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.userId, dto);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: "Détails d'une conversation" })
  getConversation(@Req() req: any, @Param('id') id: string) {
    return this.chatService.getConversationById(id, req.user.userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: "Messages d'une conversation" })
  getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('take') take?: string,
    @Query('before') before?: string,
  ) {
    return this.chatService.getMessages(id, req.user.userId, take ? parseInt(take) : 50, before);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  async sendMessage(@Req() req: any, @Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(id, req.user.userId, dto.content, dto.type);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer comme lu' })
  markAsRead(@Req() req: any, @Param('id') id: string) {
    return this.chatService.markAsRead(id, req.user.userId);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Lister les agents disponibles' })
  getAgents(@Req() req: any) {
    return this.chatService.getAgents(req.user.userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Compteur messages non lus' })
  getUnread(@Req() req: any) {
    return this.chatService.getTotalUnread(req.user.userId);
  }
}
