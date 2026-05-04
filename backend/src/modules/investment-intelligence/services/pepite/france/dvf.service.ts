import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface DvfMutation {
  id: string;
  date: string;
  commune: string;
  codePostal: string;
  adresse: string;
  type: string;
  surface: number | null;
  prixTotal: number;
  prixM2: number | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Service DVF — Demandes de Valeurs Foncières (France)
 * Source: https://api.gouv.fr/les-api/api_dvf (data.gouv.fr)
 * Permet de récupérer les transactions immobilières réelles pour calculer
 * le prix de marché et détecter des biens sous-évalués
 */
@Injectable()
export class DvfService {
  private readonly logger = new Logger(DvfService.name);
  private readonly apiUrl = 'https://api.gouv.fr/api/dvf';
  // API officielle app.dvf.etalab.gouv.fr
  private readonly etalabUrl = 'https://api.dvf.etalab.gouv.fr/geoapi';

  async getMutationsByLocation(lat: number, lng: number, radiusKm = 2): Promise<DvfMutation[]> {
    try {
      this.logger.log(`DVF query: lat=${lat}, lng=${lng}, radius=${radiusKm}km`);

      const res = await axios.get(`${this.etalabUrl}/mutations`, {
        params: {
          lat,
          lon: lng,
          dist: radiusKm * 1000, // mètres
          fields: 'id_mutation,date_mutation,nom_commune,code_postal,adresse_numero,adresse_nom_voie,type_local,surface_reelle_bati,surface_terrain,valeur_fonciere',
          page_size: 50,
        },
        timeout: 10000,
      });

      return this.parseMutations(res.data?.features ?? []);
    } catch (err: any) {
      this.logger.warn(`DVF API échouée: ${err.message}`);
      return [];
    }
  }

  async getAveragePriceM2(codePostal: string): Promise<number | null> {
    try {
      const res = await axios.get(`${this.etalabUrl}/mutations`, {
        params: {
          code_postal: codePostal,
          type_local: 'Terrain',
          page_size: 100,
        },
        timeout: 10000,
      });

      const features = res.data?.features ?? [];
      const prices = features
        .map((f: any) => {
          const p = f.properties;
          const surface = p.surface_terrain || p.surface_reelle_bati;
          return surface > 0 ? p.valeur_fonciere / surface : null;
        })
        .filter((p: number | null): p is number => p !== null && p > 0);

      if (prices.length === 0) return null;
      return Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length);
    } catch {
      return null;
    }
  }

  private parseMutations(features: any[]): DvfMutation[] {
    return features.map((f) => {
      const p = f.properties;
      const surface = p.surface_terrain || p.surface_reelle_bati || null;
      const prix = p.valeur_fonciere || 0;

      return {
        id: p.id_mutation,
        date: p.date_mutation,
        commune: p.nom_commune,
        codePostal: p.code_postal,
        adresse: `${p.adresse_numero || ''} ${p.adresse_nom_voie || ''}`.trim(),
        type: p.type_local || 'Terrain',
        surface,
        prixTotal: prix,
        prixM2: surface && surface > 0 ? Math.round(prix / surface) : null,
        lat: f.geometry?.coordinates?.[1] ?? null,
        lng: f.geometry?.coordinates?.[0] ?? null,
      };
    });
  }
}
