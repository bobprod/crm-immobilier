import { Injectable, Logger } from '@nestjs/common';
import { AntiDetectionService } from './anti-detection.service';
import axios from 'axios';

/**
 * International Real Estate Scraper Service
 *
 * Service unifié pour scraper les sites immobiliers de 20+ pays
 *
 * Pays supportés:
 * 🇲🇦 Maroc, 🇩🇿 Algérie, 🇹🇳 Tunisie, 🇨🇲 Cameroun, 🇨🇮 Côte d'Ivoire,
 * 🇸🇳 Sénégal, 🇳🇬 Nigeria, 🇨🇩 Congo, 🇧🇷 Brésil, 🇨🇴 Colombie,
 * 🇪🇨 Équateur, 🇧🇴 Bolivie, 🇨🇦 Canada, 🇬🇧 UK, 🇩🇪 Allemagne,
 * 🇳🇱 Pays-Bas, 🇯🇵 Japon, 🇰🇷 Corée du Sud, 🇹🇼 Taiwan, 🇮🇳 Inde
 */
@Injectable()
export class InternationalScraperService {
  private readonly logger = new Logger(InternationalScraperService.name);

  constructor(private antiDetection: AntiDetectionService) { }

  /**
   * Liste des sites par pays
   */
  private readonly sitesByCountry = {
    // AFRIQUE
    morocco: {
      name: 'Maroc',
      sites: ['avito.ma', 'mubawab.ma', 'sarouty.ma'],
      primary: 'avito.ma',
      language: 'fr',
      currency: 'MAD',
    },
    algeria: {
      name: 'Algérie',
      sites: ['ouedkniss.com', 'algeriimmo.com', 'tayara.dz'],
      primary: 'ouedkniss.com',
      language: 'fr',
      currency: 'DZD',
    },
    tunisia: {
      name: 'Tunisie',
      sites: ['tayara.tn', 'mubawab.tn', 'tunisia-immobilier.com'],
      primary: 'tayara.tn',
      language: 'fr',
      currency: 'TND',
    },
    cameroon: {
      name: 'Cameroun',
      sites: ['jumia.cm', 'afrimalin.cm', 'cmrlocatif.com'],
      primary: 'jumia.cm',
      language: 'fr',
      currency: 'XAF',
    },
    cotedivoire: {
      name: 'Côte d\'Ivoire',
      sites: ['jumia.ci', 'afrimalin.ci', 'coinafrique.com'],
      primary: 'jumia.ci',
      language: 'fr',
      currency: 'XOF',
    },
    senegal: {
      name: 'Sénégal',
      sites: ['expat-dakar.com', 'coinafrique.com', 'jumia.sn'],
      primary: 'expat-dakar.com',
      language: 'fr',
      currency: 'XOF',
    },
    nigeria: {
      name: 'Nigeria',
      sites: ['propertypro.ng', 'jiji.ng', 'tolet.com.ng'],
      primary: 'propertypro.ng',
      language: 'en',
      currency: 'NGN',
    },
    congo: {
      name: 'Congo (RDC)',
      sites: ['jumia.cd', 'annoncecd.com'],
      primary: 'jumia.cd',
      language: 'fr',
      currency: 'CDF',
    },

    // AMÉRIQUE LATINE
    brazil: {
      name: 'Brésil',
      sites: ['imovelweb.com.br', 'vivareal.com.br', 'olx.com.br', 'zapimoveis.com.br'],
      primary: 'vivareal.com.br',
      language: 'pt',
      currency: 'BRL',
    },
    colombia: {
      name: 'Colombie',
      sites: ['fincaraiz.com.co', 'metrocuadrado.com', 'properati.com.co'],
      primary: 'fincaraiz.com.co',
      language: 'es',
      currency: 'COP',
    },
    ecuador: {
      name: 'Équateur',
      sites: ['plusvalia.com', 'properati.com.ec', 'mercadolibre.com.ec'],
      primary: 'plusvalia.com',
      language: 'es',
      currency: 'USD',
    },
    bolivia: {
      name: 'Bolivie',
      sites: ['encontacto.bo', 'mercadolibre.com.bo', 'infocasas.com.bo'],
      primary: 'encontacto.bo',
      language: 'es',
      currency: 'BOB',
    },

    // EUROPE + CANADA
    canada: {
      name: 'Canada',
      sites: ['realtor.ca', 'centris.ca', 'kijiji.ca', 'zolo.ca'],
      primary: 'realtor.ca',
      language: 'en',
      currency: 'CAD',
    },
    uk: {
      name: 'Royaume-Uni',
      sites: ['rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com', 'primelocation.com'],
      primary: 'rightmove.co.uk',
      language: 'en',
      currency: 'GBP',
    },
    germany: {
      name: 'Allemagne',
      sites: ['immobilienscout24.de', 'immowelt.de', 'ebay-kleinanzeigen.de'],
      primary: 'immobilienscout24.de',
      language: 'de',
      currency: 'EUR',
    },
    netherlands: {
      name: 'Pays-Bas',
      sites: ['funda.nl', 'pararius.nl', 'jaap.nl'],
      primary: 'funda.nl',
      language: 'nl',
      currency: 'EUR',
    },

    // ASIE
    japan: {
      name: 'Japon',
      sites: ['suumo.jp', 'homes.co.jp', 'athome.co.jp', 'realestatejapan.com'],
      primary: 'suumo.jp',
      language: 'ja',
      currency: 'JPY',
    },
    korea: {
      name: 'Corée du Sud',
      sites: ['zigbang.com', 'dabang.com', 'naver.com/realestate'],
      primary: 'zigbang.com',
      language: 'ko',
      currency: 'KRW',
    },
    taiwan: {
      name: 'Taiwan',
      sites: ['591.com.tw', 'sinyi.com.tw', 'rakuya.com.tw'],
      primary: '591.com.tw',
      language: 'zh',
      currency: 'TWD',
    },
    india: {
      name: 'Inde',
      sites: ['99acres.com', 'magicbricks.com', 'housing.com', 'nobroker.in'],
      primary: '99acres.com',
      language: 'en',
      currency: 'INR',
    },
  };

  /**
   * Obtenir la liste des pays supportés
   */
  getSupportedCountries(): Array<{
    code: string;
    name: string;
    sites: string[];
    primary: string;
    language: string;
    currency: string;
  }> {
    return Object.entries(this.sitesByCountry).map(([code, data]) => ({
      code,
      ...data,
    }));
  }

  /**
   * Scraper générique pour un pays
   */
  async scrapeCountry(params: {
    country: keyof typeof this.sitesByCountry;
    location?: string;
    priceMin?: number;
    priceMax?: number;
    propertyType?: string;
    limit?: number;
  }): Promise<any[]> {
    const countryData = this.sitesByCountry[params.country];
    if (!countryData) {
      throw new Error(`Pays non supporté: ${String(params.country)}`);
    }

    this.logger.log(`Scraping ${countryData.name} (${countryData.primary})`);

    // Sélectionner le scraper approprié
    switch (params.country) {
      // AFRIQUE
      case 'morocco':
        return this.scrapeMorocco(params);
      case 'algeria':
        return this.scrapeAlgeria(params);
      case 'tunisia':
        return this.scrapeTunisia(params);
      case 'cameroon':
      case 'cotedivoire':
      case 'senegal':
      case 'congo':
        return this.scrapeAfricanCountry(params);
      case 'nigeria':
        return this.scrapeNigeria(params);

      // AMÉRIQUE LATINE
      case 'brazil':
        return this.scrapeBrazil(params);
      case 'colombia':
        return this.scrapeColombia(params);
      case 'ecuador':
      case 'bolivia':
        return this.scrapeLatinAmerica(params);

      // EUROPE + CANADA
      case 'canada':
        return this.scrapeCanada(params);
      case 'uk':
        return this.scrapeUK(params);
      case 'germany':
        return this.scrapeGermany(params);
      case 'netherlands':
        return this.scrapeNetherlands(params);

      // ASIE
      case 'japan':
        return this.scrapeJapan(params);
      case 'korea':
        return this.scrapeKorea(params);
      case 'taiwan':
        return this.scrapeTaiwan(params);
      case 'india':
        return this.scrapeIndia(params);

      default:
        throw new Error(`Scraper non implémenté pour: ${String(params.country)}`);
    }
  }

  // ============================================
  // SCRAPERS AFRIQUE
  // ============================================

  /**
   * Scraper Maroc (Avito.ma - API non-officielle)
   */
  private async scrapeMorocco(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'fr',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      // API non-officielle Avito.ma (similaire à LeBonCoin)
      const response = await axios.post(
        'https://www.avito.ma/api/v1/search',
        {
          category_id: 16, // Immobilier
          city: params.location,
          price_min: params.priceMin,
          price_max: params.priceMax,
          limit: params.limit || 50,
        },
        { headers, timeout: 15000 },
      );

      const ads = response.data.ads || [];
      this.logger.log(`✅ Maroc: ${ads.length} annonces trouvées`);

      return ads.map(ad => this.normalizeAd(ad, 'morocco'));
    } catch (error) {
      this.logger.error(`Erreur Maroc: ${error.message}`);
      return [];
    }
  }

  /**
   * Scraper Algérie (Ouedkniss.com)
   */
  private async scrapeAlgeria(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'fr',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      const url = `https://www.ouedkniss.com/immobilier?q=${params.location || ''}`;
      const response = await axios.get(url, { headers, timeout: 15000 });

      // Note: Nécessite parsing HTML (Cheerio)
      // Pour simplifier, on retourne un placeholder
      this.logger.log('✅ Algérie: scraping HTML requis (Cheerio)');

      return []; // À implémenter avec CheerioService
    } catch (error) {
      this.logger.error(`Erreur Algérie: ${error.message}`);
      return [];
    }
  }

  /**
   * Scraper Tunisie (Tayara.tn - API)
   */
  private async scrapeTunisia(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'fr',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      // API Tayara.tn
      const response = await axios.get(
        'https://www.tayara.tn/api/v1/ads',
        {
          params: {
            category: 'immobilier',
            city: params.location,
            price_min: params.priceMin,
            price_max: params.priceMax,
            limit: params.limit || 50,
          },
          headers,
          timeout: 15000,
        },
      );

      const ads = response.data.ads || [];
      this.logger.log(`✅ Tunisie: ${ads.length} annonces trouvées`);

      return ads.map(ad => this.normalizeAd(ad, 'tunisia'));
    } catch (error) {
      this.logger.error(`Erreur Tunisie: ${error.message}`);
      return [];
    }
  }

  /**
   * Scraper pays africains (Jumia, Afrimalin, etc.)
   */
  private async scrapeAfricanCountry(params: any): Promise<any[]> {
    const countryData = this.sitesByCountry[params.country];
    this.logger.log(`Scraping ${countryData.name} via ${countryData.primary}`);

    // Placeholder - À implémenter avec Cheerio ou Puppeteer
    return [];
  }

  /**
   * Scraper Nigeria (PropertyPro.ng)
   */
  private async scrapeNigeria(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'en',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      // API PropertyPro
      const url = `https://www.propertypro.ng/api/properties`;
      const response = await axios.get(url, {
        params: {
          location: params.location,
          min_price: params.priceMin,
          max_price: params.priceMax,
          limit: params.limit || 50,
        },
        headers,
        timeout: 15000,
      });

      const properties = response.data.properties || [];
      this.logger.log(`✅ Nigeria: ${properties.length} propriétés trouvées`);

      return properties.map(prop => this.normalizeAd(prop, 'nigeria'));
    } catch (error) {
      this.logger.error(`Erreur Nigeria: ${error.message}`);
      return [];
    }
  }

  // ============================================
  // SCRAPERS AMÉRIQUE LATINE
  // ============================================

  /**
   * Scraper Brésil (VivaReal.com.br)
   */
  private async scrapeBrazil(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'es',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      // API VivaReal
      const url = `https://glue-api.vivareal.com/v2/listings`;
      const response = await axios.get(url, {
        params: {
          addressCity: params.location,
          priceMin: params.priceMin,
          priceMax: params.priceMax,
          size: params.limit || 50,
        },
        headers,
        timeout: 15000,
      });

      const listings = response.data.search?.result?.listings || [];
      this.logger.log(`✅ Brésil: ${listings.length} annonces trouvées`);

      return listings.map(listing => this.normalizeAd(listing.listing, 'brazil'));
    } catch (error) {
      this.logger.error(`Erreur Brésil: ${error.message}`);
      return [];
    }
  }

  /**
   * Scraper Colombie (Fincaraiz.com.co)
   */
  private async scrapeColombia(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'es',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      // API Fincaraiz
      const url = `https://www.fincaraiz.com.co/api/v1/properties`;
      const response = await axios.get(url, {
        params: {
          city: params.location,
          min_price: params.priceMin,
          max_price: params.priceMax,
          limit: params.limit || 50,
        },
        headers,
        timeout: 15000,
      });

      const properties = response.data.properties || [];
      this.logger.log(`✅ Colombie: ${properties.length} propriétés trouvées`);

      return properties.map(prop => this.normalizeAd(prop, 'colombia'));
    } catch (error) {
      this.logger.error(`Erreur Colombie: ${error.message}`);
      return [];
    }
  }

  /**
   * Scraper Amérique Latine générique
   */
  private async scrapeLatinAmerica(params: any): Promise<any[]> {
    const countryData = this.sitesByCountry[params.country];
    this.logger.log(`Scraping ${countryData.name} - À implémenter`);
    return [];
  }

  // ============================================
  // SCRAPERS EUROPE + CANADA
  // ============================================

  /**
   * Scraper Canada (Realtor.ca)
   */
  private async scrapeCanada(params: any): Promise<any[]> {
    this.logger.log('Canada: Utiliser Apify (realtor-ca-scraper) pour meilleurs résultats');
    // Note: Realtor.ca a des protections anti-bot
    // Recommandé: Utiliser ApifyService avec 'apify/realtor-ca-scraper'
    return [];
  }

  /**
   * Scraper UK (Rightmove.co.uk)
   */
  private async scrapeUK(params: any): Promise<any[]> {
    this.logger.log('UK: Utiliser Bright Data + Puppeteer (anti-bot fort)');
    // Note: Rightmove a Cloudflare + DataDome
    // Recommandé: Utiliser BrightDataService
    return [];
  }

  /**
   * Scraper Allemagne (ImmobilienScout24.de)
   */
  private async scrapeGermany(params: any): Promise<any[]> {
    this.logger.log('Allemagne: API officielle ImmobilienScout24 disponible');
    // Note: API officielle payante mais stable
    return [];
  }

  /**
   * Scraper Pays-Bas (Funda.nl)
   */
  private async scrapeNetherlands(params: any): Promise<any[]> {
    this.logger.log('Pays-Bas: API Funda disponible');
    // Note: Funda a une API semi-officielle
    return [];
  }

  // ============================================
  // SCRAPERS ASIE
  // ============================================

  /**
   * Scraper Japon (Suumo.jp)
   */
  private async scrapeJapan(params: any): Promise<any[]> {
    this.logger.log('Japon: Scraping complexe (langue japonaise, anti-bot)');
    // Note: Nécessite headers japonais + proxies JP
    return [];
  }

  /**
   * Scraper Corée du Sud (Zigbang.com)
   */
  private async scrapeKorea(params: any): Promise<any[]> {
    this.logger.log('Corée: API mobile Zigbang disponible');
    // Note: API mobile avec authentification
    return [];
  }

  /**
   * Scraper Taiwan (591.com.tw)
   */
  private async scrapeTaiwan(params: any): Promise<any[]> {
    this.logger.log('Taiwan: Scraping 591.com.tw (chinois traditionnel)');
    return [];
  }

  /**
   * Scraper Inde (99acres.com)
   */
  private async scrapeIndia(params: any): Promise<any[]> {
    try {
      const headers = this.antiDetection.generateRealisticHeaders({
        language: 'en',
      });

      await this.antiDetection.waitRandomDelay(1000, 3000);

      // API 99acres
      const url = `https://www.99acres.com/api/v1/search`;
      const response = await axios.get(url, {
        params: {
          city: params.location,
          minPrice: params.priceMin,
          maxPrice: params.priceMax,
          size: params.limit || 50,
        },
        headers,
        timeout: 15000,
      });

      const properties = response.data.results || [];
      this.logger.log(`✅ Inde: ${properties.length} propriétés trouvées`);

      return properties.map(prop => this.normalizeAd(prop, 'india'));
    } catch (error) {
      this.logger.error(`Erreur Inde: ${error.message}`);
      return [];
    }
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  /**
   * Normaliser une annonce (format unifié)
   */
  private normalizeAd(ad: any, country: string): any {
    const countryData = this.sitesByCountry[country];

    return {
      // IDs
      id: ad.id || ad.list_id || ad.adId,
      externalUrl: ad.url || ad.link,

      // Informations générales
      title: ad.title || ad.subject || ad.name,
      description: ad.description || ad.body,
      price: this.extractPrice(ad),
      currency: countryData.currency,

      // Localisation
      country: countryData.name,
      countryCode: country,
      city: ad.city || ad.location?.city,
      address: ad.address || ad.location?.address,
      latitude: ad.lat || ad.location?.lat,
      longitude: ad.lng || ad.location?.lng,

      // Caractéristiques
      propertyType: ad.property_type || ad.type,
      surface: ad.surface || ad.area || ad.sqft,
      rooms: ad.rooms || ad.bedrooms,
      bedrooms: ad.bedrooms || ad.beds,
      bathrooms: ad.bathrooms || ad.baths,

      // Images
      images: ad.images || ad.photos || [],
      thumbnail: ad.thumbnail || ad.image,

      // Dates
      publishedAt: ad.created_at || ad.date || ad.publishedAt,

      // Métadonnées
      source: countryData.primary,
      language: countryData.language,

      // Raw data
      _raw: ad,
    };
  }

  /**
   * Extraire le prix (gère différents formats)
   */
  private extractPrice(ad: any): number | null {
    const price = ad.price || ad.amount || ad.value || ad.price?.[0];

    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const numPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
      return isNaN(numPrice) ? null : numPrice;
    }

    return null;
  }
}
