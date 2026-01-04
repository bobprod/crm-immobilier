import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

/**
 * Service TikTok Events API
 * Doc: https://ads.tiktok.com/marketing_api/docs?id=1701890979375106
 */
@Injectable()
export class TikTokEventsApiService {
  private readonly logger = new Logger(TikTokEventsApiService.name);
  private readonly client: AxiosInstance;
  private readonly pixelId: string;
  private readonly accessToken: string;

  constructor(private config: ConfigService) {
    this.pixelId = this.config.get('tracking.tiktok.pixelId');
    this.accessToken = this.config.get('tracking.tiktok.accessToken');

    this.client = axios.create({
      baseURL: 'https://business-api.tiktok.com/open_api/v1.3',
      timeout: 10000,
      headers: {
        'Access-Token': this.accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendEvent(event: {
    eventName: string;
    eventTime: number;
    eventId?: string;
    userData: {
      email?: string;
      phone?: string;
      externalId?: string;
      ipAddress?: string;
      userAgent?: string;
    };
    properties?: {
      value?: number;
      currency?: string;
      contentType?: string;
      contentId?: string;
      contentName?: string;
      [key: string]: any;
    };
    pageUrl?: string;
  }) {
    try {
      const payload = {
        pixel_code: this.pixelId,
        event: event.eventName,
        event_id: event.eventId || this.generateEventId(),
        timestamp: event.eventTime,
        context: {
          user: {
            email: event.userData.email ? this.hashValue(event.userData.email) : undefined,
            phone: event.userData.phone ? this.hashValue(event.userData.phone) : undefined,
            external_id: event.userData.externalId,
          },
          ip: event.userData.ipAddress,
          user_agent: event.userData.userAgent,
          page: {
            url: event.pageUrl,
          },
        },
        properties: event.properties,
      };

      const response = await this.client.post('/pixel/track', {
        data: [payload],
      });

      this.logger.log(`TikTok Events API event sent: ${event.eventName}`);

      return {
        success: true,
        code: response.data.code,
        message: response.data.message,
      };
    } catch (error) {
      this.logger.error(`TikTok Events API error: ${error.message}`);
      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testEvent = {
        eventName: 'PageView',
        eventTime: Math.floor(Date.now() / 1000),
        userData: {
          email: 'test@example.com',
          ipAddress: '127.0.0.1',
          userAgent: 'Test',
        },
      };

      const result = await this.sendEvent(testEvent);
      return {
        success: result.success,
        message: result.success ? 'TikTok Events API connection successful' : 'Connection failed',
      };
    } catch (error) {
      return {
        success: false,
        message: `TikTok Events API test failed: ${error.message}`,
      };
    }
  }
}
