export type PepiteSourceId =
  | 'geopau'
  | 'jort'
  | 'domainetat'
  | 'tayara'
  | 'mubawab'
  | 'dvf'
  | 'georisques'
  | 'leboncoin'
  | 'seloger';

export interface CountrySourceConfig {
  label: string;
  sources: PepiteSourceId[];
  currency: string;
  coordinatesDefault: { lat: number; lng: number };
}

export const COUNTRY_SOURCES: Record<string, CountrySourceConfig> = {
  Tunisie: {
    label: 'Tunisie',
    currency: 'TND',
    coordinatesDefault: { lat: 36.8188, lng: 10.1658 }, // Tunis
    sources: ['geopau', 'jort', 'domainetat', 'tayara', 'mubawab'],
  },
  France: {
    label: 'France',
    currency: 'EUR',
    coordinatesDefault: { lat: 48.8566, lng: 2.3522 }, // Paris
    sources: ['dvf', 'georisques', 'leboncoin', 'seloger'],
  },
  Maroc: {
    label: 'Maroc',
    currency: 'MAD',
    coordinatesDefault: { lat: 33.9716, lng: -6.8498 }, // Rabat
    sources: ['tayara', 'mubawab'],
  },
};

export const SOURCE_LABELS: Record<PepiteSourceId, string> = {
  geopau: 'SIG PAU (ArcGIS)',
  jort: 'JORT',
  domainetat: 'Domaine de l\'État',
  tayara: 'Tayara',
  mubawab: 'Mubawab',
  dvf: 'DVF (data.gouv.fr)',
  georisques: 'Géorisques',
  leboncoin: 'LeBonCoin',
  seloger: 'SeLoger',
};

export function getSourcesForCountry(country: string): PepiteSourceId[] {
  return COUNTRY_SOURCES[country]?.sources ?? COUNTRY_SOURCES['Tunisie'].sources;
}

export function getConfigForCountry(country: string): CountrySourceConfig {
  return COUNTRY_SOURCES[country] ?? COUNTRY_SOURCES['Tunisie'];
}
