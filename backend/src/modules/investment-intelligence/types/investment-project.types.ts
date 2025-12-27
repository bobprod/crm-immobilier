/**
 * Investment Intelligence - Type Definitions
 * Unified data structures for multi-platform investment projects
 */

import { InvestmentProjectSource, InvestmentProjectStatus } from '@prisma/client';

// ============================================
// Unified Project Data Format
// ============================================

export interface UnifiedProjectData {
  // Core Information
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

  // Financial Data
  totalPrice: number;
  minTicket: number;
  currency: string; // ISO 4217 (EUR, USD, TND, etc.)

  // Yields
  grossYield?: number; // Percentage
  netYield?: number; // Percentage
  targetYield?: number; // Percentage

  // Duration
  durationMonths?: number;
  startDate?: Date;
  endDate?: Date;

  // Property Type
  propertyType: string; // residential, commercial, mixed, etc.

  // Status
  status?: InvestmentProjectStatus;
  fundingProgress?: number; // Percentage (0-100)

  // Metadata
  rawData?: any; // Platform-specific raw data
  images?: string[];
  documents?: string[];
}

// ============================================
// Raw Platform Data (before normalization)
// ============================================

export interface RawProjectData {
  source: InvestmentProjectSource;
  sourceUrl: string;
  sourceProjectId?: string;
  rawHtml?: string;
  rawJson?: any;
  scrapedAt: Date;
}

// ============================================
// Import Context
// ============================================

export interface ImportContext {
  userId: string;
  tenantId: string;
  orchestrationId?: string;
  options?: {
    skipValidation?: boolean;
    forceUpdate?: boolean;
    analyzeImmediately?: boolean;
  };
}

// ============================================
// Validation Result
// ============================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// ============================================
// Analysis Data Types
// ============================================

export interface ProjectAnalysis {
  // Scoring (0-100)
  overallScore: number;
  locationScore?: number;
  yieldScore?: number;
  riskScore?: number;
  liquidityScore?: number;

  // SWOT Analysis
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];

  // Recommendation
  recommendation: string; // 'BUY', 'HOLD', 'PASS', 'INVESTIGATE'
  recommendationReason?: string;

  // Market Comparison
  marketComparison?: any;
  similarProjects?: string[]; // IDs of similar projects

  // Advanced Metrics
  metrics?: any;

  // Red Flags
  redFlags?: string[];
}

// ============================================
// Comparison Types
// ============================================

export interface ComparisonCriteria {
  weights: {
    location?: number;
    yield?: number;
    risk?: number;
    liquidity?: number;
    ticket?: number;
    duration?: number;
  };
  filters?: {
    minYield?: number;
    maxTicket?: number;
    propertyTypes?: string[];
    countries?: string[];
  };
}

export interface ComparisonResult {
  projectId: string;
  scores: {
    overall: number;
    location?: number;
    yield?: number;
    risk?: number;
    liquidity?: number;
    ticket?: number;
    duration?: number;
  };
  ranking: number;
  pros: string[];
  cons: string[];
}

// ============================================
// Alert Types
// ============================================

export interface AlertCriteria {
  // Geographic
  countries?: string[];
  cities?: string[];

  // Financial
  minYield?: number;
  maxYield?: number;
  minTicket?: number;
  maxTicket?: number;
  currencies?: string[];

  // Property
  propertyTypes?: string[];

  // Duration
  minDuration?: number;
  maxDuration?: number;

  // Sources
  sources?: InvestmentProjectSource[];

  // Status
  statuses?: InvestmentProjectStatus[];
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'in_app';
  config: {
    email?: string;
    webhookUrl?: string;
  };
}

// ============================================
// Platform Detection
// ============================================

export interface PlatformDetectionResult {
  detected: boolean;
  source?: InvestmentProjectSource;
  confidence: number; // 0-1
  adapterName?: string;
}

// ============================================
// Adapter Metadata
// ============================================

export interface AdapterMetadata {
  name: string;
  source: InvestmentProjectSource;
  supportedCountries: string[];
  baseUrl: string;
  requiresAuth: boolean;
  rateLimit?: {
    requests: number;
    period: number; // milliseconds
  };
  capabilities: {
    canImportFromUrl: boolean;
    canSearch: boolean;
    canExportToXLSX: boolean;
  };
}
