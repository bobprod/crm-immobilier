/**
 * Types pour le module AI Prospection Panel
 * Intégration avec l'API Backend Prospecting AI
 */

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface GeographicZone {
  type: 'city' | 'region' | 'radius' | 'custom';
  name: string;
  coordinates?: {
    lat: number;
    lng: number;
    radius?: number; // en km
  };
  polygon?: Array<[number, number]>; // Pour zones custom
}

export type TargetType = 'buyers' | 'sellers' | 'investors' | 'renters';
export type PropertyType = 'apartment' | 'villa' | 'terrain' | 'commercial' | 'all';

export interface BudgetRange {
  min: number;
  max: number;
  currency?: 'TND' | 'EUR' | 'USD';
}

export interface CampaignSettings {
  name: string;
  maxLeads: number; // 20-100
  maxCost: number; // Budget API en USD (0.50-5.00)
  timeout?: number; // en secondes (default: 300)
}

export interface ProspectionConfiguration {
  zone: GeographicZone;
  targetType: TargetType;
  propertyType: PropertyType;
  budget?: BudgetRange;
  keywords?: string[];
  campaignSettings: CampaignSettings;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface StartProspectionRequest {
  zone: GeographicZone;
  targetType: TargetType;
  propertyType: PropertyType;
  budget?: BudgetRange;
  keywords?: string[];
  maxLeads?: number;
  options?: {
    maxCost?: number;
    timeout?: number;
  };
}

export interface StartProspectionResponse {
  prospectionId: string;
  status: 'running' | 'pending';
  estimatedTime: number; // en secondes
  message: string;
}

export interface ProspectionLead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location?: {
    city?: string;
    region?: string;
    address?: string;
  };
  budget?: BudgetRange;
  propertyInterest?: PropertyType;
  confidence: number; // 0-100
  source?: string;
  metadata?: Record<string, any>;
}

export interface ProspectionMetadata {
  totalLeads: number;
  executionTime: number; // en secondes
  apiCost: number; // en USD
  sources?: string[];
  errors?: string[];
}

export type ProspectionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout';

export interface ProspectionResult {
  id: string;
  status: ProspectionStatus;
  progress: number; // 0-100
  leads: ProspectionLead[];
  metadata: ProspectionMetadata;
  createdAt: string;
  completedAt?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ConvertToProspectsResponse {
  converted: number;
  prospects: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    source: string;
  }>;
}

// ============================================================================
// UI STATE MACHINE TYPES
// ============================================================================

export type ProspectionPanelState =
  | 'CONFIGURING'   // User is setting up targeting and campaign
  | 'READY'         // Configuration complete, ready to launch
  | 'LAUNCHING'     // API call in progress
  | 'RUNNING'       // Prospection running, polling for updates
  | 'COMPLETED'     // Prospection finished successfully
  | 'ERROR';        // Error occurred

export interface ProspectionPanelStateData {
  state: ProspectionPanelState;
  prospectionId?: string;
  prospectionResult?: ProspectionResult;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

// ============================================================================
// FUNNEL/CONVERSION TYPES
// ============================================================================

export type FunnelStage = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';

export interface FunnelMetrics {
  stage: FunnelStage;
  count: number;
  percentage: number;
  avgTimeInStage?: number; // en heures
}

export interface ConversionFunnelData {
  prospectionId: string;
  totalLeads: number;
  stages: FunnelMetrics[];
  conversionRate: number; // 0-100
  totalValue?: number; // Valeur totale générée (en TND)
  avgConversionTime?: number; // Temps moyen de conversion (en jours)
}

// ============================================================================
// LEAD ACTIONS TYPES
// ============================================================================

export type LeadAction = 'add-to-crm' | 'contact' | 'reject' | 'mark-qualified';

export interface LeadActionPayload {
  leadId: string;
  action: LeadAction;
  metadata?: Record<string, any>;
}

export interface BulkLeadAction {
  leadIds: string[];
  action: Exclude<LeadAction, 'contact'>; // Contact is individual only
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type ExportFormat = 'json' | 'csv';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  filterByConfidence?: number; // Minimum confidence score
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ConfigurationValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export interface ProspectionProgress {
  percentage: number;
  currentStep: string;
  estimatedTimeRemaining: number; // en secondes
  leadsFound: number;
  apiCostSoFar: number;
}

export interface ProspectionCostEstimate {
  estimatedCost: number; // USD
  estimatedLeads: number;
  costPerLead: number;
}
