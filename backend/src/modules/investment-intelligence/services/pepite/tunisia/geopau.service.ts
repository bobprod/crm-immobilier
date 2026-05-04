import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface PauZoneResult {
  vocation: string;      // UA, UB, UC, zone verte, agricole...
  cos: number | null;    // Coefficient d'Occupation au Sol
  cuf: number | null;    // Coefficient d'Utilisation Foncière
  hauteur: string | null; // R+2, R+3...
  isUrbain: boolean;
  raw: Record<string, any>;
}

/**
 * Service d'interrogation du SIG PAU tunisien (geopau.gov.tn)
 * Utilise l'API REST ArcGIS Server du Ministère de l'Équipement
 */
@Injectable()
export class GeopauService {
  private readonly logger = new Logger(GeopauService.name);

  // Endpoint ArcGIS REST principal — liste complète des services disponibles
  private readonly baseUrl = 'https://geopau.gov.tn/arcgisserver/rest/services';

  // Couche PAU principale (zones d'urbanisme)
  private readonly pausLayer =
    'https://geopau.gov.tn/arcgisserver/rest/services/PAU/PAU_Zones/MapServer/0';

  async queryZoneByCoordinates(lat: number, lng: number): Promise<PauZoneResult | null> {
    try {
      this.logger.log(`Query PAU zone: lat=${lat}, lng=${lng}`);

      const params = new URLSearchParams({
        geometry: JSON.stringify({ x: lng, y: lat }),
        geometryType: 'esriGeometryPoint',
        spatialRel: 'esriSpatialRelIntersects',
        outFields: 'VOCATION,COS,CUF,HAUTEUR,NOM_ZONE',
        returnGeometry: 'false',
        f: 'json',
      });

      const res = await axios.get(`${this.pausLayer}/query?${params}`, {
        timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0 CRM-Immo/1.0' },
      });

      const features = res.data?.features;
      if (!features || features.length === 0) {
        this.logger.warn(`Aucune zone PAU trouvée pour lat=${lat}, lng=${lng}`);
        return null;
      }

      const attrs = features[0].attributes as Record<string, any>;
      const vocation: string = attrs.VOCATION || attrs.NOM_ZONE || 'Inconnu';

      return {
        vocation,
        cos: attrs.COS ? parseFloat(attrs.COS) : null,
        cuf: attrs.CUF ? parseFloat(attrs.CUF) : null,
        hauteur: attrs.HAUTEUR || null,
        isUrbain: /^U[A-C]|urbain/i.test(vocation),
        raw: attrs,
      };
    } catch (err: any) {
      this.logger.error(`Erreur API Geopau: ${err.message}`);
      // Retourner null sans crasher — source externe non critique
      return null;
    }
  }

  async getAvailableServices(): Promise<string[]> {
    try {
      const res = await axios.get(`${this.baseUrl}?f=json`, { timeout: 8000 });
      return (res.data?.services ?? []).map((s: any) => s.name);
    } catch {
      return [];
    }
  }
}
