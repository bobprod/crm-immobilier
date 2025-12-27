/**
 * Homunity Adapter
 * Platform: https://homunity.com
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
export class HomunityAdapter extends BaseInvestmentSourceAdapter {
  private readonly logger = new Logger(HomunityAdapter.name);

  readonly metadata: AdapterMetadata = {
    name: 'HomunityAdapter',
    source: InvestmentProjectSource.homunity,
    supportedCountries: ['France', 'FR'],
    baseUrl: 'https://homunity.com',
    requiresAuth: false,
    rateLimit: {
      requests: 10,
      period: 60000,
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
    return domain === 'homunity.com' || url.includes('homunity.com');
  }

  extractProjectId(url: string): string | null {
    // URL formats:
    // https://homunity.com/projet/residence-name-123
    // https://homunity.com/fr/projet/residence-name-123
    const match = url.match(/\/projet\/([a-z0-9-]+)/i);
    return match ? match[1] : null;
  }

  // ============================================
  // Data Import
  // ============================================

  async importFromUrl(url: string, context: ImportContext): Promise<RawProjectData> {
    this.logger.log(`Importing project from Homunity: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const rawData: RawProjectData = {
        source: InvestmentProjectSource.homunity,
        sourceUrl: url,
        sourceProjectId: this.extractProjectId(url) || undefined,
        rawHtml: response.data,
        scrapedAt: new Date(),
      };

      this.logger.log(`Successfully fetched Homunity project: ${url}`);
      return rawData;
    } catch (error) {
      this.logger.error(`Failed to import from Homunity: ${error.message}`);
      throw new Error(`Homunity import failed: ${error.message}`);
    }
  }

  // ============================================
  // Data Mapping
  // ============================================

  mapToUnifiedFormat(rawData: any): UnifiedProjectData {
    this.logger.log('Mapping Homunity data to unified format');

    const $ = cheerio.load(rawData.rawHtml);

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
      source: InvestmentProjectSource.homunity,
      sourceProjectId: rawData.sourceProjectId,

      city,
      country: 'France',
      address,
      latitude: undefined,
      longitude: undefined,

      totalPrice,
      minTicket,
      currency: 'EUR',

      grossYield: undefined,
      netYield: undefined,
      targetYield,

      durationMonths,
      startDate: undefined,
      endDate: undefined,

      propertyType,

      status: this.determineStatus(fundingProgress),
      fundingProgress,

      rawData: {
        html: rawData.rawHtml,
        scrapedAt: rawData.scrapedAt,
      },
      images,
      documents: [],
    };

    this.logger.log(`Mapped Homunity project: ${title}`);
    return unifiedData;
  }

  // ============================================
  // Private Extraction Methods
  // ============================================

  private extractTitle($: cheerio.CheerioAPI): string {
    let title =
      $('h1.project-name').text().trim() ||
      $('h1.titre-projet').text().trim() ||
      $('[data-testid="project-title"]').text().trim() ||
      $('h1').first().text().trim() ||
      $('title').text().split('|')[0].trim();

    return title || 'Untitled Project';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    return (
      $('.description-projet').text().trim() ||
      $('.project-desc').text().trim() ||
      $('meta[name="description"]').attr('content') ||
      ''
    );
  }

  private extractCity($: cheerio.CheerioAPI): string {
    const locationText =
      $('.ville-projet').text().trim() ||
      $('.project-city').text().trim() ||
      $('[data-testid="city"]').text().trim() ||
      '';

    const match = locationText.match(/^([^,\(]+)/);
    return match ? match[1].trim() : 'Paris';
  }

  private extractAddress($: cheerio.CheerioAPI): string {
    return (
      $('.adresse-projet').text().trim() ||
      $('.project-address').text().trim() ||
      ''
    );
  }

  private extractTotalPrice($: cheerio.CheerioAPI): number {
    const priceText =
      $('.montant-total').text().trim() ||
      $('.total-amount').text().trim() ||
      $('[data-testid="total-price"]').text().trim() ||
      '';

    return this.parsePrice(priceText || '0');
  }

  private extractMinTicket($: cheerio.CheerioAPI): number {
    const ticketText =
      $('.ticket-minimum').text().trim() ||
      $('.min-invest').text().trim() ||
      $('[data-testid="min-ticket"]').text().trim() ||
      '';

    const parsed = this.parsePrice(ticketText || '0');
    return parsed > 0 ? parsed : 1000; // Homunity typically has 1000€ minimum
  }

  private extractTargetYield($: cheerio.CheerioAPI): number | undefined {
    const yieldText =
      $('.rendement-cible').text().trim() ||
      $('.target-yield').text().trim() ||
      $('[data-testid="yield"]').text().trim() ||
      '';

    if (!yieldText) return undefined;

    return this.parsePercentage(yieldText);
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    const durationText =
      $('.duree-projet').text().trim() ||
      $('.project-duration').text().trim() ||
      $('[data-testid="duration"]').text().trim() ||
      '';

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
      $('.type-bien').text().trim() ||
      $('.property-type').text().trim() ||
      $('[data-testid="type"]').text().trim() ||
      '';

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

    return 'residential';
  }

  private extractFundingProgress($: cheerio.CheerioAPI): number | undefined {
    const progressText =
      $('.taux-financement').text().trim() ||
      $('.funding-rate').text().trim() ||
      $('[data-testid="progress"]').text().trim() ||
      '';

    if (!progressText) {
      const progressBar = $('.progress-bar, .barre-progression').attr('style') || '';
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

    $('.galerie-projet img, .project-gallery img, .slider-projet img').each(
      (_, elem) => {
        const src = $(elem).attr('src') || $(elem).attr('data-src');
        if (src && !src.includes('placeholder')) {
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
