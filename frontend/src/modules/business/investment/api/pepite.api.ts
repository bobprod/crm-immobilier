import { apiClient } from '@/shared/utils/backend-api';

export interface PepiteOpportunity {
  id: string;
  title: string;
  source: string;
  country: string;
  location: string;
  surface: string | null;
  prix: string | null;
  score: number;
  scoreLabel: 'PÉPITE' | 'BONNE' | 'NORMALE' | 'FAIBLE';
  scoreDetails: { critere: string; points: number; max: number; ok: boolean }[];
  vocation: string | null;
  isUrbain: boolean;
  risques: string[];
  url: string;
  type: string;
  createdAt: string;
}

export interface PepiteScanResult {
  country: string;
  sources: string[];
  opportunities: PepiteOpportunity[];
  totalScanned: number;
  pepiteCount: number;
  scanDate: string;
}

export interface PepiteSource {
  id: string;
  label: string;
}

export interface PepiteSourcesResult {
  country: string;
  sources: PepiteSource[];
  availableCountries: string[];
}

const BASE = '/investment-intelligence/pepite';

export const pepiteApi = {
  getSources: async (country: string): Promise<PepiteSourcesResult> => {
    const res = await apiClient.get(`${BASE}/sources`, { params: { country } });
    return res.data;
  },

  scan: async (
    country: string,
    opts?: { lat?: number; lng?: number; keywords?: string; urls?: string },
  ): Promise<PepiteScanResult> => {
    const params: Record<string, any> = { country, ...opts };
    const res = await apiClient.get(`${BASE}/scan`, { params, timeout: 30000 });
    return res.data;
  },

  zoneCheck: async (lat: number, lng: number, country: string): Promise<Record<string, any>> => {
    const res = await apiClient.post(`${BASE}/zone-check`, { lat, lng, country });
    return res.data;
  },

  analyzePrompt: async (prompt: string, country: string): Promise<{ keywords: string[]; location: string | null; maxBudget: string | null; type: string | null }> => {
    const res = await apiClient.post(`${BASE}/analyze-prompt`, { prompt, country });
    return res.data;
  },

  addToCrm: async (opportunity: {
    title: string;
    prix: string | null;
    surface: string | null;
    location: string;
    url: string;
    country: string;
  }): Promise<{ success: boolean; property: any }> => {
    const res = await apiClient.post(`${BASE}/add-to-crm`, opportunity);
    return res.data;
  },
};
