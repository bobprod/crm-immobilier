import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { WebDataService } from '../../../../scraping/services/web-data.service';

export interface JortEntry {
  title: string;
  date: string;
  url: string;
  type: 'vocation' | 'expropriation' | 'regularisation' | 'autre';
  summary: string;
}

const KEYWORDS = {
  vocation: ['changement de vocation', 'terres agricoles', 'zone urbaine', 'plan d\'aménagement'],
  expropriation: ['expropriation', 'utilité publique'],
  regularisation: ['régularisation', 'arrêté', 'terres agricoles'],
};

/**
 * Service de surveillance du JORT (Journal Officiel de la République Tunisienne)
 * Source: iort.gov.tn
 * Détecte les changements de vocation foncière et arrêtés immobiliers
 */
@Injectable()
export class JortService {
  private readonly logger = new Logger(JortService.name);
  private readonly baseUrl = 'https://iort.gov.tn';

  constructor(private readonly webData: WebDataService) {}

  async searchRecentEntries(keywords?: string[]): Promise<JortEntry[]> {
    const searchTerms = keywords ?? [
      'changement de vocation',
      'terres agricoles',
      'zone urbaine',
      'régularisation projets',
    ];

    const results: JortEntry[] = [];

    for (const term of searchTerms.slice(0, 3)) {
      try {
        const entries = await this.scrapeSearch(term);
        results.push(...entries);
      } catch (err: any) {
        this.logger.warn(`JORT search échouée pour "${term}": ${err.message}`);
      }
    }

    // Dédoublonner par URL
    const seen = new Set<string>();
    return results.filter((e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    });
  }

  private async scrapeSearch(keyword: string): Promise<JortEntry[]> {
    const searchUrl = `${this.baseUrl}/recherche?q=${encodeURIComponent(keyword)}&lang=fr`;

    // WebDataService : anti-détection + fallback multi-providers (cheerio → puppeteer)
    const scraped = await this.webData.fetchHtml(searchUrl, { provider: 'cheerio' });
    const $ = cheerio.load(scraped?.html ?? '');
    const entries: JortEntry[] = [];

    // Selectors génériques — adapter selon structure réelle du site
    $('article, .result-item, .jort-entry, tr.entry').each((_, el) => {
      const title = $(el).find('h2, h3, .title, td.title').first().text().trim();
      const date = $(el).find('.date, time, td.date').first().text().trim();
      const link = $(el).find('a').first().attr('href') || '';
      const summary = $(el).find('p, .summary, td.summary').first().text().trim();

      if (!title) return;

      entries.push({
        title,
        date,
        url: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
        type: this.classifyEntry(title + ' ' + summary),
        summary: summary.substring(0, 300),
      });
    });

    return entries;
  }

  private classifyEntry(text: string): JortEntry['type'] {
    const lower = text.toLowerCase();
    if (KEYWORDS.vocation.some((k) => lower.includes(k))) return 'vocation';
    if (KEYWORDS.expropriation.some((k) => lower.includes(k))) return 'expropriation';
    if (KEYWORDS.regularisation.some((k) => lower.includes(k))) return 'regularisation';
    return 'autre';
  }
}
