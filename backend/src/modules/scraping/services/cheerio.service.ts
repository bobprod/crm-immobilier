import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';

export interface CheerioScrapingOptions {
  selectors?: {
    links?: string;
    emails?: string;
    phones?: string;
    content?: string;
  };
  timeout?: number;
  headers?: Record<string, string>;
}

export interface CheerioScrapingResult {
  html: string;
  text: string;
  links: string[];
  emails: string[];
  phones: string[];
  metadata?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

/**
 * Service de scraping HTML simple avec Cheerio
 * 
 * Avantages:
 * - 100% gratuit
 * - Très rapide
 * - Léger en ressources
 * - Parfait pour HTML statique
 * 
 * Limitations:
 * - Ne supporte pas JavaScript
 * - Ne peut pas interagir avec la page
 * 
 * Cas d'usage:
 * - Annonces immobilières simples
 * - Parsing de résultats SerpAPI
 * - Sites statiques
 */
@Injectable()
export class CheerioService {
  private readonly logger = new Logger(CheerioService.name);

  /**
   * Scraper une URL et extraire le contenu HTML simple
   */
  async scrapeUrl(url: string, options?: CheerioScrapingOptions): Promise<CheerioScrapingResult> {
    this.logger.log(`Scraping URL with Cheerio: ${url}`);

    try {
      // Faire la requête HTTP
      const response = await axios.get(url, {
        timeout: options?.timeout || 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          ...options?.headers,
        },
      });

      // Parser le HTML avec Cheerio
      const $ = cheerio.load(response.data);

      // Extraire les données
      const result: CheerioScrapingResult = {
        html: response.data,
        text: $('body').text().trim(),
        links: this.extractLinks($, options?.selectors?.links),
        emails: this.extractEmails($, options?.selectors?.emails),
        phones: this.extractPhones($, options?.selectors?.phones),
        metadata: {
          title: $('title').text().trim() || undefined,
          description: $('meta[name="description"]').attr('content') || undefined,
          keywords:
            $('meta[name="keywords"]')
              .attr('content')
              ?.split(',')
              .map((k) => k.trim()) || undefined,
        },
      };

      this.logger.log(
        `Successfully scraped ${url}: ${result.links.length} links, ${result.emails.length} emails, ${result.phones.length} phones`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to scrape ${url}: ${error.message}`);
      throw new Error(`Cheerio scraping failed: ${error.message}`);
    }
  }

  /**
   * Parser du HTML déjà récupéré
   */
  parseHtml(html: string, options?: CheerioScrapingOptions): CheerioScrapingResult {
    this.logger.log(`Parsing HTML with Cheerio`);

    const $ = cheerio.load(html);

    return {
      html,
      text: $('body').text().trim(),
      links: this.extractLinks($, options?.selectors?.links),
      emails: this.extractEmails($, options?.selectors?.emails),
      phones: this.extractPhones($, options?.selectors?.phones),
      metadata: {
        title: $('title').text().trim() || undefined,
        description: $('meta[name="description"]').attr('content') || undefined,
        keywords:
          $('meta[name="keywords"]')
            .attr('content')
            ?.split(',')
            .map((k) => k.trim()) || undefined,
      },
    };
  }

  /**
   * Extraire tous les liens de la page
   */
  private extractLinks($: cheerio.CheerioAPI, selector?: string): string[] {
    const links: string[] = [];
    const elements = selector ? $(selector) : $('a');

    elements.each((i, el) => {
      const href = $(el).attr('href');
      if (href && href.startsWith('http')) {
        links.push(href);
      }
    });

    return [...new Set(links)]; // Dédupliquer
  }

  /**
   * Extraire tous les emails de la page
   */
  private extractEmails($: cheerio.CheerioAPI, selector?: string): string[] {
    const text = selector ? $(selector).text() : $('body').text();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex) || [];

    // Filtrer les emails de spam/test
    return [...new Set(matches)].filter(
      (email) =>
        !email.includes('example.com') &&
        !email.includes('test.com') &&
        !email.includes('placeholder'),
    );
  }

  /**
   * Extraire tous les téléphones tunisiens de la page
   */
  private extractPhones($: cheerio.CheerioAPI, selector?: string): string[] {
    const text = selector ? $(selector).text() : $('body').text();

    // Patterns pour les numéros tunisiens
    const patterns = [
      /(?:\+216|00216)?[\s.-]?[2579]\d[\s.-]?\d{3}[\s.-]?\d{3}/g,
      /(?:\+216|00216)?[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
    ];

    const phones: string[] = [];

    for (const pattern of patterns) {
      const matches = text.match(pattern) || [];
      phones.push(...matches);
    }

    // Dédupliquer et normaliser
    return [...new Set(phones.map((p) => this.normalizePhone(p)))];
  }

  /**
   * Normaliser un numéro de téléphone tunisien
   */
  private normalizePhone(phone: string): string {
    let normalized = phone.replace(/[\s.-]/g, '');

    // Ajouter le préfixe tunisien si absent
    if (normalized.match(/^[2579]\d{7}$/)) {
      normalized = '+216' + normalized;
    } else if (normalized.startsWith('00216')) {
      normalized = '+216' + normalized.substring(5);
    } else if (normalized.startsWith('216')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }

  /**
   * Extraire du contenu spécifique avec un sélecteur CSS
   */
  extractContent(html: string, selector: string): string[] {
    const $ = cheerio.load(html);
    const content: string[] = [];

    $(selector).each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        content.push(text);
      }
    });

    return content;
  }

  /**
   * Extraire des attributs spécifiques
   */
  extractAttributes(html: string, selector: string, attribute: string): string[] {
    const $ = cheerio.load(html);
    const attributes: string[] = [];

    $(selector).each((i, el) => {
      const attr = $(el).attr(attribute);
      if (attr) {
        attributes.push(attr);
      }
    });

    return [...new Set(attributes)];
  }
}
