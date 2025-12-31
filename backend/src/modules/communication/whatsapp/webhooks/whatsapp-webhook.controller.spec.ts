import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WhatsAppWebhookController } from './whatsapp-webhook.controller';
import { WhatsAppService } from '../whatsapp.service';

describe('WhatsAppWebhookController', () => {
  let controller: WhatsAppWebhookController;
  let service: WhatsAppService;

  const mockWhatsAppService = {
    handleInboundMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsAppWebhookController],
      providers: [
        {
          provide: WhatsAppService,
          useValue: mockWhatsAppService,
        },
      ],
    }).compile();

    controller = module.get<WhatsAppWebhookController>(WhatsAppWebhookController);
    service = module.get<WhatsAppService>(WhatsAppService);

    // Set environment variables
    process.env.WHATSAPP_META_WEBHOOK_TOKEN = 'test_verify_token';
    process.env.WHATSAPP_META_APP_SECRET = 'test_app_secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyWebhook', () => {
    it('should verify webhook with valid token', () => {
      const query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test_verify_token',
        'hub.challenge': 'challenge_string_123',
      };

      const result = controller.verifyWebhook(query);

      expect(result).toBe('challenge_string_123');
    });

    it('should reject webhook with invalid token', () => {
      const query = {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'challenge_string_123',
      };

      expect(() => controller.verifyWebhook(query)).toThrow(BadRequestException);
    });

    it('should reject webhook with invalid mode', () => {
      const query = {
        'hub.mode': 'invalid_mode',
        'hub.verify_token': 'test_verify_token',
        'hub.challenge': 'challenge_string_123',
      };

      expect(() => controller.verifyWebhook(query)).toThrow(BadRequestException);
    });

    it('should reject webhook with missing parameters', () => {
      const query = {
        'hub.mode': 'subscribe',
      };

      expect(() => controller.verifyWebhook(query)).toThrow(BadRequestException);
    });
  });

  describe('handleWebhook', () => {
    it('should handle incoming webhook successfully', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+33612345678',
                    phone_number_id: 'phone-123',
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'John Doe',
                      },
                      wa_id: '33612345678',
                    },
                  ],
                  messages: [
                    {
                      from: '33612345678',
                      id: 'msg-123',
                      timestamp: '1234567890',
                      type: 'text',
                      text: {
                        body: 'Hello',
                      },
                    },
                  ],
                  statuses: [],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const signature = 'sha256=test_signature';

      const result = await controller.handleWebhook(webhook, signature);

      expect(result).toEqual({ status: 'ok' });
    });

    it('should return ok even on processing errors', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [],
      };

      const signature = 'sha256=test_signature';

      // Simulate processing error
      mockWhatsAppService.handleInboundMessage.mockRejectedValue(
        new Error('Processing failed'),
      );

      const result = await controller.handleWebhook(webhook, signature);

      expect(result.status).toBe('ok');
    });

    it('should handle webhook with status updates', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-123',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    phone_number_id: 'phone-123',
                  },
                  statuses: [
                    {
                      id: 'msg-123',
                      status: 'delivered',
                      timestamp: '1234567890',
                      recipient_id: '33612345678',
                    },
                  ],
                  messages: [],
                  contacts: [],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const result = await controller.handleWebhook(webhook, 'sha256=sig');

      expect(result).toEqual({ status: 'ok' });
    });

    it('should handle webhook with multiple entries', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-1',
            changes: [
              {
                value: {
                  metadata: { phone_number_id: 'phone-123' },
                  messages: [
                    {
                      from: '33612345678',
                      id: 'msg-1',
                      timestamp: '1234567890',
                      text: { body: 'Message 1' },
                    },
                  ],
                  statuses: [],
                  contacts: [],
                },
                field: 'messages',
              },
            ],
          },
          {
            id: 'entry-2',
            changes: [
              {
                value: {
                  metadata: { phone_number_id: 'phone-456' },
                  messages: [
                    {
                      from: '33698765432',
                      id: 'msg-2',
                      timestamp: '1234567891',
                      text: { body: 'Message 2' },
                    },
                  ],
                  statuses: [],
                  contacts: [],
                },
                field: 'messages',
              },
            ],
          },
        ],
      };

      const result = await controller.handleWebhook(webhook, 'sha256=sig');

      expect(result).toEqual({ status: 'ok' });
    });
  });

  describe('handleTwilioWebhook', () => {
    it('should handle Twilio webhook successfully', async () => {
      const body = {
        MessageSid: 'SM123456',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Hello from Twilio',
        NumMedia: '0',
      };

      const signature = 'twilio_signature_123';

      const result = await controller.handleTwilioWebhook(body, signature);

      expect(result).toEqual({ status: 'ok' });
    });

    it('should handle Twilio webhook with media', async () => {
      const body = {
        MessageSid: 'SM123456',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Check this image',
        NumMedia: '1',
        MediaUrl0: 'https://example.com/image.jpg',
        MediaContentType0: 'image/jpeg',
      };

      const result = await controller.handleTwilioWebhook(body, 'sig');

      expect(result).toEqual({ status: 'ok' });
    });

    it('should return ok even on Twilio processing errors', async () => {
      const body = {
        MessageSid: 'SM123456',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Test',
      };

      // Force error by providing invalid data
      const result = await controller.handleTwilioWebhook(body, 'sig');

      expect(result.status).toBe('ok');
    });
  });

  describe('verifySignature', () => {
    it('should verify valid Meta webhook signature', () => {
      const payload = '{"test":"data"}';
      const crypto = require('crypto');

      const secret = process.env.WHATSAPP_META_APP_SECRET || '';
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const result = (controller as any).verifySignature(payload, `sha256=${expectedSignature}`);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = '{"test":"data"}';
      const signature = 'sha256=invalid_signature';

      const result = (controller as any).verifySignature(payload, signature);

      expect(result).toBe(false);
    });

    it('should reject signature without sha256 prefix', () => {
      const payload = '{"test":"data"}';
      const signature = 'invalid_format';

      const result = (controller as any).verifySignature(payload, signature);

      expect(result).toBe(false);
    });
  });

  describe('processWebhook', () => {
    it('should ignore non-whatsapp objects', async () => {
      const webhook = {
        object: 'page',
        entry: [],
      };

      await (controller as any).processWebhook(webhook);

      expect(service.handleInboundMessage).not.toHaveBeenCalled();
    });

    it('should skip entries without phone number ID', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ id: 'msg-123', text: { body: 'Hello' } }],
                  statuses: [],
                  contacts: [],
                  metadata: {},
                },
              },
            ],
          },
        ],
      };

      await (controller as any).processWebhook(webhook);

      expect(service.handleInboundMessage).not.toHaveBeenCalled();
    });

    it('should handle webhook when config not found', async () => {
      const webhook = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                value: {
                  metadata: { phone_number_id: 'unknown-phone' },
                  messages: [],
                  statuses: [],
                  contacts: [],
                },
              },
            ],
          },
        ],
      };

      // Mock findConfigByPhoneNumberId to return null
      jest.spyOn(controller as any, 'findConfigByPhoneNumberId').mockResolvedValue(null);

      await (controller as any).processWebhook(webhook);

      expect(service.handleInboundMessage).not.toHaveBeenCalled();
    });
  });

  describe('findConfigByPhoneNumberId', () => {
    it('should return null for now (TODO implementation)', async () => {
      const result = await (controller as any).findConfigByPhoneNumberId('phone-123');

      expect(result).toBeNull();
    });
  });
});
