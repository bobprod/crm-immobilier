import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

/**
 * Service Meta Conversion API (CAPI)
 * Doc: https://developers.facebook.com/docs/marketing-api/conversions-api
 */
@Injectable()
export class MetaConversionApiService {
  private readonly logger = new Logger(MetaConversionApiService.name);
  private readonly client: AxiosInstance;
  private readonly pixelId: string;
  private readonly accessToken: string;
  private readonly testEventCode?: string;

  constructor(private config: ConfigService) {
    this.pixelId = this.config.get('tracking.meta.pixelId');
    this.accessToken = this.config.get('tracking.meta.conversionApiToken');
    this.testEventCode = this.config.get('tracking.meta.testEventCode');

    this.client = axios.create({
      baseURL: 'https://graph.facebook.com/v18.0',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envoyer un événement à Meta CAPI
   */
  async sendEvent(event: {
    eventName: string;
    eventTime: number;
    eventId?: string;
    userData: {
      email?: string;
      phone?: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
      externalId?: string;
      clientIpAddress?: string;
      clientUserAgent?: string;
      fbc?: string; // Facebook Click ID
      fbp?: string; // Facebook Browser ID
    };
    customData?: {
      value?: number;
      currency?: string;
      content_name?: string;
      content_category?: string;
      content_ids?: string[];
      content_type?: string;
      num_items?: number;
      [key: string]: any;
    };
    eventSourceUrl?: string;
    actionSource?: 'website' | 'app' | 'email' | 'phone_call' | 'chat' | 'physical_store' | 'system_generated' | 'other';
  }) {
    try {
      // Hash PII (Personally Identifiable Information)
      const hashedUserData = this.hashUserData(event.userData);

      const payload = {
        data: [
          {
            event_name: event.eventName,
            event_time: event.eventTime,
            event_id: event.eventId || this.generateEventId(),
            event_source_url: event.eventSourceUrl,
            action_source: event.actionSource || 'website',
            user_data: hashedUserData,
            custom_data: event.customData,
          },
        ],
        test_event_code: this.testEventCode,
      };

      const response = await this.client.post(
        `/${this.pixelId}/events`,
        payload,
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      this.logger.log(`Meta CAPI event sent: ${event.eventName}`);

      return {
        success: true,
        eventsReceived: response.data.events_received,
        fbTraceId: response.data.fbtrace_id,
        messages: response.data.messages,
      };
    } catch (error) {
      this.logger.error(`Meta CAPI error: ${error.message}`, error.stack);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Envoyer plusieurs événements en batch
   */
  async sendBatchEvents(events: any[]) {
    try {
      const payload = {
        data: events.map((event) => ({
          event_name: event.eventName,
          event_time: event.eventTime,
          event_id: event.eventId || this.generateEventId(),
          event_source_url: event.eventSourceUrl,
          action_source: event.actionSource || 'website',
          user_data: this.hashUserData(event.userData),
          custom_data: event.customData,
        })),
        test_event_code: this.testEventCode,
      };

      const response = await this.client.post(
        `/${this.pixelId}/events`,
        payload,
        {
          params: {
            access_token: this.accessToken,
          },
        }
      );

      this.logger.log(`Meta CAPI batch sent: ${events.length} events`);

      return {
        success: true,
        eventsReceived: response.data.events_received,
        fbTraceId: response.data.fbtrace_id,
      };
    } catch (error) {
      this.logger.error(`Meta CAPI batch error: ${error.message}`);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }

  /**
   * Hash des données utilisateur (SHA256)
   * Meta requiert que les PII soient hashées
   */
  private hashUserData(userData: any) {
    const hashed: any = {};

    if (userData.email) {
      hashed.em = this.hashValue(userData.email.toLowerCase().trim());
    }
    if (userData.phone) {
      // Nettoyer le numéro de téléphone (garder seulement les chiffres)
      const cleanPhone = userData.phone.replace(/\D/g, '');
      hashed.ph = this.hashValue(cleanPhone);
    }
    if (userData.firstName) {
      hashed.fn = this.hashValue(userData.firstName.toLowerCase().trim());
    }
    if (userData.lastName) {
      hashed.ln = this.hashValue(userData.lastName.toLowerCase().trim());
    }
    if (userData.city) {
      hashed.ct = this.hashValue(userData.city.toLowerCase().trim());
    }
    if (userData.state) {
      hashed.st = this.hashValue(userData.state.toLowerCase().trim());
    }
    if (userData.zip) {
      hashed.zp = this.hashValue(userData.zip.toLowerCase().trim());
    }
    if (userData.country) {
      hashed.country = this.hashValue(userData.country.toLowerCase().trim());
    }

    // Ces champs ne sont pas hashés
    if (userData.externalId) hashed.external_id = userData.externalId;
    if (userData.clientIpAddress) hashed.client_ip_address = userData.clientIpAddress;
    if (userData.clientUserAgent) hashed.client_user_agent = userData.clientUserAgent;
    if (userData.fbc) hashed.fbc = userData.fbc;
    if (userData.fbp) hashed.fbp = userData.fbp;

    return hashed;
  }

  /**
   * Hash SHA256
   */
  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Générer un event_id unique pour la déduplication
   */
  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Tester la connexion CAPI
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Envoyer un test event
      const testEvent = {
        eventName: 'PageView',
        eventTime: Math.floor(Date.now() / 1000),
        userData: {
          email: 'test@example.com',
          clientIpAddress: '127.0.0.1',
          clientUserAgent: 'Test User Agent',
        },
        customData: {
          content_name: 'Test Page',
        },
        actionSource: 'website' as const,
      };

      const result = await this.sendEvent(testEvent);

      if (result.success) {
        return {
          success: true,
          message: 'Meta Conversion API connection successful',
          details: {
            eventsReceived: result.eventsReceived,
            fbTraceId: result.fbTraceId,
            testMode: !!this.testEventCode,
          },
        };
      } else {
        return {
          success: false,
          message: 'Meta Conversion API connection failed',
          details: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Meta CAPI test failed: ${error.message}`,
      };
    }
  }

  /**
   * Mapper les événements du CRM vers Meta
   */
  mapCrmEventToMeta(crmEvent: {
    eventName: string;
    data: any;
    prospectId?: string;
    propertyId?: string;
    sessionId?: string;
    userAgent?: string;
    ipAddress?: string;
    url?: string;
  }) {
    const eventMap: Record<string, string> = {
      PageView: 'PageView',
      ViewContent: 'ViewContent',
      Lead: 'Lead',
      Contact: 'Contact',
      CompleteRegistration: 'CompleteRegistration',
      Schedule: 'Schedule',
      Purchase: 'Purchase',
      AddToCart: 'AddToCart',
      InitiateCheckout: 'InitiateCheckout',
      Search: 'Search',
    };

    return {
      eventName: eventMap[crmEvent.eventName] || crmEvent.eventName,
      eventTime: Math.floor(Date.now() / 1000),
      eventId: `${crmEvent.sessionId}_${crmEvent.eventName}_${Date.now()}`,
      userData: {
        email: crmEvent.data.email,
        phone: crmEvent.data.phone,
        firstName: crmEvent.data.firstName,
        lastName: crmEvent.data.lastName,
        externalId: crmEvent.prospectId,
        clientIpAddress: crmEvent.ipAddress,
        clientUserAgent: crmEvent.userAgent,
      },
      customData: {
        value: crmEvent.data.value || 0,
        currency: crmEvent.data.currency || 'EUR',
        content_name: crmEvent.data.propertyTitle,
        content_category: crmEvent.data.propertyType,
        content_ids: crmEvent.propertyId ? [crmEvent.propertyId] : undefined,
      },
      eventSourceUrl: crmEvent.url,
      actionSource: 'website' as const,
    };
  }
}
