import apiClient from './backend-api';
import type {
  AIMetricsQueryParams,
  TimeSeriesQueryParams,
  ProspectingOverview,
  LeadTypeDistribution,
  IntentionDistribution,
  UrgencyDistribution,
  ValidationStatusDistribution,
  LLMQualityMetrics,
  MatchingPerformance,
  TimeSeriesDataPoint,
  SourcePerformance,
  CampaignPerformance,
  ContactValidationMetrics,
  LocationPerformance,
  BudgetAnalysis,
  TopPerformers,
  SalesFunnel,
  AppointmentsPerformance,
  ConversionMetrics,
  ProspectsPerformance,
  CRMMatchingPerformance,
  PropertiesPerformance,
  TopProperties,
  UnifiedROI,
  UnifiedDashboard,
} from '../types/ai-metrics.types';

const BASE_URL = '/ai-metrics/prospecting';

/**
 * API Client pour AI Metrics Prospecting
 * Couche d'observation unifiee pour le CRM
 */
export const aiMetricsAPI = {
  // ============================================
  // OVERVIEW & SUMMARY
  // ============================================

  /**
   * Vue d'ensemble des performances IA prospection
   */
  getOverview: async (params?: AIMetricsQueryParams): Promise<ProspectingOverview> => {
    const response = await apiClient.get(`${BASE_URL}/overview`, { params });
    return response.data;
  },

  /**
   * Resume global (overview + distributions + LLM quality + matching)
   */
  getSummary: async (params?: AIMetricsQueryParams) => {
    const response = await apiClient.get(`${BASE_URL}/summary`, { params });
    return response.data;
  },

  // ============================================
  // DISTRIBUTIONS
  // ============================================

  /**
   * Distribution par type de lead
   */
  getLeadTypeDistribution: async (params?: AIMetricsQueryParams): Promise<LeadTypeDistribution[]> => {
    const response = await apiClient.get(`${BASE_URL}/distributions/lead-type`, { params });
    return response.data;
  },

  /**
   * Distribution par intention
   */
  getIntentionDistribution: async (params?: AIMetricsQueryParams): Promise<IntentionDistribution[]> => {
    const response = await apiClient.get(`${BASE_URL}/distributions/intention`, { params });
    return response.data;
  },

  /**
   * Distribution par urgence
   */
  getUrgencyDistribution: async (params?: AIMetricsQueryParams): Promise<UrgencyDistribution[]> => {
    const response = await apiClient.get(`${BASE_URL}/distributions/urgency`, { params });
    return response.data;
  },

  /**
   * Distribution par statut de validation
   */
  getValidationStatusDistribution: async (params?: AIMetricsQueryParams): Promise<ValidationStatusDistribution[]> => {
    const response = await apiClient.get(`${BASE_URL}/distributions/validation-status`, { params });
    return response.data;
  },

  // ============================================
  // LLM & MATCHING QUALITY
  // ============================================

  /**
   * Metriques qualite LLM
   */
  getLLMQuality: async (params?: AIMetricsQueryParams): Promise<LLMQualityMetrics> => {
    const response = await apiClient.get(`${BASE_URL}/llm-quality`, { params });
    return response.data;
  },

  /**
   * Performance du matching prospecting
   */
  getMatchingPerformance: async (params?: AIMetricsQueryParams): Promise<MatchingPerformance> => {
    const response = await apiClient.get(`${BASE_URL}/matching`, { params });
    return response.data;
  },

  // ============================================
  // TIME SERIES & ANALYTICS
  // ============================================

  /**
   * Donnees temporelles (day/week/month)
   */
  getTimeSeries: async (params?: TimeSeriesQueryParams): Promise<TimeSeriesDataPoint[]> => {
    const response = await apiClient.get(`${BASE_URL}/time-series`, { params });
    return response.data;
  },

  /**
   * Performance par source
   */
  getSourcePerformance: async (params?: AIMetricsQueryParams): Promise<SourcePerformance[]> => {
    const response = await apiClient.get(`${BASE_URL}/sources`, { params });
    return response.data;
  },

  /**
   * Performance par campagne
   */
  getCampaignPerformance: async (params?: AIMetricsQueryParams): Promise<CampaignPerformance[]> => {
    const response = await apiClient.get(`${BASE_URL}/campaigns`, { params });
    return response.data;
  },

  /**
   * Metriques validation contact
   */
  getContactValidation: async (params?: AIMetricsQueryParams): Promise<ContactValidationMetrics> => {
    const response = await apiClient.get(`${BASE_URL}/validations`, { params });
    return response.data;
  },

  /**
   * Performance par localisation
   */
  getLocationPerformance: async (params?: AIMetricsQueryParams): Promise<LocationPerformance[]> => {
    const response = await apiClient.get(`${BASE_URL}/locations`, { params });
    return response.data;
  },

  /**
   * Analyse des budgets
   */
  getBudgetAnalysis: async (params?: AIMetricsQueryParams): Promise<BudgetAnalysis> => {
    const response = await apiClient.get(`${BASE_URL}/budget`, { params });
    return response.data;
  },

  /**
   * Top performers (leads, matches, campaigns)
   */
  getTopPerformers: async (params?: AIMetricsQueryParams & { limit?: number }): Promise<TopPerformers> => {
    const response = await apiClient.get(`${BASE_URL}/top-performers`, { params });
    return response.data;
  },

  // ============================================
  // SALES / PIPELINE
  // ============================================

  /**
   * Funnel de conversion complet
   */
  getSalesFunnel: async (params?: AIMetricsQueryParams): Promise<SalesFunnel> => {
    const response = await apiClient.get(`${BASE_URL}/sales/funnel`, { params });
    return response.data;
  },

  /**
   * Performance des RDVs
   */
  getAppointmentsPerformance: async (params?: AIMetricsQueryParams): Promise<AppointmentsPerformance> => {
    const response = await apiClient.get(`${BASE_URL}/sales/appointments`, { params });
    return response.data;
  },

  /**
   * Metriques de conversion
   */
  getConversionMetrics: async (params?: AIMetricsQueryParams): Promise<ConversionMetrics> => {
    const response = await apiClient.get(`${BASE_URL}/sales/conversions`, { params });
    return response.data;
  },

  /**
   * Performance des prospects pipeline
   */
  getProspectsPerformance: async (params?: AIMetricsQueryParams): Promise<ProspectsPerformance> => {
    const response = await apiClient.get(`${BASE_URL}/sales/prospects`, { params });
    return response.data;
  },

  // ============================================
  // MATCHING / PROPERTIES
  // ============================================

  /**
   * Performance matching CRM (prospects <-> properties)
   */
  getCRMMatchingPerformance: async (params?: AIMetricsQueryParams): Promise<CRMMatchingPerformance> => {
    const response = await apiClient.get(`${BASE_URL}/crm-matching`, { params });
    return response.data;
  },

  /**
   * Performance des proprietes
   */
  getPropertiesPerformance: async (params?: AIMetricsQueryParams): Promise<PropertiesPerformance> => {
    const response = await apiClient.get(`${BASE_URL}/properties`, { params });
    return response.data;
  },

  /**
   * Top proprietes
   */
  getTopProperties: async (params?: AIMetricsQueryParams & { limit?: number }): Promise<TopProperties> => {
    const response = await apiClient.get(`${BASE_URL}/properties/top`, { params });
    return response.data;
  },

  // ============================================
  // UNIFIED ROI & DASHBOARD
  // ============================================

  /**
   * ROI unifie multi-modules
   */
  getUnifiedROI: async (params?: AIMetricsQueryParams): Promise<UnifiedROI> => {
    const response = await apiClient.get(`${BASE_URL}/roi`, { params });
    return response.data;
  },

  /**
   * Dashboard unifie complet avec alertes
   */
  getUnifiedDashboard: async (params?: AIMetricsQueryParams): Promise<UnifiedDashboard> => {
    const response = await apiClient.get(`${BASE_URL}/dashboard`, { params });
    return response.data;
  },
};

export default aiMetricsAPI;
