import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScrapingController } from './scraping.controller';
import { CheerioService } from './services/cheerio.service';
import { PuppeteerService } from './services/puppeteer.service';
import { FirecrawlService } from './services/firecrawl.service';
import { WebDataService } from './services/web-data.service';
import { SerpService } from './services/serp.service';
import { AiBillingModule } from '../../shared/ai-billing/ai-billing.module';

// Nouveaux services externes et avancés
import { ApifyService } from './services/apify.service';
import { BrightDataService } from './services/brightdata.service';
import { AntiDetectionService } from './services/anti-detection.service';
import { LeBonCoinService } from './services/leboncoin.service';
import { InternationalScraperService } from './services/international-scraper.service';

/**
 * Module de scraping web unifié - Version internationale
 *
 * Ce module fournit une architecture complète pour le scraping web
 * avec support de 20+ pays et multiples providers:
 *
 * PROVIDERS INTÉGRÉS (gratuits):
 * - CheerioService: Parsing HTML simple (gratuit, rapide)
 * - PuppeteerService: Browser automation (gratuit, sites JS)
 *
 * PROVIDERS EXTERNES (API payantes):
 * - FirecrawlService: IA intégrée (sites complexes)
 * - ApifyService: Scrapers pré-construits (Zillow, Realtor, etc.)
 * - BrightDataService: Proxies résidentiels premium (anti-bot)
 *
 * SCRAPERS SPÉCIFIQUES FRANCE:
 * - LeBonCoinService: API non-officielle LeBonCoin
 * - SeLogerService: À venir
 * - PAPService: À venir
 *
 * SCRAPERS INTERNATIONAUX (20+ pays):
 * - InternationalScraperService: Scraper unifié multi-pays
 *   🌍 Afrique: Maroc, Algérie, Tunisie, Cameroun, CI, Sénégal, Nigeria, Congo
 *   🌎 Amérique Latine: Brésil, Colombie, Équateur, Bolivie
 *   🌐 Europe+Canada: Canada, UK, Allemagne, Pays-Bas
 *   🌏 Asie: Japon, Corée du Sud, Taiwan, Inde
 *
 * SERVICES AVANCÉS:
 * - AntiDetectionService: Techniques d'évitement de détection
 * - SerpService: Recherche Google/Maps
 * - WebDataService: Orchestrateur intelligent
 *
 * Les clés API se configurent dans les paramètres utilisateur (BYOK)
 * ou dans les variables d'environnement.
 */
@Module({
  imports: [ConfigModule, AiBillingModule],
  controllers: [ScrapingController],
  providers: [
    // Services intégrés (existants)
    CheerioService,
    PuppeteerService,
    FirecrawlService,
    SerpService,
    WebDataService,

    // Nouveaux services externes
    ApifyService,
    BrightDataService,

    // Services avancés
    AntiDetectionService,

    // Scrapers spécifiques sites français
    LeBonCoinService,

    // Scraper international (20+ pays)
    InternationalScraperService,
  ],
  exports: [
    // Exports existants
    CheerioService,
    PuppeteerService,
    FirecrawlService,
    SerpService,
    WebDataService,

    // Nouveaux exports
    ApifyService,
    BrightDataService,
    AntiDetectionService,
    LeBonCoinService,

    // Export international
    InternationalScraperService,
  ],
})
export class ScrapingModule { }
