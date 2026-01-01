import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MetaCloudProvider } from './providers/meta-cloud.provider';
import { TwilioProvider } from './providers/twilio.provider';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WhatsAppService', () => {
  let service: WhatsAppService;
  let prismaService: PrismaService;
  let metaProvider: MetaCloudProvider;
  let twilioProvider: TwilioProvider;

  const mockPrismaService = {
    whatsAppConfig: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    whatsAppConversation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    whatsAppMessage: {
      create: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    whatsAppTemplate: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockMetaProvider = {
    sendTextMessage: jest.fn(),
    sendMediaMessage: jest.fn(),
    sendTemplateMessage: jest.fn(),
    parseInboundMessage: jest.fn(),
  };

  const mockTwilioProvider = {
    sendTextMessage: jest.fn(),
    sendMediaMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MetaCloudProvider,
          useValue: mockMetaProvider,
        },
        {
          provide: TwilioProvider,
          useValue: mockTwilioProvider,
        },
      ],
    }).compile();

    service = module.get<WhatsAppService>(WhatsAppService);
    prismaService = module.get<PrismaService>(PrismaService);
    metaProvider = module.get<MetaCloudProvider>(MetaCloudProvider);
    twilioProvider = module.get<TwilioProvider>(TwilioProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Config Management', () => {
    const userId = 'user-123';
    const mockConfig = {
      id: 'config-123',
      userId,
      provider: 'meta',
      phoneNumberId: 'phone-123',
      accessToken: 'token-123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('createConfig', () => {
      it('should create WhatsApp config successfully', async () => {
        const dto = {
          provider: 'meta' as any,
          phoneNumberId: 'phone-123',
          accessToken: 'token-123',
        };

        mockPrismaService.whatsAppConfig.create.mockResolvedValue(mockConfig);

        const result = await service.createConfig(userId, dto);

        expect(result).toEqual(mockConfig);
        expect(mockPrismaService.whatsAppConfig.create).toHaveBeenCalledWith({
          data: { ...dto, userId },
        });
      });
    });

    describe('getConfig', () => {
      it('should get config successfully', async () => {
        mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);

        const result = await service.getConfig(userId);

        expect(result).toEqual(mockConfig);
        expect(mockPrismaService.whatsAppConfig.findUnique).toHaveBeenCalledWith({
          where: { userId },
        });
      });

      it('should throw NotFoundException if config not found', async () => {
        mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(null);

        await expect(service.getConfig(userId)).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateConfig', () => {
      it('should update config successfully', async () => {
        const dto = { isActive: false };
        const updatedConfig = { ...mockConfig, isActive: false };

        mockPrismaService.whatsAppConfig.update.mockResolvedValue(updatedConfig);

        const result = await service.updateConfig(userId, dto);

        expect(result).toEqual(updatedConfig);
        expect(mockPrismaService.whatsAppConfig.update).toHaveBeenCalledWith({
          where: { userId },
          data: dto,
        });
      });
    });

    describe('deleteConfig', () => {
      it('should delete config successfully', async () => {
        mockPrismaService.whatsAppConfig.delete.mockResolvedValue(mockConfig);

        const result = await service.deleteConfig(userId);

        expect(result).toEqual(mockConfig);
        expect(mockPrismaService.whatsAppConfig.delete).toHaveBeenCalledWith({
          where: { userId },
        });
      });
    });
  });

  describe('Message Sending', () => {
    const userId = 'user-123';
    const mockConfig = {
      id: 'config-123',
      userId,
      provider: 'meta',
      phoneNumberId: 'phone-123',
      accessToken: 'token-123',
      isActive: true,
    };

    const mockConversation = {
      id: 'conv-123',
      configId: 'config-123',
      phoneNumber: '+33612345678',
      userId,
      status: 'open',
      messageCount: 0,
      unreadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessageAt: new Date(),
    };

    const mockMessage = {
      id: 'msg-123',
      conversationId: 'conv-123',
      messageId: 'wa-msg-123',
      direction: 'outbound',
      type: 'text',
      content: 'Hello',
      status: 'sent',
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppConversation.findFirst.mockResolvedValue(null);
      mockPrismaService.whatsAppConversation.create.mockResolvedValue(mockConversation);
      mockPrismaService.whatsAppConversation.update.mockResolvedValue(mockConversation);
    });

    describe('sendTextMessage', () => {
      it('should send text message via Meta provider successfully', async () => {
        const dto = {
          phoneNumber: '+33612345678',
          message: 'Hello',
        };

        mockMetaProvider.sendTextMessage.mockResolvedValue({
          success: true,
          messageId: 'wa-msg-123',
        });

        mockPrismaService.whatsAppMessage.create.mockResolvedValue(mockMessage);

        const result = await service.sendTextMessage(userId, dto);

        expect(result.success).toBe(true);
        expect(result.messageId).toBe(mockMessage.id);
        expect(result.conversationId).toBe(mockConversation.id);
        expect(mockMetaProvider.sendTextMessage).toHaveBeenCalled();
        expect(mockPrismaService.whatsAppMessage.create).toHaveBeenCalled();
      });

      it('should throw BadRequestException if config is not active', async () => {
        mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue({
          ...mockConfig,
          isActive: false,
        });

        const dto = {
          phoneNumber: '+33612345678',
          message: 'Hello',
        };

        await expect(service.sendTextMessage(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should throw BadRequestException if message sending fails', async () => {
        const dto = {
          phoneNumber: '+33612345678',
          message: 'Hello',
        };

        mockMetaProvider.sendTextMessage.mockResolvedValue({
          success: false,
          error: 'Rate limit exceeded',
        });

        await expect(service.sendTextMessage(userId, dto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('should create conversation if not exists', async () => {
        const dto = {
          phoneNumber: '+33612345678',
          message: 'Hello',
          leadId: 'lead-123',
        };

        mockMetaProvider.sendTextMessage.mockResolvedValue({
          success: true,
          messageId: 'wa-msg-123',
        });

        mockPrismaService.whatsAppMessage.create.mockResolvedValue(mockMessage);

        await service.sendTextMessage(userId, dto);

        expect(mockPrismaService.whatsAppConversation.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            configId: mockConfig.id,
            phoneNumber: dto.phoneNumber,
            userId,
            leadId: dto.leadId,
          }),
        });
      });
    });

    describe('sendMediaMessage', () => {
      it('should send media message successfully', async () => {
        const dto = {
          phoneNumber: '+33612345678',
          mediaUrl: 'https://example.com/image.jpg',
          type: 'image' as any,
          caption: 'Check this out',
        };

        mockMetaProvider.sendMediaMessage.mockResolvedValue({
          success: true,
          messageId: 'wa-msg-123',
        });

        mockPrismaService.whatsAppMessage.create.mockResolvedValue({
          ...mockMessage,
          type: 'image',
          content: dto.mediaUrl,
          caption: dto.caption,
        });

        const result = await service.sendMediaMessage(userId, dto);

        expect(result.success).toBe(true);
        expect(mockMetaProvider.sendMediaMessage).toHaveBeenCalledWith(
          expect.any(Object),
          dto.phoneNumber,
          dto.type,
          dto.mediaUrl,
          dto.caption,
        );
      });
    });

    describe('sendTemplateMessage', () => {
      it('should send template message successfully', async () => {
        const mockTemplate = {
          id: 'template-123',
          name: 'welcome_message',
          body: 'Bonjour {{1}}!',
          status: 'approved',
          sentCount: 0,
        };

        const dto = {
          phoneNumber: '+33612345678',
          templateName: 'welcome_message',
          parameters: ['John'],
          language: 'fr',
        };

        mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(mockTemplate);
        mockMetaProvider.sendTemplateMessage.mockResolvedValue({
          success: true,
          messageId: 'wa-msg-123',
        });
        mockPrismaService.whatsAppMessage.create.mockResolvedValue(mockMessage);
        mockPrismaService.whatsAppTemplate.update.mockResolvedValue({
          ...mockTemplate,
          sentCount: 1,
        });

        const result = await service.sendTemplateMessage(userId, dto);

        expect(result.success).toBe(true);
        expect(mockPrismaService.whatsAppTemplate.update).toHaveBeenCalledWith({
          where: { id: mockTemplate.id },
          data: { sentCount: { increment: 1 } },
        });
      });

      it('should throw NotFoundException if template not found', async () => {
        mockPrismaService.whatsAppTemplate.findFirst.mockResolvedValue(null);

        const dto = {
          phoneNumber: '+33612345678',
          templateName: 'unknown_template',
          parameters: [],
        };

        await expect(service.sendTemplateMessage(userId, dto)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('sendBulkMessage', () => {
      it('should send bulk messages successfully', async () => {
        const dto = {
          phoneNumbers: ['+33612345678', '+33687654321'],
          message: 'Bulk message',
          delayMs: 100,
        };

        mockMetaProvider.sendTextMessage.mockResolvedValue({
          success: true,
          messageId: 'wa-msg-123',
        });

        mockPrismaService.whatsAppMessage.create.mockResolvedValue(mockMessage);

        const result = await service.sendBulkMessage(userId, dto);

        expect(result.total).toBe(2);
        expect(result.successful).toBe(2);
        expect(result.failed).toBe(0);
        expect(result.results).toHaveLength(2);
      });

      it('should handle partial failures in bulk send', async () => {
        const dto = {
          phoneNumbers: ['+33612345678', '+33687654321'],
          message: 'Bulk message',
        };

        mockMetaProvider.sendTextMessage
          .mockResolvedValueOnce({ success: true, messageId: 'wa-msg-1' })
          .mockResolvedValueOnce({ success: false, error: 'Invalid number' });

        mockPrismaService.whatsAppMessage.create.mockResolvedValue(mockMessage);

        const result = await service.sendBulkMessage(userId, dto);

        expect(result.total).toBe(2);
        expect(result.successful).toBe(1);
        expect(result.failed).toBe(1);
      });
    });
  });

  describe('Conversation Management', () => {
    const userId = 'user-123';
    const mockConversations = [
      {
        id: 'conv-1',
        phoneNumber: '+33612345678',
        status: 'open',
        messageCount: 5,
        unreadCount: 2,
        lastMessageAt: new Date(),
        messages: [],
      },
      {
        id: 'conv-2',
        phoneNumber: '+33687654321',
        status: 'assigned',
        messageCount: 3,
        unreadCount: 0,
        lastMessageAt: new Date(),
        messages: [],
      },
    ];

    describe('getConversations', () => {
      it('should get conversations with filters', async () => {
        const filters = {
          status: 'open' as any,
          limit: 50,
          offset: 0,
        };

        mockPrismaService.whatsAppConversation.findMany.mockResolvedValue(
          mockConversations,
        );
        mockPrismaService.whatsAppConversation.count.mockResolvedValue(2);

        const result = await service.getConversations(userId, filters);

        expect(result.conversations).toEqual(mockConversations);
        expect(result.total).toBe(2);
        expect(result.limit).toBe(50);
        expect(result.offset).toBe(0);
      });

      it('should filter by phone number', async () => {
        const filters = {
          phoneNumber: '+33612345678',
        };

        mockPrismaService.whatsAppConversation.findMany.mockResolvedValue([
          mockConversations[0],
        ]);
        mockPrismaService.whatsAppConversation.count.mockResolvedValue(1);

        const result = await service.getConversations(userId, filters);

        expect(result.conversations).toHaveLength(1);
        expect(mockPrismaService.whatsAppConversation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              phoneNumber: '+33612345678',
            }),
          }),
        );
      });
    });

    describe('getConversation', () => {
      it('should get conversation by ID with messages', async () => {
        const conversation = {
          ...mockConversations[0],
          messages: [{ id: 'msg-1', content: 'Hello' }],
          lead: { id: 'lead-1', name: 'John Doe' },
        };

        mockPrismaService.whatsAppConversation.findFirst.mockResolvedValue(
          conversation,
        );

        const result = await service.getConversation(userId, 'conv-1');

        expect(result).toEqual(conversation);
        expect(mockPrismaService.whatsAppConversation.findFirst).toHaveBeenCalledWith({
          where: {
            id: 'conv-1',
            userId,
          },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
            },
            lead: true,
          },
        });
      });

      it('should throw NotFoundException if conversation not found', async () => {
        mockPrismaService.whatsAppConversation.findFirst.mockResolvedValue(null);

        await expect(service.getConversation(userId, 'invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('updateConversation', () => {
      it('should update conversation successfully', async () => {
        const dto = {
          status: 'resolved' as any,
          tags: ['important', 'follow-up'],
        };

        const updated = { ...mockConversations[0], ...dto };
        mockPrismaService.whatsAppConversation.update.mockResolvedValue(updated);

        const result = await service.updateConversation(userId, 'conv-1', dto);

        expect(result).toEqual(updated);
        expect(mockPrismaService.whatsAppConversation.update).toHaveBeenCalledWith({
          where: {
            id: 'conv-1',
            userId,
          },
          data: dto,
        });
      });
    });

    describe('closeConversation', () => {
      it('should close conversation', async () => {
        const closed = { ...mockConversations[0], status: 'closed' };
        mockPrismaService.whatsAppConversation.update.mockResolvedValue(closed);

        const result = await service.closeConversation(userId, 'conv-1');

        expect(result.status).toBe('closed');
      });
    });

    describe('assignConversation', () => {
      it('should assign conversation to user', async () => {
        const assignedTo = 'agent-123';
        const assigned = {
          ...mockConversations[0],
          status: 'assigned',
          assignedTo,
        };
        mockPrismaService.whatsAppConversation.update.mockResolvedValue(assigned);

        const result = await service.assignConversation(userId, 'conv-1', assignedTo);

        expect(result.status).toBe('assigned');
        expect(result.assignedTo).toBe(assignedTo);
      });
    });
  });

  describe('Webhook Handling', () => {
    const mockConfig = {
      id: 'config-123',
      userId: 'user-123',
      provider: 'meta',
      phoneNumberId: 'phone-123',
      accessToken: 'token-123',
      autoReplyEnabled: true,
    };

    const mockInboundMessage = {
      id: 'wa-msg-123',
      from: '33612345678',
      timestamp: '1640000000',
      type: 'text',
      text: {
        body: 'Hello',
      },
    };

    beforeEach(() => {
      mockPrismaService.whatsAppConfig.findUnique.mockResolvedValue(mockConfig);
      mockPrismaService.whatsAppConversation.findFirst.mockResolvedValue(null);
      mockPrismaService.whatsAppConversation.create.mockResolvedValue({
        id: 'conv-123',
        configId: mockConfig.id,
        phoneNumber: '+33612345678',
        userId: mockConfig.userId,
      });
      mockPrismaService.whatsAppConversation.update.mockResolvedValue({});
      mockPrismaService.whatsAppMessage.create.mockResolvedValue({});
      mockPrismaService.whatsAppMessage.count.mockResolvedValue(1);
    });

    it('should handle inbound message successfully', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-123',
            changes: [
              {
                value: {
                  messages: [mockInboundMessage],
                  statuses: [],
                },
              },
            ],
          },
        ],
      };

      mockMetaProvider.parseInboundMessage.mockReturnValue({
        messages: [mockInboundMessage],
        statuses: [],
      });

      await service.handleInboundMessage(mockConfig.id, webhook);

      expect(mockPrismaService.whatsAppMessage.create).toHaveBeenCalled();
      expect(mockPrismaService.whatsAppConversation.update).toHaveBeenCalled();
    });

    it('should trigger auto-reply on first message', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-123',
            changes: [
              {
                value: {
                  messages: [mockInboundMessage],
                  statuses: [],
                },
              },
            ],
          },
        ],
      };

      mockMetaProvider.parseInboundMessage.mockReturnValue({
        messages: [mockInboundMessage],
        statuses: [],
      });

      mockMetaProvider.sendTextMessage.mockResolvedValue({
        success: true,
        messageId: 'auto-reply-123',
      });

      await service.handleInboundMessage(mockConfig.id, webhook);

      expect(mockMetaProvider.sendTextMessage).toHaveBeenCalled();
    });
  });
});
