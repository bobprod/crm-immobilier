import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface MetaCloudConfig {
  phoneNumberId: string;
  accessToken: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

@Injectable()
export class MetaCloudProvider {
  private readonly logger = new Logger(MetaCloudProvider.name);
  private readonly apiVersion = 'v18.0';
  private readonly baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
    });
  }

  /**
   * Send text message
   */
  async sendTextMessage(
    config: MetaCloudConfig,
    to: string,
    message: string,
  ): Promise<SendMessageResult> {
    try {
      const url = `/${config.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\+/g, ''), // Remove + from phone number
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      };

      this.logger.debug(`Sending text message to ${to}`);

      const response = await this.axiosInstance.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages?.[0]?.id;

      this.logger.log(`Text message sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send text message: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    config: MetaCloudConfig,
    to: string,
    templateName: string,
    language: string,
    parameters: string[],
  ): Promise<SendMessageResult> {
    try {
      const url = `/${config.phoneNumberId}/messages`;

      // Build template components
      const components = [];
      if (parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: parameters.map(param => ({
            type: 'text',
            text: param,
          })),
        });
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\+/g, ''),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language,
          },
          components,
        },
      };

      this.logger.debug(`Sending template message to ${to}: ${templateName}`);

      const response = await this.axiosInstance.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages?.[0]?.id;

      this.logger.log(`Template message sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send template message: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Send media message (image, document, video, audio)
   */
  async sendMediaMessage(
    config: MetaCloudConfig,
    to: string,
    mediaType: 'image' | 'document' | 'video' | 'audio',
    mediaUrl: string,
    caption?: string,
  ): Promise<SendMessageResult> {
    try {
      const url = `/${config.phoneNumberId}/messages`;

      const mediaObject: any = {
        link: mediaUrl,
      };

      if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
        mediaObject.caption = caption;
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to.replace(/\+/g, ''),
        type: mediaType,
        [mediaType]: mediaObject,
      };

      this.logger.debug(`Sending ${mediaType} message to ${to}`);

      const response = await this.axiosInstance.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const messageId = response.data.messages?.[0]?.id;

      this.logger.log(`Media message sent successfully: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send media message: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Upload media to WhatsApp servers
   */
  async uploadMedia(
    config: MetaCloudConfig,
    file: Buffer,
    mimeType: string,
  ): Promise<MediaUploadResult> {
    try {
      const url = `/${config.phoneNumberId}/media`;

      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', new Blob([file], { type: mimeType }));

      const response = await this.axiosInstance.post(url, formData, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });

      const mediaId = response.data.id;

      this.logger.log(`Media uploaded successfully: ${mediaId}`);

      return {
        success: true,
        mediaId,
      };
    } catch (error) {
      this.logger.error(`Failed to upload media: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Download media from WhatsApp servers
   */
  async downloadMedia(
    config: MetaCloudConfig,
    mediaId: string,
  ): Promise<{ success: boolean; url?: string; mimeType?: string; error?: string }> {
    try {
      // Step 1: Get media URL
      const mediaInfoUrl = `/${mediaId}`;
      const mediaInfoResponse = await this.axiosInstance.get(mediaInfoUrl, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });

      const mediaUrl = mediaInfoResponse.data.url;
      const mimeType = mediaInfoResponse.data.mime_type;

      // Step 2: Download media
      const mediaResponse = await this.axiosInstance.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
        responseType: 'arraybuffer',
      });

      this.logger.log(`Media downloaded successfully: ${mediaId}`);

      return {
        success: true,
        url: mediaUrl,
        mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to download media: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(
    config: MetaCloudConfig,
    messageId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const url = `/${config.phoneNumberId}/messages`;
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      };

      await this.axiosInstance.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(`Message marked as read: ${messageId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to mark message as read: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, appSecret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  /**
   * Parse inbound webhook message
   */
  parseInboundMessage(webhook: any): any {
    try {
      const entry = webhook.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value) {
        return null;
      }

      const messages = value.messages || [];
      const statuses = value.statuses || [];

      return {
        messages,
        statuses,
        contacts: value.contacts || [],
        metadata: value.metadata || {},
      };
    } catch (error) {
      this.logger.error(`Failed to parse webhook: ${error.message}`, error.stack);
      return null;
    }
  }
}
