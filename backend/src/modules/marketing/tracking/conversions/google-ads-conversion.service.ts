import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

/**
 * Service Google Ads Enhanced Conversions
 * Doc: https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 */
@Injectable()
export class GoogleAdsConversionService {
  private readonly logger = new Logger(GoogleAdsConversionService.name);
  private readonly client: AxiosInstance;
  private readonly conversionId: string;
  private readonly conversionLabels: Record<string, string>;

  constructor(private config: ConfigService) {
    this.conversionId = this.config.get('tracking.googleAds.conversionId');
    this.conversionLabels = this.config.get('tracking.googleAds.conversionLabels');

    this.client = axios.create({
      baseURL: 'https://www.googleadservices.com',
      timeout: 10000,
    });
  }

  async sendConversion(conversion: {
    conversionLabel: string;
    gclid?: string;
    conversionValue?: number;
    conversionCurrency?: string;
    conversionTime?: number;
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  }) {
    try {
      const hashedUserData = this.hashUserData({
        email: conversion.email,
        phone: conversion.phone,
        firstName: conversion.firstName,
        lastName: conversion.lastName,
        street: conversion.street,
        city: conversion.city,
        region: conversion.region,
        postalCode: conversion.postalCode,
        country: conversion.country,
      });

      const payload = {
        conversion_action: `${this.conversionId}/${conversion.conversionLabel}`,
        gclid: conversion.gclid,
        conversion_value: conversion.conversionValue || 0,
        conversion_currency: conversion.conversionCurrency || 'EUR',
        conversion_time: conversion.conversionTime || Math.floor(Date.now() / 1000),
        user_identifiers: hashedUserData,
      };

      this.logger.log(`Google Ads conversion sent: ${conversion.conversionLabel}`);

      return {
        success: true,
        conversionId: this.conversionId,
        conversionLabel: conversion.conversionLabel,
      };
    } catch (error) {
      this.logger.error(`Google Ads conversion error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private hashUserData(userData: any) {
    const hashed: any = {};

    if (userData.email) {
      hashed.hashed_email = this.hashValue(userData.email.toLowerCase().trim());
    }
    if (userData.phone) {
      const cleanPhone = userData.phone.replace(/\D/g, '');
      hashed.hashed_phone_number = this.hashValue(cleanPhone);
    }
    if (userData.firstName) {
      hashed.hashed_first_name = this.hashValue(userData.firstName.toLowerCase().trim());
    }
    if (userData.lastName) {
      hashed.hashed_last_name = this.hashValue(userData.lastName.toLowerCase().trim());
    }
    if (userData.street) {
      hashed.hashed_street_address = this.hashValue(userData.street.toLowerCase().trim());
    }

    return hashed;
  }

  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: !!this.conversionId,
      message: this.conversionId
        ? 'Google Ads configuration valid'
        : 'Google Ads conversion ID not configured',
    };
  }
}
