/**
 * Utilitaires de matching partagés entre les modules prospecting et intelligence
 * Scoring pondéré: Budget (40) + Location (30) + Type (20) + Bonus (10) = 100 max
 */

import {
  MatchReason,
  BudgetMatchReason,
  LocationMatchReason,
  TypeMatchReason,
  MetaMatchReason,
  BudgetRelation,
  LocationRelation,
  TypeRelation,
} from '../../modules/prospecting/dto/matching.dto';

// ============================================
// PROPERTY TYPE COMPATIBILITY MAPPING
// ============================================

export const COMPATIBLE_PROPERTY_TYPES: Record<string, string[]> = {
  appartement: ['appartement', 'studio', 'duplex', 'triplex', 'penthouse', 'apartment'],
  studio: ['studio', 'appartement', 'apartment'],
  maison: ['maison', 'villa', 'etage de villa', 'house'],
  villa: ['villa', 'maison', 'etage de villa'],
  terrain: ['terrain', 'parcelle', 'land'],
  bureau: ['bureau', 'local commercial', 'office', 'commercial'],
  local: ['local commercial', 'bureau', 'magasin', 'commercial'],
  immeuble: ['immeuble', 'building'],
  ferme: ['ferme', 'terrain agricole', 'farm'],
  // English mappings
  house: ['house', 'villa', 'maison'],
  apartment: ['apartment', 'appartement', 'studio', 'flat'],
  land: ['land', 'terrain', 'parcelle'],
  commercial: ['commercial', 'bureau', 'local', 'office'],
};

// ============================================
// SCORING WEIGHTS
// ============================================

export const MATCH_WEIGHTS = {
  BUDGET_MAX: 40,
  LOCATION_MAX: 30,
  TYPE_MAX: 20,
  BONUS_MAX: 10,
  QUALIFICATION_THRESHOLD: 50,
};

// ============================================
// BUDGET SCORE CALCULATION
// ============================================

export function calculateBudgetScore(
  budgetMin: number | null,
  budgetMax: number | null,
  propertyPrice: number | null,
): BudgetMatchReason {
  const result: BudgetMatchReason = {
    compatible: false,
    relation: 'no_budget',
    leadMin: budgetMin,
    leadMax: budgetMax,
    propertyPrice: propertyPrice || 0,
    score: 0,
  };

  if (!propertyPrice || propertyPrice <= 0) {
    return result;
  }

  // Pas de budget défini
  if (!budgetMin && !budgetMax) {
    result.relation = 'no_budget';
    return result;
  }

  const price = propertyPrice;

  // Cas avec les deux bornes
  if (budgetMin && budgetMax) {
    if (price >= budgetMin && price <= budgetMax) {
      result.compatible = true;
      result.relation = 'within_range';
      result.score = MATCH_WEIGHTS.BUDGET_MAX; // 40 points
    } else if (price >= budgetMin * 0.9 && price <= budgetMax * 1.1) {
      result.compatible = true;
      result.relation = price < budgetMin ? 'below_range' : 'above_range';
      result.score = 30;
    } else if (price >= budgetMin * 0.8 && price <= budgetMax * 1.2) {
      result.compatible = true;
      result.relation = price < budgetMin ? 'below_range' : 'above_range';
      result.score = 20;
    }
    return result;
  }

  // Cas avec seulement min
  if (budgetMin && !budgetMax) {
    if (price >= budgetMin && price <= budgetMin * 1.3) {
      result.compatible = true;
      result.relation = 'within_range';
      result.score = MATCH_WEIGHTS.BUDGET_MAX;
    } else if (price >= budgetMin * 0.9 && price <= budgetMin * 1.5) {
      result.compatible = true;
      result.relation = price < budgetMin ? 'below_range' : 'above_range';
      result.score = 25;
    }
    return result;
  }

  // Cas avec seulement max
  if (!budgetMin && budgetMax) {
    if (price <= budgetMax) {
      result.compatible = true;
      result.relation = 'within_range';
      result.score = MATCH_WEIGHTS.BUDGET_MAX;
    } else if (price <= budgetMax * 1.1) {
      result.compatible = true;
      result.relation = 'above_range';
      result.score = 30;
    } else if (price <= budgetMax * 1.2) {
      result.compatible = true;
      result.relation = 'above_range';
      result.score = 20;
    }
    return result;
  }

  return result;
}

// ============================================
// LOCATION SCORE CALCULATION
// ============================================

export function calculateLocationScore(
  leadCity: string | null,
  leadCountry: string | null,
  propertyCity: string | null,
  propertyCountry?: string | null,
): LocationMatchReason {
  const result: LocationMatchReason = {
    compatible: false,
    relation: 'unknown',
    leadCity,
    leadCountry,
    propertyCity,
    score: 0,
  };

  if (!leadCity && !leadCountry) {
    result.relation = 'unknown';
    result.score = 10; // Bonus partiel si pas de préférence
    return result;
  }

  if (!propertyCity) {
    result.relation = 'unknown';
    return result;
  }

  const normalizedLeadCity = leadCity?.toLowerCase().trim() || '';
  const normalizedPropertyCity = propertyCity.toLowerCase().trim();

  // Match exact de ville
  if (normalizedLeadCity && normalizedLeadCity === normalizedPropertyCity) {
    result.compatible = true;
    result.relation = 'same_city';
    result.score = MATCH_WEIGHTS.LOCATION_MAX; // 30 points
    return result;
  }

  // Match partiel (contient)
  if (
    normalizedLeadCity &&
    (normalizedPropertyCity.includes(normalizedLeadCity) ||
      normalizedLeadCity.includes(normalizedPropertyCity))
  ) {
    result.compatible = true;
    result.relation = 'same_city';
    result.score = 25;
    return result;
  }

  // Match pays
  const leadCtry = (leadCountry || 'tunisie').toLowerCase().trim();
  const propCtry = (propertyCountry || 'tunisie').toLowerCase().trim();

  if (leadCtry === propCtry) {
    result.compatible = true;
    result.relation = 'same_country';
    result.score = 15;
    return result;
  }

  result.relation = 'different';
  return result;
}

// ============================================
// TYPE SCORE CALCULATION
// ============================================

export function calculateTypeScore(
  leadTypes: string[],
  propertyType: string | null,
): TypeMatchReason {
  const result: TypeMatchReason = {
    compatible: false,
    relation: 'unknown',
    leadTypes,
    propertyType: propertyType || '',
    score: 0,
  };

  if (!propertyType) {
    return result;
  }

  // Pas de préférence de type = compatible avec tout
  if (!leadTypes || leadTypes.length === 0) {
    result.compatible = true;
    result.relation = 'unknown';
    result.score = 10; // Bonus partiel
    return result;
  }

  const normalizedPropertyType = propertyType.toLowerCase().trim();
  const normalizedLeadTypes = leadTypes.map((t) => t.toLowerCase().trim());

  // Match exact
  if (normalizedLeadTypes.includes(normalizedPropertyType)) {
    result.compatible = true;
    result.relation = 'exact';
    result.score = MATCH_WEIGHTS.TYPE_MAX; // 20 points
    return result;
  }

  // Match compatible
  const compatibleTypes = COMPATIBLE_PROPERTY_TYPES[normalizedPropertyType] || [];
  const hasCompatible = normalizedLeadTypes.some(
    (leadType) =>
      compatibleTypes.includes(leadType) ||
      (COMPATIBLE_PROPERTY_TYPES[leadType] || []).includes(normalizedPropertyType),
  );

  if (hasCompatible) {
    result.compatible = true;
    result.relation = 'compatible';
    result.score = 15;
    return result;
  }

  result.relation = 'mismatch';
  return result;
}

// ============================================
// META BONUS CALCULATION
// ============================================

export function calculateMetaBonus(
  urgency: string | null,
  seriousnessScore: number | null,
): MetaMatchReason {
  let urgencyBonus = 0;
  let seriousnessBonus = 0;

  // Bonus urgence
  if (urgency) {
    const normalizedUrgency = urgency.toLowerCase();
    if (
      normalizedUrgency === 'haute' ||
      normalizedUrgency === 'high' ||
      normalizedUrgency === 'immediate'
    ) {
      urgencyBonus = 5;
    } else if (normalizedUrgency === 'moyenne' || normalizedUrgency === 'medium') {
      urgencyBonus = 3;
    }
  }

  // Bonus sérieux
  if (seriousnessScore !== null && seriousnessScore !== undefined) {
    if (seriousnessScore >= 80) {
      seriousnessBonus = 5;
    } else if (seriousnessScore >= 60) {
      seriousnessBonus = 3;
    }
  }

  return {
    urgency,
    urgencyBonus,
    seriousnessScore,
    seriousnessBonus,
    totalBonus: Math.min(urgencyBonus + seriousnessBonus, MATCH_WEIGHTS.BONUS_MAX),
  };
}

// ============================================
// FULL MATCH SCORE CALCULATION
// ============================================

export interface MatchInput {
  // Budget
  budgetMin?: number | null;
  budgetMax?: number | null;
  // Location
  city?: string | null;
  country?: string | null;
  // Type
  propertyTypes?: string[];
  // Meta
  urgency?: string | null;
  seriousnessScore?: number | null;
}

export interface PropertyInput {
  price?: number | null;
  city?: string | null;
  country?: string | null;
  type?: string | null;
}

export interface MatchScoreResult {
  score: number;
  reasons: MatchReason;
  isQualified: boolean;
}

export function calculateMatchScore(lead: MatchInput, property: PropertyInput): MatchScoreResult {
  const budgetReason = calculateBudgetScore(
    lead.budgetMin || null,
    lead.budgetMax || null,
    property.price || null,
  );

  const locationReason = calculateLocationScore(
    lead.city || null,
    lead.country || null,
    property.city || null,
    property.country || null,
  );

  const typeReason = calculateTypeScore(lead.propertyTypes || [], property.type || null);

  const metaReason = calculateMetaBonus(lead.urgency || null, lead.seriousnessScore || null);

  const totalScore = Math.min(
    100,
    budgetReason.score + locationReason.score + typeReason.score + metaReason.totalBonus,
  );

  return {
    score: totalScore,
    reasons: {
      budget: budgetReason,
      location: locationReason,
      type: typeReason,
      meta: metaReason,
      breakdown: {
        budgetPoints: budgetReason.score,
        locationPoints: locationReason.score,
        typePoints: typeReason.score,
        bonusPoints: metaReason.totalBonus,
      },
    },
    isQualified: totalScore >= MATCH_WEIGHTS.QUALIFICATION_THRESHOLD,
  };
}

// ============================================
// PRICE RANGE FOR SEARCH (pre-filter)
// ============================================

export interface PriceRange {
  min: number;
  max: number;
}

export function getPriceRangeForSearch(
  budgetMin: number | null,
  budgetMax: number | null,
): PriceRange {
  // Default large range if no budget
  if (!budgetMin && !budgetMax) {
    return { min: 0, max: Number.MAX_SAFE_INTEGER };
  }

  // Expand range by 30% for search
  if (budgetMin && budgetMax) {
    return {
      min: Math.floor(budgetMin * 0.7),
      max: Math.ceil(budgetMax * 1.3),
    };
  }

  if (budgetMin) {
    return {
      min: Math.floor(budgetMin * 0.7),
      max: Math.ceil(budgetMin * 1.5),
    };
  }

  if (budgetMax) {
    return {
      min: Math.floor(budgetMax * 0.5),
      max: Math.ceil(budgetMax * 1.3),
    };
  }

  return { min: 0, max: Number.MAX_SAFE_INTEGER };
}
