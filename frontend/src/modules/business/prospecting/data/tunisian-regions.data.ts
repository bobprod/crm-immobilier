/**
 * Tunisian Geographic Data
 *
 * Données géographiques de la Tunisie pour le ciblage de prospection
 * Extrait de GeographicTargeting.tsx (Phase 1.2)
 */

export interface Zone {
  id: string;
  name: string;
  type: 'city' | 'region' | 'radius' | 'polygon' | 'custom';
  coordinates?: { lat: number; lng: number };
  radius?: number; // en km
  polygon?: { lat: number; lng: number }[];
  population?: number;
  avgPrice?: number;
  selected: boolean;
}

/**
 * Régions et villes principales de Tunisie
 */
export const TUNISIAN_REGIONS: Zone[] = [
  {
    id: 'tunis',
    name: 'Tunis',
    type: 'city',
    coordinates: { lat: 36.8065, lng: 10.1815 },
    population: 1056247,
    avgPrice: 350000,
    selected: false,
  },
  {
    id: 'ariana',
    name: 'Ariana',
    type: 'city',
    coordinates: { lat: 36.8663, lng: 10.1647 },
    population: 576088,
    avgPrice: 280000,
    selected: false,
  },
  {
    id: 'ben-arous',
    name: 'Ben Arous',
    type: 'city',
    coordinates: { lat: 36.7531, lng: 10.2189 },
    population: 631842,
    avgPrice: 220000,
    selected: false,
  },
  {
    id: 'manouba',
    name: 'Manouba',
    type: 'city',
    coordinates: { lat: 36.8101, lng: 10.0863 },
    population: 379518,
    avgPrice: 180000,
    selected: false,
  },
  {
    id: 'la-marsa',
    name: 'La Marsa',
    type: 'city',
    coordinates: { lat: 36.8783, lng: 10.3242 },
    population: 92987,
    avgPrice: 550000,
    selected: false,
  },
  {
    id: 'carthage',
    name: 'Carthage',
    type: 'city',
    coordinates: { lat: 36.8528, lng: 10.3233 },
    population: 21276,
    avgPrice: 650000,
    selected: false,
  },
  {
    id: 'sousse',
    name: 'Sousse',
    type: 'city',
    coordinates: { lat: 35.8288, lng: 10.6405 },
    population: 271428,
    avgPrice: 200000,
    selected: false,
  },
  {
    id: 'sfax',
    name: 'Sfax',
    type: 'city',
    coordinates: { lat: 34.7406, lng: 10.7603 },
    population: 330440,
    avgPrice: 180000,
    selected: false,
  },
  {
    id: 'hammamet',
    name: 'Hammamet',
    type: 'city',
    coordinates: { lat: 36.4, lng: 10.6167 },
    population: 97579,
    avgPrice: 320000,
    selected: false,
  },
  {
    id: 'nabeul',
    name: 'Nabeul',
    type: 'city',
    coordinates: { lat: 36.4561, lng: 10.7376 },
    population: 79628,
    avgPrice: 190000,
    selected: false,
  },
  {
    id: 'bizerte',
    name: 'Bizerte',
    type: 'city',
    coordinates: { lat: 37.2744, lng: 9.8739 },
    population: 142966,
    avgPrice: 150000,
    selected: false,
  },
  {
    id: 'monastir',
    name: 'Monastir',
    type: 'city',
    coordinates: { lat: 35.7643, lng: 10.8113 },
    population: 104535,
    avgPrice: 210000,
    selected: false,
  },
];

/**
 * Quartiers de la ville de Tunis
 */
export const QUARTIERS_TUNIS: Zone[] = [
  {
    id: 'lac1',
    name: 'Les Berges du Lac 1',
    type: 'city',
    coordinates: { lat: 36.835, lng: 10.235 },
    avgPrice: 450000,
    selected: false,
  },
  {
    id: 'lac2',
    name: 'Les Berges du Lac 2',
    type: 'city',
    coordinates: { lat: 36.845, lng: 10.255 },
    avgPrice: 380000,
    selected: false,
  },
  {
    id: 'ennasr',
    name: 'Ennasr',
    type: 'city',
    coordinates: { lat: 36.855, lng: 10.175 },
    avgPrice: 320000,
    selected: false,
  },
  {
    id: 'menzah',
    name: 'El Menzah',
    type: 'city',
    coordinates: { lat: 36.835, lng: 10.145 },
    avgPrice: 280000,
    selected: false,
  },
  {
    id: 'manar',
    name: 'El Manar',
    type: 'city',
    coordinates: { lat: 36.845, lng: 10.135 },
    avgPrice: 300000,
    selected: false,
  },
  {
    id: 'centre-ville',
    name: 'Centre Ville',
    type: 'city',
    coordinates: { lat: 36.8, lng: 10.18 },
    avgPrice: 250000,
    selected: false,
  },
  {
    id: 'bardo',
    name: 'Le Bardo',
    type: 'city',
    coordinates: { lat: 36.8089, lng: 10.1347 },
    avgPrice: 200000,
    selected: false,
  },
  {
    id: 'soukra',
    name: 'La Soukra',
    type: 'city',
    coordinates: { lat: 36.865, lng: 10.195 },
    avgPrice: 350000,
    selected: false,
  },
];

/**
 * Toutes les zones (régions + quartiers)
 */
export const ALL_ZONES: Zone[] = [...TUNISIAN_REGIONS, ...QUARTIERS_TUNIS];

/**
 * Statistiques des zones
 */
export const ZONE_STATS = {
  totalRegions: TUNISIAN_REGIONS.length,
  totalQuartiers: QUARTIERS_TUNIS.length,
  totalZones: ALL_ZONES.length,
  avgPrice: Math.round(
    ALL_ZONES.reduce((sum, zone) => sum + (zone.avgPrice || 0), 0) / ALL_ZONES.length
  ),
  totalPopulation: TUNISIAN_REGIONS.reduce((sum, zone) => sum + (zone.population || 0), 0),
};
