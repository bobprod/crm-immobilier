import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useProspecting } from '@/shared/hooks/useProspecting';
import {
  ProspectingCampaign,
  ProspectingLead,
  ProspectingMatch,
  ProspectingStats,
  LeadStatus,
  CampaignStatus,
} from '@/shared/utils/prospecting-api';

// ============================================
// TYPES
// ============================================

export type TabType = 'campaigns' | 'ai-prospection' | 'leads' | 'historique' | 'targeting' | 'funnel' | 'scraping';
export type LeadsSubTabType = 'list' | 'funnel' | 'validation';

interface ValidationResult {
  leadId: string;
  email?: {
    valid: boolean;
    score: number;
    issues?: string[];
  };
  phone?: {
    valid: boolean;
    formatted?: string;
  };
  overall: {
    score: number;
    status: 'valid' | 'suspicious' | 'spam';
  };
}

interface CleaningResult {
  leadId: string;
  changes: { field: string; before: any; after: any }[];
  qualityScoreBefore: number;
  qualityScoreAfter: number;
}

interface ProspectingContextType {
  // State
  campaigns: ProspectingCampaign[];
  leads: ProspectingLead[];
  selectedCampaignId: string | null;
  selectedLeads: string[];
  validationResults: Map<string, ValidationResult>;
  cleaningResults: Map<string, CleaningResult>;
  globalStats: ProspectingStats | null;

  // Navigation
  activeTab: TabType;
  activeLeadsSubTab: LeadsSubTabType;
  setActiveTab: (tab: TabType) => void;
  setActiveLeadsSubTab: (subTab: LeadsSubTabType) => void;

  // Campaign actions
  setSelectedCampaignId: (id: string | null) => void;
  refreshCampaigns: () => Promise<void>;

  // Lead actions
  setSelectedLeads: (ids: string[]) => void;
  refreshLeads: () => Promise<void>;
  updateLeadInContext: (leadId: string, data: Partial<ProspectingLead>) => void;

  // Validation & Cleaning
  addValidationResult: (leadId: string, result: ValidationResult) => void;
  addCleaningResult: (leadId: string, result: CleaningResult) => void;

  // Derived stats
  validationStats: {
    total: number;
    validated: number;
    pending: number;
    spam: number;
    qualified: number;
    validationRate: number;
  };

  // Loading states
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// ============================================
// CONTEXT
// ============================================

const ProspectingContext = createContext<ProspectingContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface ProspectingProviderProps {
  children: React.ReactNode;
}

export const ProspectingProvider: React.FC<ProspectingProviderProps> = ({ children }) => {
  const router = useRouter();
  const prospecting = useProspecting();

  // Navigation state
  const [activeTab, setActiveTabState] = useState<TabType>('campaigns');
  const [activeLeadsSubTab, setActiveLeadsSubTabState] = useState<LeadsSubTabType>('list');

  // Selection state
  const [selectedCampaignId, setSelectedCampaignIdState] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // Validation & Cleaning results
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(new Map());
  const [cleaningResults, setCleaningResults] = useState<Map<string, CleaningResult>>(new Map());

  // ============================================
  // URL SYNC - Sync state with URL params
  // ============================================

  // Initialize from URL on mount
  useEffect(() => {
    const { tab, subtab, campaign } = router.query;

    if (tab && typeof tab === 'string') {
      setActiveTabState(tab as TabType);
    }

    if (subtab && typeof subtab === 'string') {
      setActiveLeadsSubTabState(subtab as LeadsSubTabType);
    }

    if (campaign && typeof campaign === 'string') {
      setSelectedCampaignIdState(campaign);
    }
  }, [router.query]);

  // Update URL when state changes
  const setActiveTab = useCallback((tab: TabType) => {
    setActiveTabState(tab);

    // Update URL without full navigation
    const query: Record<string, string> = { tab };
    if (selectedCampaignId) query.campaign = selectedCampaignId;

    router.replace(
      { pathname: router.pathname, query },
      undefined,
      { shallow: true }
    );
  }, [router, selectedCampaignId]);

  const setActiveLeadsSubTab = useCallback((subTab: LeadsSubTabType) => {
    setActiveLeadsSubTabState(subTab);

    // Update URL
    const query: Record<string, string> = { tab: activeTab, subtab: subTab };
    if (selectedCampaignId) query.campaign = selectedCampaignId;

    router.replace(
      { pathname: router.pathname, query },
      undefined,
      { shallow: true }
    );
  }, [router, activeTab, selectedCampaignId]);

  const setSelectedCampaignId = useCallback((id: string | null) => {
    setSelectedCampaignIdState(id);

    // Load leads for the campaign
    if (id) {
      prospecting.loadLeads(id);
    }

    // Update URL
    const query: Record<string, string> = { tab: activeTab };
    if (activeLeadsSubTab !== 'list') query.subtab = activeLeadsSubTab;
    if (id) query.campaign = id;

    router.replace(
      { pathname: router.pathname, query },
      undefined,
      { shallow: true }
    );
  }, [router, activeTab, activeLeadsSubTab, prospecting]);

  // ============================================
  // DATA REFRESH
  // ============================================

  const refreshCampaigns = useCallback(async () => {
    await prospecting.loadCampaigns();
    await prospecting.loadAllStats();
  }, [prospecting]);

  const refreshLeads = useCallback(async () => {
    if (selectedCampaignId) {
      await prospecting.loadLeads(selectedCampaignId);
    }
  }, [selectedCampaignId, prospecting]);

  const updateLeadInContext = useCallback((leadId: string, data: Partial<ProspectingLead>) => {
    prospecting.updateLead(leadId, data);
  }, [prospecting]);

  // ============================================
  // VALIDATION & CLEANING
  // ============================================

  const addValidationResult = useCallback((leadId: string, result: ValidationResult) => {
    setValidationResults(prev => {
      const newMap = new Map(prev);
      newMap.set(leadId, result);
      return newMap;
    });
  }, []);

  const addCleaningResult = useCallback((leadId: string, result: CleaningResult) => {
    setCleaningResults(prev => {
      const newMap = new Map(prev);
      newMap.set(leadId, result);
      return newMap;
    });

    // Trigger leads refresh after cleaning
    refreshLeads();
  }, [refreshLeads]);

  // ============================================
  // DERIVED STATS
  // ============================================

  const validationStats = useMemo(() => {
    const leads = prospecting.leads;
    const total = leads.length;
    const validated = leads.filter(l => l.validated).length;
    const pending = leads.filter(l => !l.validated && !l.spam).length;
    const spam = leads.filter(l => l.spam).length;
    const qualified = leads.filter(l => l.validated && l.qualified).length;
    const validationRate = total > 0 ? (validated / total) * 100 : 0;

    return {
      total,
      validated,
      pending,
      spam,
      qualified,
      validationRate,
    };
  }, [prospecting.leads]);

  // ============================================
  // AUTO-SYNC BETWEEN TABS
  // ============================================

  // When validation is complete, refresh stats
  useEffect(() => {
    if (validationResults.size > 0) {
      prospecting.loadAllStats();
    }
  }, [validationResults.size, prospecting]);

  // When cleaning is complete, refresh leads and stats
  useEffect(() => {
    if (cleaningResults.size > 0) {
      prospecting.loadAllStats();
    }
  }, [cleaningResults.size, prospecting]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: ProspectingContextType = {
    // State from hook
    campaigns: prospecting.campaigns,
    leads: prospecting.leads,
    globalStats: prospecting.globalStats,

    // Local state
    selectedCampaignId,
    selectedLeads,
    validationResults,
    cleaningResults,

    // Navigation
    activeTab,
    activeLeadsSubTab,
    setActiveTab,
    setActiveLeadsSubTab,

    // Campaign actions
    setSelectedCampaignId,
    refreshCampaigns,

    // Lead actions
    setSelectedLeads,
    refreshLeads,
    updateLeadInContext,

    // Validation & Cleaning
    addValidationResult,
    addCleaningResult,

    // Derived stats
    validationStats,

    // Loading states
    loading: prospecting.loading,
    error: prospecting.error,
    clearError: prospecting.clearError,
  };

  return (
    <ProspectingContext.Provider value={value}>
      {children}
    </ProspectingContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useProspectingContext = (): ProspectingContextType => {
  const context = useContext(ProspectingContext);

  if (context === undefined) {
    throw new Error('useProspectingContext must be used within a ProspectingProvider');
  }

  return context;
};

// ============================================
// EXPORTS
// ============================================

export default ProspectingContext;
