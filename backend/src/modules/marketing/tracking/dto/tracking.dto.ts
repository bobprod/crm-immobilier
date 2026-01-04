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

/**
 * ==========================================
 * CONFIGURATIONS SPÉCIFIQUES PAR PLATEFORME
 * ==========================================
 */

/**
 * Configuration Meta (Facebook/Instagram) Pixel + Conversion API
 */
export interface MetaPixelConfig {
  pixelId: string;
  accessToken?: string; // Pour Conversion API
  testEventCode?: string; // Pour debugging
  enableAutomaticMatching?: boolean;
  enableAdvancedMatching?: boolean;
}

/**
 * Configuration Google Tag Manager
 */
export interface GTMConfig {
  containerId: string; // GTM-XXXXXXX
  serverContainerUrl?: string; // Pour server-side
  serverContainerId?: string; // GTM-XXXXXXX (server)
  enablePreview?: boolean;
}

/**
 * Configuration Google Analytics 4
 */
export interface GA4Config {
  measurementId: string; // G-XXXXXXXXXX
  apiSecret?: string; // Pour Measurement Protocol
  enableEnhancedMeasurement?: boolean;
  enableUserIdTracking?: boolean;
  sessionTimeout?: number; // minutes
}

/**
 * Configuration Google Ads
 */
export interface GoogleAdsConfig {
  conversionId: string; // AW-XXXXXXXXXX
  conversionLabels: {
    lead?: string;
    purchase?: string;
    schedule?: string;
    contact?: string;
    [key: string]: string | undefined;
  };
  enableEnhancedConversions?: boolean;
}

/**
 * Configuration TikTok Pixel + Events API
 */
export interface TikTokPixelConfig {
  pixelId: string;
  accessToken?: string; // Pour Events API
  enableAdvancedMatching?: boolean;
}

/**
 * Configuration LinkedIn Insight Tag
 */
export interface LinkedInConfig {
  partnerId: string;
  conversionIds?: {
    lead?: string;
    contact?: string;
    download?: string;
    [key: string]: string | undefined;
  };
  accessToken?: string; // Pour Conversions API
}

/**
 * Configuration Snapchat Pixel
 */
export interface SnapchatPixelConfig {
  pixelId: string;
  accessToken?: string;
  enableAdvancedMatching?: boolean;
}

/**
 * Configuration Server-Side Tracking
 */
export interface ServerSideConfig {
  provider: 'none' | 'stape' | 'gtm_server' | 'segment' | 'custom';
  containerUrl?: string; // URL du container server-side
  apiKey?: string; // Pour Stape ou autres
  customEndpoint?: string;
  enableProxy?: boolean;
}

/**
 * DTO pour créer/update tracking config avec validation
 */
export class CreateTrackingConfigDto {
  @IsEnum(TrackingPlatform)
  platform: TrackingPlatform;

  @IsObject()
  config: MetaPixelConfig | GTMConfig | GA4Config | GoogleAdsConfig | TikTokPixelConfig | LinkedInConfig | SnapchatPixelConfig;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsBoolean()
  @IsOptional()
  useServerSide?: boolean = false;
}

/**
 * DTO pour test de connexion pixel
 */
export class TestPixelDto {
  @IsEnum(TrackingPlatform)
  platform: TrackingPlatform;

  @IsObject()
  @IsOptional()
  testData?: any;
}

/**
 * Response du test de pixel
 */
export interface TestPixelResponse {
  success: boolean;
  message: string;
  details?: any;
  testEventUrl?: string; // URL pour voir l'événement dans le dashboard
}

/**
 * DTO pour AI Config Wizard
 */
export class AIConfigWizardDto {
  @IsString({ each: true })
  platforms: TrackingPlatform[];

  @IsObject()
  credentials: Record<TrackingPlatform, any>;

  @IsBoolean()
  @IsOptional()
  autoGenerateGTM?: boolean = true;

  @IsBoolean()
  @IsOptional()
  enableServerSide?: boolean = false;

  @IsString()
  @IsOptional()
  serverSideProvider?: 'stape' | 'gtm_server' | 'none';
}

/**
 * Response de l'AI Config Wizard
 */
export interface AIConfigWizardResponse {
  success: boolean;
  configurations: {
    platform: TrackingPlatform;
    status: 'success' | 'error' | 'warning';
    message: string;
  }[];
  gtmConfig?: {
    downloadUrl: string;
    containerJson: any;
    importInstructions: string[];
  };
  eventsDetected: {
    eventName: string;
    locations: string[];
    suggestedPlatforms: TrackingPlatform[];
  }[];
  nextSteps: string[];
}

/**
 * DTO pour événement tracking public
 */
export class PublicTrackingEventDto {
  @IsString()
  eventName: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  referrer?: string;
}

/**
 * Stats événements tracking
 */
export interface TrackingEventsStats {
  totalEvents: number;
  eventsByPlatform: Record<TrackingPlatform, number>;
  eventsByType: Record<string, number>;
  conversionRate: number;
  avgLeadScore: number;
  topEvents: {
    eventName: string;
    count: number;
    conversionRate: number;
  }[];
  recentEvents: any[];
}
