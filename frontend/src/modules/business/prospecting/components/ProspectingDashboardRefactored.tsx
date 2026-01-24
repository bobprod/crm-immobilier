import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useProspecting } from '@/shared/hooks/useProspecting';
import { LeadStatus } from '@/shared/utils/prospecting-api';

// Import new tab components
import { AiProspectionTab } from './tabs/AiProspectionTab';
import { CampaignsTab } from './tabs/CampaignsTab';
import { PipelineTab } from './tabs/PipelineTab';
import { CampaignFormModal } from './CampaignFormModal';

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
    <div
      className={`fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-slide-up`}
    >
      <span className="text-xl">{icons[type]}</span>
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-75">
        ×
      </button>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface ProspectingDashboardRefactoredProps {
  language?: 'fr' | 'en';
}

type TabType = 'ai-prospection' | 'campaigns' | 'pipeline';

export const ProspectingDashboardRefactored: React.FC<
  ProspectingDashboardRefactoredProps
> = ({ language = 'fr' }) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('ai-prospection');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const {
    campaigns,
    leads,
    globalStats,
    loading,
    error,
    loadCampaigns,
    loadLeads,
    loadAllStats,
    createCampaign,
    startCampaign,
    pauseCampaign,
    updateLead,
    deleteLead,
    convertLead,
    qualifyLead,
    clearError,
  } = useProspecting();

  // Initialize from URL params
  useEffect(() => {
    const { tab, campaign } = router.query;

    if (tab && typeof tab === 'string') {
      const validTabs: TabType[] = ['ai-prospection', 'campaigns', 'pipeline'];
      if (validTabs.includes(tab as TabType)) {
        setActiveTab(tab as TabType);
      }
    }

    if (campaign && typeof campaign === 'string') {
      setSelectedCampaignId(campaign);
    }
  }, [router.query]);

  // Initial data load
  useEffect(() => {
    loadCampaigns();
    loadAllStats();
  }, [loadCampaigns, loadAllStats]);

  // Load leads when campaign selected
  useEffect(() => {
    if (selectedCampaignId) {
      loadLeads(selectedCampaignId);
    }
  }, [selectedCampaignId, loadLeads]);

  // Update URL when tab changes
  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      const query: Record<string, string> = { tab };
      if (selectedCampaignId) query.campaign = selectedCampaignId;
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router, selectedCampaignId]
  );

  // Update URL when campaign changes
  const handleCampaignSelect = useCallback(
    (campaignId: string | null) => {
      setSelectedCampaignId(campaignId);
      const query: Record<string, string> = { tab: activeTab };
      if (campaignId) query.campaign = campaignId;
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });

      // Load leads for selected campaign
      if (campaignId) {
        loadLeads(campaignId);
      }
    },
    [router, activeTab, loadLeads]
  );

  // Toast helper
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setToast({ message, type });
    },
    []
  );

  // Handle campaign creation
  const handleCreateCampaign = useCallback(
    async (campaignData: any) => {
      try {
        const campaign = await createCampaign({
          name: campaignData.name,
          description: campaignData.description,
          type: campaignData.type,
          targetCount: campaignData.targetCount,
          config: {
            locations: campaignData.targetingConfig.zones.map((z: any) => z.name),
            propertyTypes: campaignData.targetingConfig.demographics.propertyTypes,
            sources: campaignData.scrapingEngines,
            keywords: campaignData.scrapingConfig.query
              ? [campaignData.scrapingConfig.query]
              : [],
            minPrice: campaignData.targetingConfig.demographics.budgetRange.min,
            maxPrice: campaignData.targetingConfig.demographics.budgetRange.max,
          },
        });

        if (campaign) {
          showToast('Campagne créée avec succès!', 'success');
          setShowCampaignForm(false);
          await loadCampaigns();
        }
      } catch (error) {
        console.error('Failed to create campaign:', error);
        showToast('Erreur lors de la création de la campagne', 'error');
      }
    },
    [createCampaign, loadCampaigns, showToast]
  );

  // Handle lead validation
  const handleLeadValidation = useCallback(
    async (leadIds: string[]) => {
      const leadsToValidate = leads.filter((l) => leadIds.includes(l.id));

      return leadIds.map((id) => {
        const lead = leadsToValidate.find((l) => l.id === id);
        const hasEmail = !!lead?.email;
        const hasPhone = !!lead?.phone;
        const hasName = !!(lead?.firstName || lead?.lastName);

        const emailScore = hasEmail ? 90 : 0;
        const phoneScore = hasPhone ? 70 : 0;
        const nameScore = hasName ? 80 : 40;
        const overallScore = Math.round((emailScore + phoneScore + nameScore) / 3);

        return {
          leadId: id,
          email: {
            valid: hasEmail,
            deliverable: hasEmail,
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
            status: (overallScore >= 70
              ? 'valid'
              : overallScore >= 40
              ? 'suspicious'
              : 'spam') as 'valid' | 'suspicious' | 'spam',
            flags: [
              ...(!hasEmail ? ['Email invalide'] : []),
              ...(!hasPhone ? ['Téléphone manquant'] : []),
              ...(!hasName ? ['Nom manquant'] : []),
            ],
          },
        };
      });
    },
    [leads]
  );

  // Handle lead update
  const handleLeadUpdate = useCallback(
    (leadId: string, data: any) => {
      updateLead(leadId, data);
    },
    [updateLead]
  );

  // Handle stage change
  const handleStageChange = useCallback(
    (leadId: string, newStatus: LeadStatus) => {
      updateLead(leadId, { status: newStatus });
    },
    [updateLead]
  );

  // Handle lead click (for details)
  const handleLeadClick = useCallback((lead: any) => {
    // TODO: Open lead details modal or navigate to lead page
    console.log('Lead clicked:', lead);
  }, []);

  // Tabs configuration
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'ai-prospection', label: 'Prospection IA', icon: '🤖' },
    { id: 'campaigns', label: 'Campagnes', icon: '📋' },
    { id: 'pipeline', label: 'Pipeline & Leads', icon: '🎯' },
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
                Trouvez des opportunités immobilières avec l'IA
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-[73px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-6 py-3 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
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
        {/* Onglet 1: Prospection IA */}
        {activeTab === 'ai-prospection' && <AiProspectionTab language={language} />}

        {/* Onglet 2: Campagnes */}
        {activeTab === 'campaigns' && (
          <CampaignsTab
            campaigns={campaigns}
            leads={leads}
            selectedCampaignId={selectedCampaignId}
            onCampaignSelect={handleCampaignSelect}
            onNewCampaign={() => setShowCampaignForm(true)}
            onStartCampaign={startCampaign}
            onPauseCampaign={pauseCampaign}
            onLeadUpdate={handleLeadUpdate}
            onValidateLeads={handleLeadValidation}
            loading={loading}
          />
        )}

        {/* Onglet 3: Pipeline & Leads */}
        {activeTab === 'pipeline' && (
          <PipelineTab
            leads={leads}
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onCampaignSelect={handleCampaignSelect}
            onLeadClick={handleLeadClick}
            onStageChange={handleStageChange}
          />
        )}
      </main>

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <CampaignFormModal
          show={showCampaignForm}
          onClose={() => setShowCampaignForm(false)}
          onCreate={handleCreateCampaign}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default ProspectingDashboardRefactored;
