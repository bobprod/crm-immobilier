/**
 * DTOs pour le système de matching intelligent Lead <-> Property
 * Scoring pondéré: Budget (40) + Location (30) + Type (20) + Bonus (10) = 100 max
 */

// ============================================
// BUDGET MATCHING
// ============================================

export type BudgetRelation = 'below_range' | 'within_range' | 'above_range' | 'no_budget';

export interface BudgetMatchReason {
  compatible: boolean;
  relation: BudgetRelation;
  leadMin: number | null;
  leadMax: number | null;
  propertyPrice: number;
  score: number; // 0-40
}

// ============================================
// LOCATION MATCHING
// ============================================

export type LocationRelation =
  | 'same_city'
  | 'same_region'
  | 'same_country'
  | 'different'
  | 'unknown';

export interface LocationMatchReason {
  compatible: boolean;
  relation: LocationRelation;
  leadCity: string | null;
  leadCountry: string | null;
  propertyCity: string | null;
  score: number; // 0-30
}

// ============================================
// PROPERTY TYPE MATCHING
// ============================================

export type TypeRelation = 'exact' | 'compatible' | 'unknown' | 'mismatch';

export interface TypeMatchReason {
  compatible: boolean;
  relation: TypeRelation;
  leadTypes: string[];
  propertyType: string;
  score: number; // 0-20
}

// ============================================
// META / BONUS
// ============================================

export interface MetaMatchReason {
  urgency: string | null;
  urgencyBonus: number; // 0-5
  seriousnessScore: number | null;
  seriousnessBonus: number; // 0-5
  totalBonus: number; // 0-10 (capped)
}

// ============================================
// FULL MATCH REASON
// ============================================

export interface MatchReason {
  budget: BudgetMatchReason;
  location: LocationMatchReason;
  type: TypeMatchReason;
  meta: MetaMatchReason;
  breakdown: {
    budgetPoints: number;
    locationPoints: number;
    typePoints: number;
    bonusPoints: number;
  };
}

// ============================================
// MATCH SCORE RESULT
// ============================================

export interface MatchScoreResult {
  score: number; // 0-100
  reasons: MatchReason;
  isQualified: boolean; // score >= 50
}

// ============================================
// PRICE RANGE FOR SEARCH
// ============================================

export interface PriceRange {
  min: number | null;
  max: number | null;
}

// ============================================
// COMPATIBLE PROPERTY TYPES
// ============================================

/**
 * Groupes de types de biens compatibles pour le matching flexible
 */
export const COMPATIBLE_PROPERTY_TYPES: Record<string, string[]> = {
  // Résidentiel standard
  appartement: ['appartement', 'studio', 'duplex', 'triplex'],
  studio: ['studio', 'appartement'],
  duplex: ['duplex', 'appartement', 'triplex'],
  triplex: ['triplex', 'duplex', 'appartement'],

  // Maisons
  maison: ['maison', 'villa', 'etage de villa'],
  villa: ['villa', 'maison'],
  'etage de villa': ['etage de villa', 'maison', 'villa'],

  // Terrains
  terrain: ['terrain', 'parcelle'],
  parcelle: ['parcelle', 'terrain'],

  // Commercial
  'local commercial': ['local commercial', 'commerce', 'boutique', 'bureau'],
  commerce: ['commerce', 'local commercial', 'boutique'],
  boutique: ['boutique', 'commerce', 'local commercial'],
  bureau: ['bureau', 'local commercial'],

  // Autres
  immeuble: ['immeuble'],
  ferme: ['ferme', 'agricole'],
  agricole: ['agricole', 'ferme', 'terrain'],
};

/**
 * Vérifie si deux types de biens sont compatibles
 */
export function arePropertyTypesCompatible(leadType: string, propertyType: string): boolean {
  const normalizedLead = leadType.toLowerCase().trim();
  const normalizedProperty = propertyType.toLowerCase().trim();

  // Match exact
  if (normalizedLead === normalizedProperty) return true;

  // Check dans les groupes compatibles
  const compatibleTypes = COMPATIBLE_PROPERTY_TYPES[normalizedLead];
  if (compatibleTypes) {
    return compatibleTypes.some((t) => t === normalizedProperty);
  }

  return false;
}

// ============================================
// PROSPECTING MATCH DTOs
// ============================================

import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LeadSummary,
  PropertySummary,
  ProspectSummary,
} from '../../../shared/types/relation-summaries';

export type MatchStatus = 'pending' | 'notified' | 'contacted' | 'converted' | 'ignored';

/**
 * DTO pour créer un match
 */
export class CreateProspectingMatchDto {
  @ApiProperty({ description: 'ID du lead source' })
  @IsString()
  leadId: string;

  @ApiProperty({ description: 'ID de la propriété matchée' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'ID du prospect si converti' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiProperty({ description: 'Score du match (0-100)' })
  @IsNumber()
  score: number;

  @ApiProperty({ description: 'Raisons détaillées du match' })
  @IsObject()
  reason: MatchReason;

  @ApiPropertyOptional({ description: 'Match qualifié (score >= 50)', default: false })
  @IsOptional()
  @IsBoolean()
  isQualified?: boolean;
}

/**
 * DTO pour mettre à jour un match
 */
export class UpdateProspectingMatchDto {
  @ApiPropertyOptional({ enum: ['pending', 'notified', 'contacted', 'converted', 'ignored'] })
  @IsOptional()
  @IsEnum(['pending', 'notified', 'contacted', 'converted', 'ignored'])
  status?: MatchStatus;

  @ApiPropertyOptional({ description: 'ID du prospect si converti' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'Date de notification' })
  @IsOptional()
  notifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Date de contact' })
  @IsOptional()
  contactedAt?: Date;
}

/**
 * DTO de réponse pour un match
 */
export class ProspectingMatchResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  leadId: string;

  @ApiPropertyOptional()
  prospectId?: string;

  @ApiProperty()
  propertyId: string;

  @ApiProperty({ description: 'Score du match (0-100)' })
  score: number;

  @ApiProperty({ description: 'Raisons détaillées du match' })
  reason: MatchReason;

  @ApiProperty({ description: 'Match qualifié (score >= 50)' })
  isQualified: boolean;

  @ApiProperty({ enum: ['pending', 'notified', 'contacted', 'converted', 'ignored'] })
  status: MatchStatus;

  @ApiPropertyOptional()
  notifiedAt?: Date;

  @ApiPropertyOptional()
  contactedAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations (optional, populated on demand)
  @ApiPropertyOptional({ description: 'Lead source du match' })
  lead?: LeadSummary;

  @ApiPropertyOptional({ description: 'Propriété matchée' })
  property?: PropertySummary;

  @ApiPropertyOptional({ description: 'Prospect converti' })
  prospect?: ProspectSummary;
}

/**
 * DTO pour les filtres de recherche de matches
 */
export class ProspectingMatchFiltersDto {
  @ApiPropertyOptional({ description: 'Score minimum' })
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional({ enum: ['pending', 'notified', 'contacted', 'converted', 'ignored'] })
  @IsOptional()
  @IsEnum(['pending', 'notified', 'contacted', 'converted', 'ignored'])
  status?: MatchStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'Uniquement les matches qualifiés' })
  @IsOptional()
  @IsBoolean()
  isQualified?: boolean;
}
