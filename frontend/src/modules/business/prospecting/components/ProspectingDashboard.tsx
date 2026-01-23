import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useProspecting } from '@/shared/hooks/useProspecting';
import apiClient from '@/shared/utils/backend-api';
import {
  getCampaignStatusLabel,
  getCampaignStatusColor,
  getCampaignTypeLabel,
  getLeadStatusLabel,
  getLeadStatusColor,
  getLeadTypeLabel,
  getLeadTypeColor,
  getSourceLabel,
  getSourceColor,
  getScoreBadgeColor,
  CampaignType,
  CampaignConfig,
  LeadType,
  LeadStatus,
  MatchStatus,
  ProspectingCampaign,
  ProspectingLead,
  ProspectingMatch,
} from '@/shared/utils/prospecting-api';
import { GeographicTargeting } from './GeographicTargeting';
import { DemographicTargeting } from './DemographicTargeting';
import { SalesFunnel } from './SalesFunnel';
import { LeadValidator } from './LeadValidator';
import { LeadQualificationPanel } from './LeadQualificationPanel';
import { AiProspectionPanel } from './AiProspectionPanel';
import { StatCard, CampaignCard } from './dashboard';

// ============================================
// VALIDATION TYPES
// ============================================

interface ValidationProgress {
  current: number;
  total: number;
  type: 'email' | 'phone' | 'spam' | 'duplicate' | 'ai-clean';
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
}

interface ValidationResult {
  emailsValidated: number;
  emailsInvalid: number;
  phonesValidated: number;
  phonesInvalid: number;
  spamDetected: number;
  duplicatesRemoved: number;
}

// ============================================
// TOAST NOTIFICATION COMPONENT
// ============================================

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  return (
    <div className={`fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-up`}>
      <span className="text-xl">{icons[type]}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">×</button>
    </div>
  );
};

// ============================================
// TYPES
// ============================================

interface ProspectingDashboardProps {
  language?: 'fr' | 'en';
}

type TabType = 'campaigns' | 'ai-prospection' | 'leads' | 'historique' | 'targeting' | 'funnel' | 'scraping';

// ============================================
// EXTRACTED COMPONENTS
// ============================================
// StatCard and CampaignCard are now imported from ./dashboard/
// See: components/dashboard/StatCard.tsx and CampaignCard.tsx

// ============================================
// MAIN COMPONENT
// ============================================

export const ProspectingDashboard: React.FC<ProspectingDashboardProps> = ({ language = 'fr' }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('campaigns');
  const [activeLeadsSubTab, setActiveLeadsSubTab] = useState<'list' | 'funnel' | 'validation'>('list');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignStep, setCampaignStep] = useState(1);

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState<ValidationProgress>({
    current: 0,
    total: 0,
    type: 'email',
    status: 'idle',
  });
  const [validationResults, setValidationResults] = useState<ValidationResult>({
    emailsValidated: 0,
    emailsInvalid: 0,
    phonesValidated: 0,
    phonesInvalid: 0,
    spamDetected: 0,
    duplicatesRemoved: 0,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [isCleaningWithAI, setIsCleaningWithAI] = useState(false);
  const [newCampaign, setNewCampaign] = useState<{
    name: string;
    description: string;
    type: CampaignType;
    targetCount: number;
    config: CampaignConfig;
    scrapingEngines?: string[];
    scrapingConfig?: {
      query?: string;
      urls?: string[];
      maxResults?: number;
      engine?: string;
    };
  }>({
    name: '',
    description: '',
    type: 'requete',
    targetCount: 100,
    config: {
      locations: [],
      propertyTypes: [],
      sources: [],
      keywords: [],
    },
    scrapingEngines: [],
    scrapingConfig: {
      query: '',
      urls: [''],
      maxResults: 50,
      engine: 'firecrawl',
    },
  });
  const [selectedLead, setSelectedLead] = useState<ProspectingLead | null>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadMatches, setLeadMatches] = useState<ProspectingMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  // Scraping configuration
  const [showScrapingConfig, setShowScrapingConfig] = useState(false);
  const [scrapingSource, setScrapingSource] = useState<string | null>(null);
  const [scrapingConfig, setScrapingConfig] = useState({
    query: '',
    urls: [''],
    maxResults: 50,
  });
  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const {
    campaigns,
    leads,
    sources,
    globalStats,
    sourceStats,
    loading,
    error,
    scrapingInProgress,
    aiProcessingInProgress,
    loadCampaigns,
    loadLeads,
    loadSources,
    loadAllStats,
    createCampaign,
    startCampaign,
    pauseCampaign,
    updateLead,
    deleteLead,
    convertLead,
    qualifyLead,
    scrapePica,
    scrapeSERP,
    scrapeSocial,
    scrapeFirecrawl,
    scrapeWebsites,
    detectOpportunities,
    validateEmails,
    clearError,
    // Matching functions
    findMatches,
    loadMatches,
    notifyMatch,
    updateMatchStatus,
  } = useProspecting();

  // Handle lead click - open detail modal
  const handleLeadClick = useCallback((lead: ProspectingLead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
    setLeadMatches([]);
  }, []);

  // Handle find matches for a lead
  const handleFindMatches = useCallback(
    async (leadId: string) => {
      setLoadingMatches(true);
      try {
        const matches = await findMatches(leadId);
        if (matches && Array.isArray(matches)) {
          setLeadMatches(matches);
        }
      } catch (error) {
        console.error('Failed to find matches:', error);
      } finally {
        setLoadingMatches(false);
      }
    },
    [findMatches]
  );

  // Handle load existing matches for a lead
  const handleLoadMatches = useCallback(
    async (leadId: string) => {
      setLoadingMatches(true);
      try {
        const matches = await loadMatches(leadId);
        if (matches) {
          setLeadMatches(matches);
        }
      } catch (error) {
        console.error('Failed to load matches:', error);
      } finally {
        setLoadingMatches(false);
      }
    },
    [loadMatches]
  );

  // Handle notify match
  const handleNotifyMatch = useCallback(
    async (matchId: string) => {
      try {
        await notifyMatch(matchId);
        // Refresh matches
        if (selectedLead) {
          handleLoadMatches(selectedLead.id);
        }
      } catch (error) {
        console.error('Failed to notify match:', error);
      }
    },
    [notifyMatch, selectedLead, handleLoadMatches]
  );

  // Handle update match status
  const handleUpdateMatchStatus = useCallback(
    async (matchId: string, status: MatchStatus) => {
      try {
        await updateMatchStatus(matchId, status);
        // Refresh matches
        if (selectedLead) {
          handleLoadMatches(selectedLead.id);
        }
      } catch (error) {
        console.error('Failed to update match status:', error);
      }
    },
    [updateMatchStatus, selectedLead, handleLoadMatches]
  );

  // Initial data load
  useEffect(() => {
    loadCampaigns();
    loadSources();
    loadAllStats();
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const { tab, subtab, campaign } = router.query;

    if (tab && typeof tab === 'string') {
      const validTabs: TabType[] = ['campaigns', 'ai-prospection', 'leads', 'historique', 'targeting', 'funnel', 'scraping'];
      if (validTabs.includes(tab as TabType)) {
        setActiveTab(tab as TabType);
      }
    }

    if (subtab && typeof subtab === 'string') {
      const validSubTabs = ['list', 'funnel', 'validation'];
      if (validSubTabs.includes(subtab)) {
        setActiveLeadsSubTab(subtab as 'list' | 'funnel' | 'validation');
      }
    }

    if (campaign && typeof campaign === 'string') {
      setSelectedCampaignId(campaign);
    }
  }, [router.query]);

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    const query: Record<string, string> = { tab };
    if (selectedCampaignId) query.campaign = selectedCampaignId;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, selectedCampaignId]);

  // Update URL when subtab changes
  const handleSubTabChange = useCallback((subtab: 'list' | 'funnel' | 'validation') => {
    setActiveLeadsSubTab(subtab);
    const query: Record<string, string> = { tab: activeTab, subtab };
    if (selectedCampaignId) query.campaign = selectedCampaignId;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, activeTab, selectedCampaignId]);

  // Update URL when campaign changes
  const handleCampaignSelect = useCallback((campaignId: string | null) => {
    setSelectedCampaignId(campaignId);
    const query: Record<string, string> = { tab: activeTab };
    if (activeLeadsSubTab !== 'list') query.subtab = activeLeadsSubTab;
    if (campaignId) query.campaign = campaignId;
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [router, activeTab, activeLeadsSubTab]);

  // Load leads when campaign selected
  useEffect(() => {
    if (selectedCampaignId) {
      loadLeads(selectedCampaignId);
    }
  }, [selectedCampaignId, loadLeads]);

  const handleCreateCampaign = async () => {
    const campaign = await createCampaign({
      ...newCampaign,
      config: newCampaign.config,
    });
    if (campaign) {
      setShowCampaignForm(false);
      setNewCampaign({
        name: '',
        description: '',
        type: 'requete',
        targetCount: 100,
        config: { locations: [], propertyTypes: [], sources: [], keywords: [] },
        scrapingEngines: [],
        scrapingConfig: { query: '', urls: [], maxResults: 50, engine: '' },
      });
      setCampaignStep(1);
    }
  };

  const handleLeadValidation = useCallback(
    async (leadIds: string[]) => {
      const leadsToValidate = leads.filter((l) => leadIds.includes(l.id));
      const emails = leadsToValidate.map((l) => l.email).filter(Boolean) as string[];
      const phones = leadsToValidate.map((l) => l.phone).filter(Boolean) as string[];

      // Call actual validation APIs
      let validEmails: string[] = [];
      let invalidEmails: string[] = [];

      if (emails.length > 0) {
        try {
          const response = await validateEmails(emails);
          if (response) {
            validEmails = response.valid || [];
            invalidEmails = response.invalid || [];
          }
        } catch (error) {
          console.error('Email validation failed:', error);
        }
      }

      // Build validation results from actual API responses
      return leadIds.map((id) => {
        const lead = leadsToValidate.find((l) => l.id === id);
        const isEmailValid = lead?.email ? validEmails.includes(lead.email) : false;

        // Calculate scores based on actual validation
        const emailScore = isEmailValid ? 90 : lead?.email ? 30 : 0;
        const hasPhone = !!lead?.phone;
        const hasName = !!(lead?.firstName || lead?.lastName);
        const phoneScore = hasPhone ? 70 : 0;
        const nameScore = hasName ? 80 : 40;
        const overallScore = Math.round((emailScore + phoneScore + nameScore) / 3);

        return {
          leadId: id,
          email: {
            valid: isEmailValid,
            deliverable: isEmailValid,
            disposable: false,
            role: false,
            score: emailScore,
          },
          phone: {
            valid: hasPhone,
            formatted: lead?.phone || '',
            type: 'mobile' as const,
          },
          name: {
            valid: hasName,
            confidence: hasName ? 85 : 0,
            issues: hasName ? [] : ['Nom manquant'],
          },
          overall: {
            score: overallScore,
            status: (overallScore >= 70 ? 'valid' : overallScore >= 40 ? 'suspicious' : 'spam') as
              | 'valid'
              | 'suspicious'
              | 'spam',
            flags: [
              ...(!isEmailValid ? ['Email invalide'] : []),
              ...(!hasPhone ? ['Téléphone manquant'] : []),
              ...(!hasName ? ['Nom manquant'] : []),
            ],
          },
        };
      });
    },
    [leads, validateEmails]
  );

  const handleLeadUpdate = useCallback(
    (leadId: string, data: Partial<ProspectingLead>) => {
      updateLead(leadId, data);
    },
    [updateLead]
  );

  const handleStageChange = useCallback(
    (leadId: string, newStatus: LeadStatus) => {
      updateLead(leadId, { status: newStatus });
    },
    [updateLead]
  );

  // Handle scraping with user config
  const handleLaunchScraping = useCallback(async () => {
    if (!scrapingSource) return;

    try {
      if (scrapingSource === 'pica') {
        await scrapePica({ query: scrapingConfig.query, maxResults: scrapingConfig.maxResults });
      } else if (scrapingSource === 'serp') {
        await scrapeSERP({ query: scrapingConfig.query, maxResults: scrapingConfig.maxResults });
      } else if (scrapingSource === 'meta') {
        await scrapeSocial('meta', scrapingConfig.query);
      } else if (scrapingSource === 'linkedin') {
        await scrapeSocial('linkedin', scrapingConfig.query);
      } else if (scrapingSource === 'firecrawl') {
        await scrapeFirecrawl(scrapingConfig.urls.filter(Boolean));
      } else if (scrapingSource === 'website') {
        await scrapeWebsites(scrapingConfig.urls.filter(Boolean));
      }
    } catch (error) {
      console.error('Failed to launch scraping:', error);
    } finally {
      setShowScrapingConfig(false);
      setScrapingSource(null);
      setScrapingConfig({ query: '', urls: [''], maxResults: 50 });
    }
  }, [
    scrapingSource,
    scrapingConfig,
    scrapePica,
    scrapeSERP,
    scrapeSocial,
    scrapeFirecrawl,
    scrapeWebsites,
  ]);

  // Handle detect opportunities with AI
  const handleDetectOpportunities = useCallback(async () => {
    // Check if we have at least one campaign
    if (campaigns.length === 0) {
      console.warn('No campaigns available for opportunity detection');
      return;
    }

    try {
      await detectOpportunities({
        sources: ['pica', 'serp', 'meta'],
        keywords: ['immobilier', 'appartement', 'villa', 'terrain'],
        locations: ['Tunis', 'La Marsa', 'Sousse', 'Sfax'],
        confidence: 0.7,
      });
    } catch (error) {
      console.error('Failed to detect opportunities:', error);
    }
  }, [campaigns, detectOpportunities]);

  // Handle save notes
  const handleSaveNotes = useCallback(async () => {
    if (selectedLead) {
      try {
        await updateLead(selectedLead.id, { qualificationNotes: notesValue });
        setSelectedLead({ ...selectedLead, qualificationNotes: notesValue });
        setEditingNotes(false);
      } catch (error) {
        console.error('Failed to save notes:', error);
      }
    }
  }, [selectedLead, notesValue, updateLead]);

  // Handle export stats from funnel
  const handleExportStats = useCallback(() => {
    // Export funnel statistics as CSV
    const stats = leads.reduce(
      (acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const csv = Object.entries(stats)
      .map(([status, count]) => `${status},${count}`)
      .join('\n');

    const blob = new Blob([`Status,Count\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'funnel-stats.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  // Handle relaunch inactive leads
  const handleRelaunchInactive = useCallback(
    async (leadIds: string[]) => {
      // Update inactive leads status to trigger follow-up
      try {
        for (const id of leadIds) {
          await updateLead(id, { status: 'contacted' });
        }
      } catch (error) {
        console.error('Failed to relaunch inactive leads:', error);
      }
    },
    [updateLead]
  );

  // Helper to show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setToast({ message, type });
  }, []);

  // Handle verify emails - connected to backend validation service
  const handleVerifyEmails = useCallback(async () => {
    if (!selectedCampaignId) {
      showToast('Veuillez sélectionner une campagne', 'warning');
      return;
    }

    const campaignLeads = leads.filter(l => !l.spam && l.email);
    if (campaignLeads.length === 0) {
      showToast('Aucun lead avec email à valider', 'info');
      return;
    }

    setIsValidating(true);
    setValidationProgress({
      current: 0,
      total: campaignLeads.length,
      type: 'email',
      status: 'running',
      message: 'Validation des emails en cours...',
    });

    let validCount = 0;
    let invalidCount = 0;

    try {
      // Process in batches of 10 for better performance
      const batchSize = 10;
      for (let i = 0; i < campaignLeads.length; i += batchSize) {
        const batch = campaignLeads.slice(i, i + batchSize);
        const emails = batch.map(l => l.email!).filter(Boolean);

        try {
          // Call backend validation API
          const response = await apiClient.post('/validation/emails', { emails });
          const results = response.data.results || [];

          // Update each lead based on validation results
          for (const result of results) {
            const lead = batch.find(l => l.email === result.email);
            if (lead) {
              if (result.isValid && !result.isSpam) {
                validCount++;
                await updateLead(lead.id, {
                  validated: true,
                  score: Math.max(lead.score || 0, result.score || 70),
                });
              } else {
                invalidCount++;
                await updateLead(lead.id, {
                  validated: false,
                  qualified: false,
                  spam: result.isSpam || result.isDisposable,
                });
              }
            }
          }
        } catch (batchError) {
          console.error('Batch validation error:', batchError);
          // Fallback to local validation if API fails
          for (const lead of batch) {
            const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email || '');
            if (isValidEmail) {
              validCount++;
              await updateLead(lead.id, { validated: true });
            } else {
              invalidCount++;
            }
          }
        }

        setValidationProgress(prev => ({
          ...prev,
          current: Math.min(i + batchSize, campaignLeads.length),
        }));
      }

      setValidationResults(prev => ({
        ...prev,
        emailsValidated: validCount,
        emailsInvalid: invalidCount,
      }));

      setValidationProgress(prev => ({ ...prev, status: 'completed' }));
      showToast(`Emails validés: ${validCount} valides, ${invalidCount} invalides`, 'success');

      // Reload leads to refresh the list
      if (selectedCampaignId) {
        await loadLeads(selectedCampaignId);
      }
    } catch (error) {
      console.error('Email validation error:', error);
      setValidationProgress(prev => ({ ...prev, status: 'error', message: 'Erreur de validation' }));
      showToast('Erreur lors de la validation des emails', 'error');
    } finally {
      setIsValidating(false);
    }
  }, [selectedCampaignId, leads, updateLead, loadLeads, showToast]);

  // Handle verify phones - connected to backend validation service
  const handleVerifyPhones = useCallback(async () => {
    if (!selectedCampaignId) {
      showToast('Veuillez sélectionner une campagne', 'warning');
      return;
    }

    const campaignLeads = leads.filter(l => !l.spam && l.phone);
    if (campaignLeads.length === 0) {
      showToast('Aucun lead avec téléphone à valider', 'info');
      return;
    }

    setIsValidating(true);
    setValidationProgress({
      current: 0,
      total: campaignLeads.length,
      type: 'phone',
      status: 'running',
      message: 'Validation des téléphones en cours...',
    });

    let validCount = 0;
    let invalidCount = 0;

    try {
      // Process in batches
      const batchSize = 10;
      for (let i = 0; i < campaignLeads.length; i += batchSize) {
        const batch = campaignLeads.slice(i, i + batchSize);

        for (const lead of batch) {
          try {
            // Call backend phone validation API
            const response = await apiClient.post('/validation/phone', { phone: lead.phone });
            const result = response.data;

            if (result.isValid && !result.isSpam) {
              validCount++;
              // Normalize phone to E.164 format if available
              const normalizedPhone = result.metadata?.cleanPhone || lead.phone;
              await updateLead(lead.id, {
                validated: true,
                phone: normalizedPhone,
                score: Math.max(lead.score || 0, result.score || 70),
              });
            } else {
              invalidCount++;
              await updateLead(lead.id, {
                validated: false,
                qualified: false,
              });
            }
          } catch (phoneError) {
            // Fallback to regex validation
            const phoneValid = /^\+?[0-9\s\-\(\)]{8,}$/.test(lead.phone || '');
            if (phoneValid) {
              validCount++;
              await updateLead(lead.id, { validated: true });
            } else {
              invalidCount++;
            }
          }
        }

        setValidationProgress(prev => ({
          ...prev,
          current: Math.min(i + batchSize, campaignLeads.length),
        }));
      }

      setValidationResults(prev => ({
        ...prev,
        phonesValidated: validCount,
        phonesInvalid: invalidCount,
      }));

      setValidationProgress(prev => ({ ...prev, status: 'completed' }));
      showToast(`Téléphones validés: ${validCount} valides, ${invalidCount} invalides`, 'success');

      if (selectedCampaignId) {
        await loadLeads(selectedCampaignId);
      }
    } catch (error) {
      console.error('Phone validation error:', error);
      setValidationProgress(prev => ({ ...prev, status: 'error' }));
      showToast('Erreur lors de la validation des téléphones', 'error');
    } finally {
      setIsValidating(false);
    }
  }, [selectedCampaignId, leads, updateLead, loadLeads, showToast]);

  // Handle detect spam - connected to backend AI spam detection
  const handleDetectSpam = useCallback(async () => {
    if (!selectedCampaignId) {
      showToast('Veuillez sélectionner une campagne', 'warning');
      return;
    }

    const campaignLeads = leads.filter(l => !l.spam);
    if (campaignLeads.length === 0) {
      showToast('Aucun lead à analyser', 'info');
      return;
    }

    setIsValidating(true);
    setValidationProgress({
      current: 0,
      total: campaignLeads.length,
      type: 'spam',
      status: 'running',
      message: 'Détection des spams en cours...',
    });

    let spamCount = 0;

    try {
      for (let i = 0; i < campaignLeads.length; i++) {
        const lead = campaignLeads[i];
        let isSpam = false;

        try {
          // Try AI spam detection if rawText is available
          if (lead.rawText || lead.email) {
            const response = await apiClient.post('/validation/spam/ai', {
              email: lead.email,
              name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
              message: lead.rawText || '',
            });
            isSpam = response.data.isSpam || response.data.spamScore > 70;
          }
        } catch (aiError) {
          // Fallback to pattern-based detection
          // Check email patterns
          if (lead.email) {
            const spamEmailPatterns = [
              /^test\d*@/i,
              /^fake\d*@/i,
              /^spam\d*@/i,
              /\d{8,}@/,
              /@(mailinator|guerrillamail|tempmail|throwaway|yopmail|10minutemail)/i,
            ];
            isSpam = spamEmailPatterns.some(p => p.test(lead.email!));
          }

          // Check name patterns
          if (!isSpam && (lead.firstName || lead.lastName)) {
            const spamNamePatterns = [
              /^(test|fake|spam|xxx|asdf|qwerty)/i,
              /\d{4,}/,
              /^[a-z]{1,2}$/i,
            ];
            isSpam = spamNamePatterns.some(p =>
              p.test(lead.firstName || '') || p.test(lead.lastName || '')
            );
          }
        }

        if (isSpam) {
          spamCount++;
          await updateLead(lead.id, {
            spam: true,
            qualified: false,
            validationStatus: 'spam',
          });
        }

        setValidationProgress(prev => ({
          ...prev,
          current: i + 1,
        }));
      }

      setValidationResults(prev => ({
        ...prev,
        spamDetected: prev.spamDetected + spamCount,
      }));

      setValidationProgress(prev => ({ ...prev, status: 'completed' }));
      showToast(`Détection terminée: ${spamCount} spams détectés`, spamCount > 0 ? 'warning' : 'success');

      if (selectedCampaignId) {
        await loadLeads(selectedCampaignId);
      }
    } catch (error) {
      console.error('Spam detection error:', error);
      setValidationProgress(prev => ({ ...prev, status: 'error' }));
      showToast('Erreur lors de la détection des spams', 'error');
    } finally {
      setIsValidating(false);
    }
  }, [selectedCampaignId, leads, updateLead, loadLeads, showToast]);

  // Handle remove duplicates - connected to backend deduplication
  const handleRemoveDuplicates = useCallback(async () => {
    if (!selectedCampaignId) {
      showToast('Veuillez sélectionner une campagne', 'warning');
      return;
    }

    setIsValidating(true);
    setValidationProgress({
      current: 0,
      total: 1,
      type: 'duplicate',
      status: 'running',
      message: 'Suppression des doublons en cours...',
    });

    try {
      // Call backend deduplication endpoint
      const response = await apiClient.post('/prospecting/deduplicate', {
        campaignId: selectedCampaignId,
      });

      const { removed, remaining } = response.data;

      setValidationResults(prev => ({
        ...prev,
        duplicatesRemoved: prev.duplicatesRemoved + removed,
      }));

      setValidationProgress(prev => ({ ...prev, current: 1, status: 'completed' }));
      showToast(`${removed} doublons supprimés, ${remaining} leads restants`, 'success');

      // Reload leads to refresh the list
      if (selectedCampaignId) {
        await loadLeads(selectedCampaignId);
      }
    } catch (error) {
      console.error('Deduplication error:', error);

      // Fallback to local deduplication
      const campaignLeads = leads.filter(l => !l.spam);
      const emailMap = new Map<string, ProspectingLead>();
      const phoneMap = new Map<string, ProspectingLead>();
      const duplicates = new Set<string>();

      for (const lead of campaignLeads) {
        if (lead.email) {
          const existing = emailMap.get(lead.email.toLowerCase());
          if (existing) {
            const keepLead = (lead.score || 0) > (existing.score || 0) ? lead : existing;
            const removeLead = keepLead === lead ? existing : lead;
            duplicates.add(removeLead.id);
            emailMap.set(lead.email.toLowerCase(), keepLead);
          } else {
            emailMap.set(lead.email.toLowerCase(), lead);
          }
        }

        if (lead.phone && !duplicates.has(lead.id)) {
          const normalizedPhone = lead.phone.replace(/[^\d+]/g, '');
          const existing = phoneMap.get(normalizedPhone);
          if (existing && !duplicates.has(existing.id)) {
            const keepLead = (lead.score || 0) > (existing.score || 0) ? lead : existing;
            const removeLead = keepLead === lead ? existing : lead;
            duplicates.add(removeLead.id);
          } else if (!existing) {
            phoneMap.set(normalizedPhone, lead);
          }
        }
      }

      // Mark duplicates as spam
      for (const duplicateId of duplicates) {
        await updateLead(duplicateId, { spam: true, qualified: false });
      }

      setValidationResults(prev => ({
        ...prev,
        duplicatesRemoved: prev.duplicatesRemoved + duplicates.size,
      }));

      setValidationProgress(prev => ({ ...prev, status: 'completed' }));
      showToast(`${duplicates.size} doublons supprimés (local)`, 'success');

      if (selectedCampaignId) {
        await loadLeads(selectedCampaignId);
      }
    } finally {
      setIsValidating(false);
    }
  }, [selectedCampaignId, leads, updateLead, loadLeads, showToast]);

  // Handle AI cleaning of leads
  const handleAICleanLeads = useCallback(async () => {
    if (!selectedCampaignId) {
      showToast('Veuillez sélectionner une campagne', 'warning');
      return;
    }

    const campaignLeads = leads.filter(l => !l.spam && !l.validated);
    if (campaignLeads.length === 0) {
      showToast('Aucun lead à nettoyer', 'info');
      return;
    }

    setIsCleaningWithAI(true);
    setValidationProgress({
      current: 0,
      total: campaignLeads.length,
      type: 'ai-clean',
      status: 'running',
      message: 'Nettoyage IA en cours...',
    });

    try {
      // Process in batches of 5 for LLM efficiency
      const batchSize = 5;
      let cleanedCount = 0;

      for (let i = 0; i < campaignLeads.length; i += batchSize) {
        const batch = campaignLeads.slice(i, i + batchSize);
        const leadIds = batch.map(l => l.id);

        try {
          const response = await apiClient.post('/prospecting/leads/clean-batch', {
            leadIds,
          });

          if (response.data.results) {
            for (const result of response.data.results) {
              if (result.success) {
                cleanedCount++;
              }
            }
          }
        } catch (batchError) {
          console.error('AI cleaning batch error:', batchError);
        }

        setValidationProgress(prev => ({
          ...prev,
          current: Math.min(i + batchSize, campaignLeads.length),
        }));
      }

      setValidationProgress(prev => ({ ...prev, status: 'completed' }));
      showToast(`${cleanedCount} leads nettoyés avec l'IA`, 'success');

      if (selectedCampaignId) {
        await loadLeads(selectedCampaignId);
      }
    } catch (error) {
      console.error('AI cleaning error:', error);
      setValidationProgress(prev => ({ ...prev, status: 'error' }));
      showToast('Erreur lors du nettoyage IA', 'error');
    } finally {
      setIsCleaningWithAI(false);
    }
  }, [selectedCampaignId, leads, loadLeads, showToast]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'campaigns', label: 'Mes Campagnes', icon: '📋' },
    { id: 'ai-prospection', label: 'Prospection IA', icon: '🤖' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'historique', label: 'Historique', icon: '📜' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Prospection Intelligente
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Trouvez des opportunites immobilieres avec l&apos;IA
              </p>
            </div>
            <button
              onClick={() => setShowCampaignForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Nouvelle Campagne
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b shadow-sm sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex justify-between items-center shadow-md">
            <span className="flex items-center gap-2">
              <span>⚠️</span> {error}
            </span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700 text-xl">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Mes Campagnes Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Leads"
                value={globalStats?.total || 0}
                icon="👥"
                color="purple"
              />
              <StatCard
                title="Leads Convertis"
                value={globalStats?.converted || 0}
                icon="✅"
                color="green"
              />
              <StatCard
                title="Taux de Conversion"
                value={`${(globalStats?.conversionRate || 0).toFixed(1)}%`}
                icon="📈"
                color="blue"
              />
              <StatCard
                title="Score Moyen"
                value={`${(globalStats?.avgScore || 0).toFixed(0)}%`}
                icon="⭐"
                color="yellow"
              />
            </div>

            {/* Quick Actions */}
            {/* Featured: AI Prospection */}
            <button
              onClick={() => handleTabChange('ai-prospection')}
              className="p-8 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-2xl text-white text-left hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 transform -skew-y-3"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">🤖</div>
                  <div>
                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-2">
                      ⭐ RECOMMANDÉ
                    </div>
                    <h3 className="font-bold text-2xl">Prospection IA Automatisée</h3>
                  </div>
                </div>
                <p className="text-purple-100 text-base mb-4">
                  Trouvez des leads qualifiés en quelques minutes avec l'intelligence artificielle.
                  Configuration simple, résultats rapides, export CRM direct.
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Rapide
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Qualifié par IA
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Export CRM
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 mt-4 text-base font-semibold opacity-90 group-hover:opacity-100 transition-opacity">
                  Lancer une prospection
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </button>

            {/* Other Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <button
                onClick={() => {
                  handleTabChange('leads');
                  handleSubTabChange('funnel');
                }}
                className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white text-left hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg group"
              >
                <div className="text-3xl mb-3">📍</div>
                <h3 className="font-bold text-lg">Pipeline de Leads</h3>
                <p className="text-blue-100 text-sm mt-1">Visualisez vos leads par étape</p>
                <span className="inline-block mt-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir le pipeline →
                </span>
              </button>

              <button
                onClick={() => {
                  handleTabChange('leads');
                  setActiveLeadsSubTab('funnel');
                }}
                className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white text-left hover:from-purple-600 hover:to-pink-700 transition-all shadow-lg group"
              >
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="font-bold text-lg">Stages de Conversion</h3>
                <p className="text-purple-100 text-sm mt-1">Suivre la progression des leads</p>
                <span className="inline-block mt-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir les stages →
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('leads');
                  setActiveLeadsSubTab('validation');
                }}
                className="p-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl text-white text-left hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg group"
              >
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="font-bold text-lg">Validation Anti-Spam</h3>
                <p className="text-teal-100 text-sm mt-1">Nettoyer et qualifier les leads</p>
                <span className="inline-block mt-3 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Valider →
                </span>
              </button>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Campagnes Recentes</h2>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Voir tout →
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {campaigns.slice(0, 4).map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onSelect={(id) => {
                      setSelectedCampaignId(id);
                      setActiveTab('funnel');
                    }}
                    onStart={startCampaign}
                    onPause={pauseCampaign}
                  />
                ))}
              </div>
              {campaigns.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-lg">Aucune campagne</p>
                  <p className="text-sm mt-1">Creez votre premiere campagne de prospection</p>
                  <button
                    onClick={() => setShowCampaignForm(true)}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Creer une campagne
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Prospection Tab */}
        {activeTab === 'ai-prospection' && (
          <AiProspectionPanel language={language} />
        )}

        {/* Targeting Tab */}
        {activeTab === 'targeting' && (
          <div className="space-y-6">
            <GeographicTargeting
              onZonesChange={(zones) =>
                setNewCampaign((prev) => ({
                  ...prev,
                  config: { ...prev.config, zones },
                }))
              }
            />
            <DemographicTargeting
              onChange={(demographics) =>
                setNewCampaign((prev) => ({
                  ...prev,
                  config: { ...prev.config, demographics },
                }))
              }
            />
          </div>
        )}

        {/* Leads Tab with Sub-tabs */}
        {activeTab === 'leads' && (
          <div>
            {/* Sub-tab Navigation */}
            <div className="flex gap-4 mb-6 border-b overflow-x-auto">
              <button
                onClick={() => handleSubTabChange('list')}
                className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap ${activeLeadsSubTab === 'list'
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-600 border-transparent hover:text-purple-600'
                  }`}
              >
                📊 Tableau de bord
              </button>
              <button
                onClick={() => {
                  // Vérifier si validation minimale effectuée
                  const validationRate = leads.length > 0
                    ? (leads.filter(l => l.validated).length / leads.length) * 100
                    : 0;

                  if (validationRate < 30 && leads.length > 0) {
                    showToast("Vous devez d'abord valider vos leads dans l'onglet 'Nettoyage & Validation' avant d'accéder aux Stages.", 'warning');
                    handleSubTabChange('validation');
                  } else {
                    handleSubTabChange('funnel');
                  }
                }}
                className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap relative ${activeLeadsSubTab === 'funnel'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-blue-600'
                  }`}
              >
                🔄 Stages
                {leads.length > 0 && leads.filter(l => l.validated).length === 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
                {leads.length > 0 && leads.filter(l => l.validated).length > 0 && leads.filter(l => l.validated).length < leads.length * 0.5 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => handleSubTabChange('validation')}
                className={`px-6 py-3 font-semibold transition-all border-b-2 whitespace-nowrap relative ${activeLeadsSubTab === 'validation'
                  ? 'text-green-600 border-green-600'
                  : 'text-gray-600 border-transparent hover:text-green-600'
                  }`}
              >
                ✓ Nettoyage & Validation
                {leads.length > 0 && leads.filter(l => l.validated).length < leads.length * 0.8 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-bold">
                    {leads.filter(l => !l.validated).length} à traiter
                  </span>
                )}
                {leads.length > 0 && leads.filter(l => l.validated).length >= leads.length * 0.8 && (
                  <span className="ml-2 text-green-500">✓</span>
                )}
              </button>
            </div>

            {/* Vue Leads Sub-tab - Dashboard */}
            {activeLeadsSubTab === 'list' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">{leads.length}</div>
                    <div className="text-sm text-blue-700">Leads bruts</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600">
                      {leads.filter(l => !l.validated).length}
                    </div>
                    <div className="text-sm text-yellow-700">À Valider</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600">
                      {leads.filter(l => l.validated && l.qualified).length}
                    </div>
                    <div className="text-sm text-green-700">Prêts à contacter</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <div className="text-3xl font-bold text-red-600">
                      {leads.filter(l => l.spam).length}
                    </div>
                    <div className="text-sm text-red-700">Spams</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Mes Campagnes</h3>
                  <button
                    onClick={() => setShowCampaignForm(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    + Nouvelle Campagne
                  </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {campaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      onSelect={(id) => {
                        setSelectedCampaignId(id);
                        setActiveLeadsSubTab('funnel');
                      }}
                      onStart={startCampaign}
                      onPause={pauseCampaign}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tunnel Sub-tab - Stages de conversion */}
            {activeLeadsSubTab === 'funnel' && (
              <div className="space-y-6">
                {/* Vérification workflow - Validation requise avant Stages */}
                {leads.length > 0 && leads.filter(l => l.validated).length === 0 ? (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-2xl font-bold text-yellow-800 mb-3">
                      Validation requise avant passage aux Stages
                    </h3>
                    <p className="text-yellow-700 mb-6 max-w-2xl mx-auto">
                      Vous devez d'abord nettoyer et valider vos leads dans l'onglet
                      <strong> "Nettoyage & Validation" </strong>
                      pour garantir la qualité de votre pipeline de conversion.
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl mx-auto">
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="text-2xl font-bold text-gray-900">{leads.length}</div>
                        <div className="text-xs text-gray-600">Leads bruts</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">0</div>
                        <div className="text-xs text-gray-600">Validés</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="text-2xl font-bold text-red-600">
                          {Math.round((leads.filter(l => l.validated).length / leads.length) * 100) || 0}%
                        </div>
                        <div className="text-xs text-gray-600">Taux validation</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSubTabChange('validation')}
                      className="px-8 py-4 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 transition shadow-lg inline-flex items-center gap-2"
                    >
                      <span>✅</span>
                      Aller à Nettoyage & Validation
                    </button>
                  </div>
                ) : leads.filter(l => l.validated).length < leads.length * 0.5 && leads.length > 0 ? (
                  <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">🚧</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-orange-800 mb-2">
                          Attention: Taux de validation faible
                        </h4>
                        <p className="text-orange-700 mb-3">
                          Seulement <strong>{leads.filter(l => l.validated).length}/{leads.length}</strong> leads validés
                          ({Math.round((leads.filter(l => l.validated).length / leads.length) * 100)}%).
                          Nous recommandons de valider au moins 50% des leads avant de passer aux stages.
                        </p>
                        <button
                          onClick={() => setActiveLeadsSubTab('validation')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
                        >
                          Améliorer la validation
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Pipeline de Leads</h3>
                  <p className="text-blue-100">Gérez le flux de conversion: Validation → Qualification → Prêt pour contact</p>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="font-bold text-2xl">{leads.filter(l => l.validated).length}</div>
                      <div className="text-blue-100">Leads validés</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="font-bold text-2xl">{leads.filter(l => l.qualified).length}</div>
                      <div className="text-blue-100">Leads qualifiés</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="font-bold text-2xl">
                        {leads.length > 0 ? Math.round((leads.filter(l => l.validated && l.qualified).length / leads.length) * 100) : 0}%
                      </div>
                      <div className="text-blue-100">Taux de conversion</div>
                    </div>
                  </div>
                </div>

                {/* Stage Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold">
                    ⚠️ À Valider ({leads.filter(l => !l.validated).length})
                  </button>
                  <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-semibold">
                    ⏳ En cours ({leads.filter(l => l.validated && !l.qualified).length})
                  </button>
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-semibold">
                    ✅ Prêts ({leads.filter(l => l.validated && l.qualified).length})
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold">
                    🚫 Spams ({leads.filter(l => l.spam).length})
                  </button>
                </div>

                {/* Tunnel Content */}
                {selectedCampaignId ? (
                  <SalesFunnel
                    leads={leads}
                    onLeadClick={handleLeadClick}
                    onStageChange={handleStageChange}
                    onExportStats={handleExportStats}
                    onRelaunchInactive={handleRelaunchInactive}
                  />
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sélectionnez une campagne</h3>
                    <p className="text-gray-500 mb-6">
                      Choisissez une campagne pour voir son pipeline
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {campaigns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCampaignId(c.id)}
                          className="px-4 py-2 border-2 border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50 transition"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Validation Sub-tab */}
            {activeLeadsSubTab === 'validation' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">Nettoyage & Validation</h3>
                  <p className="text-green-100">Validez les emails, téléphones, supprimez les spams et doublons</p>
                </div>

                {/* Validation Progress Bar */}
                {isValidating && validationProgress.status === 'running' && (
                  <div className="bg-white border-2 border-blue-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="animate-spin">⏳</span>
                        {validationProgress.message || 'Validation en cours...'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {validationProgress.current}/{validationProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${validationProgress.total > 0 ? (validationProgress.current / validationProgress.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Validation Tools */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                  <button
                    onClick={handleVerifyEmails}
                    disabled={!selectedCampaignId || loading || isValidating}
                    className={`bg-white border-2 rounded-xl p-4 transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                      isValidating && validationProgress.type === 'email'
                        ? 'border-green-400 bg-green-50'
                        : 'border-green-200 hover:bg-green-50'
                    }`}
                  >
                    {isValidating && validationProgress.type === 'email' && (
                      <div className="absolute inset-0 bg-green-100 opacity-50 animate-pulse" />
                    )}
                    <div className="relative">
                      <div className="text-2xl mb-2">
                        {isValidating && validationProgress.type === 'email' ? '⏳' : '✉️'}
                      </div>
                      <div className="font-bold text-gray-900">Vérifier Emails</div>
                      <div className="text-sm text-gray-600">Validez syntaxe & domaines</div>
                      {validationResults.emailsValidated > 0 && (
                        <div className="mt-2 text-xs text-green-600 font-semibold">
                          ✓ {validationResults.emailsValidated} validés
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={handleVerifyPhones}
                    disabled={!selectedCampaignId || loading || isValidating}
                    className={`bg-white border-2 rounded-xl p-4 transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                      isValidating && validationProgress.type === 'phone'
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-blue-200 hover:bg-blue-50'
                    }`}
                  >
                    {isValidating && validationProgress.type === 'phone' && (
                      <div className="absolute inset-0 bg-blue-100 opacity-50 animate-pulse" />
                    )}
                    <div className="relative">
                      <div className="text-2xl mb-2">
                        {isValidating && validationProgress.type === 'phone' ? '⏳' : '📱'}
                      </div>
                      <div className="font-bold text-gray-900">Vérifier Téléphones</div>
                      <div className="text-sm text-gray-600">Format E.164</div>
                      {validationResults.phonesValidated > 0 && (
                        <div className="mt-2 text-xs text-blue-600 font-semibold">
                          ✓ {validationResults.phonesValidated} validés
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={handleDetectSpam}
                    disabled={!selectedCampaignId || loading || isValidating}
                    className={`bg-white border-2 rounded-xl p-4 transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                      isValidating && validationProgress.type === 'spam'
                        ? 'border-red-400 bg-red-50'
                        : 'border-red-200 hover:bg-red-50'
                    }`}
                  >
                    {isValidating && validationProgress.type === 'spam' && (
                      <div className="absolute inset-0 bg-red-100 opacity-50 animate-pulse" />
                    )}
                    <div className="relative">
                      <div className="text-2xl mb-2">
                        {isValidating && validationProgress.type === 'spam' ? '⏳' : '🚫'}
                      </div>
                      <div className="font-bold text-gray-900">Détecter Spams</div>
                      <div className="text-sm text-gray-600">IA + Patterns</div>
                      {validationResults.spamDetected > 0 && (
                        <div className="mt-2 text-xs text-red-600 font-semibold">
                          ⚠ {validationResults.spamDetected} détectés
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={handleRemoveDuplicates}
                    disabled={!selectedCampaignId || loading || isValidating}
                    className={`bg-white border-2 rounded-xl p-4 transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden ${
                      isValidating && validationProgress.type === 'duplicate'
                        ? 'border-purple-400 bg-purple-50'
                        : 'border-purple-200 hover:bg-purple-50'
                    }`}
                  >
                    {isValidating && validationProgress.type === 'duplicate' && (
                      <div className="absolute inset-0 bg-purple-100 opacity-50 animate-pulse" />
                    )}
                    <div className="relative">
                      <div className="text-2xl mb-2">
                        {isValidating && validationProgress.type === 'duplicate' ? '⏳' : '🔄'}
                      </div>
                      <div className="font-bold text-gray-900">Suppr. Doublons</div>
                      <div className="text-sm text-gray-600">Dédupliquer</div>
                      {validationResults.duplicatesRemoved > 0 && (
                        <div className="mt-2 text-xs text-purple-600 font-semibold">
                          ✓ {validationResults.duplicatesRemoved} supprimés
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={handleAICleanLeads}
                    disabled={!selectedCampaignId || loading || isValidating || isCleaningWithAI}
                    className={`bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-transparent rounded-xl p-4 text-white transition disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden hover:from-indigo-600 hover:to-purple-700 ${
                      isCleaningWithAI ? 'animate-pulse' : ''
                    }`}
                  >
                    {isCleaningWithAI && (
                      <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
                    )}
                    <div className="relative">
                      <div className="text-2xl mb-2">
                        {isCleaningWithAI ? '⏳' : '🧹'}
                      </div>
                      <div className="font-bold">Nettoyer avec IA</div>
                      <div className="text-sm text-indigo-100">Enrichir & corriger</div>
                      <div className="mt-2 text-xs text-indigo-200 font-semibold">
                        ⭐ Recommandé
                      </div>
                    </div>
                  </button>
                </div>

                {/* Quality Score Indicator - Statistiques en temps réel */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-4">📊 Qualité des Leads en Temps Réel</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Emails Valides</span>
                        <span className={`text-sm font-bold ${leads.length > 0 && leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length >= 0.8
                          ? 'text-green-600'
                          : leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length >= 0.5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                          }`}>
                          {leads.length > 0
                            ? Math.round((leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${leads.length > 0 && leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length >= 0.8
                            ? 'bg-green-500'
                            : leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length >= 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                          style={{ width: `${leads.length > 0 ? Math.round((leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Téléphones Valides</span>
                        <span className={`text-sm font-bold ${leads.length > 0 && leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length >= 0.8
                          ? 'text-blue-600'
                          : leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length >= 0.5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                          }`}>
                          {leads.length > 0
                            ? Math.round((leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${leads.length > 0 && leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length >= 0.8
                            ? 'bg-blue-500'
                            : leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length >= 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                          style={{ width: `${leads.length > 0 ? Math.round((leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Sans Spam</span>
                        <span className={`text-sm font-bold ${leads.length > 0 && leads.filter(l => !l.spam).length / leads.length >= 0.9
                          ? 'text-purple-600'
                          : leads.filter(l => !l.spam).length / leads.length >= 0.7
                            ? 'text-yellow-600'
                            : 'text-red-600'
                          }`}>
                          {leads.length > 0
                            ? Math.round((leads.filter(l => !l.spam).length / leads.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${leads.length > 0 && leads.filter(l => !l.spam).length / leads.length >= 0.9
                            ? 'bg-purple-500'
                            : leads.filter(l => !l.spam).length / leads.length >= 0.7
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                          style={{ width: `${leads.length > 0 ? Math.round((leads.filter(l => !l.spam).length / leads.length) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Taux de Validation Global</span>
                        <span className={`text-sm font-bold ${leads.length > 0 && leads.filter(l => l.validated).length / leads.length >= 0.8
                          ? 'text-green-600'
                          : leads.filter(l => l.validated).length / leads.length >= 0.5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                          }`}>
                          {leads.length > 0
                            ? Math.round((leads.filter(l => l.validated).length / leads.length) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${leads.length > 0 && leads.filter(l => l.validated).length / leads.length >= 0.8
                            ? 'bg-green-500'
                            : leads.filter(l => l.validated).length / leads.length >= 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                            }`}
                          style={{ width: `${leads.length > 0 ? Math.round((leads.filter(l => l.validated).length / leads.length) * 100) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Indicateur de crédibilité */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">Score de Crédibilité</span>
                      <div className="flex items-center gap-2">
                        {leads.length > 0 && (() => {
                          const emailScore = leads.filter(l => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email)).length / leads.length;
                          const phoneScore = leads.filter(l => l.phone && /^\+?[0-9\s\-\(\)]{8,}$/.test(l.phone)).length / leads.length;
                          const spamScore = leads.filter(l => !l.spam).length / leads.length;
                          const validationScore = leads.filter(l => l.validated).length / leads.length;
                          const overallScore = Math.round(((emailScore + phoneScore + spamScore + validationScore) / 4) * 100);

                          return (
                            <>
                              <span className={`text-2xl font-bold ${overallScore >= 80 ? 'text-green-600' :
                                overallScore >= 60 ? 'text-yellow-600' :
                                  overallScore >= 40 ? 'text-orange-600' : 'text-red-600'
                                }`}>
                                {overallScore}%
                              </span>
                              <span className="text-2xl">
                                {overallScore >= 80 ? '🌟' : overallScore >= 60 ? '✅' : overallScore >= 40 ? '⚠️' : '❌'}
                              </span>
                            </>
                          );
                        })()}
                        {leads.length === 0 && <span className="text-gray-400">N/A</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Résultats de la session de validation */}
                {(validationResults.emailsValidated > 0 || validationResults.phonesValidated > 0 ||
                  validationResults.spamDetected > 0 || validationResults.duplicatesRemoved > 0) && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      Résultats de la Session
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-green-600">{validationResults.emailsValidated}</div>
                        <div className="text-xs text-gray-600">Emails validés</div>
                        {validationResults.emailsInvalid > 0 && (
                          <div className="text-xs text-red-500 mt-1">({validationResults.emailsInvalid} invalides)</div>
                        )}
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{validationResults.phonesValidated}</div>
                        <div className="text-xs text-gray-600">Téléphones validés</div>
                        {validationResults.phonesInvalid > 0 && (
                          <div className="text-xs text-red-500 mt-1">({validationResults.phonesInvalid} invalides)</div>
                        )}
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-orange-600">{validationResults.spamDetected}</div>
                        <div className="text-xs text-gray-600">Spams détectés</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                        <div className="text-2xl font-bold text-purple-600">{validationResults.duplicatesRemoved}</div>
                        <div className="text-xs text-gray-600">Doublons supprimés</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedCampaignId ? (
                  <>
                    {/* Nouveau panneau de qualification intelligente */}
                    <LeadQualificationPanel
                      leads={leads}
                      onLeadQualified={(leadId, qualified) => {
                        updateLead(leadId, {
                          qualified,
                          validated: true,
                          status: qualified ? 'qualified' : 'new'
                        });
                      }}
                      onLeadRejected={(leadId) => {
                        updateLead(leadId, {
                          spam: true,
                          qualified: false,
                          validated: false,
                          status: 'rejected'
                        });
                      }}
                      onLeadDeleted={(leadId) => {
                        deleteLead(leadId);
                      }}
                    />

                    {/* Ancien validateur pour les actions manuelles */}
                    <div className="mt-6">
                      <LeadValidator
                        leads={leads}
                        onValidate={handleLeadValidation}
                        onUpdateLead={handleLeadUpdate}
                      />
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
                    <div className="text-5xl mb-4">🧹</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Sélectionnez une campagne</h3>
                    <p className="text-gray-500 mb-6">
                      Choisissez une campagne pour nettoyer, valider et qualifier ses leads
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {campaigns.length > 0 ? (
                        campaigns.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedCampaignId(c.id)}
                            className="px-4 py-2 border-2 border-emerald-200 rounded-lg text-emerald-600 hover:bg-emerald-50 transition font-medium"
                          >
                            {c.name}
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">
                          Créez d'abord une campagne depuis l'onglet "Prospection IA"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
        }

        {/* Scraping Tab */}
        {
          activeTab === 'scraping' && (
            <div className="space-y-6">
              {/* AI Detection Button */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">🤖 Detection IA d&apos;Opportunites</h3>
                    <p className="text-purple-100 text-sm mt-1">
                      Analysez automatiquement les sources pour trouver des leads qualifies
                    </p>
                  </div>
                  <button
                    onClick={handleDetectOpportunities}
                    disabled={aiProcessingInProgress}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 disabled:opacity-50 transition"
                  >
                    {aiProcessingInProgress ? '⏳ Analyse en cours...' : '🚀 Lancer la detection IA'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Sources de Donnees</h2>
                  <a
                    href="/settings/ai-api-keys"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                  >
                    ⚙️ Configurer les API
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'pica',
                      name: 'Pica API',
                      icon: '🔮',
                      desc: 'SERP + Firecrawl',
                      color: 'purple',
                      needsQuery: true,
                    },
                    {
                      id: 'serp',
                      name: 'Google SERP',
                      icon: '🔍',
                      desc: 'Recherche Google',
                      color: 'blue',
                      needsQuery: true,
                    },
                    {
                      id: 'meta',
                      name: 'Meta/Facebook',
                      icon: '📘',
                      desc: 'Marketplace',
                      color: 'indigo',
                      needsQuery: true,
                    },
                    {
                      id: 'linkedin',
                      name: 'LinkedIn',
                      icon: '💼',
                      desc: 'Profils pro',
                      color: 'cyan',
                      needsQuery: true,
                    },
                    {
                      id: 'firecrawl',
                      name: 'Firecrawl',
                      icon: '🔥',
                      desc: 'Web scraping',
                      color: 'orange',
                      needsQuery: false,
                    },
                    {
                      id: 'website',
                      name: 'Sites web',
                      icon: '🌐',
                      desc: 'Agences immo',
                      color: 'gray',
                      needsQuery: false,
                    },
                  ].map((source) => (
                    <div key={source.id} className="border rounded-xl p-5 hover:shadow-md transition">
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl bg-${source.color}-100 flex items-center justify-center text-2xl`}
                        >
                          {source.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{source.name}</h3>
                          <p className="text-sm text-gray-500">{source.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setScrapingSource(source.id);
                          setShowScrapingConfig(true);
                          // Set default values based on source
                          if (source.needsQuery) {
                            setScrapingConfig({
                              query:
                                source.id === 'pica'
                                  ? 'immobilier tunis'
                                  : source.id === 'serp'
                                    ? 'appartement vendre tunis'
                                    : source.id === 'meta'
                                      ? 'immobilier tunisie'
                                      : 'agent immobilier tunis',
                              urls: [''],
                              maxResults: 50,
                            });
                          } else {
                            setScrapingConfig({
                              query: '',
                              urls:
                                source.id === 'firecrawl'
                                  ? ['https://www.mubawab.tn', 'https://www.tayara.tn/immobilier']
                                  : ['https://www.afif.tn', 'https://www.immobilier.com.tn'],
                              maxResults: 50,
                            });
                          }
                        }}
                        disabled={scrapingInProgress}
                        className={`w-full py-2 rounded-lg font-medium transition ${scrapingInProgress
                          ? 'bg-gray-100 text-gray-400'
                          : `bg-${source.color}-100 text-${source.color}-700 hover:bg-${source.color}-200`
                          }`}
                      >
                        {scrapingInProgress ? 'Scraping...' : '⚙️ Configurer'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }

        {/* Historique Tab */}
        {
          activeTab === 'historique' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Historique des Campagnes</h2>
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📜</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Historique des Actions</h3>
                <p className="text-gray-500 text-lg">
                  L'historique complet des campagnes et des actions effectuées s'affichera ici
                </p>
              </div>
            </div>
          )
        }

        {/* Settings Tab */}
      </main >

      {/* Campaign Creation Modal */}
      {
        showCampaignForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Nouvelle Campagne</h2>
                    <p className="text-purple-100 text-sm mt-1">Etape {campaignStep} sur 4</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCampaignForm(false);
                      setCampaignStep(1);
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
                {/* Progress bar */}
                <div className="flex gap-2 mt-4">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`flex-1 h-1 rounded-full ${step <= campaignStep ? 'bg-white' : 'bg-white/30'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {campaignStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900">Informations de base</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la campagne
                      </label>
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) =>
                          setNewCampaign((prev) => ({ ...prev, name: e.target.value }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Prospection Tunis Q4 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={newCampaign.description}
                        onChange={(e) =>
                          setNewCampaign((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        rows={3}
                        placeholder="Objectifs et details de la campagne..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de lead
                        </label>
                        <select
                          value={newCampaign.type}
                          onChange={(e) =>
                            setNewCampaign((prev) => ({
                              ...prev,
                              type: e.target.value as CampaignType,
                            }))
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="requete">🔍 Requete - Chercheurs</option>
                          <option value="mandat">🏠 Mandat - Proprietaires</option>
                          <option value="geographic">📍 Geographique</option>
                          <option value="demographic">👥 Demographique</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Objectif de leads
                        </label>
                        <input
                          type="number"
                          value={newCampaign.targetCount}
                          onChange={(e) =>
                            setNewCampaign((prev) => ({
                              ...prev,
                              targetCount: parseInt(e.target.value),
                            }))
                          }
                          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {campaignStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900">Ciblage geographique</h3>
                    <GeographicTargeting
                      onZonesChange={(zones: any) =>
                        setNewCampaign((prev) => ({
                          ...prev,
                          config: { ...prev.config, locations: zones.map((z: any) => z.name || z) },
                        }))
                      }
                      initialZones={
                        newCampaign.config.locations?.map((l, idx) => ({
                          id: `zone-${idx}`,
                          name: l,
                          type: 'city' as const,
                          selected: true,
                        })) || []
                      }
                    />
                  </div>
                )}

                {campaignStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900">Configuration du Scraping</h3>
                    <p className="text-sm text-gray-600 mb-4">Sélectionnez les moteurs de scraping à utiliser pour cette campagne</p>

                    {/* Scraping Engine Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Moteurs de Scraping</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'firecrawl', label: '🔥 Firecrawl', desc: 'Web scraping avancé' },
                          { id: 'cheerio', label: '📄 Cheerio', desc: 'Parsing HTML/DOM' },
                          { id: 'google-serp', label: '🔍 Google SERP', desc: 'Recherche Google' },
                          { id: 'linkedin', label: '💼 LinkedIn', desc: 'Profils pro' },
                          { id: 'pica', label: '🎯 Pica API', desc: 'Extraction leads' },
                          { id: 'jina', label: '⚡ Jina Reader', desc: 'Lecteur URL' },
                        ].map((engine) => (
                          <button
                            key={engine.id}
                            onClick={() => {
                              setNewCampaign((prev) => {
                                const engines = prev.scrapingEngines || [];
                                const updated = engines.includes(engine.id)
                                  ? engines.filter((e) => e !== engine.id)
                                  : [...engines, engine.id];
                                return {
                                  ...prev,
                                  scrapingEngines: updated,
                                };
                              });
                            }}
                            className={`p-3 rounded-lg border-2 text-left transition-all ${(newCampaign.scrapingEngines || []).includes(engine.id)
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-purple-300'
                              }`}
                          >
                            <div className="font-medium text-sm">{engine.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{engine.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Search Query / URLs Configuration */}
                    <div className="pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requête de recherche
                      </label>
                      <input
                        type="text"
                        value={newCampaign.scrapingConfig?.query || ''}
                        onChange={(e) =>
                          setNewCampaign((prev) => ({
                            ...prev,
                            scrapingConfig: { ...prev.scrapingConfig, query: e.target.value },
                          }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: appartement vendre tunis"
                      />
                    </div>

                    {/* URLs Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URLs à scraper (une par ligne)
                      </label>
                      <textarea
                        value={(newCampaign.scrapingConfig?.urls || []).join('\n')}
                        onChange={(e) =>
                          setNewCampaign((prev) => ({
                            ...prev,
                            scrapingConfig: {
                              ...prev.scrapingConfig,
                              urls: e.target.value.split('\n').filter((url) => url.trim()),
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        rows={4}
                        placeholder="https://example.com/1&#10;https://example.com/2"
                      />
                    </div>

                    {/* Max Results */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre maximum de résultats
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="500"
                        value={newCampaign.scrapingConfig?.maxResults || 50}
                        onChange={(e) =>
                          setNewCampaign((prev) => ({
                            ...prev,
                            scrapingConfig: {
                              ...prev.scrapingConfig,
                              maxResults: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                )}

                {campaignStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-lg text-gray-900">Ciblage demographique</h3>
                    <DemographicTargeting
                      onChange={(demographics: any) =>
                        setNewCampaign((prev) => ({
                          ...prev,
                          config: {
                            ...prev.config,
                            propertyTypes: demographics.propertyTypes || prev.config.propertyTypes,
                            minPrice: demographics.budgetRange?.min || prev.config.minPrice,
                            maxPrice: demographics.budgetRange?.max || prev.config.maxPrice,
                          },
                        }))
                      }
                      initialCriteria={{
                        propertyTypes: newCampaign.config.propertyTypes,
                        budgetRange: {
                          min: newCampaign.config.minPrice || 0,
                          max: newCampaign.config.maxPrice || 1000000,
                        },
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t flex justify-between">
                <button
                  onClick={() => setCampaignStep(Math.max(1, campaignStep - 1))}
                  disabled={campaignStep === 1}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  ← Retour
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCampaignForm(false);
                      setCampaignStep(1);
                    }}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  {campaignStep < 4 ? (
                    <button
                      onClick={() => setCampaignStep(campaignStep + 1)}
                      disabled={campaignStep === 1 && !newCampaign.name}
                      className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                    >
                      Suivant →
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateCampaign}
                      disabled={loading || !newCampaign.name}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                    >
                      {loading ? 'Creation...' : '🚀 Lancer la campagne'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Loading Overlay */}
      {
        (loading || scrapingInProgress || aiProcessingInProgress) && (
          <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl px-5 py-4 flex items-center gap-4 z-50">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-200 border-t-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {aiProcessingInProgress
                  ? 'Analyse IA en cours...'
                  : scrapingInProgress
                    ? 'Scraping en cours...'
                    : 'Chargement...'}
              </p>
              <p className="text-sm text-gray-500">Veuillez patienter</p>
            </div>
          </div>
        )
      }

      {/* Lead Detail Modal */}
      {
        showLeadModal && selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                      {(selectedLead.firstName?.[0] || '') + (selectedLead.lastName?.[0] || 'L')}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {selectedLead.firstName || ''} {selectedLead.lastName || 'Sans nom'}
                      </h2>
                      <p className="text-purple-100 text-sm mt-1">
                        {getLeadTypeLabel(selectedLead.leadType)} • Score: {selectedLead.score}%
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeadModal(false)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">📞 Contact</h3>
                  <div className="space-y-2">
                    {selectedLead.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📧</span> {selectedLead.email}
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📱</span> {selectedLead.phone}
                      </div>
                    )}
                    {selectedLead.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>📍</span> {selectedLead.city}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Score */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">📊 Statut</h3>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getLeadStatusColor(selectedLead.status)}`}
                    >
                      {getLeadStatusLabel(selectedLead.status)}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getLeadTypeColor(selectedLead.leadType)}`}
                    >
                      {getLeadTypeLabel(selectedLead.leadType)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm text-gray-600">Score:</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getScoreBadgeColor(selectedLead.score)}`}
                        style={{ width: `${selectedLead.score}%` }}
                      />
                    </div>
                    <span className="font-bold">{selectedLead.score}%</span>
                  </div>
                </div>

                {/* Budget */}
                {selectedLead.budget && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">💰 Budget</h3>
                    <p className="text-lg text-green-600 font-bold">
                      {typeof selectedLead.budget === 'object'
                        ? `${((selectedLead.budget as any).min / 1000).toFixed(0)}k - ${((selectedLead.budget as any).max / 1000).toFixed(0)}k TND`
                        : `${(selectedLead.budget / 1000).toFixed(0)}k TND`}
                    </p>
                  </div>
                )}

                {/* Source */}
                {selectedLead.source && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">🔗 Source</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getSourceColor(selectedLead.source as any)}`}
                    >
                      {getSourceLabel(selectedLead.source as any)}
                    </span>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">📝 Notes</h3>
                    {!editingNotes && (
                      <button
                        onClick={() => {
                          setEditingNotes(true);
                          setNotesValue(selectedLead.qualificationNotes || '');
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        ✏️ Modifier
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        rows={4}
                        placeholder="Ajouter des notes sur ce lead..."
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingNotes(false)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleSaveNotes}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          💾 Enregistrer
                        </button>
                      </div>
                    </div>
                  ) : selectedLead.qualificationNotes ? (
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                      {selectedLead.qualificationNotes}
                    </p>
                  ) : (
                    <p className="text-gray-400 bg-gray-50 rounded-lg p-3 italic">
                      Aucune note. Cliquez sur Modifier pour en ajouter.
                    </p>
                  )}
                </div>

                {/* Matching Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">🎯 Matching Biens</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLoadMatches(selectedLead.id)}
                        disabled={loadingMatches}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                      >
                        {loadingMatches ? '⏳' : '🔄'} Charger
                      </button>
                      <button
                        onClick={() => handleFindMatches(selectedLead.id)}
                        disabled={loadingMatches}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {loadingMatches ? '⏳ Recherche...' : '🔍 Trouver des matchs'}
                      </button>
                    </div>
                  </div>

                  {/* Match Results */}
                  {leadMatches.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {leadMatches.map((match: ProspectingMatch) => (
                        <div
                          key={match.id}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {match.property?.title || 'Bien immobilier'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {match.property?.city} • {match.property?.type} •{' '}
                                {((match.property?.price || 0) / 1000).toFixed(0)}k TND
                              </p>
                            </div>
                            <div className="text-right">
                              <div
                                className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${match.score >= 80
                                  ? 'bg-green-100 text-green-700'
                                  : match.score >= 60
                                    ? 'bg-blue-100 text-blue-700'
                                    : match.score >= 50
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}
                              >
                                {match.score}%
                              </div>
                            </div>
                          </div>

                          {/* Score Breakdown */}
                          {match.reason?.breakdown && (
                            <div className="mt-2 flex gap-2 flex-wrap text-xs">
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded">
                                Budget: {match.reason.breakdown.budgetPoints}/40
                              </span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                                Lieu: {match.reason.breakdown.locationPoints}/30
                              </span>
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded">
                                Type: {match.reason.breakdown.typePoints}/20
                              </span>
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded">
                                Bonus: {match.reason.breakdown.bonusPoints}/10
                              </span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-2 flex gap-2">
                            {match.property && (
                              <a
                                href={`/properties/${match.propertyId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              >
                                👁️ Voir le bien
                              </a>
                            )}
                            <button
                              onClick={() => handleNotifyMatch(match.id)}
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                            >
                              📧 Notifier
                            </button>
                            <button
                              onClick={() => handleUpdateMatchStatus(match.id, 'converted')}
                              className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100"
                            >
                              ✅ Accepter
                            </button>
                            <button
                              onClick={() => handleUpdateMatchStatus(match.id, 'ignored')}
                              className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                            >
                              ❌ Rejeter
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                      <p>Aucun match trouvé</p>
                      <p className="text-xs mt-1">
                        Cliquez sur "Trouver des matchs" pour lancer la recherche
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t flex justify-between">
                <button
                  onClick={() => setShowLeadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Fermer
                </button>
                <div className="flex gap-2">
                  {selectedLead.status === 'new' && (
                    <button
                      onClick={() => {
                        updateLead(selectedLead.id, { status: 'contacted' });
                        setShowLeadModal(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      📞 Marquer contacte
                    </button>
                  )}
                  {selectedLead.status === 'contacted' && (
                    <button
                      onClick={() => {
                        qualifyLead(selectedLead.id);
                        setShowLeadModal(false);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      ✅ Qualifier
                    </button>
                  )}
                  {selectedLead.status === 'qualified' && (
                    <button
                      onClick={async () => {
                        const result = await convertLead(selectedLead.id);
                        if (result?.prospect) {
                          // Dispatch event to notify other modules (prospects, etc.)
                          window.dispatchEvent(
                            new CustomEvent('prospecting:lead-converted', {
                              detail: {
                                leadId: selectedLead.id,
                                prospect: result.prospect,
                              },
                            })
                          );
                        }
                        setShowLeadModal(false);
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      🎉 Convertir
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Scraping Configuration Modal */}
      {
        showScrapingConfig && scrapingSource && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Configuration du Scraping</h2>
                    <p className="text-purple-100 text-sm mt-1">
                      {scrapingSource === 'pica' && 'Pica API - SERP + Firecrawl'}
                      {scrapingSource === 'serp' && 'Google SERP - Recherche Google'}
                      {scrapingSource === 'meta' && 'Meta/Facebook - Marketplace'}
                      {scrapingSource === 'linkedin' && 'LinkedIn - Profils pro'}
                      {scrapingSource === 'firecrawl' && 'Firecrawl - Web scraping'}
                      {scrapingSource === 'website' && 'Sites web - Agences immo'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowScrapingConfig(false);
                      setScrapingSource(null);
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                {['pica', 'serp', 'meta', 'linkedin'].includes(scrapingSource) ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requete de recherche
                      </label>
                      <input
                        type="text"
                        value={scrapingConfig.query}
                        onChange={(e) =>
                          setScrapingConfig((prev) => ({ ...prev, query: e.target.value }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: appartement vendre tunis"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre maximum de resultats
                      </label>
                      <input
                        type="number"
                        value={scrapingConfig.maxResults}
                        onChange={(e) =>
                          setScrapingConfig((prev) => ({
                            ...prev,
                            maxResults: parseInt(e.target.value) || 50,
                          }))
                        }
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                        min={1}
                        max={200}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URLs a scraper (une par ligne)
                    </label>
                    <textarea
                      value={scrapingConfig.urls.join('\n')}
                      onChange={(e) =>
                        setScrapingConfig((prev) => ({
                          ...prev,
                          urls: e.target.value.split('\n').filter(Boolean),
                        }))
                      }
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500"
                      rows={5}
                      placeholder="https://www.mubawab.tn&#10;https://www.tayara.tn/immobilier"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Entrez les URLs completes des pages a analyser
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t flex justify-between">
                <button
                  onClick={() => {
                    setShowScrapingConfig(false);
                    setScrapingSource(null);
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLaunchScraping}
                  disabled={
                    scrapingInProgress ||
                    (!scrapingConfig.query && scrapingConfig.urls.filter(Boolean).length === 0)
                  }
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  {scrapingInProgress ? '⏳ Scraping...' : '🚀 Lancer le scraping'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div >
  );
};

export default ProspectingDashboard;
