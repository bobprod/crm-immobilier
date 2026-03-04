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

/**
 * Module de scraping web unifié - Version améliorée
 *
 * Ce module fournit une architecture complète pour le scraping web
 * avec support de multiples providers et techniques avancées:
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
 * SCRAPERS SPÉCIFIQUES:
 * - LeBonCoinService: API non-officielle LeBonCoin
 * - SeLogerService: À venir
 * - PAPService: À venir
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
  ],
})
export class ScrapingModule { }
