import { IsString, IsBoolean, IsOptional, IsObject, IsEnum, IsNumber } from 'class-validator';

/**
 * Plateformes de tracking supportées
 */
export enum TrackingPlatform {
  FACEBOOK = 'facebook',
  TIKTOK = 'tiktok',
  LINKEDIN = 'linkedin',
  GOOGLE_ADS = 'google_ads',
  GA4 = 'ga4',
  GTM = 'gtm',
  SNAPCHAT = 'snapchat',
}

/**
 * Modes d'automatisation IA
 */
export enum AutomationMode {
  SUGGESTION = 'suggestion', // IA suggère, humain valide
  SEMI_AUTO = 'semi_auto', // IA ajuste dans limites
  FULL_AUTO = 'full_auto', // IA gère tout
  DISABLED = 'disabled', // Pas d'IA
}

/**
 * Configuration d'une plateforme de tracking
 */
export class TrackingConfigDto {
  @IsEnum(TrackingPlatform)
  platform: TrackingPlatform;

  @IsObject()
  config: any; // Spécifique par plateforme

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  useServerSide?: boolean;
}

/**
 * Événement de tracking
 */
export interface TrackingEvent {
  eventName: string;
  eventType: 'standard' | 'custom';
  timestamp: Date;
  sessionId?: string;
  userId?: string;
  prospectId?: string;
  propertyId?: string;
  data: Record<string, any>;
  source: 'web' | 'mobile' | 'api';
  platform: TrackingPlatform[];

  // Données contextuelles
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  url?: string;

  // Données ML
  conversionProbability?: number;
  leadScore?: number;
  segment?: string;
}

/**
 * Configuration IA/ML
 */
export class MLConfigDto {
  @IsEnum(AutomationMode)
  mode: AutomationMode;

  @IsBoolean()
  enableConversionPrediction: boolean;

  @IsBoolean()
  enableAnomalyDetection: boolean;

  @IsBoolean()
  enableAutoSegmentation: boolean;

  @IsBoolean()
  enableSmartAttribution: boolean;

  @IsNumber()
  @IsOptional()
  budgetAdjustmentLimit?: number; // % max pour semi-auto

  @IsNumber()
  @IsOptional()
  minConfidenceScore?: number; // Score min pour suggestions

  @IsObject()
  @IsOptional()
  customRules?: any;
}

/**
 * Prédiction de conversion
 */
export interface ConversionPrediction {
  prospectId?: string;
  sessionId: string;
  probability: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    value: any;
  }[];
  recommendation: string;
  timestamp: Date;
}

/**
 * Anomalie détectée
 */
export interface DetectedAnomaly {
  id: string;
  type: 'conversion_drop' | 'cost_spike' | 'quality_drop' | 'fraud_suspected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  platform: TrackingPlatform;
  campaign?: string;
  timestamp: Date;
  description: string;
  recommendations: string[];
  autoFixed?: boolean;
}

/**
 * Segment d'audience
 */
export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  size: number;
  characteristics: Record<string, any>;
  performance: {
    conversionRate: number;
    avgRevenue: number;
    costPerLead: number;
  };
  platforms: TrackingPlatform[];
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Attribution multi-touch
 */
export interface AttributionModel {
  touchpoints: {
    channel: string;
    platform: TrackingPlatform;
    timestamp: Date;
    credit: number; // 0-1
  }[];
  totalValue: number;
  conversionTime: Date;
  model: 'last_click' | 'first_click' | 'linear' | 'time_decay' | 'shapley' | 'markov';
}

/**
 * Suggestion IA
 */
export interface AISuggestion {
  id: string;
  type: 'budget' | 'targeting' | 'creative' | 'bidding' | 'schedule';
  platform: TrackingPlatform;
  campaign?: string;
  currentValue: any;
  suggestedValue: any;
  expectedImpact: {
    metric: string;
    change: number;
  };
  confidence: number;
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  createdAt: Date;
}
