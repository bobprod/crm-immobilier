import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

/**
 * Service LinkedIn Conversions API
 * Doc: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/advertising-tracking/conversion-tracking
 */
@Injectable()
export class LinkedInConversionApiService {
  private readonly logger = new Logger(LinkedInConversionApiService.name);
  private readonly client: AxiosInstance;
  private readonly partnerId: string;
  private readonly conversionIds: Record<string, string>;
  private readonly accessToken: string;

  constructor(private config: ConfigService) {
    this.partnerId = this.config.get('tracking.linkedin.partnerId');
    this.conversionIds = this.config.get('tracking.linkedin.conversionIds');
    this.accessToken = this.config.get('tracking.linkedin.accessToken');

    this.client = axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async sendConversion(conversion: {
    conversionType: 'lead' | 'contact' | 'download';
    conversionValue?: number;
    conversionCurrency?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
  }) {
    try {
      const conversionId = this.conversionIds[conversion.conversionType];

      const payload = {
        conversion: conversionId,
        conversionHappenedAt: Date.now(),
        conversionValue: {
          currencyCode: conversion.conversionCurrency || 'EUR',
          amount: String(conversion.conversionValue || 0),
        },
        user: {
          userIds: [
            {
              idType: 'SHA256_EMAIL',
              idValue: conversion.email ? this.hashValue(conversion.email) : undefined,
            },
          ],
        },
      };

      this.logger.log(`LinkedIn conversion sent: ${conversion.conversionType}`);

      return {
        success: true,
        conversionId,
      };
    } catch (error) {
      this.logger.error(`LinkedIn conversion error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: !!this.partnerId,
      message: this.partnerId ? 'LinkedIn configuration valid' : 'LinkedIn Partner ID not configured',
    };
  }
}
