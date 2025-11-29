import apiClient from './backend-api';

// ============================================
// TYPES - Types pour la Prospection Intelligente
// ============================================

export type CampaignType = 'geographic' | 'demographic' | 'behavioral' | 'custom' | 'requete' | 'mandat';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
export type LeadType = 'requete' | 'mandat'; // requete = cherche bien, mandat = a un bien
export type MatchStatus = 'pending' | 'notified' | 'contacted' | 'converted' | 'ignored';
export type ScrapingSource = 'pica' | 'serp' | 'firecrawl' | 'meta' | 'linkedin' | 'website';

export interface ProspectingCampaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: CampaignType;
  config: CampaignConfig;
  status: CampaignStatus;
  targetCount?: number;
  foundCount: number;
  matchedCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignConfig {
  // Geographic targeting
  locations?: string[];
  radius?: number;
  // Property criteria
  propertyTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  // Lead type
  leadType?: LeadType;
  // Sources
  sources?: ScrapingSource[];
  // Keywords
  keywords?: string[];
  // Schedule
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
  };
}

export interface BudgetRange {
  min?: number;
  max?: number;
  currency?: string;
}

export interface ProspectingLead {
  id: string;
  campaignId: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  propertyType?: string;
  budget?: number | BudgetRange;
  surface?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  rooms?: number;
  // Lead classification
  leadType: LeadType;
  source: ScrapingSource;
  sourceUrl?: string;
  // Scoring
  score: number;
  aiScore?: number;
  qualificationNotes?: string;
  // Status
  status: LeadStatus;
  matchedPropertyIds?: string[];
  metadata?: Record<string, any>;
  // Conversion
  convertedProspectId?: string;
  convertedAt?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProspectingMatch {
  id: string;
  leadId: string;
  prospectId?: string;
  propertyId: string;
  score: number;
  reason: MatchReason;
  status: MatchStatus;
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  property?: any;
  prospect?: any;
  lead?: ProspectingLead;
}

export interface MatchReason {
  priceMatch: number;
  locationMatch: number;
  surfaceMatch: number;
  typeMatch: number;
  amenitiesMatch?: number;
  details?: string[];
}

export interface ProspectingStats {
  total: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  bySource: { source: string; count: number }[];
  avgScore: number;
  converted: number;
  conversionRate: number;
}

export interface SourceStats {
  source: string;
  leadsCount: number;
  conversionRate: number;
  avgScore: number;
  cost?: number;
  roi?: number;
}

export interface ConversionStats {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgTimeToConvert: number;
  byStage: { stage: string; count: number; rate: number }[];
}

export interface ROIStats {
  totalInvestment: number;
  totalRevenue: number;
  roi: number;
  costPerLead: number;
  costPerConversion: number;
  bySource: { source: string; investment: number; revenue: number; roi: number }[];
}

export interface ScrapingConfig {
  query?: string;
  keywords?: string[];
  locations?: string[];
  leadType?: LeadType;
  maxResults?: number;
  filters?: Record<string, any>;
}

export interface AIDetectionConfig {
  content?: string;
  sources?: ScrapingSource[];
  leadType?: LeadType;
  keywords?: string[];
  locations?: string[];
  confidence?: number;
}

export interface ProspectingSource {
  id: string;
  name: string;
  type: ScrapingSource;
  enabled: boolean;
  configured: boolean;
  lastSync?: string;
  leadsCount: number;
}

// ============================================
// API CLIENT
// ============================================

export const prospectingAPI = {
  // ============================================
  // CAMPAIGNS - Campagnes de prospection
  // ============================================

  createCampaign: async (data: {
    name: string;
    description?: string;
    type?: CampaignType;
    config?: CampaignConfig;
    targetCount?: number;
  }): Promise<ProspectingCampaign> => {
    const response = await apiClient.post('/prospecting/campaigns', data);
    return response.data;
  },

  getCampaigns: async (filters?: {
    status?: CampaignStatus;
    type?: CampaignType;
  }): Promise<ProspectingCampaign[]> => {
    const response = await apiClient.get('/prospecting/campaigns', { params: filters });
    return response.data;
  },

  getCampaignById: async (id: string): Promise<ProspectingCampaign> => {
    const response = await apiClient.get(`/prospecting/campaigns/${id}`);
    return response.data;
  },

  updateCampaign: async (id: string, data: Partial<ProspectingCampaign>): Promise<ProspectingCampaign> => {
    const response = await apiClient.put(`/prospecting/campaigns/${id}`, data);
    return response.data;
  },

  deleteCampaign: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/prospecting/campaigns/${id}`);
    return response.data;
  },

  startCampaign: async (id: string): Promise<ProspectingCampaign> => {
    const response = await apiClient.post(`/prospecting/campaigns/${id}/start`);
    return response.data;
  },

  pauseCampaign: async (id: string): Promise<ProspectingCampaign> => {
    const response = await apiClient.post(`/prospecting/campaigns/${id}/pause`);
    return response.data;
  },

  resumeCampaign: async (id: string): Promise<ProspectingCampaign> => {
    const response = await apiClient.post(`/prospecting/campaigns/${id}/resume`);
    return response.data;
  },

  getCampaignStats: async (id: string): Promise<ProspectingStats> => {
    const response = await apiClient.get(`/prospecting/campaigns/${id}/stats`);
    return response.data;
  },

  // ============================================
  // LEADS - Leads generes par la prospection
  // ============================================

  getLeads: async (campaignId: string, filters?: {
    status?: LeadStatus;
    minScore?: number;
    leadType?: LeadType;
    limit?: number;
  }): Promise<ProspectingLead[]> => {
    const response = await apiClient.get(`/prospecting/campaigns/${campaignId}/leads`, {
      params: filters,
    });
    return response.data;
  },

  getLeadById: async (id: string): Promise<ProspectingLead> => {
    const response = await apiClient.get(`/prospecting/leads/${id}`);
    return response.data;
  },

  updateLead: async (id: string, data: Partial<ProspectingLead>): Promise<ProspectingLead> => {
    const response = await apiClient.put(`/prospecting/leads/${id}`, data);
    return response.data;
  },

  deleteLead: async (id: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/prospecting/leads/${id}`);
    return response.data;
  },

  convertLead: async (id: string): Promise<{ lead: ProspectingLead; prospect: any }> => {
    const response = await apiClient.post(`/prospecting/leads/${id}/convert`);
    return response.data;
  },

  qualifyLead: async (id: string): Promise<{ lead: ProspectingLead; qualification: any }> => {
    const response = await apiClient.post(`/prospecting/leads/${id}/qualify`);
    return response.data;
  },

  enrichLead: async (id: string): Promise<ProspectingLead> => {
    const response = await apiClient.post(`/prospecting/leads/${id}/enrich`);
    return response.data;
  },

  // ============================================
  // MATCHING - Correspondances leads/biens
  // ============================================

  findMatches: async (leadId: string): Promise<ProspectingMatch[]> => {
    const response = await apiClient.post(`/prospecting/leads/${leadId}/find-matches`);
    return response.data;
  },

  getLeadMatches: async (leadId: string): Promise<ProspectingMatch[]> => {
    const response = await apiClient.get(`/prospecting/leads/${leadId}/matches`);
    return response.data;
  },

  notifyMatch: async (matchId: string): Promise<{ success: boolean; notifiedAt: string }> => {
    const response = await apiClient.post(`/prospecting/matches/${matchId}/notify`);
    return response.data;
  },

  updateMatchStatus: async (matchId: string, status: MatchStatus): Promise<ProspectingMatch> => {
    const response = await apiClient.put(`/prospecting/matches/${matchId}/status`, { status });
    return response.data;
  },

  // ============================================
  // SOURCES - Sources de donnees
  // ============================================

  getSources: async (): Promise<ProspectingSource[]> => {
    const response = await apiClient.get('/prospecting/sources');
    return response.data;
  },

  testSource: async (source: ScrapingSource): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/prospecting/sources/test', { source });
    return response.data;
  },

  // ============================================
  // SCRAPING - Extraction de donnees
  // ============================================

  scrapeSERP: async (config: ScrapingConfig): Promise<{ leads: ProspectingLead[]; count: number }> => {
    const response = await apiClient.post('/prospecting/scrape/serp', config);
    return response.data;
  },

  scrapeFirecrawl: async (urls: string[], config?: any): Promise<{ leads: ProspectingLead[]; count: number }> => {
    const response = await apiClient.post('/prospecting/scrape/firecrawl', { urls, config });
    return response.data;
  },

  scrapePica: async (config: ScrapingConfig): Promise<{ leads: ProspectingLead[]; count: number }> => {
    const response = await apiClient.post('/prospecting/scrape/pica', config);
    return response.data;
  },

  scrapeSocial: async (platform: 'meta' | 'linkedin', query: string, config?: any): Promise<{ leads: ProspectingLead[]; count: number }> => {
    const response = await apiClient.post('/prospecting/scrape/social', { platform, query, config });
    return response.data;
  },

  scrapeWebsites: async (urls: string[], selectors?: any): Promise<{ leads: ProspectingLead[]; count: number }> => {
    const response = await apiClient.post('/prospecting/scrape/websites', { urls, selectors });
    return response.data;
  },

  // ============================================
  // AI DETECTION - Detection IA d opportunites
  // ============================================

  detectOpportunities: async (config: AIDetectionConfig): Promise<{ opportunities: ProspectingLead[]; count: number }> => {
    const response = await apiClient.post('/prospecting/ai/detect-opportunities', config);
    return response.data;
  },

  analyzeContent: async (content: string, source?: string): Promise<{ leads: ProspectingLead[]; analysis: any }> => {
    const response = await apiClient.post('/prospecting/ai/analyze-content', { content, source });
    return response.data;
  },

  classifyLead: async (leadId: string): Promise<{ leadId: string; type: LeadType; confidence: number; reasoning: string }> => {
    const response = await apiClient.post('/prospecting/ai/classify-lead', { leadId });
    return response.data;
  },

  // ============================================
  // STATISTICS - Statistiques
  // ============================================

  getGlobalStats: async (): Promise<ProspectingStats> => {
    const response = await apiClient.get('/prospecting/stats');
    return response.data;
  },

  getStatsBySource: async (): Promise<SourceStats[]> => {
    const response = await apiClient.get('/prospecting/stats/sources');
    return response.data;
  },

  getConversionStats: async (): Promise<ConversionStats> => {
    const response = await apiClient.get('/prospecting/stats/conversion');
    return response.data;
  },

  getROIStats: async (): Promise<ROIStats> => {
    const response = await apiClient.get('/prospecting/stats/roi');
    return response.data;
  },

  // ============================================
  // UTILS - Utilitaires
  // ============================================

  validateEmails: async (emails: string[]): Promise<{ valid: string[]; invalid: string[] }> => {
    const response = await apiClient.post('/prospecting/validate-emails', { emails });
    return response.data;
  },

  validatePhones: async (phones: string[]): Promise<{ valid: string[]; invalid: string[] }> => {
    const response = await apiClient.post('/prospecting/validate-phones', { phones });
    return response.data;
  },

  getLocations: async (country?: string): Promise<any> => {
    const response = await apiClient.get('/prospecting/locations', {
      params: { country },
    });
    return response.data;
  },

  deduplicateLeads: async (campaignId?: string): Promise<{ removed: number; remaining: number }> => {
    const response = await apiClient.post('/prospecting/deduplicate', { campaignId });
    return response.data;
  },

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  exportLeads: async (campaignId: string, format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> => {
    const response = await apiClient.get(`/prospecting/export/${campaignId}`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  importLeads: async (campaignId: string, leads: Partial<ProspectingLead>[]): Promise<{ imported: number; errors: any[] }> => {
    const response = await apiClient.post('/prospecting/import', { campaignId, leads });
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS - Fonctions utilitaires
// ============================================

export const getCampaignTypeLabel = (type: CampaignType): string => {
  const labels: Record<CampaignType, string> = {
    geographic: 'Géographique',
    demographic: 'Démographique',
    behavioral: 'Comportemental',
    custom: 'Personnalisée',
    requete: 'Requête (Acheteurs/Locataires)',
    mandat: 'Mandat (Vendeurs/Bailleurs)',
  };
  return labels[type] || type;
};

export const getCampaignStatusLabel = (status: CampaignStatus): string => {
  const labels: Record<CampaignStatus, string> = {
    draft: 'Brouillon',
    active: 'Active',
    paused: 'En pause',
    completed: 'Terminée',
  };
  return labels[status] || status;
};

export const getLeadStatusLabel = (status: LeadStatus): string => {
  const labels: Record<LeadStatus, string> = {
    new: 'Nouveau',
    contacted: 'Contacté',
    qualified: 'Qualifié',
    converted: 'Converti',
    rejected: 'Rejeté',
  };
  return labels[status] || status;
};

export const getLeadTypeLabel = (type: LeadType): string => {
  const labels: Record<LeadType, string> = {
    requete: 'Requête - Cherche un bien',
    mandat: 'Mandat - Possède un bien',
  };
  return labels[type] || type;
};

export const getSourceLabel = (source: ScrapingSource): string => {
  const labels: Record<ScrapingSource, string> = {
    pica: 'Pica API',
    serp: 'Google SERP',
    firecrawl: 'Firecrawl',
    meta: 'Meta/Facebook',
    linkedin: 'LinkedIn',
    website: 'Site Web',
  };
  return labels[source] || source;
};

export const getMatchStatusLabel = (status: MatchStatus): string => {
  const labels: Record<MatchStatus, string> = {
    pending: 'En attente',
    notified: 'Notifié',
    contacted: 'Contacté',
    converted: 'Converti',
    ignored: 'Ignoré',
  };
  return labels[status] || status;
};

export const getCampaignStatusColor = (status: CampaignStatus): string => {
  const colors: Record<CampaignStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getLeadStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-green-100 text-green-800',
    converted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getLeadTypeColor = (type: LeadType): string => {
  const colors: Record<LeadType, string> = {
    requete: 'bg-indigo-100 text-indigo-800',
    mandat: 'bg-amber-100 text-amber-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const getSourceColor = (source: ScrapingSource): string => {
  const colors: Record<ScrapingSource, string> = {
    pica: 'bg-purple-100 text-purple-800',
    serp: 'bg-blue-100 text-blue-800',
    firecrawl: 'bg-orange-100 text-orange-800',
    meta: 'bg-indigo-100 text-indigo-800',
    linkedin: 'bg-cyan-100 text-cyan-800',
    website: 'bg-gray-100 text-gray-800',
  };
  return colors[source] || 'bg-gray-100 text-gray-800';
};

export const getMatchStatusColor = (status: MatchStatus): string => {
  const colors: Record<MatchStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    notified: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
    ignored: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

export const getScoreBadgeColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-blue-100 text-blue-800';
  if (score >= 40) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

// ============================================
// DOWNLOAD HELPER
// ============================================

export const downloadExportFile = async (
  campaignId: string,
  format: 'csv' | 'xlsx' | 'json' = 'csv',
  filename?: string
): Promise<void> => {
  const blob = await prospectingAPI.exportLeads(campaignId, format);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `leads-${campaignId}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
