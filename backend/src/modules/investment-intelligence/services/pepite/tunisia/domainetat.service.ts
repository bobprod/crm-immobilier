import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { WebDataService } from '../../../../scraping/services/web-data.service';

export interface EnchereEntry {
  title: string;
  date: string;
  location: string;
  surface: string | null;
  prixDepart: string | null;
  url: string;
  type: 'terrain' | 'immeuble' | 'local' | 'autre';
}

/**
 * Service de surveillance des ventes aux enchères — Domaine de l'État tunisien
 * Source: domainetat.tn
 * Détecte les cessions et adjudications publiques de terrains
 */
@Injectable()
export class DomaineEtatService {
  private readonly logger = new Logger(DomaineEtatService.name);
  private readonly baseUrl = 'https://www.domainetat.tn';

  constructor(private readonly webData: WebDataService) {}

  async getActiveEncheres(): Promise<EnchereEntry[]> {
    try {
      const scraped = await this.webData.fetchHtml(`${this.baseUrl}/annonces`, { provider: 'cheerio' });
      return this.parseEncheres(scraped?.html ?? '');
    } catch (err: any) {
      this.logger.warn(`DomaineEtat scraping échoué: ${err.message}`);
      return [];
    }
  }

  private parseEncheres(html: string): EnchereEntry[] {
    const $ = cheerio.load(html);
    const results: EnchereEntry[] = [];

    // Selectors adaptés à la structure domainetat.tn
    $('.annonce, .vente-item, article.encheres, tr.annonce-row').each((_, el) => {
      const title = $(el).find('h2, h3, .titre, .annonce-title, td.titre').first().text().trim();
      const date = $(el).find('.date, time, .date-encheres, td.date').first().text().trim();
      const location = $(el).find('.location, .gouvernorat, .ville, td.lieu').first().text().trim();
      const surface = $(el).find('.surface, .superficie, td.superficie').first().text().trim() || null;
      const prix = $(el).find('.prix, .mise-en-prix, td.prix').first().text().trim() || null;
      const link = $(el).find('a').first().attr('href') || '';

      if (!title) return;

      results.push({
        title,
        date,
        location,
        surface,
        prixDepart: prix,
        url: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
        type: this.classifyType(title),
      });
    });

    return results;
  }

  private classifyType(title: string): EnchereEntry['type'] {
    const lower = title.toLowerCase();
    if (/terrain|lot|parcelle|foncier/.test(lower)) return 'terrain';
    if (/immeuble|résidence|bâtiment/.test(lower)) return 'immeuble';
    if (/local|commerce|entrepôt/.test(lower)) return 'local';
    return 'autre';
  }
}
