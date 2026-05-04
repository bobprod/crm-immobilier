import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { GeopauService } from './tunisia/geopau.service';
import { JortService } from './tunisia/jort.service';
import { DomaineEtatService } from './tunisia/domainetat.service';
import { DvfService } from './france/dvf.service';
import { GeorisquesService } from './france/georisques.service';
import { WebDataService } from '../../../scraping/services/web-data.service';
import { PepiteAiService } from './pepite-ai.service';
import { PepiteBenchmarkService } from './pepite-benchmark.service';
import { getConfigForCountry, getSourcesForCountry } from './country-sources.registry';

export interface PepiteOpportunity {
  id: string;
  title: string;
  source: string;
  country: string;
  location: string;
  surface: string | null;
  prix: string | null;
  score: number;          // 0-100
  scoreLabel: 'PÉPITE' | 'BONNE' | 'NORMALE' | 'FAIBLE';
  scoreDetails: ScoreDetail[];
  vocation: string | null;
  isUrbain: boolean;
  risques: string[];
  url: string;
  type: 'terrain' | 'immeuble' | 'local' | 'enchere' | 'autre';
  createdAt: string;
}

export interface ScoreDetail {
  critere: string;
  points: number;
  max: number;
  ok: boolean;
}

export interface PepiteScanResult {
  country: string;
  sources: string[];
  opportunities: PepiteOpportunity[];
  totalScanned: number;
  pepiteCount: number;
  scanDate: string;
}

@Injectable()
export class PepiteScorerService {
  private readonly logger = new Logger(PepiteScorerService.name);

  constructor(
    private readonly geopau: GeopauService,
    private readonly jort: JortService,
    private readonly domaineEtat: DomaineEtatService,
    private readonly dvf: DvfService,
    private readonly georisques: GeorisquesService,
    private readonly webData: WebDataService,
    private readonly pepiteAi: PepiteAiService,
    private readonly benchmark: PepiteBenchmarkService,
  ) {}

  async scan(
    country: string,
    lat?: number,
    lng?: number,
    keywords?: string[],
    customUrls?: string[],
    userId?: string,
  ): Promise<PepiteScanResult> {
    const config = getConfigForCountry(country);
    const usedLat = lat ?? config.coordinatesDefault.lat;
    const usedLng = lng ?? config.coordinatesDefault.lng;
    const sources = getSourcesForCountry(country);

    this.logger.log(`Radar Spot scan: country=${country}, keywords=${keywords?.join(',')}, urls=${customUrls?.length ?? 0}`);

    const opportunities: PepiteOpportunity[] = [];

    // Scraper les URLs personnalisées fournies par l'utilisateur
    if (customUrls && customUrls.length > 0) {
      const urlOpps = await this.scrapeCustomUrls(customUrls, country, userId);
      opportunities.push(...urlOpps);
    }

    if (country === 'Tunisie') {
      // Récupérer enchères domaine état
      const encheres = await this.domaineEtat.getActiveEncheres();
      for (const e of encheres) {
        const opp = await this.scoreEncheresTunisie(e, usedLat, usedLng);
        if (opp) opportunities.push(opp);
      }

      // Récupérer alertes JORT
      const jortEntries = await this.jort.searchRecentEntries();
      for (const j of jortEntries.slice(0, 5)) {
        opportunities.push(this.scoreJortEntry(j));
      }
    } else if (country === 'France') {
      // Récupérer transactions DVF sous le marché
      const mutations = await this.dvf.getMutationsByLocation(usedLat, usedLng, 5);
      const avgPrix = await this.dvf.getAveragePriceM2('75000');
      for (const m of mutations.slice(0, 20)) {
        if (!m.prixM2) continue;
        const opp = await this.scoreDvfMutation(m, avgPrix, usedLat, usedLng);
        if (opp) opportunities.push(opp);
      }
    }

    // Trier par score décroissant
    opportunities.sort((a, b) => b.score - a.score);

    return {
      country,
      sources,
      opportunities,
      totalScanned: opportunities.length,
      pepiteCount: opportunities.filter((o) => o.scoreLabel === 'PÉPITE').length,
      scanDate: new Date().toISOString(),
    };
  }

  // ─── Scraping URLs personnalisées ─────────────────────────────────────────

  private async scrapeCustomUrls(urls: string[], country: string, userId?: string): Promise<PepiteOpportunity[]> {
    const results: PepiteOpportunity[] = [];

    for (const url of urls.slice(0, 5)) {
      try {
        this.logger.log(`Scraping URL personnalisée: ${url}`);
        const scraped = await this.webData.fetchHtml(url, { provider: 'cheerio' });
        const html = scraped?.html ?? '';
        const $ = cheerio.load(html);

        const title =
          $('h1').first().text().trim() ||
          $('title').text().trim() ||
          `Annonce — ${new URL(url).hostname}`;

        const priceRaw = $('[class*="price"],[class*="prix"],[class*="Price"]').first().text().trim();
        const surfaceRaw = $('[class*="surface"],[class*="superficie"]').first().text().trim();
        const locationRaw = $('[class*="location"],[class*="localisation"],[class*="ville"]').first().text().trim();
        const descRaw = $('meta[name="description"]').attr('content') || $('p').first().text().trim();

        const details: ScoreDetail[] = [];
        const hasData = !!(priceRaw || surfaceRaw);
        details.push({ critere: 'URL importée', points: 20, max: 20, ok: true });
        details.push({ critere: 'Données extraites', points: hasData ? 30 : 10, max: 30, ok: hasData });

        // IA : analyse du texte de l'annonce
        let aiAnalysis = { scoreBoost: 0, signals: [] as string[], summary: '', surface: null as string | null, prix: null as string | null, vocation: null as string | null };
        if (userId && (title || descRaw)) {
          try {
            const analysis = await this.pepiteAi.analyzeListingText(title, descRaw, country, userId);
            aiAnalysis = { ...analysis };
            if (analysis.scoreBoost > 0) {
              details.push({ critere: `Signaux IA (${analysis.signals.join(', ')})`, points: analysis.scoreBoost, max: 20, ok: true });
            }
          } catch { /* non-bloquant */ }
        }

        // Benchmark CRM
        let benchmarkDetail: ScoreDetail | null = null;
        if (locationRaw) {
          try {
            const bm = await this.benchmark.isPriceUnderMarket(priceRaw || aiAnalysis.prix, locationRaw, surfaceRaw || aiAnalysis.surface, undefined);
            if (bm.underMarket) {
              benchmarkDetail = { critere: `Prix sous marché CRM (-${Math.round((1 - (bm.ratio ?? 1)) * 100)}%)`, points: 15, max: 15, ok: true };
              details.push(benchmarkDetail);
            }
          } catch { /* non-bloquant */ }
        }

        const score = Math.min(100, details.reduce((s, d) => s + d.points, 0));

        results.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: title.substring(0, 120),
          source: new URL(url).hostname,
          country,
          location: locationRaw || '',
          surface: surfaceRaw || aiAnalysis.surface || null,
          prix: priceRaw || aiAnalysis.prix || null,
          score,
          scoreLabel: this.getLabel(score),
          scoreDetails: details,
          vocation: aiAnalysis.vocation || null,
          isUrbain: false,
          risques: [],
          url,
          type: 'autre',
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        this.logger.warn(`Scraping URL échoué: ${url} — ${err.message}`);
      }
    }

    return results;
  }

  async checkZone(lat: number, lng: number, country: string): Promise<Record<string, any>> {
    if (country === 'Tunisie') {
      const zone = await this.geopau.queryZoneByCoordinates(lat, lng);
      return { source: 'SIG PAU (geopau.gov.tn)', zone };
    } else if (country === 'France') {
      const risques = await this.georisques.getRisquesByCoordinates(lat, lng);
      const dvf = await this.dvf.getMutationsByLocation(lat, lng, 1);
      return { source: 'Géorisques + DVF', risques, recentTransactions: dvf.slice(0, 5) };
    }
    return {};
  }

  // ─── Scoring Tunisie ───────────────────────────────────────────────────────

  private async scoreEncheresTunisie(enchere: any, lat: number, lng: number): Promise<PepiteOpportunity | null> {
    const details: ScoreDetail[] = [];

    // +30 : terrain (type le plus stratégique)
    const isTerrain = enchere.type === 'terrain';
    details.push({ critere: 'Type terrain', points: isTerrain ? 30 : 0, max: 30, ok: isTerrain });

    // +30 : vérifier vocation PAU si on a les coords
    let isUrbain = false;
    let vocation: string | null = null;
    const zone = await this.geopau.queryZoneByCoordinates(lat, lng);
    if (zone) {
      isUrbain = zone.isUrbain;
      vocation = zone.vocation;
    }
    details.push({ critere: 'Zone urbaine PAU', points: isUrbain ? 30 : 0, max: 30, ok: isUrbain });

    // +20 : prix de départ mentionné (= transparence)
    const hasPrix = !!enchere.prixDepart;
    details.push({ critere: 'Prix connu', points: hasPrix ? 20 : 0, max: 20, ok: hasPrix });

    // +20 : source officielle (domaine état = fiable)
    details.push({ critere: 'Source officielle', points: 20, max: 20, ok: true });

    const score = details.reduce((s, d) => s + d.points, 0);

    return {
      id: `tn-enchere-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: enchere.title,
      source: 'Domaine de l\'État',
      country: 'Tunisie',
      location: enchere.location,
      surface: enchere.surface,
      prix: enchere.prixDepart,
      score,
      scoreLabel: this.getLabel(score),
      scoreDetails: details,
      vocation,
      isUrbain,
      risques: [],
      url: enchere.url,
      type: enchere.type,
      createdAt: enchere.date || new Date().toISOString(),
    };
  }

  private scoreJortEntry(entry: any): PepiteOpportunity {
    const details: ScoreDetail[] = [];
    const isVocation = entry.type === 'vocation';
    const isRegul = entry.type === 'regularisation';

    details.push({ critere: 'Changement de vocation', points: isVocation ? 40 : 0, max: 40, ok: isVocation });
    details.push({ critere: 'Régularisation possible', points: isRegul ? 30 : 0, max: 30, ok: isRegul });
    details.push({ critere: 'Source JORT officielle', points: 20, max: 20, ok: true });

    const score = details.reduce((s, d) => s + d.points, 0);

    return {
      id: `tn-jort-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: entry.title,
      source: 'JORT',
      country: 'Tunisie',
      location: '',
      surface: null,
      prix: null,
      score,
      scoreLabel: this.getLabel(score),
      scoreDetails: details,
      vocation: isVocation ? 'Changement vocation' : null,
      isUrbain: isVocation,
      risques: [],
      url: entry.url,
      type: 'terrain',
      createdAt: entry.date || new Date().toISOString(),
    };
  }

  // ─── Scoring France ────────────────────────────────────────────────────────

  private async scoreDvfMutation(
    mutation: any,
    avgPrixM2: number | null,
    lat: number,
    lng: number,
  ): Promise<PepiteOpportunity | null> {
    const details: ScoreDetail[] = [];

    // +40 : prix sous le marché
    let sousMArche = false;
    if (avgPrixM2 && mutation.prixM2) {
      sousMArche = mutation.prixM2 < avgPrixM2 * 0.85; // -15% sous la moyenne
    }
    details.push({ critere: 'Prix sous le marché (-15%)', points: sousMArche ? 40 : 0, max: 40, ok: sousMArche });

    // +30 : terrain (vs appartement)
    const isTerrain = /terrain|foncier/i.test(mutation.type);
    details.push({ critere: 'Type terrain', points: isTerrain ? 30 : 10, max: 30, ok: isTerrain });

    // Vérifier les risques
    let risques: string[] = [];
    const risquesResult = await this.georisques.getRisquesByCoordinates(
      mutation.lat ?? lat,
      mutation.lng ?? lng,
    );
    if (risquesResult) risques = risquesResult.risques;
    const sansRisque = risques.length === 0;
    details.push({ critere: 'Sans risques naturels', points: sansRisque ? 20 : 0, max: 20, ok: sansRisque });

    // +10 : transaction récente (données fraîches)
    const isRecent = mutation.date && new Date(mutation.date) > new Date(Date.now() - 180 * 86400000);
    details.push({ critere: 'Transaction récente (<6 mois)', points: isRecent ? 10 : 0, max: 10, ok: isRecent });

    const score = details.reduce((s, d) => s + d.points, 0);
    if (score < 20) return null; // ignorer les trop faibles

    return {
      id: `fr-dvf-${mutation.id}`,
      title: `${mutation.type} — ${mutation.adresse}`,
      source: 'DVF (data.gouv.fr)',
      country: 'France',
      location: `${mutation.commune} ${mutation.codePostal}`,
      surface: mutation.surface ? `${mutation.surface} m²` : null,
      prix: mutation.prixTotal ? `${mutation.prixTotal.toLocaleString('fr-FR')} €` : null,
      score,
      scoreLabel: this.getLabel(score),
      scoreDetails: details,
      vocation: null,
      isUrbain: true,
      risques,
      url: `https://app.dvf.etalab.gouv.fr/?lat=${mutation.lat}&lon=${mutation.lng}`,
      type: isTerrain ? 'terrain' : 'immeuble',
      createdAt: mutation.date,
    };
  }

  private getLabel(score: number): PepiteOpportunity['scoreLabel'] {
    if (score >= 70) return 'PÉPITE';
    if (score >= 50) return 'BONNE';
    if (score >= 30) return 'NORMALE';
    return 'FAIBLE';
  }
}
