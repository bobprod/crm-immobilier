/**
 * Types de résumés légers pour les relations dans les DTOs
 * Ces types sont utilisés pour éviter les imports circulaires
 * et pour typer correctement les relations optionnelles
 */

// ============================================
// USER SUMMARY
// ============================================

export interface UserSummary {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

// ============================================
// PROSPECT SUMMARY
// ============================================

export interface ProspectSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  type: string;
  status: string;
  score?: number;
}

// ============================================
// PROPERTY SUMMARY
// ============================================

export interface PropertySummary {
  id: string;
  title: string;
  type: string;
  category: 'sale' | 'rent';
  price: number;
  currency: string;
  city?: string;
  status: string;
  area?: number;
  bedrooms?: number;
}

// ============================================
// LEAD SUMMARY
// ============================================

export interface LeadSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status: string;
  score: number;
  city?: string;
  budgetMin?: number;
  budgetMax?: number;
  propertyTypes: string[];
}

// ============================================
// PROSPECT PREFERENCES
// ============================================

export interface ProspectPreferences {
  propertyTypes?: string[];
  locations?: string[];
  budgetMin?: number;
  budgetMax?: number;
  minArea?: number;
  maxArea?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  features?: string[];
  urgency?: 'basse' | 'moyenne' | 'haute' | 'inconnu';
  financing?: 'cash' | 'credit' | 'mixed' | 'unknown';
  timeline?: string;
  notes?: string;
}

// ============================================
// PROSPECTING CAMPAIGN CONFIG
// ============================================

export interface ProspectingCampaignConfig {
  location?: string;
  propertyTypes?: string[];
  targetTypes?: string[];
  budgetMin?: number;
  budgetMax?: number;
  sources?: string[];
  minLeadScore?: number;
  requireEmail?: boolean;
  requirePhone?: boolean;
  maxLeadsPerSource?: number;
  totalTarget?: number;
  useAI?: boolean;
  aiProvider?: string;
}

// ============================================
// LEAD METADATA
// ============================================

export interface LeadMetadata {
  source?: string;
  sourceUrl?: string;
  rawContent?: string;
  extractedAt?: string;
  aiProvider?: string;
  aiModel?: string;
  confidence?: number;
  originalData?: Record<string, unknown>;
  parseErrors?: string[];
  enrichmentData?: Record<string, unknown>;
}

// ============================================
// COMMUNICATION ATTACHMENT
// ============================================

export interface CommunicationAttachment {
  id?: string;
  name: string;
  url: string;
  mimeType: string;
  size?: number;
}

// ============================================
// APPOINTMENT ATTENDEE
// ============================================

export interface AppointmentAttendee {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  type: 'prospect' | 'agent' | 'owner' | 'guest';
  status?: 'pending' | 'accepted' | 'declined';
}

// ============================================
// APPOINTMENT RECURRENCE
// ============================================

export interface AppointmentRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  count?: number;
}
