/**
 * Prospecting Data
 *
 * Données statiques et constantes:
 * - Régions tunisiennes
 * - Taux de conversion
 * - Configurations par défaut
 * - Données de référence
 */

// Geographic data
export {
  TUNISIAN_REGIONS,
  QUARTIERS_TUNIS,
  ALL_ZONES,
  ZONE_STATS,
  type Zone,
} from './tunisian-regions.data';

// Conversion rates & funnel data
export {
  CONVERSION_RATES,
  AVG_STAGE_DURATIONS,
  CONVERSION_STATS,
  STAGE_LABELS,
  STAGE_COLORS,
  calculateFunnelStages,
  calculateStagePercentages,
  calculateTotalValue,
  calculateFunnelMetrics,
  type FunnelStage,
} from './conversion-rates.data';
