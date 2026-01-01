import { Test, TestingModule } from '@nestjs/testing';
import { TwilioProvider } from './twilio.provider';

// Mock the twilio module
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

describe('TwilioProvider', () => {
  let provider: TwilioProvider;
  let mockTwilioClient: any;

  const mockConfig = {
    accountSid: 'AC123456789',
    authToken: 'auth_token_123',
    phoneNumber: '+33612345678',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwilioProvider],
    }).compile();

    provider = module.get<TwilioProvider>(TwilioProvider);

    // Get the mocked twilio constructor
    const twilio = require('twilio');
    mockTwilioClient = twilio();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTextMessage', () => {
    it('should send text message successfully', async () => {
      const mockResponse = {
        sid: 'SM123456789',
        status: 'queued',
        from: 'whatsapp:+33612345678',
        to: 'whatsapp:+33698765432',
        body: 'Hello World',
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.sendTextMessage(
        mockConfig,
        '+33698765432',
        'Hello World',
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('SM123456789');
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        from: 'whatsapp:+33612345678',
        to: 'whatsapp:+33698765432',
        body: 'Hello World',
      });
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Invalid phone number');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      const result = await provider.sendTextMessage(
        mockConfig,
        'invalid',
        'Hello',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid phone number');
    });

    it('should format phone numbers correctly', async () => {
      mockTwilioClient.messages.create.mockResolvedValue({ sid: 'SM123' });

      await provider.sendTextMessage(mockConfig, '+33612345678', 'Test');

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'whatsapp:+33612345678',
          to: 'whatsapp:+33612345678',
        }),
      );
    });

    it('should handle Twilio API errors', async () => {
      const twilioError = {
        status: 400,
        message: 'Invalid To phone number',
        code: 21211,
      };

      mockTwilioClient.messages.create.mockRejectedValue(twilioError);

      const result = await provider.sendTextMessage(
        mockConfig,
        '+invalid',
        'Test',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendMediaMessage', () => {
    it('should send media message successfully', async () => {
      const mockResponse = {
        sid: 'MM123456789',
        status: 'queued',
        from: 'whatsapp:+33612345678',
        to: 'whatsapp:+33698765432',
        mediaUrl: ['https://example.com/image.jpg'],
      };

      mockTwilioClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.sendMediaMessage(
        mockConfig,
        '+33698765432',
        'https://example.com/image.jpg',
        'Check this out',
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('MM123456789');
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        from: 'whatsapp:+33612345678',
        to: 'whatsapp:+33698765432',
        body: 'Check this out',
        mediaUrl: ['https://example.com/image.jpg'],
      });
    });

    it('should send media message without caption', async () => {
      mockTwilioClient.messages.create.mockResolvedValue({ sid: 'MM123' });

      const result = await provider.sendMediaMessage(
        mockConfig,
        '+33698765432',
        'https://example.com/document.pdf',
      );

      expect(result.success).toBe(true);
      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '',
          mediaUrl: ['https://example.com/document.pdf'],
        }),
      );
    });

    it('should handle media upload errors', async () => {
      const error = new Error('Media file too large');
      mockTwilioClient.messages.create.mockRejectedValue(error);

      const result = await provider.sendMediaMessage(
        mockConfig,
        '+33698765432',
        'https://example.com/large-file.mp4',
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Media file too large');
    });

    it('should handle multiple media URLs', async () => {
      mockTwilioClient.messages.create.mockResolvedValue({ sid: 'MM123' });

      await provider.sendMediaMessage(
        mockConfig,
        '+33698765432',
        'https://example.com/image1.jpg',
      );

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaUrl: ['https://example.com/image1.jpg'],
        }),
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid Twilio signature', () => {
      const twilio = require('twilio');
      twilio.validateRequest = jest.fn().mockReturnValue(true);

      const url = 'https://example.com/webhook';
      const params = { MessageSid: 'SM123', Body: 'Test' };
      const signature = 'valid_signature';
      const authToken = 'auth_token_123';

      const result = provider.verifyWebhookSignature(url, params, signature, authToken);

      expect(result).toBe(true);
      expect(twilio.validateRequest).toHaveBeenCalledWith(authToken, signature, url, params);
    });

    it('should reject invalid Twilio signature', () => {
      const twilio = require('twilio');
      twilio.validateRequest = jest.fn().mockReturnValue(false);

      const url = 'https://example.com/webhook';
      const params = { MessageSid: 'SM123', Body: 'Test' };
      const signature = 'invalid_signature';
      const authToken = 'auth_token_123';

      const result = provider.verifyWebhookSignature(url, params, signature, authToken);

      expect(result).toBe(false);
    });

    it('should handle signature verification errors', () => {
      const twilio = require('twilio');
      twilio.validateRequest = jest.fn().mockImplementation(() => {
        throw new Error('Validation error');
      });

      const url = 'https://example.com/webhook';
      const params = {};
      const signature = 'sig';
      const authToken = 'token';

      expect(() => {
        provider.verifyWebhookSignature(url, params, signature, authToken);
      }).toThrow('Validation error');
    });
  });

  describe('parseInboundMessage', () => {
    it('should parse inbound text message', () => {
      const body = {
        MessageSid: 'SM123456789',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Hello from Twilio',
        NumMedia: '0',
      };

      const result = provider.parseInboundMessage(body);

      expect(result).toEqual({
        messageId: 'SM123456789',
        from: '+33612345678',
        to: '+33698765432',
        body: 'Hello from Twilio',
        mediaUrl: undefined,
        numMedia: 0,
        timestamp: expect.any(String),
      });
    });

    it('should parse inbound message with media', () => {
      const body = {
        MessageSid: 'MM123456789',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Check this image',
        NumMedia: '1',
        MediaUrl0: 'https://example.com/image.jpg',
        MediaContentType0: 'image/jpeg',
      };

      const result = provider.parseInboundMessage(body);

      expect(result).toEqual({
        messageId: 'MM123456789',
        from: '+33612345678',
        to: '+33698765432',
        body: 'Check this image',
        mediaUrl: 'https://example.com/image.jpg',
        numMedia: 1,
        timestamp: expect.any(String),
      });
    });

    it('should handle missing From field', () => {
      const body = {
        MessageSid: 'SM123',
        To: 'whatsapp:+33698765432',
        Body: 'Test',
        NumMedia: '0',
      };

      const result = provider.parseInboundMessage(body);

      expect(result.from).toBeUndefined();
    });

    it('should handle missing To field', () => {
      const body = {
        MessageSid: 'SM123',
        From: 'whatsapp:+33612345678',
        Body: 'Test',
        NumMedia: '0',
      };

      const result = provider.parseInboundMessage(body);

      expect(result.to).toBeUndefined();
    });

    it('should parse NumMedia as integer', () => {
      const body = {
        MessageSid: 'SM123',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Test',
        NumMedia: '5',
      };

      const result = provider.parseInboundMessage(body);

      expect(result.numMedia).toBe(5);
      expect(typeof result.numMedia).toBe('number');
    });

    it('should handle missing NumMedia field', () => {
      const body = {
        MessageSid: 'SM123',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Test',
      };

      const result = provider.parseInboundMessage(body);

      expect(result.numMedia).toBe(0);
    });

    it('should strip whatsapp prefix from phone numbers', () => {
      const body = {
        MessageSid: 'SM123',
        From: 'whatsapp:+33612345678',
        To: 'whatsapp:+33698765432',
        Body: 'Test',
        NumMedia: '0',
      };

      const result = provider.parseInboundMessage(body);

      expect(result.from).toBe('+33612345678');
      expect(result.to).toBe('+33698765432');
      expect(result.from).not.toContain('whatsapp:');
      expect(result.to).not.toContain('whatsapp:');
    });
  });
});
