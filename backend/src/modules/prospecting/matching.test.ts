/**
 * Test unitaire pour la logique de matching
 * Exécuter avec: npx ts-node src/modules/prospecting/matching.test.ts
 */

import {
  MatchReason,
  MatchScoreResult,
  PriceRange,
  arePropertyTypesCompatible,
} from './dto/matching.dto';

// ============================================
// MOCK DES FONCTIONS DE SCORING
// ============================================

// Copie de la logique de calculateBudgetScore
function calculateBudgetScore(lead: any, property: any): any {
  const propertyPrice = property.price as number;
  const leadMin = lead.budgetMin ?? lead.budget?.min ?? null;
  const leadMax = lead.budgetMax ?? lead.budget?.max ?? null;

  if (!propertyPrice || propertyPrice <= 0) {
    return {
      compatible: false,
      relation: 'no_budget',
      score: 0,
      leadMin,
      leadMax,
      propertyPrice: 0,
    };
  }

  if (leadMin === null && leadMax === null) {
    return {
      compatible: false,
      relation: 'no_budget',
      score: 0,
      leadMin: null,
      leadMax: null,
      propertyPrice,
    };
  }

  if (leadMin !== null && leadMax !== null) {
    if (propertyPrice >= leadMin && propertyPrice <= leadMax) {
      return {
        compatible: true,
        relation: 'within_range',
        score: 40,
        leadMin,
        leadMax,
        propertyPrice,
      };
    }
    if (propertyPrice >= leadMin * 0.9 && propertyPrice <= leadMax * 1.1) {
      return {
        compatible: true,
        relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
        score: 30,
        leadMin,
        leadMax,
        propertyPrice,
      };
    }
    if (propertyPrice >= leadMin * 0.8 && propertyPrice <= leadMax * 1.2) {
      return {
        compatible: true,
        relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
        score: 20,
        leadMin,
        leadMax,
        propertyPrice,
      };
    }
    return {
      compatible: false,
      relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
      score: 0,
      leadMin,
      leadMax,
      propertyPrice,
    };
  }

  const singleBudget = leadMin ?? leadMax!;
  if (Math.abs(propertyPrice - singleBudget) <= singleBudget * 0.1) {
    return {
      compatible: true,
      relation: 'within_range',
      score: 40,
      leadMin,
      leadMax,
      propertyPrice,
    };
  }
  if (Math.abs(propertyPrice - singleBudget) <= singleBudget * 0.2) {
    return {
      compatible: true,
      relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
      score: 30,
      leadMin,
      leadMax,
      propertyPrice,
    };
  }
  if (Math.abs(propertyPrice - singleBudget) <= singleBudget * 0.3) {
    return {
      compatible: true,
      relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
      score: 20,
      leadMin,
      leadMax,
      propertyPrice,
    };
  }
  return {
    compatible: false,
    relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
    score: 0,
    leadMin,
    leadMax,
    propertyPrice,
  };
}

function calculateLocationScore(lead: any, property: any): any {
  const leadCity = lead.city?.toLowerCase().trim() ?? null;
  const leadCountry = lead.country?.toLowerCase().trim() ?? 'tunisie';
  const propertyCity = property.city?.toLowerCase().trim() ?? null;

  if (!leadCity || !propertyCity) {
    return {
      compatible: false,
      relation: 'unknown',
      score: 0,
      leadCity,
      leadCountry,
      propertyCity,
    };
  }

  if (leadCity === propertyCity) {
    return {
      compatible: true,
      relation: 'same_city',
      score: 30,
      leadCity,
      leadCountry,
      propertyCity,
    };
  }

  if (leadCity.includes(propertyCity) || propertyCity.includes(leadCity)) {
    return {
      compatible: true,
      relation: 'same_city',
      score: 25,
      leadCity,
      leadCountry,
      propertyCity,
    };
  }

  if (leadCountry === 'tunisie') {
    return {
      compatible: true,
      relation: 'same_country',
      score: 15,
      leadCity,
      leadCountry,
      propertyCity,
    };
  }

  return {
    compatible: false,
    relation: 'different',
    score: 0,
    leadCity,
    leadCountry,
    propertyCity,
  };
}

function calculateTypeScore(lead: any, property: any): any {
  const propertyType = property.type?.toLowerCase().trim() ?? '';
  let leadTypes: string[] = [];

  if (lead.propertyTypes && Array.isArray(lead.propertyTypes)) {
    leadTypes = lead.propertyTypes.map((t: string) => t.toLowerCase().trim());
  } else if (lead.propertyType) {
    leadTypes = [lead.propertyType.toLowerCase().trim()];
  }

  if (leadTypes.length === 0) {
    return { compatible: true, relation: 'unknown', score: 10, leadTypes: [], propertyType };
  }

  if (!propertyType) {
    return { compatible: false, relation: 'mismatch', score: 0, leadTypes, propertyType: '' };
  }

  if (leadTypes.includes(propertyType)) {
    return { compatible: true, relation: 'exact', score: 20, leadTypes, propertyType };
  }

  for (const leadType of leadTypes) {
    if (arePropertyTypesCompatible(leadType, propertyType)) {
      return { compatible: true, relation: 'compatible', score: 15, leadTypes, propertyType };
    }
  }

  return { compatible: false, relation: 'mismatch', score: 0, leadTypes, propertyType };
}

function calculateMetaBonus(lead: any): any {
  const urgency = lead.urgency ?? null;
  const seriousnessScore = lead.seriousnessScore ?? null;

  let urgencyBonus = 0;
  let seriousnessBonus = 0;

  if (urgency === 'haute') urgencyBonus = 5;
  else if (urgency === 'moyenne') urgencyBonus = 3;

  if (seriousnessScore !== null) {
    if (seriousnessScore >= 80) seriousnessBonus = 5;
    else if (seriousnessScore >= 60) seriousnessBonus = 3;
  }

  const totalBonus = Math.min(10, urgencyBonus + seriousnessBonus);
  return { urgency, urgencyBonus, seriousnessScore, seriousnessBonus, totalBonus };
}

function calculateMatchScore(lead: any, property: any): MatchScoreResult {
  const budgetResult = calculateBudgetScore(lead, property);
  const locationResult = calculateLocationScore(lead, property);
  const typeResult = calculateTypeScore(lead, property);
  const metaResult = calculateMetaBonus(lead);

  const totalScore =
    budgetResult.score + locationResult.score + typeResult.score + metaResult.totalBonus;
  const finalScore = Math.min(100, totalScore);

  return {
    score: finalScore,
    reasons: {
      budget: budgetResult,
      location: locationResult,
      type: typeResult,
      meta: metaResult,
      breakdown: {
        budgetPoints: budgetResult.score,
        locationPoints: locationResult.score,
        typePoints: typeResult.score,
        bonusPoints: metaResult.totalBonus,
      },
    },
    isQualified: finalScore >= 50,
  };
}

function getPriceRangeForSearch(lead: any): PriceRange {
  const budgetMin = lead.budgetMin ?? null;
  const budgetMax = lead.budgetMax ?? null;

  if (budgetMin != null && budgetMax != null) {
    return { min: Math.round(budgetMin * 0.7), max: Math.round(budgetMax * 1.3) };
  }
  if (budgetMin != null) {
    return { min: Math.round(budgetMin * 0.7), max: Math.round(budgetMin * 1.5) };
  }
  if (budgetMax != null) {
    return { min: Math.round(budgetMax * 0.5), max: Math.round(budgetMax * 1.3) };
  }
  return { min: null, max: null };
}

// ============================================
// TESTS
// ============================================

console.log('\\n========================================');
console.log('TESTS DU SYSTEME DE MATCHING');
console.log('========================================\\n');

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   Details: ${details}`);
    failed++;
  }
}

// Test 1: Budget dans la fourchette exacte
console.log('\\n--- Test Budget ---');
{
  const lead = { budgetMin: 200000, budgetMax: 300000 };
  const property = { price: 250000 };
  const result = calculateBudgetScore(lead, property);
  test('Budget dans fourchette exacte = 40 points', result.score === 40, `Score: ${result.score}`);
  test(
    'Relation = within_range',
    result.relation === 'within_range',
    `Relation: ${result.relation}`,
  );
}

// Test 2: Budget légèrement au-dessus (+10%)
{
  const lead = { budgetMin: 200000, budgetMax: 300000 };
  const property = { price: 320000 }; // +6.7% au-dessus de max
  const result = calculateBudgetScore(lead, property);
  test('Budget +10% au-dessus = 30 points', result.score === 30, `Score: ${result.score}`);
}

// Test 3: Budget hors fourchette
{
  const lead = { budgetMin: 200000, budgetMax: 300000 };
  const property = { price: 500000 };
  const result = calculateBudgetScore(lead, property);
  test('Budget hors fourchette = 0 points', result.score === 0, `Score: ${result.score}`);
}

// Test 4: Pas de budget défini
{
  const lead = {};
  const property = { price: 250000 };
  const result = calculateBudgetScore(lead, property);
  test('Pas de budget = 0 points', result.score === 0, `Score: ${result.score}`);
}

// Test 5: Location même ville
console.log('\\n--- Test Location ---');
{
  const lead = { city: 'La Marsa', country: 'Tunisie' };
  const property = { city: 'La Marsa' };
  const result = calculateLocationScore(lead, property);
  test('Même ville = 30 points', result.score === 30, `Score: ${result.score}`);
}

// Test 6: Location ville similaire
{
  const lead = { city: 'La Marsa', country: 'Tunisie' };
  const property = { city: 'Marsa' };
  const result = calculateLocationScore(lead, property);
  test('Ville similaire (contains) = 25 points', result.score === 25, `Score: ${result.score}`);
}

// Test 7: Location même pays, ville différente
{
  const lead = { city: 'La Marsa', country: 'Tunisie' };
  const property = { city: 'Sousse' };
  const result = calculateLocationScore(lead, property);
  test('Même pays, ville différente = 15 points', result.score === 15, `Score: ${result.score}`);
}

// Test 8: Type exact
console.log('\\n--- Test Type de Bien ---');
{
  const lead = { propertyTypes: ['appartement', 'studio'] };
  const property = { type: 'appartement' };
  const result = calculateTypeScore(lead, property);
  test('Type exact = 20 points', result.score === 20, `Score: ${result.score}`);
}

// Test 9: Type compatible
{
  const lead = { propertyTypes: ['appartement'] };
  const property = { type: 'studio' };
  const result = calculateTypeScore(lead, property);
  test(
    'Type compatible (appartement<->studio) = 15 points',
    result.score === 15,
    `Score: ${result.score}`,
  );
}

// Test 10: Type inconnu (pas de préférence)
{
  const lead = {};
  const property = { type: 'villa' };
  const result = calculateTypeScore(lead, property);
  test('Type inconnu = 10 points (pas bloquant)', result.score === 10, `Score: ${result.score}`);
}

// Test 11: Type incompatible
{
  const lead = { propertyTypes: ['appartement'] };
  const property = { type: 'terrain' };
  const result = calculateTypeScore(lead, property);
  test('Type incompatible = 0 points', result.score === 0, `Score: ${result.score}`);
}

// Test 12: Bonus urgence haute
console.log('\\n--- Test Bonus Meta ---');
{
  const lead = { urgency: 'haute', seriousnessScore: 85 };
  const result = calculateMetaBonus(lead);
  test(
    'Urgence haute + Seriousness 85 = 10 points (cap)',
    result.totalBonus === 10,
    `Bonus: ${result.totalBonus}`,
  );
}

// Test 13: Bonus moyen
{
  const lead = { urgency: 'moyenne', seriousnessScore: 65 };
  const result = calculateMetaBonus(lead);
  test(
    'Urgence moyenne + Seriousness 65 = 6 points',
    result.totalBonus === 6,
    `Bonus: ${result.totalBonus}`,
  );
}

// Test 14: Score total - Lead qualifié
console.log('\\n--- Test Score Total ---');
{
  const lead = {
    budgetMin: 200000,
    budgetMax: 350000,
    city: 'Tunis',
    country: 'Tunisie',
    propertyTypes: ['appartement'],
    urgency: 'haute',
    seriousnessScore: 80,
  };
  const property = {
    price: 280000,
    city: 'Tunis',
    type: 'appartement',
  };
  const result = calculateMatchScore(lead, property);
  console.log(
    `   Score total: ${result.score} (Budget: ${result.reasons.breakdown.budgetPoints}, Location: ${result.reasons.breakdown.locationPoints}, Type: ${result.reasons.breakdown.typePoints}, Bonus: ${result.reasons.breakdown.bonusPoints})`,
  );
  test('Lead parfait = 100 points', result.score === 100, `Score: ${result.score}`);
  test('Lead qualifié (score >= 50)', result.isQualified === true);
}

// Test 15: Score total - Lead non qualifié
{
  const lead = {
    budgetMin: 500000,
    budgetMax: 600000,
    city: 'Sfax',
    propertyTypes: ['villa'],
  };
  const property = {
    price: 150000,
    city: 'Tunis',
    type: 'appartement',
  };
  const result = calculateMatchScore(lead, property);
  console.log(
    `   Score total: ${result.score} (Budget: ${result.reasons.breakdown.budgetPoints}, Location: ${result.reasons.breakdown.locationPoints}, Type: ${result.reasons.breakdown.typePoints}, Bonus: ${result.reasons.breakdown.bonusPoints})`,
  );
  test('Lead incompatible < 50 points', result.score < 50, `Score: ${result.score}`);
  test('Lead non qualifié', result.isQualified === false);
}

// Test 16: Price range for search
console.log('\\n--- Test Price Range ---');
{
  const lead = { budgetMin: 200000, budgetMax: 300000 };
  const range = getPriceRangeForSearch(lead);
  test('Price range min = 140000 (200k * 0.7)', range.min === 140000, `Min: ${range.min}`);
  test('Price range max = 390000 (300k * 1.3)', range.max === 390000, `Max: ${range.max}`);
}

// Test 17: arePropertyTypesCompatible
console.log('\\n--- Test Compatible Types ---');
test('appartement compatible avec studio', arePropertyTypesCompatible('appartement', 'studio'));
test('villa compatible avec maison', arePropertyTypesCompatible('villa', 'maison'));
test(
  'appartement NON compatible avec terrain',
  !arePropertyTypesCompatible('appartement', 'terrain'),
);

// Résumé
console.log('\\n========================================');
console.log(`RESULTATS: ${passed} passés, ${failed} échoués`);
console.log('========================================\\n');

if (failed > 0) {
  process.exit(1);
}
