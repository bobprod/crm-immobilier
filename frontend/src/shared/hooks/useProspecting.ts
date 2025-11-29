import { useState, useCallback, useEffect } from 'react';
import {
  prospectingAPI,
  ProspectingCampaign,
  ProspectingLead,
  ProspectingMatch,
  ProspectingStats,
  ProspectingSource,
  SourceStats,
  ConversionStats,
  ROIStats,
  CampaignType,
  CampaignStatus,
  LeadStatus,
  LeadType,
  MatchStatus,
  ScrapingSource,
  ScrapingConfig,
  AIDetectionConfig,
  CampaignConfig,
  RawScrapedItem,
  LLMAnalysisResult,
  StructuredLead,
} from '../utils/prospecting-api';

// ============================================
// TYPES
// ============================================

interface UseProspectingState {
  // Data
  campaigns: ProspectingCampaign[];
  currentCampaign: ProspectingCampaign | null;
  leads: ProspectingLead[];
  currentLead: ProspectingLead | null;
  matches: ProspectingMatch[];
  sources: ProspectingSource[];
  // Stats
  globalStats: ProspectingStats | null;
  sourceStats: SourceStats[];
  conversionStats: ConversionStats | null;
  roiStats: ROIStats | null;
  // UI State
  loading: boolean;
  error: string | null;
  scrapingInProgress: boolean;
  aiProcessingInProgress: boolean;
}

// ============================================
// HOOK
// ============================================

export function useProspecting() {
  const [state, setState] = useState<UseProspectingState>({
    campaigns: [],
    currentCampaign: null,
    leads: [],
    currentLead: null,
    matches: [],
    sources: [],
    globalStats: null,
    sourceStats: [],
    conversionStats: null,
    roiStats: null,
    loading: false,
    error: null,
    scrapingInProgress: false,
    aiProcessingInProgress: false,
  });

  // Helper to update state
  const updateState = useCallback((updates: Partial<UseProspectingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper to handle errors
  const handleError = useCallback((error: any, context: string) => {
    const message = error?.response?.data?.message || error?.message || `Erreur: ${context}`;
    console.error(`[Prospecting] ${context}:`, error);
    updateState({ error: message, loading: false });
    return message;
  }, [updateState]);

  // ============================================
  // CAMPAIGNS
  // ============================================

  const loadCampaigns = useCallback(async (filters?: {
    status?: CampaignStatus;
    type?: CampaignType;
  }) => {
    updateState({ loading: true, error: null });
    try {
      const campaigns = await prospectingAPI.getCampaigns(filters);
      updateState({ campaigns, loading: false });
      return campaigns;
    } catch (error) {
      handleError(error, 'Chargement des campagnes');
      return [];
    }
  }, [updateState, handleError]);

  const loadCampaign = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const campaign = await prospectingAPI.getCampaignById(id);
      updateState({ currentCampaign: campaign, loading: false });
      return campaign;
    } catch (error) {
      handleError(error, 'Chargement de la campagne');
      return null;
    }
  }, [updateState, handleError]);

  const createCampaign = useCallback(async (data: {
    name: string;
    description?: string;
    type?: CampaignType;
    config?: CampaignConfig;
    targetCount?: number;
  }) => {
    updateState({ loading: true, error: null });
    try {
      const campaign = await prospectingAPI.createCampaign(data);
      setState(prev => ({
        ...prev,
        campaigns: [campaign, ...prev.campaigns],
        currentCampaign: campaign,
        loading: false,
      }));
      return campaign;
    } catch (error) {
      handleError(error, 'Creation de la campagne');
      return null;
    }
  }, [updateState, handleError]);

  const updateCampaign = useCallback(async (id: string, data: Partial<ProspectingCampaign>) => {
    updateState({ loading: true, error: null });
    try {
      const updated = await prospectingAPI.updateCampaign(id, data);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => c.id === id ? updated : c),
        currentCampaign: prev.currentCampaign?.id === id ? updated : prev.currentCampaign,
        loading: false,
      }));
      return updated;
    } catch (error) {
      handleError(error, 'Mise a jour de la campagne');
      return null;
    }
  }, [updateState, handleError]);

  const deleteCampaign = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      await prospectingAPI.deleteCampaign(id);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.filter(c => c.id !== id),
        currentCampaign: prev.currentCampaign?.id === id ? null : prev.currentCampaign,
        loading: false,
      }));
      return true;
    } catch (error) {
      handleError(error, 'Suppression de la campagne');
      return false;
    }
  }, [updateState, handleError]);

  const startCampaign = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const updated = await prospectingAPI.startCampaign(id);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => c.id === id ? updated : c),
        currentCampaign: prev.currentCampaign?.id === id ? updated : prev.currentCampaign,
        loading: false,
      }));
      return updated;
    } catch (error) {
      handleError(error, 'Demarrage de la campagne');
      return null;
    }
  }, [updateState, handleError]);

  const pauseCampaign = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const updated = await prospectingAPI.pauseCampaign(id);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => c.id === id ? updated : c),
        currentCampaign: prev.currentCampaign?.id === id ? updated : prev.currentCampaign,
        loading: false,
      }));
      return updated;
    } catch (error) {
      handleError(error, 'Mise en pause de la campagne');
      return null;
    }
  }, [updateState, handleError]);

  const resumeCampaign = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const updated = await prospectingAPI.resumeCampaign(id);
      setState(prev => ({
        ...prev,
        campaigns: prev.campaigns.map(c => c.id === id ? updated : c),
        currentCampaign: prev.currentCampaign?.id === id ? updated : prev.currentCampaign,
        loading: false,
      }));
      return updated;
    } catch (error) {
      handleError(error, 'Reprise de la campagne');
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // LEADS
  // ============================================

  const loadLeads = useCallback(async (campaignId: string, filters?: {
    status?: LeadStatus;
    minScore?: number;
    leadType?: LeadType;
    limit?: number;
  }) => {
    updateState({ loading: true, error: null });
    try {
      const leads = await prospectingAPI.getLeads(campaignId, filters);
      updateState({ leads, loading: false });
      return leads;
    } catch (error) {
      handleError(error, 'Chargement des leads');
      return [];
    }
  }, [updateState, handleError]);

  const loadLead = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const lead = await prospectingAPI.getLeadById(id);
      updateState({ currentLead: lead, loading: false });
      return lead;
    } catch (error) {
      handleError(error, 'Chargement du lead');
      return null;
    }
  }, [updateState, handleError]);

  const updateLead = useCallback(async (id: string, data: Partial<ProspectingLead>) => {
    updateState({ loading: true, error: null });
    try {
      const updated = await prospectingAPI.updateLead(id, data);
      setState(prev => ({
        ...prev,
        leads: prev.leads.map(l => l.id === id ? updated : l),
        currentLead: prev.currentLead?.id === id ? updated : prev.currentLead,
        loading: false,
      }));
      return updated;
    } catch (error) {
      handleError(error, 'Mise a jour du lead');
      return null;
    }
  }, [updateState, handleError]);

  const deleteLead = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      await prospectingAPI.deleteLead(id);
      setState(prev => ({
        ...prev,
        leads: prev.leads.filter(l => l.id !== id),
        currentLead: prev.currentLead?.id === id ? null : prev.currentLead,
        loading: false,
      }));
      return true;
    } catch (error) {
      handleError(error, 'Suppression du lead');
      return false;
    }
  }, [updateState, handleError]);

  const convertLead = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const result = await prospectingAPI.convertLead(id);
      setState(prev => ({
        ...prev,
        leads: prev.leads.map(l => l.id === id ? result.lead : l),
        currentLead: prev.currentLead?.id === id ? result.lead : prev.currentLead,
        loading: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Conversion du lead');
      return null;
    }
  }, [updateState, handleError]);

  const qualifyLead = useCallback(async (id: string) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.qualifyLead(id);
      setState(prev => ({
        ...prev,
        leads: prev.leads.map(l => l.id === id ? result.lead : l),
        currentLead: prev.currentLead?.id === id ? result.lead : prev.currentLead,
        aiProcessingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Qualification du lead');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const enrichLead = useCallback(async (id: string) => {
    updateState({ loading: true, error: null });
    try {
      const enriched = await prospectingAPI.enrichLead(id);
      setState(prev => ({
        ...prev,
        leads: prev.leads.map(l => l.id === id ? enriched : l),
        currentLead: prev.currentLead?.id === id ? enriched : prev.currentLead,
        loading: false,
      }));
      return enriched;
    } catch (error) {
      handleError(error, 'Enrichissement du lead');
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // MATCHING
  // ============================================

  const findMatches = useCallback(async (leadId: string) => {
    updateState({ loading: true, error: null });
    try {
      const matches = await prospectingAPI.findMatches(leadId);
      updateState({ matches, loading: false });
      return matches;
    } catch (error) {
      handleError(error, 'Recherche des correspondances');
      return [];
    }
  }, [updateState, handleError]);

  const loadMatches = useCallback(async (leadId: string) => {
    updateState({ loading: true, error: null });
    try {
      const matches = await prospectingAPI.getLeadMatches(leadId);
      updateState({ matches, loading: false });
      return matches;
    } catch (error) {
      handleError(error, 'Chargement des correspondances');
      return [];
    }
  }, [updateState, handleError]);

  const notifyMatch = useCallback(async (matchId: string) => {
    updateState({ loading: true, error: null });
    try {
      const result = await prospectingAPI.notifyMatch(matchId);
      setState(prev => ({
        ...prev,
        matches: prev.matches.map(m =>
          m.id === matchId ? { ...m, status: 'notified' as MatchStatus, notifiedAt: result.notifiedAt } : m
        ),
        loading: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Notification du match');
      return null;
    }
  }, [updateState, handleError]);

  const updateMatchStatus = useCallback(async (matchId: string, status: MatchStatus) => {
    updateState({ loading: true, error: null });
    try {
      const updated = await prospectingAPI.updateMatchStatus(matchId, status);
      setState(prev => ({
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? updated : m),
        loading: false,
      }));
      return updated;
    } catch (error) {
      handleError(error, 'Mise a jour du statut du match');
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // SOURCES
  // ============================================

  const loadSources = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const sources = await prospectingAPI.getSources();
      updateState({ sources, loading: false });
      return sources;
    } catch (error) {
      handleError(error, 'Chargement des sources');
      return [];
    }
  }, [updateState, handleError]);

  const testSource = useCallback(async (source: ScrapingSource) => {
    updateState({ loading: true, error: null });
    try {
      const result = await prospectingAPI.testSource(source);
      updateState({ loading: false });
      return result;
    } catch (error) {
      handleError(error, 'Test de la source');
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // SCRAPING
  // ============================================

  const scrapeSERP = useCallback(async (config: ScrapingConfig) => {
    updateState({ scrapingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.scrapeSERP(config);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        scrapingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Scraping SERP');
      updateState({ scrapingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const scrapeFirecrawl = useCallback(async (urls: string[], config?: any) => {
    updateState({ scrapingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.scrapeFirecrawl(urls, config);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        scrapingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Scraping Firecrawl');
      updateState({ scrapingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const scrapePica = useCallback(async (config: ScrapingConfig) => {
    updateState({ scrapingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.scrapePica(config);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        scrapingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Scraping Pica API');
      updateState({ scrapingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const scrapeSocial = useCallback(async (platform: 'meta' | 'linkedin', query: string, config?: any) => {
    updateState({ scrapingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.scrapeSocial(platform, query, config);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        scrapingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, `Scraping ${platform}`);
      updateState({ scrapingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const scrapeWebsites = useCallback(async (urls: string[], selectors?: any) => {
    updateState({ scrapingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.scrapeWebsites(urls, selectors);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        scrapingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Scraping de sites web');
      updateState({ scrapingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // AI DETECTION
  // ============================================

  const detectOpportunities = useCallback(async (config: AIDetectionConfig) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.detectOpportunities(config);
      setState(prev => ({
        ...prev,
        leads: [...result.opportunities, ...prev.leads],
        aiProcessingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Detection IA des opportunites');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const analyzeContent = useCallback(async (content: string, source?: string) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.analyzeContent(content, source);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        aiProcessingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Analyse du contenu');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const classifyLead = useCallback(async (leadId: string) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.classifyLead(leadId);
      updateState({ aiProcessingInProgress: false });
      return result;
    } catch (error) {
      handleError(error, 'Classification du lead');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // LLM PROSPECTING
  // ============================================

  const llmAnalyzeItem = useCallback(async (item: RawScrapedItem) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.llmAnalyzeItem(item);
      updateState({ aiProcessingInProgress: false });
      return result;
    } catch (error) {
      handleError(error, 'Analyse LLM de l\'element');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const llmBuildLead = useCallback(async (item: RawScrapedItem) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.llmBuildLead(item);
      updateState({ aiProcessingInProgress: false });
      return result;
    } catch (error) {
      handleError(error, 'Construction du lead structure');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const llmAnalyzeBatch = useCallback(async (items: RawScrapedItem[]) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.llmAnalyzeBatch(items);
      updateState({ aiProcessingInProgress: false });
      return result;
    } catch (error) {
      handleError(error, 'Analyse LLM du batch');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const ingestScrapedItems = useCallback(async (campaignId: string, items: RawScrapedItem[]) => {
    updateState({ aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.ingestScrapedItems(campaignId, items);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        aiProcessingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Ingestion des elements scrappes');
      updateState({ aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  const scrapeAndIngest = useCallback(async (campaignId: string, source: string, config: any) => {
    updateState({ scrapingInProgress: true, aiProcessingInProgress: true, error: null });
    try {
      const result = await prospectingAPI.scrapeAndIngest(campaignId, source, config);
      setState(prev => ({
        ...prev,
        leads: [...result.leads, ...prev.leads],
        scrapingInProgress: false,
        aiProcessingInProgress: false,
      }));
      return result;
    } catch (error) {
      handleError(error, 'Scraping et ingestion');
      updateState({ scrapingInProgress: false, aiProcessingInProgress: false });
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // STATISTICS
  // ============================================

  const loadGlobalStats = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const stats = await prospectingAPI.getGlobalStats();
      updateState({ globalStats: stats, loading: false });
      return stats;
    } catch (error) {
      handleError(error, 'Chargement des statistiques globales');
      return null;
    }
  }, [updateState, handleError]);

  const loadSourceStats = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const stats = await prospectingAPI.getStatsBySource();
      updateState({ sourceStats: stats, loading: false });
      return stats;
    } catch (error) {
      handleError(error, 'Chargement des statistiques par source');
      return [];
    }
  }, [updateState, handleError]);

  const loadConversionStats = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const stats = await prospectingAPI.getConversionStats();
      updateState({ conversionStats: stats, loading: false });
      return stats;
    } catch (error) {
      handleError(error, 'Chargement des statistiques de conversion');
      return null;
    }
  }, [updateState, handleError]);

  const loadROIStats = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const stats = await prospectingAPI.getROIStats();
      updateState({ roiStats: stats, loading: false });
      return stats;
    } catch (error) {
      handleError(error, 'Chargement des statistiques ROI');
      return null;
    }
  }, [updateState, handleError]);

  const loadAllStats = useCallback(async () => {
    updateState({ loading: true, error: null });
    try {
      const [globalStats, sourceStats, conversionStats, roiStats] = await Promise.all([
        prospectingAPI.getGlobalStats(),
        prospectingAPI.getStatsBySource(),
        prospectingAPI.getConversionStats(),
        prospectingAPI.getROIStats(),
      ]);
      updateState({ globalStats, sourceStats, conversionStats, roiStats, loading: false });
      return { globalStats, sourceStats, conversionStats, roiStats };
    } catch (error) {
      handleError(error, 'Chargement des statistiques');
      return null;
    }
  }, [updateState, handleError]);

  // ============================================
  // UTILS
  // ============================================

  const validateEmails = useCallback(async (emails: string[]) => {
    try {
      return await prospectingAPI.validateEmails(emails);
    } catch (error) {
      handleError(error, 'Validation des emails');
      return null;
    }
  }, [handleError]);

  const validatePhones = useCallback(async (phones: string[]) => {
    try {
      return await prospectingAPI.validatePhones(phones);
    } catch (error) {
      handleError(error, 'Validation des telephones');
      return null;
    }
  }, [handleError]);

  const deduplicateLeads = useCallback(async (campaignId?: string) => {
    updateState({ loading: true, error: null });
    try {
      const result = await prospectingAPI.deduplicateLeads(campaignId);
      updateState({ loading: false });
      // Reload leads after deduplication
      if (campaignId) {
        await loadLeads(campaignId);
      }
      return result;
    } catch (error) {
      handleError(error, 'Deduplication des leads');
      return null;
    }
  }, [updateState, handleError, loadLeads]);

  // ============================================
  // EXPORT/IMPORT
  // ============================================

  const exportLeads = useCallback(async (campaignId: string, format: 'csv' | 'xlsx' | 'json' = 'csv') => {
    try {
      return await prospectingAPI.exportLeads(campaignId, format);
    } catch (error) {
      handleError(error, 'Export des leads');
      return null;
    }
  }, [handleError]);

  const importLeads = useCallback(async (campaignId: string, leads: Partial<ProspectingLead>[]) => {
    updateState({ loading: true, error: null });
    try {
      const result = await prospectingAPI.importLeads(campaignId, leads);
      updateState({ loading: false });
      // Reload leads after import
      await loadLeads(campaignId);
      return result;
    } catch (error) {
      handleError(error, 'Import des leads');
      return null;
    }
  }, [updateState, handleError, loadLeads]);

  // ============================================
  // CLEAR & RESET
  // ============================================

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const resetState = useCallback(() => {
    setState({
      campaigns: [],
      currentCampaign: null,
      leads: [],
      currentLead: null,
      matches: [],
      sources: [],
      globalStats: null,
      sourceStats: [],
      conversionStats: null,
      roiStats: null,
      loading: false,
      error: null,
      scrapingInProgress: false,
      aiProcessingInProgress: false,
    });
  }, []);

  return {
    // State
    ...state,

    // Campaigns
    loadCampaigns,
    loadCampaign,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    pauseCampaign,
    resumeCampaign,

    // Leads
    loadLeads,
    loadLead,
    updateLead,
    deleteLead,
    convertLead,
    qualifyLead,
    enrichLead,

    // Matching
    findMatches,
    loadMatches,
    notifyMatch,
    updateMatchStatus,

    // Sources
    loadSources,
    testSource,

    // Scraping
    scrapeSERP,
    scrapeFirecrawl,
    scrapePica,
    scrapeSocial,
    scrapeWebsites,

    // AI Detection
    detectOpportunities,
    analyzeContent,
    classifyLead,

    // LLM Prospecting
    llmAnalyzeItem,
    llmBuildLead,
    llmAnalyzeBatch,
    ingestScrapedItems,
    scrapeAndIngest,

    // Statistics
    loadGlobalStats,
    loadSourceStats,
    loadConversionStats,
    loadROIStats,
    loadAllStats,

    // Utils
    validateEmails,
    validatePhones,
    deduplicateLeads,

    // Export/Import
    exportLeads,
    importLeads,

    // Clear & Reset
    clearError,
    resetState,
  };
}

export default useProspecting;
