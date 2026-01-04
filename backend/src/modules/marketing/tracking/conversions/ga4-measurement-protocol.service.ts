import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Service GA4 Measurement Protocol
 * Doc: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
@Injectable()
export class GA4MeasurementProtocolService {
  private readonly logger = new Logger(GA4MeasurementProtocolService.name);
  private readonly client: AxiosInstance;
  private readonly measurementId: string;
  private readonly apiSecret: string;

  constructor(private config: ConfigService) {
    this.measurementId = this.config.get('tracking.ga4.measurementId');
    this.apiSecret = this.config.get('tracking.ga4.apiSecret');

    this.client = axios.create({
      baseURL: 'https://www.google-analytics.com',
      timeout: 10000,
    });
  }

  async sendEvent(event: {
    clientId: string;
    userId?: string;
    eventName: string;
    params?: {
      value?: number;
      currency?: string;
      transaction_id?: string;
      item_id?: string;
      item_name?: string;
      item_category?: string;
      [key: string]: any;
    };
  }) {
    try {
      const payload = {
        client_id: event.clientId,
        user_id: event.userId,
        events: [
          {
            name: event.eventName,
            params: {
              ...event.params,
              engagement_time_msec: '100',
            },
          },
        ],
      };

      await this.client.post('/mp/collect', payload, {
        params: {
          measurement_id: this.measurementId,
          api_secret: this.apiSecret,
        },
      });

      this.logger.log(`GA4 Measurement Protocol event sent: ${event.eventName}`);

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`GA4 Measurement Protocol error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.sendEvent({
        clientId: 'test-client-id',
        eventName: 'page_view',
        params: {
          page_title: 'Test Page',
        },
      });

      return {
        success: result.success,
        message: result.success
          ? 'GA4 Measurement Protocol connection successful'
          : 'Connection failed',
      };
    } catch (error) {
      return {
        success: false,
        message: `GA4 test failed: ${error.message}`,
      };
    }
  }
}
