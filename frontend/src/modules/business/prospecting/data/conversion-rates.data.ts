/**
 * Conversion Rates & Funnel Data
 *
 * Taux de conversion et données du funnel de prospection
 * Extrait de useAiProspection.ts (Phase 1.2)
 */

/**
 * Taux de conversion par étape du funnel
 */
export const CONVERSION_RATES = {
  /**
   * Taux de leads contactés: 48.9%
   * Leads qui ont été contactés avec succès
   */
  contacted: 0.489,

  /**
   * Taux de leads qualifiés: 25.5%
   * Leads qui répondent aux critères de qualification
   */
  qualified: 0.255,

  /**
   * Taux de conversion finale: 6.4%
   * Leads qui deviennent des clients (signature)
   */
  converted: 0.064,
} as const;

/**
 * Durées moyennes par étape (en heures)
 */
export const AVG_STAGE_DURATIONS = {
  /**
   * Durée initiale: 0h
   * Lead fraîchement créé
   */
  new: 0,

  /**
   * Premier contact: 24h
   * Temps avant le premier contact
   */
  contacted: 24,

  /**
   * Qualification: 72h (3 jours)
   * Temps pour qualifier le lead
   */
  qualified: 72,

  /**
   * Conversion: 288h (12 jours)
   * Temps total pour convertir en client
   */
  converted: 288,

  /**
   * Rejet: 48h (2 jours)
   * Temps avant de rejeter un lead non qualifié
   */
  rejected: 48,
} as const;

/**
 * Statistiques de conversion
 */
export const CONVERSION_STATS = {
  /**
   * Valeur moyenne par conversion: 283,333 TND
   * Revenu moyen généré par un lead converti
   */
  avgConversionValue: 283333,

  /**
   * Temps moyen de conversion: 12 jours
   * Durée moyenne du cycle de vente complet
   */
  avgConversionTime: 12,

  /**
   * Taux de conversion global: 6.4%
   * Pourcentage de leads qui deviennent clients
   */
  globalConversionRate: 6.4,
} as const;

/**
 * Calculer le nombre de leads par étape
 */
export function calculateFunnelStages(totalLeads: number) {
  const contacted = Math.round(totalLeads * CONVERSION_RATES.contacted);
  const qualified = Math.round(totalLeads * CONVERSION_RATES.qualified);
  const converted = Math.round(totalLeads * CONVERSION_RATES.converted);
  const rejected = totalLeads - contacted - qualified - converted;

  return {
    new: totalLeads,
    contacted,
    qualified,
    converted,
    rejected,
  };
}

/**
 * Calculer les pourcentages par étape
 */
export function calculateStagePercentages(totalLeads: number) {
  const stages = calculateFunnelStages(totalLeads);

  return {
    new: 100,
    contacted: (stages.contacted / totalLeads) * 100,
    qualified: (stages.qualified / totalLeads) * 100,
    converted: (stages.converted / totalLeads) * 100,
    rejected: (stages.rejected / totalLeads) * 100,
  };
}

/**
 * Calculer la valeur totale estimée
 */
export function calculateTotalValue(totalLeads: number): number {
  const stages = calculateFunnelStages(totalLeads);
  return stages.converted * CONVERSION_STATS.avgConversionValue;
}

/**
 * Calculer les métriques du funnel
 */
export function calculateFunnelMetrics(totalLeads: number) {
  const stages = calculateFunnelStages(totalLeads);
  const percentages = calculateStagePercentages(totalLeads);
  const totalValue = calculateTotalValue(totalLeads);

  return {
    stages,
    percentages,
    totalValue,
    avgConversionValue: CONVERSION_STATS.avgConversionValue,
    avgConversionTime: CONVERSION_STATS.avgConversionTime,
    conversionRate: CONVERSION_STATS.globalConversionRate,
  };
}

/**
 * Types pour les étapes du funnel
 */
export type FunnelStage = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';

/**
 * Labels français pour les étapes
 */
export const STAGE_LABELS: Record<FunnelStage, string> = {
  new: 'Nouveaux',
  contacted: 'Contactés',
  qualified: 'Qualifiés',
  converted: 'Convertis',
  rejected: 'Rejetés',
};

/**
 * Couleurs pour les étapes du funnel
 */
export const STAGE_COLORS: Record<FunnelStage, string> = {
  new: '#3b82f6', // blue-500
  contacted: '#8b5cf6', // violet-500
  qualified: '#10b981', // green-500
  converted: '#f59e0b', // amber-500
  rejected: '#ef4444', // red-500
};
