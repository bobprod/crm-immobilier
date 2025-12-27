/**
 * Base Investment Source Adapter Interface
 * All platform adapters must implement this interface
 */

import { InvestmentProjectSource } from '@prisma/client';
import {
  UnifiedProjectData,
  RawProjectData,
  ImportContext,
  ValidationResult,
  PlatformDetectionResult,
  AdapterMetadata,
} from '../types/investment-project.types';

export abstract class BaseInvestmentSourceAdapter {
  /**
   * Adapter metadata
   */
  abstract readonly metadata: AdapterMetadata;

  /**
   * Get adapter name
   */
  get name(): string {
    return this.metadata.name;
  }

  /**
   * Get source type
   */
  get sourceType(): InvestmentProjectSource {
    return this.metadata.source;
  }

  /**
   * Get supported countries
   */
  get supportedCountries(): string[] {
    return this.metadata.supportedCountries;
  }

  /**
   * Get base URL
   */
  get baseUrl(): string {
    return this.metadata.baseUrl;
  }

  // ============================================
  // URL Detection & Validation
  // ============================================

  /**
   * Check if this adapter can handle the given URL
   */
  abstract canHandle(url: string): boolean;

  /**
   * Detect platform from URL
   */
  detect(url: string): PlatformDetectionResult {
    const canHandle = this.canHandle(url);
    return {
      detected: canHandle,
      source: canHandle ? this.sourceType : undefined,
      confidence: canHandle ? 1.0 : 0.0,
      adapterName: canHandle ? this.name : undefined,
    };
  }

  /**
   * Extract project ID from URL
   * Example: https://bricks.co/projets/residence-city-center -> "residence-city-center"
   */
  abstract extractProjectId(url: string): string | null;

  // ============================================
  // Data Import
  // ============================================

  /**
   * Import project data from URL
   * This is the main entry point for importing a project
   */
  abstract importFromUrl(
    url: string,
    context: ImportContext,
  ): Promise<RawProjectData>;

  /**
   * Map raw platform data to unified format
   * Each adapter implements its own mapping logic
   */
  abstract mapToUnifiedFormat(rawData: any): UnifiedProjectData;

  /**
   * Validate unified data
   */
  validateData(data: UnifiedProjectData): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Required fields
    if (!data.title) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.city) {
      errors.push({
        field: 'city',
        message: 'City is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.country) {
      errors.push({
        field: 'country',
        message: 'Country is required',
        code: 'REQUIRED_FIELD',
      });
    }

    if (!data.totalPrice || data.totalPrice <= 0) {
      errors.push({
        field: 'totalPrice',
        message: 'Valid total price is required',
        code: 'INVALID_VALUE',
      });
    }

    if (!data.minTicket || data.minTicket <= 0) {
      errors.push({
        field: 'minTicket',
        message: 'Valid minimum ticket is required',
        code: 'INVALID_VALUE',
      });
    }

    if (!data.propertyType) {
      errors.push({
        field: 'propertyType',
        message: 'Property type is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Warnings for optional but recommended fields
    if (!data.grossYield && !data.netYield && !data.targetYield) {
      warnings.push({
        field: 'yields',
        message: 'No yield information provided',
        severity: 'medium' as const,
      });
    }

    if (!data.latitude || !data.longitude) {
      warnings.push({
        field: 'coordinates',
        message: 'Geolocation data missing',
        severity: 'low' as const,
      });
    }

    if (!data.images || data.images.length === 0) {
      warnings.push({
        field: 'images',
        message: 'No images provided',
        severity: 'low' as const,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================
  // Search (Optional - not all adapters support this)
  // ============================================

  /**
   * Search for projects on the platform
   * Not all adapters need to implement this
   */
  async search?(criteria: any): Promise<UnifiedProjectData[]>;

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Normalize currency code
   */
  protected normalizeCurrency(currency: string): string {
    const map: Record<string, string> = {
      euro: 'EUR',
      euros: 'EUR',
      '€': 'EUR',
      dollar: 'USD',
      dollars: 'USD',
      $: 'USD',
      'us$': 'USD',
      'can$': 'CAD',
      'c$': 'CAD',
      dinar: 'TND',
      dinars: 'TND',
      dt: 'TND',
      tnd: 'TND',
      pound: 'GBP',
      pounds: 'GBP',
      '£': 'GBP',
      gbp: 'GBP',
      real: 'BRL',
      reais: 'BRL',
      'r$': 'BRL',
      brl: 'BRL',
      peso: 'MXN',
      pesos: 'MXN',
      mxn: 'MXN',
      dirham: 'AED',
      dirhams: 'AED',
      aed: 'AED',
      mad: 'MAD',
      sar: 'SAR',
      riyal: 'SAR',
      riyals: 'SAR',
      qar: 'QAR',
      egp: 'EGP',
      dzd: 'DZD',
      ngn: 'NGN',
      naira: 'NGN',
    };

    const normalized = currency.toLowerCase().trim();
    return map[normalized] || currency.toUpperCase();
  }

  /**
   * Parse price string to number
   * Handles formats like: "150,000 €", "$150k", "150 000", etc.
   */
  protected parsePrice(priceStr: string): number {
    if (typeof priceStr === 'number') {
      return priceStr;
    }

    // Remove currency symbols and spaces
    let cleaned = priceStr
      .replace(/[€$£₹₽¥]/g, '')
      .replace(/\s/g, '')
      .replace(/,/g, '');

    // Handle k, K (thousands)
    if (cleaned.toLowerCase().includes('k')) {
      const num = parseFloat(cleaned.replace(/k/gi, ''));
      return num * 1000;
    }

    // Handle m, M (millions)
    if (cleaned.toLowerCase().includes('m')) {
      const num = parseFloat(cleaned.replace(/m/gi, ''));
      return num * 1000000;
    }

    return parseFloat(cleaned);
  }

  /**
   * Parse percentage string to number
   * Handles formats like: "5.5%", "5,5 %", "0.055", etc.
   */
  protected parsePercentage(percentStr: string | number): number {
    if (typeof percentStr === 'number') {
      // If already a number, check if it's decimal (0.055) or percentage (5.5)
      return percentStr < 1 ? percentStr * 100 : percentStr;
    }

    let cleaned = percentStr.replace(/\s/g, '').replace(/%/g, '').replace(/,/g, '.');
    const num = parseFloat(cleaned);

    // If the number is less than 1, assume it's decimal format (0.055)
    return num < 1 ? num * 100 : num;
  }

  /**
   * Extract domain from URL
   */
  protected extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  /**
   * Sleep utility for rate limiting
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
