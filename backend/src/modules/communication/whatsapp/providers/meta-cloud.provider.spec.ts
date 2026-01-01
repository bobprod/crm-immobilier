import { Test, TestingModule } from '@nestjs/testing';
import { MetaCloudProvider } from './meta-cloud.provider';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MetaCloudProvider', () => {
  let provider: MetaCloudProvider;

  const mockConfig = {
    phoneNumberId: 'phone-123',
    accessToken: 'token-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetaCloudProvider],
    }).compile();

    provider = module.get<MetaCloudProvider>(MetaCloudProvider);

    // Setup axios mock
    (axios.create as jest.Mock).mockReturnValue({
      post: jest.fn(),
      get: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'wa-msg-123' }],
        },
      };

      (provider as any).axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await provider.sendTextMessage(
        mockConfig,
        '+33612345678',
        'Hello World',
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wa-msg-123');
    });

    it('should handle errors gracefully', async () => {
      const error = {
        response: {
          data: {
            error: { message: 'Invalid phone number' },
          },
        },
      };

      (provider as any).axiosInstance.post = jest.fn().mockRejectedValue(error);

      const result = await provider.sendTextMessage(
        mockConfig,
        'invalid',
        'Hello',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number');
    });
  });

  describe('sendTemplateMessage', () => {
    it('should send template message with parameters', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'wa-msg-456' }],
        },
      };

      (provider as any).axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await provider.sendTemplateMessage(
        mockConfig,
        '+33612345678',
        'welcome_template',
        'fr',
        ['John', 'Doe'],
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wa-msg-456');
      expect((provider as any).axiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          type: 'template',
          template: expect.objectContaining({
            name: 'welcome_template',
            language: { code: 'fr' },
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('sendMediaMessage', () => {
    it('should send image message', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'wa-msg-789' }],
        },
      };

      (provider as any).axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await provider.sendMediaMessage(
        mockConfig,
        '+33612345678',
        'image',
        'https://example.com/image.jpg',
        'Check this out',
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('wa-msg-789');
    });

    it('should send document message', async () => {
      const mockResponse = {
        data: {
          messages: [{ id: 'wa-msg-doc' }],
        },
      };

      (provider as any).axiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await provider.sendMediaMessage(
        mockConfig,
        '+33612345678',
        'document',
        'https://example.com/doc.pdf',
        'Invoice',
      );

      expect(result.success).toBe(true);
    });
  });

  describe('parseInboundMessage', () => {
    it('should parse inbound text message', () => {
      const webhook = {
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    {
                      id: 'msg-123',
                      from: '33612345678',
                      text: { body: 'Hello' },
                    },
                  ],
                  statuses: [],
                  contacts: [],
                  metadata: {},
                },
              },
            ],
          },
        ],
      };

      const result = provider.parseInboundMessage(webhook);

      expect(result).toBeDefined();
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].text.body).toBe('Hello');
    });

    it('should handle empty webhook', () => {
      const result = provider.parseInboundMessage({});
      expect(result).toBeNull();
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = '{"test":"data"}';
      const secret = 'my-secret';
      const crypto = require('crypto');

      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = provider.verifyWebhookSignature(
        payload,
        `sha256=${expectedSignature}`,
        secret,
      );

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const result = provider.verifyWebhookSignature(
        '{"test":"data"}',
        'sha256=invalid',
        'secret',
      );

      expect(result).toBe(false);
    });
  });

  describe('markAsRead', () => {
    it('should mark message as read', async () => {
      (provider as any).axiosInstance.post = jest.fn().mockResolvedValue({});

      const result = await provider.markAsRead(mockConfig, 'msg-123');

      expect(result.success).toBe(true);
      expect((provider as any).axiosInstance.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          status: 'read',
          message_id: 'msg-123',
        }),
        expect.any(Object),
      );
    });
  });
});
