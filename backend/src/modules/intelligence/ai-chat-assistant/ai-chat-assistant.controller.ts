import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { AIChatAssistantService } from './ai-chat-assistant.service';
import { CreateConversationDto, SendMessageDto } from './dto';

@Controller('ai-chat-assistant')
@UseGuards(JwtAuthGuard)
export class AIChatAssistantController {
  private readonly logger = new Logger(AIChatAssistantController.name);

  constructor(private readonly chatService: AIChatAssistantService) { }

  /**
   * Create a new conversation
   * POST /api/ai-chat-assistant/conversation
   */
  @Post('conversation')
  async createConversation(
    @Request() req,
    @Body() dto: CreateConversationDto,
  ) {
    const userId = req.user.userId;
    this.logger.log(`Creating conversation for user ${userId}`);
    return this.chatService.createConversation(userId, dto);
  }

  /**
   * Get all conversations for the current user
   * GET /api/ai-chat-assistant/conversations
   */
  @Get('conversations')
  async getConversations(@Request() req, @Query('limit') limit?: string) {
    try {
      const userId = req.user.userId;
      const limitNumber = limit ? parseInt(limit) : 50;
      this.logger.log(`Fetching conversations for user ${userId}`);
      const conversations = await this.chatService.getConversations(userId, limitNumber);
      return conversations || [];
    } catch (error: any) {
      // Log and fail gracefully to avoid frontend 500 crash
      const msg = error?.message || 'Unknown server error';
      this.logger.error(`Error fetching conversations: ${msg}`, error?.stack);
      return [];
    }
  }

  /**
   * Get messages for a conversation
   * GET /api/ai-chat-assistant/messages/:conversationId
   */
  @Get('messages/:conversationId')
  async getMessages(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.userId;
    const limitNumber = limit ? parseInt(limit) : 100;
    this.logger.log(
      `Fetching messages for conversation ${conversationId}, user ${userId}`,
    );
    return this.chatService.getMessages(userId, conversationId, limitNumber);
  }

  /**
   * Send a message and get AI response
   * POST /api/ai-chat-assistant/message/:conversationId
   */
  @Post('message/:conversationId')
  async sendMessage(
    @Request() req,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const userId = req.user.userId;
    this.logger.log(
      `Sending message in conversation ${conversationId}, user ${userId}`,
    );
    return this.chatService.sendMessage(userId, conversationId, dto);
  }

  /**
   * Delete a conversation
   * DELETE /api/ai-chat-assistant/conversation/:id
   */
  @Delete('conversation/:id')
  async deleteConversation(@Request() req, @Param('id') conversationId: string) {
    const userId = req.user.userId;
    this.logger.log(
      `Deleting conversation ${conversationId}, user ${userId}`,
    );
    await this.chatService.deleteConversation(userId, conversationId);
    return { success: true, message: 'Conversation deleted successfully' };
  }
}
