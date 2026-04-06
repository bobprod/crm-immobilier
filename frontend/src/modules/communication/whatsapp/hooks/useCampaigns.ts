import { useState, useCallback } from 'react';
import useSWR from 'swr';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper for authenticated requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return { Authorization: `Bearer ${token}` };
};

const fetcher = async (url: string) => {
  const response = await axios.get(`${API_BASE_URL}${url}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// Types
export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum CampaignType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  templateId: string;
  templateName: string;
  recipients: CampaignRecipient[];
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  stats: CampaignStats;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignRecipient {
  contactId?: string;
  phoneNumber: string;
  name?: string;
  variables?: Record<string, string>;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  errorMessage?: string;
}

export interface CampaignStats {
  totalRecipients: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  successRate: number;
  readRate: number;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: CampaignType;
  templateId: string;
  recipients: {
    contactId?: string;
    phoneNumber: string;
    variables?: Record<string, string>;
  }[];
  scheduledAt?: Date;
}

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  scheduledAt?: Date;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  type?: CampaignType;
  search?: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Hook for WhatsApp Campaigns & Broadcasting
 */
export function useCampaigns(filters?: CampaignFilters) {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isPausing, setIsPausing] = useState(false);

  // Build query string
  const buildQueryString = useCallback(() => {
    if (!filters) return '';

    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  }, [filters]);

  // Fetch campaigns
  const {
    data: campaignsResponse,
    error,
    isLoading,
    mutate,
  } = useSWR<CampaignsResponse>(
    `/whatsapp/campaigns${buildQueryString()}`,
    fetcher
  );

  const campaigns = campaignsResponse?.campaigns || [];
  const total = campaignsResponse?.total || 0;

  // Create campaign
  const createCampaign = async (data: CreateCampaignDto): Promise<Campaign> => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns`,
        data,
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la campagne');
    } finally {
      setIsCreating(false);
    }
  };

  // Update campaign
  const updateCampaign = async (id: string, data: UpdateCampaignDto): Promise<Campaign> => {
    setIsUpdating(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/whatsapp/campaigns/${id}`,
        data,
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete campaign
  const deleteCampaign = async (id: string): Promise<void> => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/whatsapp/campaigns/${id}`, {
        headers: getAuthHeaders(),
      });
      await mutate();
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  // Get single campaign
  const getCampaign = async (id: string): Promise<Campaign> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/campaigns/${id}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  };

  // Launch campaign
  const launchCampaign = async (id: string): Promise<Campaign> => {
    setIsLaunching(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns/${id}/launch`,
        {},
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors du lancement');
    } finally {
      setIsLaunching(false);
    }
  };

  // Pause campaign
  const pauseCampaign = async (id: string): Promise<Campaign> => {
    setIsPausing(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns/${id}/pause`,
        {},
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la pause');
    } finally {
      setIsPausing(false);
    }
  };

  // Resume campaign
  const resumeCampaign = async (id: string): Promise<Campaign> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns/${id}/resume`,
        {},
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la reprise');
    }
  };

  // Cancel campaign
  const cancelCampaign = async (id: string): Promise<Campaign> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/campaigns/${id}/cancel`,
        {},
        { headers: getAuthHeaders() }
      );
      await mutate();
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'annulation');
    }
  };

  // Get campaign recipients
  const getRecipients = async (id: string): Promise<CampaignRecipient[]> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/whatsapp/campaigns/${id}/recipients`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la récupération');
    }
  };

  // Get status counts
  const getStatusCounts = useCallback(() => {
    const counts = {
      draft: 0,
      scheduled: 0,
      running: 0,
      completed: 0,
      paused: 0,
      cancelled: 0,
    };

    campaigns.forEach((campaign) => {
      counts[campaign.status]++;
    });

    return counts;
  }, [campaigns]);

  // Get type counts
  const getTypeCounts = useCallback(() => {
    const counts = {
      immediate: 0,
      scheduled: 0,
      recurring: 0,
    };

    campaigns.forEach((campaign) => {
      counts[campaign.type]++;
    });

    return counts;
  }, [campaigns]);

  // Get overall stats
  const getOverallStats = useCallback(() => {
    const stats = {
      totalCampaigns: campaigns.length,
      totalRecipients: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalRead: 0,
      totalFailed: 0,
      avgSuccessRate: 0,
      avgReadRate: 0,
    };

    campaigns.forEach((campaign) => {
      stats.totalRecipients += campaign.stats.totalRecipients;
      stats.totalSent += campaign.stats.sent;
      stats.totalDelivered += campaign.stats.delivered;
      stats.totalRead += campaign.stats.read;
      stats.totalFailed += campaign.stats.failed;
    });

    if (stats.totalSent > 0) {
      stats.avgSuccessRate = (stats.totalDelivered / stats.totalSent) * 100;
    }

    if (stats.totalDelivered > 0) {
      stats.avgReadRate = (stats.totalRead / stats.totalDelivered) * 100;
    }

    return stats;
  }, [campaigns]);

  // Duplicate campaign
  const duplicateCampaign = async (id: string): Promise<Campaign> => {
    try {
      const original = await getCampaign(id);

      const data: CreateCampaignDto = {
        name: `${original.name} (copie)`,
        description: original.description,
        type: original.type,
        templateId: original.templateId,
        recipients: original.recipients.map((r) => ({
          contactId: r.contactId,
          phoneNumber: r.phoneNumber,
          variables: r.variables,
        })),
      };

      return await createCampaign(data);
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors de la duplication');
    }
  };

  return {
    // Data
    campaigns,
    total,
    isLoading,
    error,

    // CRUD
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaign,
    duplicateCampaign,

    // Actions
    launchCampaign,
    pauseCampaign,
    resumeCampaign,
    cancelCampaign,
    getRecipients,

    // Stats
    getStatusCounts,
    getTypeCounts,
    getOverallStats,

    // Loading states
    isCreating,
    isUpdating,
    isDeleting,
    isLaunching,
    isPausing,

    // Mutate
    mutate,
  };
}

/**
 * Get campaign status label
 */
export function getCampaignStatusLabel(status: CampaignStatus): string {
  const labels = {
    [CampaignStatus.DRAFT]: 'Brouillon',
    [CampaignStatus.SCHEDULED]: 'Planifiée',
    [CampaignStatus.RUNNING]: 'En cours',
    [CampaignStatus.COMPLETED]: 'Terminée',
    [CampaignStatus.PAUSED]: 'En pause',
    [CampaignStatus.CANCELLED]: 'Annulée',
  };

  return labels[status] || status;
}

/**
 * Get campaign status color
 */
export function getCampaignStatusColor(status: CampaignStatus): string {
  const colors = {
    [CampaignStatus.DRAFT]: 'gray',
    [CampaignStatus.SCHEDULED]: 'blue',
    [CampaignStatus.RUNNING]: 'green',
    [CampaignStatus.COMPLETED]: 'purple',
    [CampaignStatus.PAUSED]: 'yellow',
    [CampaignStatus.CANCELLED]: 'red',
  };

  return colors[status] || 'gray';
}
