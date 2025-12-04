// Types pour AI Metrics Prospecting API

// Query params communs
export interface AIMetricsQueryParams {
  agencyId?: string;
  userId?: string;
  campaignId?: string;
  from?: string;
  to?: string;
}

export interface TimeSeriesQueryParams extends AIMetricsQueryParams {
  granularity?: 'day' | 'week' | 'month';
}

// ============================================
// PROSPECTING OVERVIEW
// ============================================

export interface ProspectingOverview {
  totalLeadsProcessed: number;
  leadsWithLLMAnalysis: number;
  llmCoverageRate: number;
  totalMatches: number;
  qualifiedMatches: number;
  matchQualificationRate: number;
  avgSeriousnessScore: number;
  avgMatchScore: number;
  convertedLeads: number;
  conversionRate: number;
  period: {
    from: string;
    to: string;
  };
}

// ============================================
// DISTRIBUTIONS
// ============================================

export interface Distribution {
  count: number;
  percentage: number;
}

export interface LeadTypeDistribution extends Distribution {
  leadType: string;
}

export interface IntentionDistribution extends Distribution {
  intention: string;
}

export interface UrgencyDistribution extends Distribution {
  urgency: string;
}

export interface ValidationStatusDistribution extends Distribution {
  validationStatus: string;
}

// ============================================
// LLM QUALITY
// ============================================

export interface LLMQualityMetrics {
  totalAnalyzed: number;
  seriousnessDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  avgSeriousnessScore: number;
  medianSeriousnessScore: number;
  validLeadDetectionRate: number;
  spamDetectionRate: number;
  avgDataCompleteness: number;
}

// ============================================
// MATCHING PERFORMANCE
// ============================================

export interface MatchingPerformance {
  totalMatches: number;
  qualifiedMatches: number;
  qualificationRate: number;
  avgScore: number;
  medianScore: number;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  conversionFunnel: {
    pending: number;
    notified: number;
    contacted: number;
    converted: number;
    ignored: number;
  };
}

// ============================================
// TIME SERIES
// ============================================

export interface TimeSeriesDataPoint {
  date: string;
  leadsCreated: number;
  leadsAnalyzed: number;
  matchesCreated: number;
  qualifiedMatches: number;
  avgSeriousnessScore: number;
  avgMatchScore: number;
  conversions: number;
}

// ============================================
// SOURCE & CAMPAIGN PERFORMANCE
// ============================================

export interface SourcePerformance {
  source: string;
  leadsCount: number;
  avgSeriousnessScore: number;
  validRate: number;
  spamRate: number;
  conversionRate: number;
  matchesGenerated: number;
  avgMatchScore: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  status: string;
  type: string;
  leadsFound: number;
  leadsAnalyzed: number;
  avgSeriousnessScore: number;
  matchesCount: number;
  qualifiedMatches: number;
  avgMatchScore: number;
  conversionRate: number;
  efficiencyScore: number;
}

// ============================================
// SALES / PIPELINE
// ============================================

export interface SalesFunnel {
  leadsGenerated: number;
  leadsQualified: number;
  prospectsCreated: number;
  prospectsActive: number;
  appointmentsScheduled: number;
  appointmentsCompleted: number;
  visitsCompleted: number;
  offersMade: number;
  contractsSigned: number;
  conversionRates: {
    leadsToQualified: number;
    qualifiedToProspects: number;
    prospectsToAppointments: number;
    appointmentsToVisits: number;
    visitsToOffers: number;
    offersToContracts: number;
    overallLeadsToContracts: number;
  };
  period: { from: string; to: string };
}

export interface AppointmentsPerformance {
  totalAppointments: number;
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  attendanceRate: number;
  noShowRate: number;
  avgRating: number;
  avgDurationMinutes: number;
  appointmentsWithConversion: number;
  appointmentToConversionRate: number;
}

export interface ConversionMetrics {
  totalConversions: number;
  totalValue: number;
  avgConversionValue: number;
  byEventType: {
    eventType: string;
    count: number;
    totalValue: number;
    avgValue: number;
  }[];
  bySource: {
    source: string;
    count: number;
    totalValue: number;
  }[];
  avgTimeToConversionDays: number;
}

export interface ProspectsPerformance {
  totalProspects: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  byType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  avgScore: number;
  prospectsWithMatches: number;
  prospectsWithAppointments: number;
  convertedThisMonth: number;
  overallConversionRate: number;
}

// ============================================
// MATCHING / PROPERTIES
// ============================================

export interface CRMMatchingPerformance {
  totalMatches: number;
  excellentMatches: number;
  goodMatches: number;
  averageMatches: number;
  poorMatches: number;
  avgScore: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  matchToVisitRate: number;
  scoreConversionCorrelation: {
    scoreRange: string;
    matches: number;
    conversions: number;
    conversionRate: number;
  }[];
}

export interface PropertiesPerformance {
  totalProperties: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  byType: {
    type: string;
    count: number;
    avgPrice: number;
  }[];
  byCategory: {
    category: string;
    count: number;
    totalValue: number;
  }[];
  avgPrice: number;
  propertiesWithMatches: number;
  featuredProperties: number;
  avgDaysOnMarket: number;
  soldRentedRate: number;
}

export interface TopProperties {
  byMatchCount: {
    id: string;
    title: string;
    type: string;
    city: string;
    price: number;
    matchCount: number;
    avgMatchScore: number;
  }[];
  byMatchScore: {
    id: string;
    title: string;
    type: string;
    city: string;
    price: number;
    avgMatchScore: number;
    matchCount: number;
  }[];
  recentlySold: {
    id: string;
    title: string;
    type: string;
    city: string;
    price: number;
    soldDate: string;
    daysOnMarket: number;
  }[];
}

// ============================================
// UNIFIED ROI
// ============================================

export interface UnifiedROI {
  totalAICost: number;
  costByModule: {
    prospecting: number;
    matching: number;
    validation: number;
    other: number;
  };
  totalRevenue: number;
  overallROI: number;
  costPerLead: number;
  costPerProspect: number;
  costPerConversion: number;
  avgRevenuePerConversion: number;
  roiBySource: {
    source: string;
    cost: number;
    revenue: number;
    roi: number;
    conversions: number;
  }[];
  roiTrend: {
    date: string;
    cost: number;
    revenue: number;
    roi: number;
  }[];
  period: { from: string; to: string };
}

// ============================================
// UNIFIED DASHBOARD
// ============================================

export interface UnifiedDashboard {
  prospecting: ProspectingOverview;
  salesFunnel: SalesFunnel;
  crmMatching: CRMMatchingPerformance;
  properties: PropertiesPerformance;
  roi: UnifiedROI;
  alerts: {
    type: 'warning' | 'info' | 'success';
    message: string;
    metric: string;
    value: number;
  }[];
}

// ============================================
// TOP PERFORMERS (Prospecting)
// ============================================

export interface TopPerformers {
  topLeadsBySeriousness: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    seriousnessScore: number;
    leadType: string;
    city: string;
  }[];
  topMatchesByScore: {
    id: string;
    leadId: string;
    propertyId: string;
    score: number;
    status: string;
    isQualified: boolean;
  }[];
  topCampaigns: {
    id: string;
    name: string;
    leadsCount: number;
    conversionRate: number;
    efficiencyScore: number;
  }[];
}

// ============================================
// BUDGET & LOCATION
// ============================================

export interface BudgetAnalysis {
  avgBudgetMin: number;
  avgBudgetMax: number;
  budgetRangeDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  budgetCoverageRate: number;
  primaryCurrency: string;
}

export interface LocationPerformance {
  city: string;
  country: string;
  leadsCount: number;
  avgSeriousnessScore: number;
  matchesCount: number;
  avgMatchScore: number;
  qualificationRate: number;
  conversionRate: number;
}

export interface ContactValidationMetrics {
  totalValidations: number;
  emailValidations: number;
  phoneValidations: number;
  validRate: number;
  spamRate: number;
  disposableRate: number;
  resultDistribution: {
    valid: number;
    invalid: number;
    spam: number;
    disposable: number;
    catchAll: number;
  };
}
