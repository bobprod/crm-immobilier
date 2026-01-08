import { apiClient } from './api-client-backend';

// ============================================
// PROSPECTS CONVERSION TRACKER API
// ============================================

export interface ConversionEvent {
  id: string;
  prospectId: string;
  eventType:
  | 'lead_created'
  | 'prospect_qualified'
  | 'property_viewed'
  | 'appointment_scheduled'
  | 'deal_closed';
  eventName?: string;
  propertyId?: string;
  appointmentId?: string;
  value?: number;
  currency: string;
  source?: string;
  medium?: string;
  campaign?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  createdAt: string;
}

export interface AgentContribution {
  agentId: string;
  agentName: string;
  contribution: number;
  interactions: number;
  conversionRate: number;
}

export interface HighRoiProspect {
  prospectId: string;
  prospectName: string;
  totalValue: number;
  conversionRate: number;
  aiAssistance: number;
  score: number;
}

export interface PerformanceReport {
  prospectId: string;
  prospectName: string;
  conversions: ConversionEvent[];
  totalValue: number;
  conversionRate: number;
  timeline: {
    stage: string;
    date: string;
    duration: number;
  }[];
  aiContribution: {
    documents: number;
    emails: number;
    recommendations: number;
  };
}

/**
 * Tracker un prospect comme qualifié
 */
export async function trackProspectQualified(
  prospectId: string,
  data: {
    value?: number;
    source?: string;
    campaign?: string;
    metadata?: Record<string, any>;
  }
): Promise<ConversionEvent> {
  const response = await apiClient.post(`/prospects-conversion/${prospectId}/qualified`, data);
  return response.data;
}

/**
 * Tracker une réservation de rendez-vous
 */
export async function trackMeetingBooked(
  prospectId: string,
  data: {
    appointmentId: string;
    value?: number;
    source?: string;
  }
): Promise<ConversionEvent> {
  const response = await apiClient.post(`/prospects-conversion/${prospectId}/meeting-booked`, data);
  return response.data;
}

/**
 * Tracker une visite complétée
 */
export async function trackVisitCompleted(
  prospectId: string,
  data: {
    propertyId: string;
    appointmentId?: string;
    value?: number;
    feedback?: string;
  }
): Promise<ConversionEvent> {
  const response = await apiClient.post(
    `/prospects-conversion/${prospectId}/visit-completed`,
    data
  );
  return response.data;
}

/**
 * Tracker une offre faite
 */
export async function trackOfferMade(
  prospectId: string,
  data: {
    propertyId: string;
    value: number;
    currency?: string;
  }
): Promise<ConversionEvent> {
  const response = await apiClient.post(`/prospects-conversion/${prospectId}/offer-made`, data);
  return response.data;
}

/**
 * Tracker un contrat signé (conversion finale)
 */
export async function trackContractSigned(
  prospectId: string,
  data: {
    propertyId: string;
    value: number;
    currency?: string;
    commission?: number;
  }
): Promise<ConversionEvent> {
  const response = await apiClient.post(
    `/prospects-conversion/${prospectId}/contract-signed`,
    data
  );
  return response.data;
}

/**
 * Détecter automatiquement les conversions d'un prospect
 */
export async function detectConversions(prospectId: string): Promise<ConversionEvent[]> {
  const response = await apiClient.get(`/prospects-conversion/${prospectId}/detect-conversions`);
  return response.data;
}

/**
 * Obtenir la contribution des agents IA pour un prospect
 */
export async function getAgentContribution(prospectId: string): Promise<AgentContribution[]> {
  const response = await apiClient.get(`/prospects-conversion/${prospectId}/agent-contribution`);
  return response.data;
}

/**
 * Obtenir les prospects avec le meilleur ROI
 */
export async function getHighRoiProspects(filters?: {
  minValue?: number;
  minConversionRate?: number;
  limit?: number;
}): Promise<HighRoiProspect[]> {
  const response = await apiClient.get('/prospects-conversion/high-roi', {
    params: filters,
  });
  return response.data;
}

/**
 * Obtenir le rapport de performance d'un prospect
 */
export async function getPerformanceReport(prospectId: string): Promise<PerformanceReport> {
  const response = await apiClient.get(`/prospects-conversion/${prospectId}/performance-report`);
  return response.data;
}

/**
 * Obtenir toutes les conversions (filtrable)
 */
export async function getAllConversions(filters?: {
  prospectId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  minValue?: number;
}): Promise<ConversionEvent[]> {
  const response = await apiClient.get('/prospects-conversion', {
    params: filters,
  });
  return response.data;
}

// Backward-compatible API object expected by some pages
export const prospectsConversionApi = {
  getById: getPerformanceReport,
  getAll: getAllConversions,
  detectConversions,
  trackProspectQualified,
  trackMeetingBooked,
  trackVisitCompleted,
  trackOfferMade,
  trackContractSigned,
  getAgentContribution,
  getHighRoiProspects,
};
