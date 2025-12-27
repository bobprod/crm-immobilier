/**
 * Generic Investment Platform Adapter
 * Fallback adapter for platforms without dedicated adapter
 * Uses generic scraping and LLM extraction
 */

import { Injectable, Logger } from '@nestjs/common';
import { InvestmentProjectSource, InvestmentProjectStatus } from '@prisma/client';
import { BaseInvestmentSourceAdapter } from './base-source.adapter';
import {
  UnifiedProjectData,
  RawProjectData,
  ImportContext,
  AdapterMetadata,
} from '../types/investment-project.types';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class GenericAdapter extends BaseInvestmentSourceAdapter {
  private readonly logger = new Logger(GenericAdapter.name);

  readonly metadata: AdapterMetadata = {
    name: 'GenericAdapter',
    source: InvestmentProjectSource.other,
    supportedCountries: ['*'], // Supports all countries
    baseUrl: '',
    requiresAuth: false,
    rateLimit: {
      requests: 5,
      period: 60000, // More conservative rate limit
    },
    capabilities: {
      canImportFromUrl: true,
      canSearch: false,
      canExportToXLSX: false,
    },
  };

  // ============================================
  // URL Detection
  // ============================================

  canHandle(url: string): boolean {
    // Generic adapter can handle any URL as fallback
    // But should be last in priority
    return this.isValidUrl(url);
  }

  extractProjectId(url: string): string | null {
    // Extract last path segment as project ID
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter((s) => s);
      return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    } catch {
      return null;
    }
  }

  // ============================================
  // Data Import
  // ============================================

  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    this.logger.log(`Importing project using generic adapter: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        },
        timeout: 20000,
        maxRedirects: 5,
      });

      // Detect source from URL
      const detectedSource = this.detectSourceFromUrl(url);

      const rawData: RawProjectData = {
        source: detectedSource,
        sourceUrl: url,
        sourceProjectId: this.extractProjectId(url) || undefined,
        rawHtml: response.data,
        scrapedAt: new Date(),
      };

      this.logger.log(`Successfully fetched project using generic adapter: ${url}`);
      return rawData;
    } catch (error) {
      this.logger.error(`Generic adapter import failed: ${error.message}`);
      throw new Error(`Generic import failed: ${error.message}`);
    }
  }

  // ============================================
  // Data Mapping
  // ============================================

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    this.logger.log('Mapping data using generic adapter');

    const $ = cheerio.load(rawData.rawHtml);

    // Generic extraction using common patterns
    const title = this.extractTitle($);
    const description = this.extractDescription($);
    const location = this.extractLocation($);
    const financialData = this.extractFinancialData($);
    const yieldData = this.extractYieldData($);
    const duration = this.extractDuration($);
    const propertyType = this.extractPropertyType($);
    const images = this.extractImages($, rawData.sourceUrl);

    const unifiedData: UnifiedProjectData = {
      title,
      description,
      sourceUrl: rawData.sourceUrl,
      source: rawData.source,
      sourceProjectId: rawData.sourceProjectId,

      city: location.city,
      country: location.country,
      address: location.address,
      latitude: undefined,
      longitude: undefined,

      totalPrice: financialData.totalPrice,
      minTicket: financialData.minTicket,
      currency: financialData.currency,

      grossYield: yieldData.grossYield,
      netYield: yieldData.netYield,
      targetYield: yieldData.targetYield,

      durationMonths: duration,
      startDate: undefined,
      endDate: undefined,

      propertyType,

      status: InvestmentProjectStatus.draft,
      fundingProgress: undefined,

      rawData: {
        html: rawData.rawHtml,
        scrapedAt: rawData.scrapedAt,
      },
      images,
      documents: [],
    };

    this.logger.log(`Mapped project using generic adapter: ${title}`);
    return unifiedData;
  }

  // ============================================
  // Private Extraction Methods
  // ============================================

  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple common selectors
    const candidates = [
      $('h1').first().text().trim(),
      $('[class*="title"]').first().text().trim(),
      $('[class*="heading"]').first().text().trim(),
      $('meta[property="og:title"]').attr('content'),
      $('title').text().split('|')[0].split('-')[0].trim(),
    ];

    for (const candidate of candidates) {
      if (candidate && candidate.length > 3 && candidate.length < 200) {
        return candidate;
      }
    }

    return 'Untitled Investment Project';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    const candidates = [
      $('[class*="description"]').first().text().trim(),
      $('[class*="desc"]').first().text().trim(),
      $('meta[name="description"]').attr('content'),
      $('meta[property="og:description"]').attr('content'),
      $('p').first().text().trim(),
    ];

    for (const candidate of candidates) {
      if (candidate && candidate.length > 20) {
        return candidate.slice(0, 1000); // Limit length
      }
    }

    return '';
  }

  private extractLocation($: cheerio.CheerioAPI): {
    city: string;
    country: string;
    address?: string;
  } {
    // Look for location indicators
    const locationText = (
      $('[class*="location"]').text() +
      ' ' +
      $('[class*="city"]').text() +
      ' ' +
      $('[class*="address"]').text()
    ).trim();

    // Try to extract city
    let city = 'Unknown';
    let country = 'Unknown';

    // Common patterns
    const cityMatch = locationText.match(/([A-Z][a-zÀ-ÿ]+(?:[\s-][A-Z][a-zÀ-ÿ]+)?)/);
    if (cityMatch) {
      city = cityMatch[1];
    }

    // Detect country from domain
    const urlMeta = $('meta[property="og:url"]').attr('content') || '';
    country = this.detectCountryFromUrl(urlMeta);

    return {
      city,
      country,
      address: locationText || undefined,
    };
  }

  private extractFinancialData($: cheerio.CheerioAPI): {
    totalPrice: number;
    minTicket: number;
    currency: string;
  } {
    // Look for price indicators
    const priceText = (
      $('[class*="price"]').text() +
      ' ' +
      $('[class*="amount"]').text() +
      ' ' +
      $('[class*="total"]').text()
    ).trim();

    // Detect currency from symbols or text
    let currency = 'EUR'; // Default
    if (priceText.includes('$') || priceText.includes('USD')) {
      currency = 'USD';
    } else if (priceText.includes('£') || priceText.includes('GBP')) {
      currency = 'GBP';
    } else if (priceText.includes('DT') || priceText.includes('TND')) {
      currency = 'TND';
    }

    // Extract numbers
    const numbers = priceText.match(/[\d\s,.]+/g) || [];
    const parsedNumbers = numbers.map((n) => this.parsePrice(n)).filter((n) => n > 0);

    // Assume largest number is total price, smallest is min ticket
    parsedNumbers.sort((a, b) => b - a);

    return {
      totalPrice: parsedNumbers[0] || 100000,
      minTicket: parsedNumbers[parsedNumbers.length - 1] || 100,
      currency,
    };
  }

  private extractYieldData($: cheerio.CheerioAPI): {
    grossYield?: number;
    netYield?: number;
    targetYield?: number;
  } {
    const yieldText = (
      $('[class*="yield"]').text() +
      ' ' +
      $('[class*="return"]').text() +
      ' ' +
      $('[class*="rendement"]').text()
    ).trim();

    // Look for percentages
    const percentageMatches = yieldText.match(/(\d+(?:[.,]\d+)?)\s*%/g) || [];
    const percentages = percentageMatches.map((p) => this.parsePercentage(p));

    if (percentages.length > 0) {
      return {
        targetYield: percentages[0],
        grossYield: undefined,
        netYield: undefined,
      };
    }

    return {};
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    const durationText = (
      $('[class*="duration"]').text() +
      ' ' +
      $('[class*="period"]').text() +
      ' ' +
      $('[class*="term"]').text()
    ).trim();

    const monthsMatch = durationText.match(/(\d+)\s*(mois|months?)/i);
    if (monthsMatch) {
      return parseInt(monthsMatch[1]);
    }

    const yearsMatch = durationText.match(/(\d+)\s*(ans?|years?)/i);
    if (yearsMatch) {
      return parseInt(yearsMatch[1]) * 12;
    }

    return undefined;
  }

  private extractPropertyType($: cheerio.CheerioAPI): string {
    const typeText = (
      $('[class*="type"]').text() +
      ' ' +
      $('[class*="category"]').text()
    ).trim().toLowerCase();

    if (
      typeText.includes('residential') ||
      typeText.includes('résidentiel') ||
      typeText.includes('logement') ||
      typeText.includes('apartment')
    ) {
      return 'residential';
    }

    if (
      typeText.includes('commercial') ||
      typeText.includes('office') ||
      typeText.includes('bureau') ||
      typeText.includes('retail')
    ) {
      return 'commercial';
    }

    if (typeText.includes('mixed') || typeText.includes('mixte')) {
      return 'mixed';
    }

    return 'residential'; // Default
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    const domain = this.extractDomain(baseUrl);

    $('img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('logo') && !src.includes('icon')) {
        let absoluteUrl = src;
        if (!src.startsWith('http')) {
          absoluteUrl = src.startsWith('/')
            ? `https://${domain}${src}`
            : `https://${domain}/${src}`;
        }
        images.push(absoluteUrl);
      }
    });

    return images.slice(0, 10); // Limit to 10 images
  }

  // ============================================
  // Helper Methods
  // ============================================

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private detectSourceFromUrl(url: string): InvestmentProjectSource {
    const domain = this.extractDomain(url).toLowerCase();

    // Map domains to sources
    const sourceMap: Record<string, InvestmentProjectSource> = {
      'anaxago.com': InvestmentProjectSource.anaxago,
      'fundimmo.com': InvestmentProjectSource.fundimmo,
      'lymo.fr': InvestmentProjectSource.lymo,
      'raizers.com': InvestmentProjectSource.raizers,
      'wiseed.com': InvestmentProjectSource.wiseed,
      'estateguru.co': InvestmentProjectSource.estateguru,
      'reinvest24.com': InvestmentProjectSource.reinvest24,
      'crowdestate.eu': InvestmentProjectSource.crowdestate,
      'propertypartner.co': InvestmentProjectSource.propertypartner,
      'crowdproperty.com': InvestmentProjectSource.crowdproperty,
      'brickowner.com': InvestmentProjectSource.brickowner,
      'exporo.de': InvestmentProjectSource.exporo,
      'rendity.com': InvestmentProjectSource.rendity,
      'fundrise.com': InvestmentProjectSource.fundrise,
      'realtymogul.com': InvestmentProjectSource.realtymogul,
      'crowdstreet.com': InvestmentProjectSource.crowdstreet,
      'peerstreet.com': InvestmentProjectSource.peerstreet,
      'roofstock.com': InvestmentProjectSource.roofstock,
      'arrived.com': InvestmentProjectSource.arrived,
      'addy.co': InvestmentProjectSource.addy,
      'triovest.com': InvestmentProjectSource.triovest,
      'realtypro.ca': InvestmentProjectSource.realtypro,
      'urba.com.br': InvestmentProjectSource.brla_urba,
      'credihome.com.br': InvestmentProjectSource.brla_credihome,
      'housers.com': InvestmentProjectSource.brla_housers,
      'lahaus.com': InvestmentProjectSource.colombia_la_haus,
      'nawy.com': InvestmentProjectSource.egypt_nawy,
      'aqarmap.com': InvestmentProjectSource.egypt_aqarmap,
      'smartcrowd.ae': InvestmentProjectSource.uae_smartcrowd,
      'stake.ae': InvestmentProjectSource.uae_stake,
      'redf.gov.sa': InvestmentProjectSource.saudi_redf,
    };

    return sourceMap[domain] || InvestmentProjectSource.other;
  }

  private detectCountryFromUrl(url: string): string {
    const domain = this.extractDomain(url).toLowerCase();

    // Country detection from TLD or domain
    if (domain.endsWith('.fr') || domain.includes('france')) return 'France';
    if (domain.endsWith('.de') || domain.includes('germany')) return 'Germany';
    if (domain.endsWith('.co.uk') || domain.includes('uk')) return 'United Kingdom';
    if (domain.endsWith('.com') && domain.includes('us')) return 'USA';
    if (domain.endsWith('.ca') || domain.includes('canada')) return 'Canada';
    if (domain.endsWith('.br') || domain.includes('brazil')) return 'Brazil';
    if (domain.endsWith('.tn') || domain.includes('tunisia')) return 'Tunisia';
    if (domain.endsWith('.ma') || domain.includes('morocco')) return 'Morocco';
    if (domain.endsWith('.dz') || domain.includes('algeria')) return 'Algeria';
    if (domain.endsWith('.eg') || domain.includes('egypt')) return 'Egypt';
    if (domain.endsWith('.ae') || domain.includes('uae')) return 'United Arab Emirates';
    if (domain.endsWith('.sa') || domain.includes('saudi')) return 'Saudi Arabia';
    if (domain.endsWith('.qa') || domain.includes('qatar')) return 'Qatar';
    if (domain.endsWith('.ng') || domain.includes('nigeria')) return 'Nigeria';

    return 'Unknown';
  }
}
