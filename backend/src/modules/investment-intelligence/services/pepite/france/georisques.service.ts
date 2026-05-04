import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface RisqueResult {
  commune: string;
  risques: string[];
  zonagesPPR: string[];
  seismicite: string | null;
  inondation: boolean;
  mouvementTerrain: boolean;
  raw: Record<string, any>;
}

/**
 * Service Géorisques (France)
 * Source: https://georisques.gouv.fr/api/v1/
 * Récupère les risques naturels et technologiques d'un terrain
 * Impact sur le scoring pépite : terrain avec risques = malus
 */
@Injectable()
export class GeorisquesService {
  private readonly logger = new Logger(GeorisquesService.name);
  private readonly baseUrl = 'https://georisques.gouv.fr/api/v1';

  async getRisquesByCoordinates(lat: number, lng: number): Promise<RisqueResult | null> {
    try {
      this.logger.log(`Géorisques query: lat=${lat}, lng=${lng}`);

      const [gasparRes, argiles] = await Promise.allSettled([
        axios.get(`${this.baseUrl}/gaspar/risques`, {
          params: { latlon: `${lat},${lng}`, rayon: 500 },
          timeout: 8000,
        }),
        axios.get(`${this.baseUrl}/argiles`, {
          params: { lon: lng, lat, rayon: 200 },
          timeout: 8000,
        }),
      ]);

      const gaspar = gasparRes.status === 'fulfilled' ? gasparRes.value.data : null;
      const argile = argiles.status === 'fulfilled' ? argiles.value.data : null;

      const risques: string[] = [];
      const zonagesPPR: string[] = [];

      if (gaspar?.data) {
        for (const r of gaspar.data) {
          risques.push(r.libelle_risque_jo || r.code_risque);
          if (r.ppr_existant) zonagesPPR.push(r.libelle_risque_jo);
        }
      }

      return {
        commune: gaspar?.commune || '',
        risques,
        zonagesPPR,
        seismicite: gaspar?.seismicite || null,
        inondation: risques.some((r) => /inondation|crue/i.test(r)),
        mouvementTerrain: risques.some((r) => /mouvement|glissement|éboulement/i.test(r)),
        raw: { gaspar: gaspar?.data ?? [], argile: argile ?? {} },
      };
    } catch (err: any) {
      this.logger.warn(`Géorisques API échouée: ${err.message}`);
      return null;
    }
  }
}
