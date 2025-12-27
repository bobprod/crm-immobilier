/**
 * Investment Intelligence - Frontend Types
 * Mirrors backend types for type safety
 */

// ============================================
// Enums
// ============================================

export enum InvestmentProjectSource {
  // FRANCE
  bricks = 'bricks',
  homunity = 'homunity',
  anaxago = 'anaxago',
  fundimmo = 'fundimmo',
  lymo = 'lymo',
  raizers = 'raizers',
  wiseed = 'wiseed',

  // EUROPE
  estateguru = 'estateguru',
  reinvest24 = 'reinvest24',
  crowdestate = 'crowdestate',
  propertypartner = 'propertypartner',
  crowdproperty = 'crowdproperty',
  brickowner = 'brickowner',
  exporo = 'exporo',
  rendity = 'rendity',

  // USA
  fundrise = 'fundrise',
  realtymogul = 'realtymogul',
  crowdstreet = 'crowdstreet',
  peerstreet = 'peerstreet',
  roofstock = 'roofstock',
  arrived = 'arrived',

  // CANADA
  addy = 'addy',
  triovest = 'triovest',
  realtypro = 'realtypro',

  // LATAM
  brla_urba = 'brla_urba',
  brla_credihome = 'brla_credihome',
  brla_housers = 'brla_housers',
  colombia_la_haus = 'colombia_la_haus',
  venezuela_local = 'venezuela_local',

  // MENA
  tunisia_bricks_tn = 'tunisia_bricks_tn',
  tunisia_local = 'tunisia_local',
  morocco_reit = 'morocco_reit',
  morocco_local = 'morocco_local',
  algeria_local = 'algeria_local',
  egypt_nawy = 'egypt_nawy',
  egypt_aqarmap = 'egypt_aqarmap',
  uae_smartcrowd = 'uae_smartcrowd',
  uae_stake = 'uae_stake',
  saudi_redf = 'saudi_redf',
  saudi_local = 'saudi_local',
  qatar_local = 'qatar_local',

  // AFRICA
  cameroon_local = 'cameroon_local',
  ivorycoast_local = 'ivorycoast_local',
  nigeria_proptech = 'nigeria_proptech',
  nigeria_local = 'nigeria_local',

  // OTHER
  manual = 'manual',
  other = 'other',
}

export enum InvestmentProjectStatus {
  draft = 'draft',
  analyzing = 'analyzing',
  active = 'active',
  funded = 'funded',
  completed = 'completed',
  archived = 'archived',
}

// ============================================
// Investment Project
// ============================================

export interface InvestmentProject {
  id: string;
  userId: string;
  tenantId: string;

  // Core Data
  title: string;
  description?: string;
  sourceUrl: string;
  source: InvestmentProjectSource;
  sourceProjectId?: string;

  // Location
  city: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;

  // Financial
  totalPrice: number;
  minTicket: number;
  currency: string;

  // Yields
  grossYield?: number;
  netYield?: number;
  targetYield?: number;

  // Duration
  durationMonths?: number;
  startDate?: string;
  endDate?: string;

  // Type
  propertyType: string;

  // Status
  status: InvestmentProjectStatus;
  fundingProgress?: number;

  // Metadata
  rawData?: any;
  images?: string[];
  documents?: string[];

  // Timestamps
  importedAt: string;
  lastAnalyzedAt?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Analysis
// ============================================

export interface InvestmentAnalysis {
  id: string;
  projectId: string;
  userId: string;
  orchestrationId?: string;

  // Scores (0-100)
  overallScore: number;
  locationScore?: number;
  yieldScore?: number;
  riskScore?: number;
  liquidityScore?: number;

  // SWOT
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];

  // Recommendation
  recommendation: 'BUY' | 'HOLD' | 'PASS' | 'INVESTIGATE';
  recommendationReason?: string;

  // Comparison
  marketComparison?: any;
  similarProjects?: string[];

  // Metrics
  metrics?: any;

  // Alerts
  redFlags?: string[];

  // Timestamps
  analyzedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Comparison
// ============================================

export interface ComparisonWeights {
  location?: number;
  yield?: number;
  risk?: number;
  liquidity?: number;
  ticket?: number;
  duration?: number;
}

export interface ComparisonFilters {
  minYield?: number;
  maxTicket?: number;
  propertyTypes?: string[];
  countries?: string[];
}

export interface ComparisonCriteria {
  weights?: ComparisonWeights;
  filters?: ComparisonFilters;
}

export interface ComparisonScores {
  overall: number;
  location?: number;
  yield?: number;
  risk?: number;
  liquidity?: number;
  ticket?: number;
  duration?: number;
}

export interface ComparisonResult {
  projectId: string;
  scores: ComparisonScores;
  ranking: number;
  pros: string[];
  cons: string[];
}

export interface InvestmentComparison {
  id: string;
  userId: string;
  name?: string;

  projectIds: string[];
  criteria: ComparisonCriteria;
  results: ComparisonResult[];
  winner?: string;
  recommendations?: string[];

  comparedAt: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Alerts
// ============================================

export interface AlertCriteria {
  countries?: string[];
  cities?: string[];
  minYield?: number;
  maxYield?: number;
  minTicket?: number;
  maxTicket?: number;
  currencies?: string[];
  propertyTypes?: string[];
  minDuration?: number;
  maxDuration?: number;
  sources?: InvestmentProjectSource[];
  statuses?: InvestmentProjectStatus[];
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'in_app';
  config: {
    email?: string;
    webhookUrl?: string;
  };
}

export interface InvestmentAlert {
  id: string;
  userId: string;
  tenantId: string;

  name: string;
  isActive: boolean;

  criteria: AlertCriteria;
  notificationChannels: NotificationChannel[];
  frequency: string;

  lastTriggeredAt?: string;
  triggeredCount: number;

  createdAt: string;
  updatedAt: string;
}

// ============================================
// Platform Detection
// ============================================

export interface PlatformDetectionResult {
  detected: boolean;
  source?: InvestmentProjectSource;
  confidence: number;
  adapterName?: string;
}

export interface AdapterCapabilities {
  canImportFromUrl: boolean;
  canSearch: boolean;
  canExportToXLSX: boolean;
}

export interface AdapterMetadata {
  name: string;
  source: InvestmentProjectSource;
  supportedCountries: string[];
  baseUrl: string;
  requiresAuth: boolean;
  rateLimit?: {
    requests: number;
    period: number;
  };
  capabilities: AdapterCapabilities;
}

export interface PlatformsSummary {
  count: number;
  adapters: AdapterMetadata[];
  capabilities: {
    totalAdapters: number;
    canImportFromUrl: number;
    canSearch: number;
    supportedCountries: string[];
  };
}

// ============================================
// API Request/Response Types
// ============================================

export interface ImportProjectRequest {
  url: string;
  skipValidation?: boolean;
  forceUpdate?: boolean;
  analyzeImmediately?: boolean;
}

export interface ImportBatchRequest {
  urls: string[];
  skipValidation?: boolean;
  analyzeImmediately?: boolean;
}

export interface AnalyzeProjectRequest {
  projectId: string;
}

export interface CompareProjectsRequest {
  projectIds: string[];
  weights?: ComparisonWeights;
  filters?: ComparisonFilters;
  name?: string;
}

export interface CreateAlertRequest {
  name: string;
  criteria: AlertCriteria;
  notificationChannels: NotificationChannel[];
  frequency?: string;
}

export interface UpdateAlertRequest {
  name?: string;
  criteria?: AlertCriteria;
  notificationChannels?: NotificationChannel[];
  frequency?: string;
  isActive?: boolean;
}

export interface ListProjectsFilters {
  source?: InvestmentProjectSource;
  status?: InvestmentProjectStatus;
  country?: string;
  minYield?: number;
  maxTicket?: number;
}

// ============================================
// UI State Types
// ============================================

export type InvestmentViewMode =
  | 'dashboard'
  | 'import'
  | 'projects'
  | 'analysis'
  | 'comparison'
  | 'alerts';

export interface InvestmentDashboardState {
  viewMode: InvestmentViewMode;
  selectedProjectId?: string;
  selectedComparisonId?: string;
  filters: ListProjectsFilters;
  isLoading: boolean;
  error?: string;
}

// ============================================
// Source Display Names
// ============================================

export const SOURCE_DISPLAY_NAMES: Record<InvestmentProjectSource, string> = {
  // France
  bricks: 'Bricks.co',
  homunity: 'Homunity',
  anaxago: 'Anaxago',
  fundimmo: 'Fundimmo',
  lymo: 'Lymo',
  raizers: 'Raizers',
  wiseed: 'Wiseed',

  // Europe
  estateguru: 'Estateguru',
  reinvest24: 'Reinvest24',
  crowdestate: 'Crowdestate',
  propertypartner: 'PropertyPartner',
  crowdproperty: 'CrowdProperty',
  brickowner: 'BrickOwner',
  exporo: 'Exporo',
  rendity: 'Rendity',

  // USA
  fundrise: 'Fundrise',
  realtymogul: 'RealtyMogul',
  crowdstreet: 'CrowdStreet',
  peerstreet: 'PeerStreet',
  roofstock: 'Roofstock',
  arrived: 'Arrived',

  // Canada
  addy: 'Addy',
  triovest: 'Triovest',
  realtypro: 'RealtyPRO',

  // LATAM
  brla_urba: 'Urba (Brazil)',
  brla_credihome: 'CrediHome (Brazil)',
  brla_housers: 'Housers (Brazil)',
  colombia_la_haus: 'LaHaus (Colombia)',
  venezuela_local: 'Local (Venezuela)',

  // MENA
  tunisia_bricks_tn: 'Bricks.tn (Tunisia)',
  tunisia_local: 'Local (Tunisia)',
  morocco_reit: 'REIT (Morocco)',
  morocco_local: 'Local (Morocco)',
  algeria_local: 'Local (Algeria)',
  egypt_nawy: 'Nawy (Egypt)',
  egypt_aqarmap: 'Aqarmap (Egypt)',
  uae_smartcrowd: 'SmartCrowd (UAE)',
  uae_stake: 'Stake (UAE)',
  saudi_redf: 'REDF (Saudi Arabia)',
  saudi_local: 'Local (Saudi Arabia)',
  qatar_local: 'Local (Qatar)',

  // Africa
  cameroon_local: 'Local (Cameroon)',
  ivorycoast_local: 'Local (Ivory Coast)',
  nigeria_proptech: 'PropTech (Nigeria)',
  nigeria_local: 'Local (Nigeria)',

  // Other
  manual: 'Manual Entry',
  other: 'Other Platform',
};

// ============================================
// Utility Functions
// ============================================

export function getSourceDisplayName(source: InvestmentProjectSource): string {
  return SOURCE_DISPLAY_NAMES[source] || source;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  return 'red';
}

export function getRecommendationColor(
  recommendation: InvestmentAnalysis['recommendation'],
): string {
  switch (recommendation) {
    case 'BUY':
      return 'green';
    case 'HOLD':
      return 'blue';
    case 'PASS':
      return 'red';
    case 'INVESTIGATE':
      return 'yellow';
    default:
      return 'gray';
  }
}

export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  try {
    return formatter.format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export function formatYield(yieldValue: number): string {
  return `${yieldValue.toFixed(1)}%`;
}

export function getStatusBadgeColor(status: InvestmentProjectStatus): string {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'analyzing':
      return 'blue';
    case 'active':
      return 'green';
    case 'funded':
      return 'purple';
    case 'completed':
      return 'green';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}
