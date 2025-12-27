import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, Page } from 'puppeteer-core';

/**
 * Service de scraping avancé avec Puppeteer/Browserless
 * Spécialisé pour Facebook Marketplace et sites dynamiques
 */

export interface ScrapingResult {
  success: boolean;
  data: any[];
  count: number;
  errors?: string[];
  metadata?: {
    url: string;
    scrapedAt: Date;
    duration: number;
  };
}

export interface FacebookMarketplaceListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  description: string;
  seller: {
    name: string;
    profileUrl: string;
    joinedDate?: string;
  };
  images: string[];
  url: string;
  postedDate: Date;
  category: string;
  metadata: any;
}

export interface FacebookMarketplaceSearch {
  query: string;
  location: string;
  minPrice?: number;
  maxPrice?: number;
  category?: 'property_for_sale' | 'property_rentals';
  radius?: number;
  limit?: number;
}

@Injectable()
export class BrowserlessService {
  private readonly logger = new Logger(BrowserlessService.name);
  private browser: Browser | null = null;
  private readonly browserlessEndpoint: string;
  private readonly browserlessToken: string;

  constructor(private readonly configService: ConfigService) {
    this.browserlessEndpoint =
      configService.get('BROWSERLESS_ENDPOINT') || 'wss://chrome.browserless.io';
    this.browserlessToken = configService.get('BROWSERLESS_TOKEN') || '';
  }

  /**
   * Initialiser une session de browser
   */
  private async initBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    try {
      // Connexion à Browserless cloud
      if (this.browserlessToken) {
        this.browser = await puppeteer.connect({
          browserWSEndpoint: `${this.browserlessEndpoint}?token=${this.browserlessToken}`,
        });
        this.logger.log('Connected to Browserless cloud');
      } else {
        // Fallback: utiliser Puppeteer local (dev uniquement)
        this.logger.warn('No Browserless token, using local Puppeteer (dev mode)');
        // Note: nécessite Chrome/Chromium installé
        throw new Error(
          'Local Puppeteer not configured. Set BROWSERLESS_TOKEN environment variable.',
        );
      }

      return this.browser;
    } catch (error) {
      this.logger.error(`Failed to init browser: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fermer le browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  /**
   * Scraper Facebook Marketplace pour annonces immobilières
   */
  async scrapeFacebookMarketplace(
    search: FacebookMarketplaceSearch,
  ): Promise<ScrapingResult> {
    const startTime = Date.now();
    const listings: FacebookMarketplaceListing[] = [];
    const errors: string[] = [];

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Configuration page
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Construire URL Facebook Marketplace
      const marketplaceUrl = this.buildMarketplaceUrl(search);
      this.logger.log(`Scraping Facebook Marketplace: ${marketplaceUrl}`);

      // Naviguer vers Marketplace
      await page.goto(marketplaceUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Attendre que les annonces se chargent
      await page.waitForSelector('[data-testid="marketplace-feed"]', { timeout: 10000 });

      // Scroll pour charger plus d'annonces
      await this.autoScroll(page, search.limit || 20);

      // Extraire les annonces
      const listingsData = await page.evaluate(() => {
        const items: any[] = [];
        const listingElements = document.querySelectorAll('[data-testid*="marketplace"]');

        listingElements.forEach((el: any) => {
          try {
            // Extraction des données
            const titleEl = el.querySelector('span[dir="auto"]');
            const priceEl = el.querySelector('span[class*="price"]');
            const locationEl = el.querySelector('span[class*="location"]');
            const linkEl = el.querySelector('a[href*="marketplace"]');

            if (titleEl && priceEl && linkEl) {
              items.push({
                title: titleEl.textContent?.trim(),
                price: priceEl.textContent?.trim(),
                location: locationEl?.textContent?.trim(),
                url: linkEl.href,
                imageUrl: el.querySelector('img')?.src,
              });
            }
          } catch (error) {
            console.error('Error extracting listing:', error);
          }
        });

        return items;
      });

      // Parser et enrichir les données
      for (const data of listingsData) {
        try {
          const listing = await this.parseMarketplaceListing(page, data);
          if (listing) {
            listings.push(listing);
          }
        } catch (error) {
          errors.push(`Failed to parse listing: ${error.message}`);
        }
      }

      await page.close();

      return {
        success: true,
        data: listings,
        count: listings.length,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          url: marketplaceUrl,
          scrapedAt: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error(`Facebook Marketplace scraping failed: ${error.message}`);
      return {
        success: false,
        data: [],
        count: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Scraper profil utilisateur Facebook (public uniquement)
   */
  async scrapeFacebookProfile(profileUrl: string): Promise<any> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.goto(profileUrl, { waitUntil: 'networkidle2' });

      const profileData = await page.evaluate(() => {
        return {
          name: document.querySelector('h1')?.textContent,
          location: document.querySelector('[class*="location"]')?.textContent,
          // Autres données publiques accessibles
        };
      });

      await page.close();
      return profileData;
    } catch (error) {
      this.logger.error(`Facebook profile scraping failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Scraper site web générique avec sélecteurs custom
   */
  async scrapeWebsite(
    url: string,
    selectors: { [key: string]: string },
  ): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extraire données avec sélecteurs
      const data = await page.evaluate((sel) => {
        const result: any = {};
        for (const [key, selector] of Object.entries(sel)) {
          const elements = document.querySelectorAll(selector);
          result[key] = Array.from(elements).map((el: any) => ({
            text: el.textContent?.trim(),
            html: el.innerHTML,
            href: el.href,
          }));
        }
        return result;
      }, selectors);

      await page.close();

      return {
        success: true,
        data: [data],
        count: 1,
        metadata: {
          url,
          scrapedAt: new Date(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      this.logger.error(`Website scraping failed: ${error.message}`);
      return {
        success: false,
        data: [],
        count: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Prendre un screenshot d'une page
   */
  async takeScreenshot(url: string, fullPage: boolean = true): Promise<Buffer> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'networkidle2' });

      const screenshot = await page.screenshot({
        fullPage,
        type: 'png',
      });

      await page.close();
      return screenshot as Buffer;
    } catch (error) {
      this.logger.error(`Screenshot failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Générer PDF d'une page
   */
  async generatePDF(url: string): Promise<Buffer> {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      await page.goto(url, { waitUntil: 'networkidle2' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      await page.close();
      return pdf as Buffer;
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`);
      throw error;
    }
  }

  // ================== MÉTHODES PRIVÉES ==================

  private buildMarketplaceUrl(search: FacebookMarketplaceSearch): string {
    const baseUrl = 'https://www.facebook.com/marketplace';
    const params = new URLSearchParams();

    // Catégorie
    if (search.category) {
      params.append('category', search.category);
    }

    // Localisation
    if (search.location) {
      params.append('query', search.query);
      params.append('exactLocation', search.location);
    }

    // Prix
    if (search.minPrice) {
      params.append('minPrice', search.minPrice.toString());
    }
    if (search.maxPrice) {
      params.append('maxPrice', search.maxPrice.toString());
    }

    // Rayon de recherche
    if (search.radius) {
      params.append('radius', search.radius.toString());
    }

    return `${baseUrl}/search?${params.toString()}`;
  }

  private async parseMarketplaceListing(
    page: Page,
    rawData: any,
  ): Promise<FacebookMarketplaceListing | null> {
    try {
      // Parser prix
      const priceMatch = rawData.price?.match(/[\d,]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;

      // Extraire ID de l'URL
      const idMatch = rawData.url?.match(/item\/(\d+)/);
      const id = idMatch ? idMatch[1] : Date.now().toString();

      return {
        id,
        title: rawData.title || '',
        price,
        currency: 'TND', // Tunisie
        location: rawData.location || '',
        description: '', // Nécessite navigation vers page détails
        seller: {
          name: '', // Nécessite navigation vers page détails
          profileUrl: '',
        },
        images: rawData.imageUrl ? [rawData.imageUrl] : [],
        url: rawData.url || '',
        postedDate: new Date(), // Approximation
        category: 'property',
        metadata: rawData,
      };
    } catch (error) {
      this.logger.warn(`Failed to parse listing: ${error.message}`);
      return null;
    }
  }

  private async autoScroll(page: Page, targetCount: number = 20): Promise<void> {
    try {
      let previousHeight = 0;
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        // Scroll vers le bas
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });

        // Attendre chargement
        await page.waitForTimeout(2000);

        // Vérifier si nouvelles annonces chargées
        const currentHeight = await page.evaluate(() => document.body.scrollHeight);

        if (currentHeight === previousHeight) {
          break; // Plus de contenu à charger
        }

        previousHeight = currentHeight;
        attempts++;

        // Vérifier si on a assez d'annonces
        const count = await page.evaluate(() => {
          return document.querySelectorAll('[data-testid*="marketplace"]').length;
        });

        if (count >= targetCount) {
          break;
        }
      }

      this.logger.log(`Auto-scrolled ${attempts} times`);
    } catch (error) {
      this.logger.warn(`Auto-scroll failed: ${error.message}`);
    }
  }

  /**
   * Cleanup à la destruction du service
   */
  async onModuleDestroy() {
    await this.closeBrowser();
  }
}
