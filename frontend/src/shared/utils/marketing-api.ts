import apiClient from '../../../shared/utils/backend-api';

// ==================== TYPES ====================

export interface MarketingOverview {
  campaigns: { total: number; active: number; draft: number; completed: number };
  tracking: { totalEvents: number; conversionRate: number; activePlatforms: number };
  seo: { optimizedCount: number; averageScore: number; totalProperties: number };
  prospects: { total: number; fromMarketing: number; conversionRate: number };
}

export interface CampaignSummary {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp' | 'mixed';
  status: 'draft' | 'active' | 'paused' | 'completed';
  stats?: { sent: number; delivered: number; opened: number; clicked: number; converted: number };
  createdAt: string;
}

export interface TrackingDashboard {
  realTimeEvents: any[];
  platformPerformance: any[];
  eventsByType: any[];
  timeline: any[];
  topEvents: any[];
}

export interface SeoProperty {
  id: string;
  title: string;
  city: string;
  seoOptimized: boolean;
  seoScore: number;
}

// ==================== API CALLS ====================

export const marketingAPI = {
  // --- Overview ---
  getOverview: async (): Promise<MarketingOverview> => {
    const [campaigns, tracking, prospects] = await Promise.all([
      apiClient.get('/campaigns').catch(() => ({ data: { campaigns: [] } })),
      apiClient.get('/marketing-tracking/analytics/dashboard').catch(() => ({ data: {} })),
      apiClient.get('/prospects').catch(() => ({ data: { prospects: [] } })),
    ]);

    const campaignList = campaigns.data?.campaigns || [];
    const trackingData = tracking.data || {};
    const prospectList = prospects.data?.prospects || [];

    return {
      campaigns: {
        total: campaignList.length,
        active: campaignList.filter((c: any) => c.status === 'active').length,
        draft: campaignList.filter((c: any) => c.status === 'draft').length,
        completed: campaignList.filter((c: any) => c.status === 'completed').length,
      },
      tracking: {
        totalEvents: trackingData.totalEvents || 0,
        conversionRate: trackingData.conversionRate || 0,
        activePlatforms: trackingData.activePlatforms || 0,
      },
      seo: { optimizedCount: 0, averageScore: 0, totalProperties: 0 },
      prospects: {
        total: prospectList.length,
        fromMarketing: prospectList.filter((p: any) => p.source === 'marketing').length,
        conversionRate: 0,
      },
    };
  },

  // --- Campaigns ---
  getCampaigns: async (filters?: Record<string, any>): Promise<CampaignSummary[]> => {
    const response = await apiClient.get('/campaigns', { params: filters });
    return response.data?.campaigns || [];
  },

  // --- Tracking Dashboard ---
  getTrackingDashboard: async (period?: string): Promise<TrackingDashboard> => {
    const response = await apiClient.get('/marketing-tracking/analytics/dashboard', {
      params: { period },
    });
    return response.data || {};
  },

  // --- SEO ---
  getSeoProperties: async (): Promise<SeoProperty[]> => {
    const response = await apiClient.get('/properties');
    return (response.data?.properties || response.data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      city: p.city,
      seoOptimized: p.seoOptimized || false,
      seoScore: p.seoScore || 0,
    }));
  },

  // --- AI / ML ---
  getAiSuggestions: async () => {
    const response = await apiClient
      .get('/marketing-tracking/automation/suggestions')
      .catch(() => ({ data: [] }));
    return response.data || [];
  },

  getAnomalies: async () => {
    const response = await apiClient
      .get('/marketing-tracking/ml/anomalies?platform=facebook')
      .catch(() => ({ data: [] }));
    return response.data || [];
  },

  getAutomationConfig: async () => {
    const response = await apiClient
      .get('/marketing-tracking/automation/config')
      .catch(() => ({ data: null }));
    return response.data;
  },
};
