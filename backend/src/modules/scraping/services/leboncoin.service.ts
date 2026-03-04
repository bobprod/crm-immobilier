import { Injectable, Logger } from '@nestjs/common';
import { AntiDetectionService } from './anti-detection.service';
import axios from 'axios';

/**
 * LeBonCoin Scraper Service
 *
 * Service dédié au scraping de LeBonCoin.fr - le plus grand site
 * d'annonces immobilières en France.
 *
 * Techniques utilisées:
 * - API non-officielle LeBonCoin (plus stable que le scraping HTML)
 * - Anti-détection avancée
 * - Rate limiting intelligent
 * - Extraction structurée des données
 *
 * Note: LeBonCoin a une API non-officielle accessible via :
 * https://api.leboncoin.fr/api/adfinder/v1/search
 */
@Injectable()
export class LeBonCoinService {
  private readonly logger = new Logger(LeBonCoinService.name);
  private readonly apiUrl = 'https://api.leboncoin.fr/api/adfinder/v1/search';
  private readonly apiKey = 'ba0c2dad52b3ec'; // API key publique LBC

  constructor(private antiDetection: AntiDetectionService) {}

  /**
   * Rechercher des annonces immobilières sur LeBonCoin
   */
  async searchProperties(params: {
    location?: string;
    locationType?: 'city' | 'department' | 'region';
    priceMin?: number;
    priceMax?: number;
    propertyType?: 'house' | 'apartment' | 'land' | 'parking';
    rooms?: number;
    surfaceMin?: number;
    surfaceMax?: number;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      this.logger.log(`Recherche LeBonCoin avec params: ${JSON.stringify(params)}`);

      // Préparer le body de la requête
      const searchBody = this.buildSearchBody(params);

      // Headers réalistes
      const headers = this.antiDetection.getSiteSpecificHeaders('leboncoin.fr');

      // Rate limiting
      await this.antiDetection.waitRandomDelay(1000, 3000);

      // Requête API
      const response = await axios.post(this.apiUrl, searchBody, {
        headers,
        timeout: 15000,
      });

      const ads = response.data.ads || [];
      this.logger.log(`✅ ${ads.length} annonces trouvées`);

      // Normaliser les données
      return ads.map(ad => this.normalizeAd(ad));
    } catch (error) {
      this.logger.error(`Erreur LeBonCoin API: ${error.message}`);

      if (error.response?.status === 429) {
        this.logger.warn('Rate limit atteint, attente de 30 secondes...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        throw new Error('Rate limit - réessayez dans 30 secondes');
      }

      throw error;
    }
  }

  /**
   * Construire le body de recherche pour l'API LeBonCoin
   */
  private buildSearchBody(params: any): any {
    const body: any = {
      limit: params.limit || 35,
      offset: params.offset || 0,
      filters: {
        category: { id: '9' }, // Catégorie Immobilier
        enums: {},
        ranges: {},
      },
    };

    // Localisation
    if (params.location) {
      body.filters.location = {
        locations: [
          {
            locationType: params.locationType || 'city',
            label: params.location,
          },
        ],
      };
    }

    // Prix
    if (params.priceMin || params.priceMax) {
      body.filters.ranges.price = {};
      if (params.priceMin) body.filters.ranges.price.min = params.priceMin;
      if (params.priceMax) body.filters.ranges.price.max = params.priceMax;
    }

    // Surface
    if (params.surfaceMin || params.surfaceMax) {
      body.filters.ranges.square = {};
      if (params.surfaceMin) body.filters.ranges.square.min = params.surfaceMin;
      if (params.surfaceMax) body.filters.ranges.square.max = params.surfaceMax;
    }

    // Type de bien
    if (params.propertyType) {
      const propertyTypeMap = {
        house: '1',
        apartment: '2',
        land: '3',
        parking: '4',
      };
      body.filters.enums.real_estate_type = [propertyTypeMap[params.propertyType]];
    }

    // Nombre de pièces
    if (params.rooms) {
      body.filters.ranges.rooms = { min: params.rooms };
    }

    return body;
  }

  /**
   * Normaliser une annonce LeBonCoin
   */
  private normalizeAd(ad: any): any {
    return {
      // IDs
      id: ad.list_id,
      url: ad.url,

      // Informations générales
      title: ad.subject,
      description: ad.body,
      price: ad.price?.[0] || null,
      currency: 'EUR',

      // Localisation
      city: ad.location?.city,
      zipCode: ad.location?.zipcode,
      department: ad.location?.department_id,
      region: ad.location?.region_id,
      latitude: ad.location?.lat,
      longitude: ad.location?.lng,

      // Caractéristiques
      propertyType: this.mapPropertyType(ad.attributes?.real_estate_type),
      surface: ad.attributes?.square,
      rooms: ad.attributes?.rooms,
      bedrooms: ad.attributes?.bedrooms,

      // Images
      images: ad.images?.urls?.map(img => img) || [],
      thumbnail: ad.images?.thumb_url,

      // Dates
      publishedAt: ad.first_publication_date,
      updatedAt: ad.index_date,

      // Contact
      ownerType: ad.owner?.type, // 'pro' ou 'private'
      ownerName: ad.owner?.name,

      // Métadonnées
      source: 'leboncoin',
      adType: ad.ad_type, // 'offer' ou 'seek'

      // Raw data (pour debug)
      _raw: ad,
    };
  }

  /**
   * Mapper le type de bien LeBonCoin vers notre format
   */
  private mapPropertyType(type: string): string {
    const map: Record<string, string> = {
      '1': 'house',
      '2': 'apartment',
      '3': 'land',
      '4': 'parking',
      '5': 'other',
    };
    return map[type] || 'unknown';
  }

  /**
   * Récupérer les détails d'une annonce
   */
  async getAdDetails(adId: string): Promise<any> {
    try {
      this.logger.log(`Récupération détails annonce ${adId}`);

      const headers = this.antiDetection.getSiteSpecificHeaders('leboncoin.fr');

      await this.antiDetection.waitRandomDelay(500, 1500);

      const response = await axios.get(
        `https://api.leboncoin.fr/api/ads/${adId}`,
        {
          headers,
          timeout: 10000,
        },
      );

      return this.normalizeAd(response.data);
    } catch (error) {
      this.logger.error(`Erreur récupération annonce ${adId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extraire le téléphone d'une annonce (nécessite plus de droits)
   */
  async extractPhone(adId: string): Promise<string | null> {
    try {
      // Note: L'extraction du téléphone nécessite souvent une connexion
      // ou des droits spéciaux. Cette méthode est un placeholder.
      this.logger.warn('Extraction téléphone LeBonCoin requiert authentification');
      return null;
    } catch (error) {
      this.logger.error(`Erreur extraction téléphone: ${error.message}`);
      return null;
    }
  }

  /**
   * Rechercher des annonces récentes (dernières 24h)
   */
  async getRecentAds(params?: {
    location?: string;
    priceMax?: number;
    limit?: number;
  }): Promise<any[]> {
    // Calculer la date d'il y a 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const results = await this.searchProperties({
      ...params,
      limit: params?.limit || 100,
    });

    // Filtrer les annonces récentes (publiées dans les dernières 24h)
    const recentAds = results.filter(ad => {
      const publishDate = new Date(ad.publishedAt);
      return publishDate >= yesterday;
    });

    this.logger.log(`${recentAds.length} annonces récentes (24h)`);
    return recentAds;
  }

  /**
   * Obtenir des statistiques de prix pour une zone
   */
  async getPriceStats(params: {
    location: string;
    propertyType?: string;
  }): Promise<{
    average: number;
    median: number;
    min: number;
    max: number;
    count: number;
  }> {
    const ads = await this.searchProperties({
      location: params.location,
      propertyType: params.propertyType as any,
      limit: 200,
    });

    const prices = ads
      .map(ad => ad.price)
      .filter(price => price && price > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) {
      return { average: 0, median: 0, min: 0, max: 0, count: 0 };
    }

    const sum = prices.reduce((a, b) => a + b, 0);
    const average = sum / prices.length;
    const median = prices[Math.floor(prices.length / 2)];

    return {
      average: Math.round(average),
      median,
      min: prices[0],
      max: prices[prices.length - 1],
      count: prices.length,
    };
  }
}
