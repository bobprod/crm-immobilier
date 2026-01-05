import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { MetaCloudProvider } from './providers/meta-cloud.provider';
import { TwilioProvider } from './providers/twilio.provider';
import {
  SendTextMessageDto,
  SendMediaMessageDto,
  SendTemplateMessageDto,
  SendBulkMessageDto,
} from './dto/send-message.dto';
import { CreateWhatsAppConfigDto, UpdateWhatsAppConfigDto } from './dto/config.dto';
import { GetConversationsDto, UpdateConversationDto } from './dto/conversation.dto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaProvider: MetaCloudProvider,
    private readonly twilioProvider: TwilioProvider,
  ) { }

  // ═══════════════════════════════════════════════════════════════
  // CONFIG MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async createConfig(userId: string, dto: CreateWhatsAppConfigDto) {
    return this.prisma.whatsAppConfig.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async getConfig(userId: string) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      throw new NotFoundException('WhatsApp config not found');
    }

    return config;
  }

  async updateConfig(userId: string, dto: UpdateWhatsAppConfigDto) {
    return this.prisma.whatsAppConfig.update({
      where: { userId },
      data: dto,
    });
  }

  async deleteConfig(userId: string) {
    return this.prisma.whatsAppConfig.delete({
      where: { userId },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // MESSAGE SENDING
  // ═══════════════════════════════════════════════════════════════

  async sendTextMessage(userId: string, dto: SendTextMessageDto) {
    const config = await this.getConfig(userId);

    if (!config.isActive) {
      throw new BadRequestException('WhatsApp config is not active');
    }

    // Find or create conversation
    const conversation = await this.findOrCreateConversation(
      config.id,
      dto.phoneNumber,
      userId,
      dto.leadId,
      dto.prospectId,
    );

    // Send via appropriate provider
    let result;
    if (config.provider === 'meta') {
      result = await this.metaProvider.sendTextMessage(
        {
          phoneNumberId: config.phoneNumberId!,
          accessToken: config.accessToken!,
        },
        dto.phoneNumber,
        dto.message,
      );
    } else {
      result = await this.twilioProvider.sendTextMessage(
        {
          accountSid: config.twilioAccountSid!,
          authToken: config.twilioAuthToken!,
          phoneNumber: config.twilioPhoneNumber!,
        },
        dto.phoneNumber,
        dto.message,
      );
    }

    if (!result.success) {
      throw new BadRequestException(`Failed to send message: ${result.error}`);
    }

    // Save message to database
    const message = await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        messageId: result.messageId!,
        direction: 'outbound',
        type: 'text',
        content: dto.message,
        status: 'sent',
        sentBy: userId,
        timestamp: new Date(),
      },
    });

    // Update conversation
    await this.prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });

    return {
      success: true,
      messageId: message.id,
      conversationId: conversation.id,
    };
  }

  async sendMediaMessage(userId: string, dto: SendMediaMessageDto) {
    const config = await this.getConfig(userId);

    if (!config.isActive) {
      throw new BadRequestException('WhatsApp config is not active');
    }

    const conversation = await this.findOrCreateConversation(
      config.id,
      dto.phoneNumber,
      userId,
      dto.leadId,
    );

    let result;
    if (config.provider === 'meta') {
      result = await this.metaProvider.sendMediaMessage(
        {
          phoneNumberId: config.phoneNumberId!,
          accessToken: config.accessToken!,
        },
        dto.phoneNumber,
        dto.type as any,
        dto.mediaUrl,
        dto.caption,
      );
    } else {
      result = await this.twilioProvider.sendMediaMessage(
        {
          accountSid: config.twilioAccountSid!,
          authToken: config.twilioAuthToken!,
          phoneNumber: config.twilioPhoneNumber!,
        },
        dto.phoneNumber,
        dto.mediaUrl,
        dto.caption,
      );
    }

    if (!result.success) {
      throw new BadRequestException(`Failed to send media: ${result.error}`);
    }

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        messageId: result.messageId!,
        direction: 'outbound',
        type: dto.type,
        content: dto.mediaUrl,
        caption: dto.caption,
        mediaUrl: dto.mediaUrl,
        status: 'sent',
        sentBy: userId,
        timestamp: new Date(),
      },
    });

    await this.prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });

    return {
      success: true,
      messageId: message.id,
      conversationId: conversation.id,
    };
  }

  async sendTemplateMessage(userId: string, dto: SendTemplateMessageDto) {
    const config = await this.getConfig(userId);

    if (!config.isActive) {
      throw new BadRequestException('WhatsApp config is not active');
    }

    // Get template
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        configId: config.id,
        name: dto.templateName,
        status: 'approved',
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found or not approved');
    }

    const conversation = await this.findOrCreateConversation(
      config.id,
      dto.phoneNumber,
      userId,
      dto.leadId,
    );

    const result = await this.metaProvider.sendTemplateMessage(
      {
        phoneNumberId: config.phoneNumberId!,
        accessToken: config.accessToken!,
      },
      dto.phoneNumber,
      dto.templateName,
      dto.language || 'fr',
      dto.parameters,
    );

    if (!result.success) {
      throw new BadRequestException(`Failed to send template: ${result.error}`);
    }

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        messageId: result.messageId!,
        direction: 'outbound',
        type: 'template',
        content: template.body,
        templateName: dto.templateName,
        templateParams: dto.parameters,
        status: 'sent',
        sentBy: userId,
        timestamp: new Date(),
      },
    });

    // Update template stats
    await this.prisma.whatsAppTemplate.update({
      where: { id: template.id },
      data: {
        sentCount: { increment: 1 },
      },
    });

    await this.prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });

    return {
      success: true,
      messageId: message.id,
      conversationId: conversation.id,
    };
  }

  async sendBulkMessage(userId: string, dto: SendBulkMessageDto) {
    const results = [];

    for (const phoneNumber of dto.phoneNumbers) {
      try {
        const result = await this.sendTextMessage(userId, {
          phoneNumber,
          message: dto.message,
        });
        results.push({ phoneNumber, success: true, ...result });

        // Delay between messages
        if (dto.delayMs) {
          await new Promise(resolve => setTimeout(resolve, dto.delayMs));
        }
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: dto.phoneNumbers.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONVERSATION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  async getConversations(userId: string, filters: GetConversationsDto) {
    const where: any = {
      userId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.phoneNumber) {
      where.phoneNumber = filters.phoneNumber;
    }

    if (filters.leadId) {
      where.leadId = filters.leadId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [conversations, total] = await Promise.all([
      this.prisma.whatsAppConversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.whatsAppConversation.count({ where }),
    ]);

    return {
      conversations,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        lead: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateConversation(userId: string, conversationId: string, dto: UpdateConversationDto) {
    return this.prisma.whatsAppConversation.update({
      where: {
        id: conversationId,
        userId,
      },
      data: dto,
    });
  }

  async closeConversation(userId: string, conversationId: string) {
    return this.updateConversation(userId, conversationId, {
      status: 'closed' as any,
    } as any);
  }

  async assignConversation(userId: string, conversationId: string, assignToUserId: string) {
    return this.updateConversation(userId, conversationId, {
      status: 'assigned' as any,
      assignedTo: assignToUserId,
    } as any);
  }

  // ═══════════════════════════════════════════════════════════════
  // WEBHOOK HANDLING
  // ═══════════════════════════════════════════════════════════════

  async handleInboundMessage(configId: string, webhook: any) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { id: configId },
    });

    if (!config) {
      this.logger.error(`Config not found: ${configId}`);
      return;
    }

    const parsed = this.metaProvider.parseInboundMessage(webhook);

    if (!parsed || !parsed.messages || parsed.messages.length === 0) {
      return;
    }

    for (const msg of parsed.messages) {
      await this.processInboundMessage(config, msg);
    }

    // Handle status updates
    if (parsed.statuses) {
      for (const status of parsed.statuses) {
        await this.processStatusUpdate(status);
      }
    }
  }

  private async processInboundMessage(config: any, message: any) {
    try {
      const fromNumber = message.from;
      const messageId = message.id;
      const timestamp = new Date(parseInt(message.timestamp) * 1000);

      // Find or create conversation
      const conversation = await this.findOrCreateConversation(
        config.id,
        `+${fromNumber}`,
        config.userId,
      );

      // Extract message content
      let content = '';
      let type = 'text';
      let mediaUrl = null;

      if (message.text) {
        content = message.text.body;
        type = 'text';
      } else if (message.image) {
        type = 'image';
        mediaUrl = message.image.id;
      } else if (message.document) {
        type = 'document';
        mediaUrl = message.document.id;
      } else if (message.video) {
        type = 'video';
        mediaUrl = message.video.id;
      } else if (message.audio) {
        type = 'audio';
        mediaUrl = message.audio.id;
      }

      // Save message
      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          messageId,
          direction: 'inbound',
          type: type as any,
          content: content || mediaUrl || '',
          mediaUrl,
          status: 'delivered',
          timestamp,
        },
      });

      // Update conversation
      await this.prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: timestamp,
          messageCount: { increment: 1 },
          unreadCount: { increment: 1 },
        },
      });

      // Trigger auto-reply if enabled
      if (config.autoReplyEnabled) {
        await this.triggerAutoReply(config, conversation, content);
      }

      this.logger.log(`Inbound message processed: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to process inbound message: ${error.message}`, error.stack);
    }
  }

  private async processStatusUpdate(status: any) {
    try {
      const messageId = status.id;
      const newStatus = status.status;

      await this.prisma.whatsAppMessage.updateMany({
        where: { messageId },
        data: {
          status: newStatus,
          ...(newStatus === 'delivered' && { deliveredAt: new Date() }),
          ...(newStatus === 'read' && { readAt: new Date() }),
        },
      });

      this.logger.debug(`Message status updated: ${messageId} -> ${newStatus}`);
    } catch (error) {
      this.logger.error(`Failed to update message status: ${error.message}`);
    }
  }

  private async triggerAutoReply(config: any, conversation: any, messageText: string) {
    // Simple auto-reply logic (can be enhanced with rules engine)
    const messageCount = await this.prisma.whatsAppMessage.count({
      where: {
        conversationId: conversation.id,
        direction: 'inbound',
      },
    });

    // First message auto-reply
    if (messageCount === 1) {
      const autoReplyText = 'Bonjour ! Merci de nous contacter. Un conseiller va vous répondre rapidement. 🏠';

      await this.metaProvider.sendTextMessage(
        {
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessToken,
        },
        conversation.phoneNumber,
        autoReplyText,
      );

      this.logger.log(`Auto-reply sent to ${conversation.phoneNumber}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  private async findOrCreateConversation(
    configId: string,
    phoneNumber: string,
    userId?: string,
    leadId?: string,
    prospectId?: string,
  ) {
    let conversation = await this.prisma.whatsAppConversation.findFirst({
      where: {
        configId,
        phoneNumber,
      },
    });

    if (!conversation) {
      conversation = await this.prisma.whatsAppConversation.create({
        data: {
          configId,
          phoneNumber,
          userId,
          leadId,
          prospectId,
          status: 'open',
        },
      });
    }

    return conversation;
  }
}
