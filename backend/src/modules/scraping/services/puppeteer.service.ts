import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';

export interface PuppeteerScrapingOptions {
  waitForSelector?: string;
  waitForTimeout?: number;
  screenshot?: boolean;
  executeJavaScript?: string;
  cookies?: Array<{ name: string; value: string }>;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface PuppeteerScrapingResult {
  html: string;
  text: string;
  title: string;
  url: string;
  screenshot?: string; // Base64
  metadata?: any;
}

/**
 * Service de scraping avec Puppeteer (browser automation)
 * 
 * Avantages:
 * - 100% gratuit
 * - Supporte JavaScript
 * - Peut interagir avec la page
 * - Screenshots possibles
 * 
 * Limitations:
 * - Plus lent que Cheerio
 * - Consomme plus de ressources (CPU/RAM)
 * - Nécessite un navigateur headless
 * 
 * Cas d'usage:
 * - Sites avec JavaScript lourd (React, Vue, Angular)
 * - Sites nécessitant une interaction (scroll, clicks)
 * - Sites avec contenu dynamique
 * - Bricks.co, Homunity, etc.
 */
@Injectable()
export class PuppeteerService {
  private readonly logger = new Logger(PuppeteerService.name);
  private browser: Browser | null = null;
  private browserPromise: Promise<Browser> | null = null;

  /**
   * Initialiser le navigateur Puppeteer avec gestion thread-safe
   */
  private async getBrowser(): Promise<Browser> {
    // Si un browser est déjà disponible et connecté, le réutiliser
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    // Si un lancement est déjà en cours, attendre au lieu d'en démarrer un nouveau
    if (!this.browserPromise) {
      this.logger.log('Launching Puppeteer browser...');
      this.browserPromise = puppeteer
        .launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--window-size=1920,1080',
          ],
        })
        .then((browser) => {
          this.browser = browser;
          return browser;
        })
        .finally(() => {
          // Permettre une nouvelle tentative de lancement si le browser se déconnecte plus tard
          this.browserPromise = null;
        });
    }

    return this.browserPromise;
  }

  /**
   * Scraper une URL avec rendu JavaScript
   */
  async scrapeUrl(
    url: string,
    options?: PuppeteerScrapingOptions,
  ): Promise<PuppeteerScrapingResult> {
    this.logger.log(`Scraping URL with Puppeteer: ${url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Configurer le viewport
      if (options?.viewport) {
        await page.setViewport(options.viewport);
      } else {
        await page.setViewport({ width: 1920, height: 1080 });
      }

      // Ajouter des cookies si fournis
      if (options?.cookies) {
        await page.setCookie(...options.cookies);
      }

      // Naviguer vers l'URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Attendre un sélecteur spécifique si fourni
      if (options?.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
      }

      // Attendre un délai supplémentaire si fourni
      if (options?.waitForTimeout) {
        await page.evaluate(
          (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
          options.waitForTimeout,
        );
      }

      // Exécuter du JavaScript personnalisé si fourni
      if (options?.executeJavaScript) {
        await page.evaluate(options.executeJavaScript);
      }

      // Extraire le contenu
      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText);
      const title = await page.title();
      const finalUrl = page.url();

      // Prendre une capture d'écran si demandé
      let screenshot: string | undefined;
      if (options?.screenshot) {
        const screenshotBuffer = await page.screenshot({ encoding: 'binary' });
        screenshot = Buffer.from(screenshotBuffer as Buffer).toString('base64');
      }

      // Extraire les métadonnées
      const metadata = await page.evaluate(() => {
        const metas: any = {};
        document.querySelectorAll('meta').forEach((meta) => {
          const name = meta.getAttribute('name') || meta.getAttribute('property');
          const content = meta.getAttribute('content');
          if (name && content) {
            metas[name] = content;
          }
        });
        return metas;
      });

      this.logger.log(`Successfully scraped ${url} with Puppeteer`);

      return {
        html,
        text,
        title,
        url: finalUrl,
        screenshot,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape ${url} with Puppeteer: ${error.message}`);
      throw new Error(`Puppeteer scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Scraper plusieurs URLs en parallèle
   */
  async scrapeMultipleUrls(
    urls: string[],
    options?: PuppeteerScrapingOptions,
  ): Promise<PuppeteerScrapingResult[]> {
    this.logger.log(`Scraping ${urls.length} URLs with Puppeteer`);

    const results: PuppeteerScrapingResult[] = [];

    // Traiter par lots de 3 pour ne pas surcharger le système
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map((url) => this.scrapeUrl(url, options)),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          this.logger.warn(`Failed to scrape URL: ${result.reason}`);
        }
      }
    }

    return results;
  }

  /**
   * Scraper avec interaction (scroll, click, etc.)
   */
  async scrapeWithInteraction(
    url: string,
    interaction: (page: Page) => Promise<void>,
    options?: PuppeteerScrapingOptions,
  ): Promise<PuppeteerScrapingResult> {
    this.logger.log(`Scraping URL with interaction: ${url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Exécuter l'interaction personnalisée
      await interaction(page);

      // Attendre que le contenu se charge après l'interaction
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText);
      const title = await page.title();
      const finalUrl = page.url();

      return {
        html,
        text,
        title,
        url: finalUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape with interaction: ${error.message}`);
      throw new Error(`Puppeteer scraping with interaction failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Scraper avec scroll infini (charger plus de contenu)
   */
  async scrapeWithInfiniteScroll(
    url: string,
    maxScrolls: number = 5,
  ): Promise<PuppeteerScrapingResult> {
    this.logger.log(`Scraping URL with infinite scroll: ${url}`);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Scroller plusieurs fois pour charger plus de contenu
      for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      const html = await page.content();
      const text = await page.evaluate(() => document.body.innerText);
      const title = await page.title();
      const finalUrl = page.url();

      return {
        html,
        text,
        title,
        url: finalUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to scrape with infinite scroll: ${error.message}`);
      throw new Error(`Puppeteer infinite scroll scraping failed: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  /**
   * Fermer le navigateur (à appeler lors du shutdown de l'application)
   */
  async close(): Promise<void> {
    if (this.browser) {
      try {
        this.logger.log('Closing Puppeteer browser...');
        await this.browser.close();
      } catch (error) {
        this.logger.error('Erreur lors de la fermeture du browser:', error);
      } finally {
        this.browser = null;
        this.browserPromise = null;
      }
    }
  }

  /**
   * Hook pour fermer le navigateur lors du shutdown
   */
  async onModuleDestroy(): Promise<void> {
    await this.close();
  }
}
