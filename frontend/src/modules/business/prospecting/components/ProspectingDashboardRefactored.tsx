import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useProspecting } from '@/shared/hooks/useProspecting';
import { LeadStatus, prospectingAPI } from '@/shared/utils/prospecting-api';
import {
  Bot,
  LayoutGrid,
  Target,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Zap,
  Play,
  Pause,
  Plus,
  RefreshCw,
  Shield,
  Filter,
  ChevronRight,
  Activity,
  Flame,
  Star,
} from 'lucide-react';

import { AiProspectionTab } from './tabs/AiProspectionTab';
import { CampaignsTab } from './tabs/CampaignsTab';
import { PipelineTab } from './tabs/PipelineTab';
import { CampaignFormModal } from './CampaignFormModal';

// ─── Toast ──────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: { bg: 'bg-emerald-500', icon: <CheckCircle2 className="w-4 h-4" /> },
    error: { bg: 'bg-red-500', icon: <XCircle className="w-4 h-4" /> },
    info: { bg: 'bg-blue-500', icon: <Activity className="w-4 h-4" /> },
    warning: { bg: 'bg-amber-500', icon: <AlertTriangle className="w-4 h-4" /> },
  };
  const s = styles[type];

  return (
    <div
      className={`fixed bottom-6 right-6 ${s.bg} text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-50 text-sm font-medium`}
      style={{ animation: 'slideUp 0.3s ease' }}
    >
      {s.icon}
      <span>{message}</span>
      <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100 text-lg leading-none">
        ×
      </button>
    </div>
  );
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color: 'purple' | 'blue' | 'emerald' | 'amber' | 'red';
}

const colorMap = {
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-100 text-purple-600',
    value: 'text-purple-700',
    border: 'border-l-purple-500',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
    border: 'border-l-blue-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    border: 'border-l-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    border: 'border-l-amber-500',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-100 text-red-600',
    value: 'text-red-700',
    border: 'border-l-red-500',
  },
};

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, color }) => {
  const c = colorMap[color];
  return (
    <div
      className={`bg-white rounded-xl px-4 py-3 border border-gray-100 border-l-4 ${c.border} shadow-sm hover:shadow-md transition-shadow flex items-center gap-3`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.icon} flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-xl font-bold leading-tight ${c.value}`}>{value}</p>
        <p className="text-xs font-medium text-gray-400 truncate">{label}</p>
      </div>
    </div>
  );
};

// ─── Tab types ───────────────────────────────────────────────────────────────

type MainTab = 'ai-prospection' | 'campaigns' | 'pipeline' | 'analytics';
type CampaignSubTab = 'active' | 'paused' | 'history';
type PipelineSubTab = 'all' | 'qualified' | 'to-contact' | 'converted' | 'spam';

interface ProspectingDashboardRefactoredProps {
  language?: 'fr' | 'en';
}

// ─── Analytics stub tab ──────────────────────────────────────────────────────

const AnalyticsTab: React.FC<{ campaigns: any[]; leads: any[] }> = ({ campaigns, leads }) => {
  const sourceStats = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || 'Autre';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  const total = leads.length || 1;

  return (
    <div className="space-y-6">
      {/* Performance summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-800">Taux de conversion</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">
            {leads.length > 0
              ? Math.round(
                  (leads.filter((l) => l.status === 'converted').length / leads.length) * 100
                )
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500 mt-1">Leads → Prospects qualifiés</p>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              style={{
                width: `${leads.length > 0 ? Math.round((leads.filter((l) => l.status === 'converted').length / leads.length) * 100) : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Flame className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-800">Score moyen</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {leads.length > 0
              ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length)
              : 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Qualité moyenne des leads</p>
          <div className="flex gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= 3 ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-gray-800">Campagnes actives</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-700">
            {campaigns.filter((c) => c.status === 'active').length}
          </p>
          <p className="text-xs text-gray-500 mt-1">sur {campaigns.length} campagnes</p>
        </div>
      </div>

      {/* Sources breakdown */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Filter className="w-4 h-4 text-purple-500" />
          Répartition par source
        </h3>
        {sourceStats.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sourceStats.map(([src, count]) => (
              <div key={src}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{src}</span>
                  <span className="text-gray-500">
                    {count} leads ({Math.round((count / total) * 100)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-700"
                    style={{ width: `${Math.round((count / total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export const ProspectingDashboardRefactored: React.FC<ProspectingDashboardRefactoredProps> = ({
  language = 'fr',
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MainTab>('ai-prospection');
  const [campaignSubTab, setCampaignSubTab] = useState<CampaignSubTab>('active');
  const [pipelineSubTab, setPipelineSubTab] = useState<PipelineSubTab>('all');
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

  useEffect(() => {
    const { tab, campaign } = router.query;
    if (tab && typeof tab === 'string') {
      const valid: MainTab[] = ['ai-prospection', 'campaigns', 'pipeline', 'analytics'];
      if (valid.includes(tab as MainTab)) setActiveTab(tab as MainTab);
    }
    if (campaign && typeof campaign === 'string') setSelectedCampaignId(campaign);
  }, [router.query]);

  useEffect(() => {
    loadCampaigns();
    loadAllStats();
  }, [loadCampaigns, loadAllStats]);

  useEffect(() => {
    if (selectedCampaignId) loadLeads(selectedCampaignId);
  }, [selectedCampaignId, loadLeads]);

  const handleTabChange = useCallback(
    (tab: MainTab) => {
      setActiveTab(tab);
      const query: Record<string, string> = { tab };
      if (selectedCampaignId) query.campaign = selectedCampaignId;
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router, selectedCampaignId]
  );

  const handleCampaignSelect = useCallback(
    (campaignId: string | null) => {
      setSelectedCampaignId(campaignId);
      if (campaignId) loadLeads(campaignId);
      const query: Record<string, string> = { tab: activeTab };
      if (campaignId) query.campaign = campaignId;
      router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
    },
    [router, activeTab, loadLeads]
  );

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setToast({ message, type });
    },
    []
  );

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
            keywords: campaignData.scrapingConfig.query ? [campaignData.scrapingConfig.query] : [],
            minPrice: campaignData.targetingConfig.demographics.budgetRange.min,
            maxPrice: campaignData.targetingConfig.demographics.budgetRange.max,
          },
        });
        if (campaign) {
          showToast('Campagne créée avec succès !', 'success');
          setShowCampaignForm(false);
          await loadCampaigns();
        }
      } catch {
        showToast('Erreur lors de la création de la campagne', 'error');
      }
    },
    [createCampaign, loadCampaigns, showToast]
  );

  const handleLeadValidation = useCallback(
    async (leadIds: string[]) => {
      const leadsToValidate = leads.filter((l) => leadIds.includes(l.id));
      try {
        const results = await prospectingAPI.validateLeads(
          leadsToValidate.map((l) => ({
            id: l.id,
            email: l.email,
            phone: l.phone,
            firstName: l.firstName,
            lastName: l.lastName,
          }))
        );
        return results;
      } catch {
        // Fallback local si le backend est indisponible
        return leadIds.map((id) => {
          const lead = leadsToValidate.find((l) => l.id === id);
          const hasEmail = !!lead?.email;
          const hasPhone = !!lead?.phone;
          const hasName = !!(lead?.firstName || lead?.lastName);
          const score = Math.round(
            ((hasEmail ? 80 : 0) + (hasPhone ? 70 : 0) + (hasName ? 80 : 40)) / 3
          );
          return {
            leadId: id,
            email: {
              valid: hasEmail,
              deliverable: hasEmail,
              disposable: false,
              role: false,
              score: hasEmail ? 80 : 0,
            },
            phone: { valid: hasPhone, formatted: lead?.phone || '', type: 'mobile' as const },
            name: {
              valid: hasName,
              confidence: hasName ? 85 : 0,
              issues: hasName ? [] : ['Nom manquant'],
            },
            overall: {
              score,
              status: (score >= 70 ? 'valid' : score >= 40 ? 'suspicious' : 'spam') as
                | 'valid'
                | 'suspicious'
                | 'spam',
              flags: [
                ...(!hasEmail ? ['Email invalide'] : []),
                ...(!hasPhone ? ['Téléphone manquant'] : []),
                ...(!hasName ? ['Nom manquant'] : []),
              ],
            },
          };
        });
      }
    },
    [leads]
  );

  const handleLeadUpdate = useCallback(
    (leadId: string, data: any) => updateLead(leadId, data),
    [updateLead]
  );
  const handleStageChange = useCallback(
    (leadId: string, newStatus: LeadStatus) => updateLead(leadId, { status: newStatus }),
    [updateLead]
  );
  const handleLeadClick = useCallback((lead: any) => console.log('Lead:', lead), []);

  // ── KPIs
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'active').length;
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified' || l.validated).length;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;
  const spamCount = leads.filter((l) => l.spam).length;

  // ── Main tabs config
  const mainTabs: { id: MainTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'ai-prospection', label: 'Prospection IA', icon: <Bot className="w-4 h-4" /> },
    {
      id: 'campaigns',
      label: 'Campagnes',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: activeCampaignsCount || undefined,
    },
    {
      id: 'pipeline',
      label: 'Pipeline & Leads',
      icon: <Target className="w-4 h-4" />,
      badge: totalLeads || undefined,
    },
    { id: 'analytics', label: 'Analytiques', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  // ── Sub-tabs
  const campaignSubTabs: { id: CampaignSubTab; label: string; count: number }[] = [
    {
      id: 'active',
      label: 'Actives',
      count: campaigns.filter((c) => c.status === 'active').length,
    },
    {
      id: 'paused',
      label: 'En pause',
      count: campaigns.filter((c) => c.status === 'paused').length,
    },
    {
      id: 'history',
      label: 'Historique',
      count: campaigns.filter((c) => c.status === 'completed').length,
    },
  ];

  const pipelineSubTabs: { id: PipelineSubTab; label: string; count: number; color: string }[] = [
    { id: 'all', label: 'Tous', count: leads.length, color: 'bg-gray-500' },
    {
      id: 'qualified',
      label: 'Qualifiés',
      count: leads.filter((l) => l.status === 'qualified').length,
      color: 'bg-emerald-500',
    },
    {
      id: 'to-contact',
      label: 'À contacter',
      count: leads.filter((l) => l.status === 'new').length,
      color: 'bg-blue-500',
    },
    {
      id: 'converted',
      label: 'Convertis',
      count: leads.filter((l) => l.status === 'converted').length,
      color: 'bg-purple-500',
    },
    { id: 'spam', label: 'Spam', count: spamCount, color: 'bg-red-500' },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(135deg, #f8f7ff 0%, #fdf4ff 100%)' }}
    >
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </span>
                Prospection Intelligente
              </h1>
              <p className="text-sm text-gray-500 mt-0.5 ml-10">
                Trouvez des opportunités immobilières avec l'IA
              </p>
            </div>

            <div className="flex items-center gap-3">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Chargement…</span>
                </div>
              )}
              <button
                onClick={() => setShowCampaignForm(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm hover:shadow-md transition-all"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)' }}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvelle campagne</span>
              </button>
            </div>
          </div>

          {/* ── Main Tab Bar ───────────────────────────────────────────── */}
          <div className="flex gap-1 overflow-x-auto pb-px">
            {mainTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? 'text-purple-700 border-purple-600 bg-purple-50/60'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Error Banner ───────────────────────────────────────────────── */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex justify-between items-center text-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* ── KPI Bar (always visible) ────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            icon={<LayoutGrid className="w-5 h-5" />}
            label="Campagnes actives"
            value={activeCampaignsCount}
            sub={`${campaigns.length} au total`}
            color="purple"
          />
          <KpiCard
            icon={<Users className="w-5 h-5" />}
            label="Leads collectés"
            value={totalLeads}
            trend={12}
            color="blue"
          />
          <KpiCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Taux de qualification"
            value={`${conversionRate}%`}
            sub={`${qualifiedLeads} qualifiés`}
            color="emerald"
          />
          <KpiCard
            icon={<Shield className="w-5 h-5" />}
            label="Spams filtrés"
            value={spamCount}
            color="red"
          />
        </div>

        {/* ── Sub Tab Bar (Campaigns) ─────────────────────────────────── */}
        {activeTab === 'campaigns' && (
          <div className="flex items-center gap-2 mb-5 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm w-fit">
            {campaignSubTabs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setCampaignSubTab(sub.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  campaignSubTab === sub.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {sub.label}
                {sub.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      campaignSubTab === sub.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sub.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Sub Tab Bar (Pipeline) ──────────────────────────────────── */}
        {activeTab === 'pipeline' && (
          <div className="flex items-center gap-2 mb-5 bg-white rounded-2xl p-1.5 border border-gray-100 shadow-sm overflow-x-auto w-fit max-w-full">
            {pipelineSubTabs.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setPipelineSubTab(sub.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  pipelineSubTab === sub.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${sub.color} ${
                    pipelineSubTab === sub.id ? 'bg-white' : ''
                  }`}
                />
                {sub.label}
                {sub.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      pipelineSubTab === sub.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {sub.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Tab Content ─────────────────────────────────────────────── */}

        {activeTab === 'ai-prospection' && <AiProspectionTab language={language} />}

        {activeTab === 'campaigns' && (
          <CampaignsTab
            campaigns={
              campaignSubTab === 'active'
                ? campaigns.filter((c) => c.status === 'active')
                : campaignSubTab === 'paused'
                  ? campaigns.filter((c) => c.status === 'paused')
                  : campaigns.filter((c) => c.status === 'completed')
            }
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

        {activeTab === 'pipeline' && (
          <PipelineTab
            leads={
              pipelineSubTab === 'all'
                ? leads
                : pipelineSubTab === 'qualified'
                  ? leads.filter((l) => l.status === 'qualified' || l.validated)
                  : pipelineSubTab === 'to-contact'
                    ? leads.filter((l) => l.status === 'new' && !l.spam)
                    : pipelineSubTab === 'converted'
                      ? leads.filter((l) => l.status === 'converted')
                      : /* spam */ leads.filter((l) => l.spam)
            }
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onCampaignSelect={handleCampaignSelect}
            onLeadClick={handleLeadClick}
            onStageChange={handleStageChange}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsTab campaigns={campaigns} leads={leads} />}
      </div>

      {/* ── Campaign Form Modal ─────────────────────────────────────────── */}
      {showCampaignForm && (
        <CampaignFormModal
          show={showCampaignForm}
          onClose={() => setShowCampaignForm(false)}
          onCreate={handleCreateCampaign}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ProspectingDashboardRefactored;
