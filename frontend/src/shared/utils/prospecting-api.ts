import apiClient from './backend-api';

// Types
export interface ProspectingCampaign {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'geographic' | 'demographic' | 'behavioral' | 'custom';
  config: any;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetCount?: number;
  foundCount: number;
  matchedCount: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  propertyType?: string;
  budget?: number;
  source?: string;
  sourceUrl?: string;
  score: number;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'rejected';
  matchedPropertyIds?: string[];
  metadata?: any;
  convertedProspectId?: string;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProspectingMatch {
  id: string;
  leadId: string;
  prospectId?: string;
  propertyId: string;
  score: number;
  reason: any;
  status: 'pending' | 'notified' | 'contacted' | 'converted' | 'ignored';
  notifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  property?: any;
  prospect?: any;
}

export interface ProspectingStats {
  total: number;
  byStatus: any[];
  avgScore: number;
  converted: number;
  conversionRate: number;
}

export const prospectingAPI = {
  // ============================================
  // CAMPAIGNS
  // ============================================

  createCampaign: async (data: {
    name: string;
    description?: string;
    type?: string;
    config?: any;
    targetCount?: number;
  }): Promise<ProspectingCampaign> => {
    const response = await apiClient.post('/prospecting/campaigns', data);
    return response.data;
  },

  getCampaigns: async (filters?: {
    status?: string;
    type?: string;
  }): Promise<ProspectingCampaign[]> => {
    const response = await apiClient.get('/prospecting/campaigns', { params: filters });
    return response.data;
  },

  getCampaignById: async (id: string): Promise<ProspectingCampaign> => {
    const response = await apiClient.get(`/prospecting/campaigns/${id}`);
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

  deleteCampaign: async (id: string): Promise<any> => {
    const response = await apiClient.delete(`/prospecting/campaigns/${id}`);
    return response.data;
  },

  getCampaignStats: async (id: string): Promise<ProspectingStats> => {
    const response = await apiClient.get(`/prospecting/campaigns/${id}/stats`);
    return response.data;
  },

  // ============================================
  // LEADS
  // ============================================

  getLeads: async (campaignId: string, filters?: {
    status?: string;
    minScore?: number;
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

  convertLead: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/prospecting/leads/${id}/convert`);
    return response.data;
  },

  getLeadMatches: async (id: string): Promise<ProspectingMatch[]> => {
    const response = await apiClient.get(`/prospecting/leads/${id}/matches`);
    return response.data;
  },

  findMatches: async (id: string): Promise<ProspectingMatch[]> => {
    const response = await apiClient.post(`/prospecting/leads/${id}/find-matches`);
    return response.data;
  },

  // ============================================
  // MATCHES
  // ============================================

  notifyMatch: async (id: string): Promise<any> => {
    const response = await apiClient.post(`/prospecting/matches/${id}/notify`);
    return response.data;
  },

  // ============================================
  // STATS
  // ============================================

  getGlobalStats: async (): Promise<any> => {
    const response = await apiClient.get('/prospecting/stats');
    return response.data;
  },

  // ============================================
  // UTILS
  // ============================================

  validateEmails: async (emails: string[]): Promise<any> => {
    const response = await apiClient.post('/prospecting/validate-emails', { emails });
    return response.data;
  },

  getLocations: async (country?: string): Promise<any> => {
    const response = await apiClient.get('/prospecting/locations', {
      params: { country },
    });
    return response.data;
  },
};

// Helper functions
export const getCampaignTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    geographic: 'Géographique',
    demographic: 'Démographique',
    behavioral: 'Comportemental',
    custom: 'Personnalisée',
  };
  return labels[type] || type;
};

export const getCampaignStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    active: 'Active',
    paused: 'En pause',
    completed: 'Terminée',
  };
  return labels[status] || status;
};

export const getLeadStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    new: 'Nouveau',
    contacted: 'Contacté',
    qualified: 'Qualifié',
    converted: 'Converti',
    rejected: 'Rejeté',
  };
  return labels[status] || status;
};

export const getCampaignStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getLeadStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-green-100 text-green-800',
    converted: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
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
