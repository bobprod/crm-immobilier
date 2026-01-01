import { Injectable, Logger } from '@nestjs/common';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class TwilioProvider {
  private readonly logger = new Logger(TwilioProvider.name);

  /**
   * Send text message via Twilio
   */
  async sendTextMessage(
    config: TwilioConfig,
    to: string,
    message: string,
  ): Promise<SendMessageResult> {
    try {
      // Twilio uses require('twilio') client
      const twilio = require('twilio');
      const client = twilio(config.accountSid, config.authToken);

      const result = await client.messages.create({
        from: `whatsapp:${config.phoneNumber}`,
        to: `whatsapp:${to}`,
        body: message,
      });

      this.logger.log(`Twilio message sent: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send Twilio message: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send media message via Twilio
   */
  async sendMediaMessage(
    config: TwilioConfig,
    to: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<SendMessageResult> {
    try {
      const twilio = require('twilio');
      const client = twilio(config.accountSid, config.authToken);

      const result = await client.messages.create({
        from: `whatsapp:${config.phoneNumber}`,
        to: `whatsapp:${to}`,
        body: caption || '',
        mediaUrl: [mediaUrl],
      });

      this.logger.log(`Twilio media message sent: ${result.sid}`);

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error) {
      this.logger.error(`Failed to send Twilio media: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify Twilio webhook signature
   */
  verifyWebhookSignature(url: string, params: any, signature: string, authToken: string): boolean {
    const twilio = require('twilio');
    return twilio.validateRequest(authToken, signature, url, params);
  }

  /**
   * Parse Twilio inbound message
   */
  parseInboundMessage(body: any): any {
    return {
      messageId: body.MessageSid,
      from: body.From?.replace('whatsapp:', ''),
      to: body.To?.replace('whatsapp:', ''),
      body: body.Body,
      mediaUrl: body.MediaUrl0,
      numMedia: parseInt(body.NumMedia || '0'),
      timestamp: new Date().toISOString(),
    };
  }
}
