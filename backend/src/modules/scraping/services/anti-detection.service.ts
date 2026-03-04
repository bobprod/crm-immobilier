import { Injectable, Logger } from '@nestjs/common';
import { randomInt } from 'crypto';

/**
 * Anti-Detection Service
 *
 * Service centralisant toutes les techniques d'évitement de détection
 * pour le web scraping.
 *
 * Techniques implémentées:
 * - Rotation User-Agent (desktop, mobile, tablet)
 * - Headers HTTP réalistes
 * - Rate limiting intelligent
 * - Randomisation des délais
 * - Emulation fingerprint navigateur
 */
@Injectable()
export class AntiDetectionService {
  private readonly logger = new Logger(AntiDetectionService.name);

  /**
   * User-Agents réalistes (2024-2026)
   */
  private readonly userAgents = {
    desktop: [
      // Chrome Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      // Chrome Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      // Firefox Windows
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      // Safari Mac
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      // Edge
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
    ],
    mobile: [
      // iPhone Safari
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      // Android Chrome
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
      // Samsung Internet
      'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
    ],
    tablet: [
      // iPad Safari
      'Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      // Android Tablet
      'Mozilla/5.0 (Linux; Android 13; Tab S9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    ],
  };

  /**
   * Accept-Language headers réalistes par pays
   */
  private readonly acceptLanguages = {
    fr: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    en: 'en-US,en;q=0.9',
    de: 'de-DE,de;q=0.9,en;q=0.8',
    es: 'es-ES,es;q=0.9,en;q=0.8',
    it: 'it-IT,it;q=0.9,en;q=0.8',
  };

  /**
   * Obtenir un User-Agent aléatoire
   */
  getRandomUserAgent(device: 'desktop' | 'mobile' | 'tablet' = 'desktop'): string {
    const agents = this.userAgents[device];
    return agents[randomInt(agents.length)];
  }

  /**
   * Générer des headers HTTP réalistes
   */
  generateRealisticHeaders(options?: {
    device?: 'desktop' | 'mobile' | 'tablet';
    language?: 'fr' | 'en' | 'de' | 'es' | 'it';
    referer?: string;
  }): Record<string, string> {
    const device = options?.device || 'desktop';
    const language = options?.language || 'fr';

    return {
      'User-Agent': this.getRandomUserAgent(device),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': this.acceptLanguages[language],
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0',
      ...(options?.referer && { Referer: options.referer }),
    };
  }

  /**
   * Générer un délai aléatoire (rate limiting humain)
   */
  generateRandomDelay(
    minMs: number = 1000,
    maxMs: number = 5000,
  ): number {
    return randomInt(minMs, maxMs);
  }

  /**
   * Attendre un délai aléatoire (simule comportement humain)
   */
  async waitRandomDelay(minMs: number = 1000, maxMs: number = 5000): Promise<void> {
    const delay = this.generateRandomDelay(minMs, maxMs);
    this.logger.debug(`Attente de ${delay}ms (anti-détection)`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Obtenir des headers spécifiques pour un site
   */
  getSiteSpecificHeaders(domain: string): Record<string, string> {
    const baseHeaders = this.generateRealisticHeaders();

    // Headers spécifiques par domaine
    const siteSpecific: Record<string, Record<string, string>> = {
      'leboncoin.fr': {
        ...baseHeaders,
        'api_key': 'ba0c2dad52b3ec',
        'Origin': 'https://www.leboncoin.fr',
      },
      'seloger.com': {
        ...baseHeaders,
        'Origin': 'https://www.seloger.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
      'pap.fr': {
        ...baseHeaders,
        'Origin': 'https://www.pap.fr',
      },
      'zillow.com': {
        ...baseHeaders,
        'Origin': 'https://www.zillow.com',
      },
    };

    // Extraire le domaine de base
    const baseDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];

    return siteSpecific[baseDomain] || baseHeaders;
  }

  /**
   * Vérifier si un site a de l'anti-bot
   */
  detectAntiBot(html: string): {
    hasAntiBot: boolean;
    type?: 'cloudflare' | 'recaptcha' | 'datadome' | 'perimeter-x' | 'unknown';
    confidence: number;
  } {
    const patterns = {
      cloudflare: /cloudflare|cf-ray|cf-browser-verification/i,
      recaptcha: /recaptcha|google\.com\/recaptcha/i,
      datadome: /datadome|dd-.*=|\.datadome\./i,
      'perimeter-x': /perimeterx|px-.*=/i,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(html)) {
        return {
          hasAntiBot: true,
          type: type as any,
          confidence: 0.9,
        };
      }
    }

    // Vérifier les signes génériques
    const genericSigns = [
      /please verify you are a human/i,
      /access denied|403 forbidden/i,
      /unusual traffic/i,
      /security check/i,
    ];

    for (const pattern of genericSigns) {
      if (pattern.test(html)) {
        return {
          hasAntiBot: true,
          type: 'unknown',
          confidence: 0.7,
        };
      }
    }

    return { hasAntiBot: false, confidence: 0.9 };
  }

  /**
   * Générer des cookies de session réalistes
   */
  generateSessionCookies(): Record<string, string> {
    const sessionId = this.generateRandomId(32);
    const timestamp = Date.now();

    return {
      'session_id': sessionId,
      '_ga': `GA1.2.${randomInt(1000000000)}.${timestamp}`,
      '_gid': `GA1.2.${randomInt(1000000000)}.${timestamp}`,
      '_fbp': `fb.1.${timestamp}.${randomInt(1000000000)}`,
    };
  }

  /**
   * Générer un ID aléatoire
   */
  private generateRandomId(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[randomInt(chars.length)];
    }
    return result;
  }

  /**
   * Configurer Puppeteer pour éviter la détection
   */
  getPuppeteerStealthConfig() {
    return {
      // Cacher l'automatisation
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ],
      // Headers réalistes
      userAgent: this.getRandomUserAgent('desktop'),
      // Viewport réaliste
      viewport: {
        width: 1920 + randomInt(-100, 100),
        height: 1080 + randomInt(-100, 100),
        deviceScaleFactor: 1,
        hasTouch: false,
        isLandscape: true,
        isMobile: false,
      },
    };
  }

  /**
   * Scripts à injecter dans Puppeteer pour masquer l'automatisation
   */
  getPuppeteerStealthScripts(): string[] {
    return [
      // Cacher webdriver
      `Object.defineProperty(navigator, 'webdriver', { get: () => false });`,

      // Cacher automation
      `window.navigator.chrome = { runtime: {} };`,

      // Permissions réalistes
      `Object.defineProperty(navigator, 'permissions', {
        get: () => ({
          query: () => Promise.resolve({ state: 'granted' })
        })
      });`,

      // Plugins réalistes
      `Object.defineProperty(navigator, 'plugins', {
        get: () => [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ]
      });`,

      // Languages réalistes
      `Object.defineProperty(navigator, 'languages', {
        get: () => ['fr-FR', 'fr', 'en-US', 'en']
      });`,
    ];
  }
}
