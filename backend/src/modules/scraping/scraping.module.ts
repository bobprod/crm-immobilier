import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScrapingController } from './scraping.controller';
import { CheerioService } from './services/cheerio.service';
import { PuppeteerService } from './services/puppeteer.service';
import { FirecrawlService } from './services/firecrawl.service';
import { WebDataService } from './services/web-data.service';

/**
 * Module de scraping web unifié
 * 
 * Ce module fournit une architecture propre pour le scraping web
 * avec support de plusieurs providers:
 * 
 * - CheerioService: Parsing HTML simple (gratuit, rapide)
 * - PuppeteerService: Browser automation (gratuit, sites JS)
 * - FirecrawlService: IA intégrée (API payante, sites complexes)
 * - WebDataService: Orchestrateur qui sélectionne le meilleur provider
 * 
 * Les clés API se configurent dans les paramètres utilisateur ou
 * dans les variables d'environnement.
 */
@Module({
  imports: [ConfigModule],
  controllers: [ScrapingController],
  providers: [CheerioService, PuppeteerService, FirecrawlService, WebDataService],
  exports: [CheerioService, PuppeteerService, FirecrawlService, WebDataService],
})
export class ScrapingModule {}
