import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('WhatsAppController', () => {
  let controller: WhatsAppController;
  let service: WhatsAppService;

  const mockWhatsAppService = {
    createConfig: jest.fn(),
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    deleteConfig: jest.fn(),
    sendTextMessage: jest.fn(),
    sendMediaMessage: jest.fn(),
    sendTemplateMessage: jest.fn(),
    sendBulkMessage: jest.fn(),
    getConversations: jest.fn(),
    getConversation: jest.fn(),
    updateConversation: jest.fn(),
    closeConversation: jest.fn(),
    assignConversation: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppController],
      providers: [
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
      ],
    }).compile();

    controller = module.get<WhatsAppController>(WhatsAppController);
    service = module.get<WhatsAppService>(WhatsAppService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Config Management', () => {
    describe('createConfig', () => {
      it('should create WhatsApp config successfully', async () => {
        const createDto = {
          provider: 'meta' as const,
          phoneNumberId: 'phone-123',
          accessToken: 'token-123',
          isActive: true,
        };

        const expectedConfig = {
          id: 'config-123',
          userId: 'user-123',
          ...createDto,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockWhatsAppService.createConfig.mockResolvedValue(expectedConfig);

        const result = await controller.createConfig(mockRequest, createDto);

        expect(service.createConfig).toHaveBeenCalledWith('user-123', createDto);
        expect(result).toEqual(expectedConfig);
      });

      it('should handle creation errors', async () => {
        const createDto = {
          provider: 'meta' as const,
          phoneNumberId: 'phone-123',
          accessToken: 'token-123',
          isActive: true,
        };

        mockWhatsAppService.createConfig.mockRejectedValue(
          new BadRequestException('Config already exists'),
        );

        await expect(controller.createConfig(mockRequest, createDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getConfig', () => {
      it('should get WhatsApp config successfully', async () => {
        const expectedConfig = {
          id: 'config-123',
          userId: 'user-123',
          provider: 'meta',
          phoneNumberId: 'phone-123',
          isActive: true,
        };

        mockWhatsAppService.getConfig.mockResolvedValue(expectedConfig);

        const result = await controller.getConfig(mockRequest);

        expect(service.getConfig).toHaveBeenCalledWith('user-123');
        expect(result).toEqual(expectedConfig);
      });

      it('should throw NotFoundException if config not found', async () => {
        mockWhatsAppService.getConfig.mockRejectedValue(
          new NotFoundException('WhatsApp config not found'),
        );

        await expect(controller.getConfig(mockRequest)).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateConfig', () => {
      it('should update WhatsApp config successfully', async () => {
        const updateDto = {
          isActive: false,
          autoReplyEnabled: true,
        };

        const expectedConfig = {
          id: 'config-123',
          userId: 'user-123',
          ...updateDto,
        };

        mockWhatsAppService.updateConfig.mockResolvedValue(expectedConfig);

        const result = await controller.updateConfig(mockRequest, updateDto);

        expect(service.updateConfig).toHaveBeenCalledWith('user-123', updateDto);
        expect(result).toEqual(expectedConfig);
      });
    });

    describe('deleteConfig', () => {
      it('should delete WhatsApp config successfully', async () => {
        mockWhatsAppService.deleteConfig.mockResolvedValue({ success: true });

        const result = await controller.deleteConfig(mockRequest);

        expect(service.deleteConfig).toHaveBeenCalledWith('user-123');
        expect(result).toEqual({ success: true });
      });
    });
  });

  describe('Message Sending', () => {
    describe('sendTextMessage', () => {
      it('should send text message successfully', async () => {
        const sendDto = {
          phoneNumber: '+33612345678',
          message: 'Hello World',
          leadId: 'lead-123',
        };

        const expectedResponse = {
          success: true,
          messageId: 'msg-123',
          conversationId: 'conv-123',
        };

        mockWhatsAppService.sendTextMessage.mockResolvedValue(expectedResponse);

        const result = await controller.sendTextMessage(mockRequest, sendDto);

        expect(service.sendTextMessage).toHaveBeenCalledWith('user-123', sendDto);
        expect(result).toEqual(expectedResponse);
      });

      it('should handle sending errors', async () => {
        const sendDto = {
          phoneNumber: '+33612345678',
          message: 'Hello World',
        };

        mockWhatsAppService.sendTextMessage.mockRejectedValue(
          new BadRequestException('Config is not active'),
        );

        await expect(controller.sendTextMessage(mockRequest, sendDto)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('sendMediaMessage', () => {
      it('should send media message successfully', async () => {
        const sendDto = {
          phoneNumber: '+33612345678',
          type: 'image' as const,
          mediaUrl: 'https://example.com/image.jpg',
          caption: 'Check this out',
        };

        const expectedResponse = {
          success: true,
          messageId: 'msg-456',
          conversationId: 'conv-123',
        };

        mockWhatsAppService.sendMediaMessage.mockResolvedValue(expectedResponse);

        const result = await controller.sendMediaMessage(mockRequest, sendDto);

        expect(service.sendMediaMessage).toHaveBeenCalledWith('user-123', sendDto);
        expect(result).toEqual(expectedResponse);
      });

      it('should handle different media types', async () => {
        const mediaTypes = ['image', 'document', 'video', 'audio'] as const;

        for (const type of mediaTypes) {
          const sendDto = {
            phoneNumber: '+33612345678',
            type,
            mediaUrl: `https://example.com/file.${type}`,
          };

          mockWhatsAppService.sendMediaMessage.mockResolvedValue({
            success: true,
            messageId: `msg-${type}`,
            conversationId: 'conv-123',
          });

          const result = await controller.sendMediaMessage(mockRequest, sendDto);

          expect(result.success).toBe(true);
        }
      });
    });

    describe('sendTemplateMessage', () => {
      it('should send template message successfully', async () => {
        const sendDto = {
          phoneNumber: '+33612345678',
          templateName: 'welcome_template',
          language: 'fr',
          parameters: ['John', 'Doe'],
        };

        const expectedResponse = {
          success: true,
          messageId: 'msg-789',
          conversationId: 'conv-123',
        };

        mockWhatsAppService.sendTemplateMessage.mockResolvedValue(expectedResponse);

        const result = await controller.sendTemplateMessage(mockRequest, sendDto);

        expect(service.sendTemplateMessage).toHaveBeenCalledWith('user-123', sendDto);
        expect(result).toEqual(expectedResponse);
      });

      it('should handle template not found', async () => {
        const sendDto = {
          phoneNumber: '+33612345678',
          templateName: 'non_existent',
          language: 'fr',
        };

        mockWhatsAppService.sendTemplateMessage.mockRejectedValue(
          new NotFoundException('Template not found or not approved'),
        );

        await expect(controller.sendTemplateMessage(mockRequest, sendDto)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('sendBulkMessage', () => {
      it('should send bulk messages successfully', async () => {
        const sendDto = {
          phoneNumbers: ['+33612345678', '+33698765432'],
          message: 'Bulk message',
          delayMs: 1000,
        };

        const expectedResponse = {
          total: 2,
          successful: 2,
          failed: 0,
          results: [
            { phoneNumber: '+33612345678', success: true, messageId: 'msg-1' },
            { phoneNumber: '+33698765432', success: true, messageId: 'msg-2' },
          ],
        };

        mockWhatsAppService.sendBulkMessage.mockResolvedValue(expectedResponse);

        const result = await controller.sendBulkMessage(mockRequest, sendDto);

        expect(service.sendBulkMessage).toHaveBeenCalledWith('user-123', sendDto);
        expect(result).toEqual(expectedResponse);
        expect(result.successful).toBe(2);
        expect(result.failed).toBe(0);
      });

      it('should handle partial failures in bulk send', async () => {
        const sendDto = {
          phoneNumbers: ['+33612345678', 'invalid', '+33698765432'],
          message: 'Bulk message',
        };

        const expectedResponse = {
          total: 3,
          successful: 2,
          failed: 1,
          results: [
            { phoneNumber: '+33612345678', success: true, messageId: 'msg-1' },
            { phoneNumber: 'invalid', success: false, error: 'Invalid phone number' },
            { phoneNumber: '+33698765432', success: true, messageId: 'msg-2' },
          ],
        };

        mockWhatsAppService.sendBulkMessage.mockResolvedValue(expectedResponse);

        const result = await controller.sendBulkMessage(mockRequest, sendDto);

        expect(result.successful).toBe(2);
        expect(result.failed).toBe(1);
      });
    });
  });

  describe('Conversation Management', () => {
    describe('getConversations', () => {
      it('should get conversations with filters', async () => {
        const filters = {
          status: 'open' as const,
          limit: 50,
          offset: 0,
        };

        const expectedResponse = {
          conversations: [
            {
              id: 'conv-123',
              phoneNumber: '+33612345678',
              status: 'open',
              messageCount: 5,
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        };

        mockWhatsAppService.getConversations.mockResolvedValue(expectedResponse);

        const result = await controller.getConversations(mockRequest, filters);

        expect(service.getConversations).toHaveBeenCalledWith('user-123', filters);
        expect(result).toEqual(expectedResponse);
      });

      it('should filter by phone number', async () => {
        const filters = {
          phoneNumber: '+33612345678',
        };

        mockWhatsAppService.getConversations.mockResolvedValue({
          conversations: [{ phoneNumber: '+33612345678' }],
          total: 1,
        });

        const result = await controller.getConversations(mockRequest, filters);

        expect(result.conversations).toHaveLength(1);
        expect(result.conversations[0].phoneNumber).toBe('+33612345678');
      });

      it('should filter by leadId', async () => {
        const filters = {
          leadId: 'lead-123',
        };

        mockWhatsAppService.getConversations.mockResolvedValue({
          conversations: [{ leadId: 'lead-123' }],
          total: 1,
        });

        const result = await controller.getConversations(mockRequest, filters);

        expect(result.conversations[0].leadId).toBe('lead-123');
      });
    });

    describe('getConversation', () => {
      it('should get conversation by ID with messages', async () => {
        const conversationId = 'conv-123';
        const expectedConversation = {
          id: conversationId,
          phoneNumber: '+33612345678',
          status: 'open',
          messages: [
            { id: 'msg-1', content: 'Hello', direction: 'inbound' },
            { id: 'msg-2', content: 'Hi there', direction: 'outbound' },
          ],
        };

        mockWhatsAppService.getConversation.mockResolvedValue(expectedConversation);

        const result = await controller.getConversation(mockRequest, conversationId);

        expect(service.getConversation).toHaveBeenCalledWith('user-123', conversationId);
        expect(result).toEqual(expectedConversation);
        expect(result.messages).toHaveLength(2);
      });

      it('should throw NotFoundException if conversation not found', async () => {
        mockWhatsAppService.getConversation.mockRejectedValue(
          new NotFoundException('Conversation not found'),
        );

        await expect(controller.getConversation(mockRequest, 'invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('updateConversation', () => {
      it('should update conversation successfully', async () => {
        const conversationId = 'conv-123';
        const updateDto = {
          status: 'assigned' as const,
          tags: ['important', 'follow-up'],
        };

        const expectedConversation = {
          id: conversationId,
          ...updateDto,
        };

        mockWhatsAppService.updateConversation.mockResolvedValue(expectedConversation);

        const result = await controller.updateConversation(mockRequest, conversationId, updateDto);

        expect(service.updateConversation).toHaveBeenCalledWith(
          'user-123',
          conversationId,
          updateDto,
        );
        expect(result).toEqual(expectedConversation);
      });
    });

    describe('closeConversation', () => {
      it('should close conversation successfully', async () => {
        const conversationId = 'conv-123';

        mockWhatsAppService.closeConversation.mockResolvedValue({
          id: conversationId,
          status: 'closed',
        });

        const result = await controller.closeConversation(mockRequest, conversationId);

        expect(service.closeConversation).toHaveBeenCalledWith('user-123', conversationId);
        expect(result.status).toBe('closed');
      });
    });

    describe('assignConversation', () => {
      it('should assign conversation to user', async () => {
        const conversationId = 'conv-123';
        const assignDto = {
          userId: 'agent-456',
        };

        mockWhatsAppService.assignConversation.mockResolvedValue({
          id: conversationId,
          status: 'assigned',
          assignedTo: 'agent-456',
        });

        const result = await controller.assignConversation(mockRequest, conversationId, assignDto);

        expect(service.assignConversation).toHaveBeenCalledWith(
          'user-123',
          conversationId,
          'agent-456',
        );
        expect(result.assignedTo).toBe('agent-456');
      });
    });
  });
});
