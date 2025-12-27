/**
 * Bricks.co Adapter
 * Platform: https://bricks.co
 * Country: France
 * Type: Real estate crowdfunding
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
export class BricksAdapter extends BaseInvestmentSourceAdapter {
  private readonly logger = new Logger(BricksAdapter.name);

  readonly metadata: AdapterMetadata = {
    name: 'BricksAdapter',
    source: InvestmentProjectSource.bricks,
    supportedCountries: ['France', 'FR'],
    baseUrl: 'https://bricks.co',
    requiresAuth: false,
    rateLimit: {
      requests: 10,
      period: 60000, // 10 requests per minute
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
    const domain = this.extractDomain(url);
    return domain === 'bricks.co' || url.includes('bricks.co');
  }

  extractProjectId(url: string): string | null {
    // URL format: https://bricks.co/projets/residence-name-123
    // or: https://bricks.co/fr/projets/residence-name-123
    const match = url.match(/\/projets\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  }

  // ============================================
  // Data Import
  // ============================================

  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    this.logger.log(`Importing project from Bricks.co: ${url}`);

    try {
      // Fetch HTML content
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const rawData: RawProjectData = {
        source: InvestmentProjectSource.bricks,
        sourceUrl: url,
        sourceProjectId: this.extractProjectId(url) || undefined,
        rawHtml: response.data,
        scrapedAt: new Date(),
      };

      this.logger.log(`Successfully fetched Bricks.co project: ${url}`);
      return rawData;
    } catch (error) {
      this.logger.error(`Failed to import from Bricks.co: ${error.message}`);
      throw new Error(`Bricks.co import failed: ${error.message}`);
    }
  }

  // ============================================
  // Data Mapping
  // ============================================

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    this.logger.log('Mapping Bricks.co data to unified format');

    const $ = cheerio.load(rawData.rawHtml);

    // Extract data using CSS selectors
    // Note: These selectors are examples and may need adjustment based on actual HTML structure
    const title = this.extractTitle($);
    const description = this.extractDescription($);
    const city = this.extractCity($);
    const address = this.extractAddress($);
    const totalPrice = this.extractTotalPrice($);
    const minTicket = this.extractMinTicket($);
    const targetYield = this.extractTargetYield($);
    const durationMonths = this.extractDuration($);
    const propertyType = this.extractPropertyType($);
    const fundingProgress = this.extractFundingProgress($);
    const images = this.extractImages($);

    const unifiedData: UnifiedProjectData = {
      title,
      description,
      sourceUrl: rawData.sourceUrl,
      source: InvestmentProjectSource.bricks,
      sourceProjectId: rawData.sourceProjectId,

      // Location
      city,
      country: 'France',
      address,
      latitude: undefined, // TODO: Geocode from address
      longitude: undefined,

      // Financial
      totalPrice,
      minTicket,
      currency: 'EUR',

      // Yields
      grossYield: undefined,
      netYield: undefined,
      targetYield,

      // Duration
      durationMonths,
      startDate: undefined,
      endDate: undefined,

      // Property
      propertyType,

      // Status
      status: this.determineStatus(fundingProgress),
      fundingProgress,

      // Metadata
      rawData: {
        html: rawData.rawHtml,
        scrapedAt: rawData.scrapedAt,
      },
      images,
      documents: [],
    };

    this.logger.log(`Mapped Bricks.co project: ${title}`);
    return unifiedData;
  }

  // ============================================
  // Private Extraction Methods
  // ============================================

  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple selectors
    let title =
      $('h1.project-title').text().trim() ||
      $('h1[data-testid="project-title"]').text().trim() ||
      $('h1').first().text().trim() ||
      $('title').text().split('|')[0].trim();

    return title || 'Untitled Project';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    return (
      $('.project-description').text().trim() ||
      $('meta[name="description"]').attr('content') ||
      ''
    );
  }

  private extractCity($: cheerio.CheerioAPI): string {
    const locationText =
      $('.project-location').text().trim() ||
      $('[data-testid="project-city"]').text().trim() ||
      '';

    // Extract city from formats like "Paris, France" or "Lyon (69)"
    const match = locationText.match(/^([^,\(]+)/);
    return match ? match[1].trim() : 'Paris'; // Default to Paris if not found
  }

  private extractAddress($: cheerio.CheerioAPI): string {
    return (
      $('.project-address').text().trim() ||
      $('[data-testid="project-address"]').text().trim() ||
      ''
    );
  }

  private extractTotalPrice($: cheerio.CheerioAPI): number {
    const priceText =
      $('.project-total-amount').text().trim() ||
      $('[data-testid="total-price"]').text().trim() ||
      '';

    return this.parsePrice(priceText || '0');
  }

  private extractMinTicket($: cheerio.CheerioAPI): number {
    const ticketText =
      $('.min-investment').text().trim() ||
      $('[data-testid="min-ticket"]').text().trim() ||
      '';

    const parsed = this.parsePrice(ticketText || '0');
    return parsed > 0 ? parsed : 100; // Bricks.co typically has 100€ minimum
  }

  private extractTargetYield($: cheerio.CheerioAPI): number | undefined {
    const yieldText =
      $('.project-yield').text().trim() ||
      $('[data-testid="target-yield"]').text().trim() ||
      '';

    if (!yieldText) return undefined;

    return this.parsePercentage(yieldText);
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    const durationText =
      $('.project-duration').text().trim() ||
      $('[data-testid="duration"]').text().trim() ||
      '';

    // Extract number from formats like "24 mois", "2 ans", etc.
    const monthsMatch = durationText.match(/(\d+)\s*mois/i);
    if (monthsMatch) {
      return parseInt(monthsMatch[1]);
    }

    const yearsMatch = durationText.match(/(\d+)\s*ans?/i);
    if (yearsMatch) {
      return parseInt(yearsMatch[1]) * 12;
    }

    return undefined;
  }

  private extractPropertyType($: cheerio.CheerioAPI): string {
    const typeText =
      $('.property-type').text().trim() ||
      $('[data-testid="property-type"]').text().trim() ||
      '';

    // Normalize common French property types
    const normalized = typeText.toLowerCase();
    if (normalized.includes('résidentiel') || normalized.includes('logement')) {
      return 'residential';
    }
    if (normalized.includes('bureau') || normalized.includes('commercial')) {
      return 'commercial';
    }
    if (normalized.includes('mixte')) {
      return 'mixed';
    }

    return 'residential'; // Default
  }

  private extractFundingProgress($: cheerio.CheerioAPI): number | undefined {
    const progressText =
      $('.funding-progress').text().trim() ||
      $('[data-testid="funding-progress"]').text().trim() ||
      '';

    if (!progressText) {
      // Try to extract from progress bar
      const progressBar = $('.progress-bar').attr('style') || '';
      const widthMatch = progressBar.match(/width:\s*(\d+(?:\.\d+)?)/);
      if (widthMatch) {
        return parseFloat(widthMatch[1]);
      }
      return undefined;
    }

    return this.parsePercentage(progressText);
  }

  private extractImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];

    // Extract from gallery
    $('.project-gallery img, .project-images img, [data-testid="project-image"]').each(
      (_, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src');
        if (src && !src.includes('placeholder')) {
          // Convert relative URLs to absolute
          const absoluteUrl = src.startsWith('http')
            ? src
            : `${this.baseUrl}${src}`;
          images.push(absoluteUrl);
        }
      },
    );

    return images;
  }

  private determineStatus(
    fundingProgress?: number,
  ): InvestmentProjectStatus {
    if (!fundingProgress) {
      return InvestmentProjectStatus.active;
    }

    if (fundingProgress >= 100) {
      return InvestmentProjectStatus.funded;
    }

    if (fundingProgress > 0) {
      return InvestmentProjectStatus.active;
    }

    return InvestmentProjectStatus.draft;
  }
}
