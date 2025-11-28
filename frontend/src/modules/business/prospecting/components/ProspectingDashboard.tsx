import React, { useEffect, useState } from 'react';
import { useProspecting } from '@/shared/hooks/useProspecting';
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
  CampaignStatus,
  LeadType,
  ProspectingCampaign,
  ProspectingLead,
} from '@/shared/utils/prospecting-api';

// ============================================
// TYPES
// ============================================

interface ProspectingDashboardProps {
  language?: 'fr' | 'en';
}

type TabType = 'dashboard' | 'campaigns' | 'leads' | 'scraping' | 'ai' | 'settings';

// ============================================
// SUB-COMPONENTS
// ============================================

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  change?: number;
  color?: string;
}> = ({ title, value, icon, change, color = 'purple' }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}% vs mois dernier
          </p>
        )}
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  </div>
);

const CampaignCard: React.FC<{
  campaign: ProspectingCampaign;
  onSelect: (id: string) => void;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
}> = ({ campaign, onSelect, onStart, onPause }) => (
  <div
    className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
    onClick={() => onSelect(campaign.id)}
  >
    <div className="flex justify-between items-start mb-3">
      <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
      <span className={`px-2 py-1 rounded-full text-xs ${getCampaignStatusColor(campaign.status)}`}>
        {getCampaignStatusLabel(campaign.status)}
      </span>
    </div>
    <p className="text-sm text-gray-500 mb-3">{campaign.description || 'Pas de description'}</p>
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">
        {getCampaignTypeLabel(campaign.type)}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-purple-600 font-medium">{campaign.foundCount} leads</span>
        <span className="text-green-600 font-medium">{campaign.matchedCount} matchs</span>
      </div>
    </div>
    <div className="mt-3 flex gap-2">
      {campaign.status === 'draft' || campaign.status === 'paused' ? (
        <button
          onClick={(e) => { e.stopPropagation(); onStart(campaign.id); }}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Demarrer
        </button>
      ) : campaign.status === 'active' ? (
        <button
          onClick={(e) => { e.stopPropagation(); onPause(campaign.id); }}
          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
        >
          Pause
        </button>
      ) : null}
    </div>
  </div>
);

const LeadRow: React.FC<{
  lead: ProspectingLead;
  onSelect: (id: string) => void;
  onConvert: (id: string) => void;
  onQualify: (id: string) => void;
}> = ({ lead, onSelect, onConvert, onQualify }) => (
  <tr
    className="hover:bg-gray-50 cursor-pointer"
    onClick={() => onSelect(lead.id)}
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-purple-600 font-medium">
            {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || 'L')}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {lead.firstName || ''} {lead.lastName || 'Lead sans nom'}
          </p>
          <p className="text-sm text-gray-500">{lead.email || lead.phone || '-'}</p>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <span className={`px-2 py-1 rounded-full text-xs ${getLeadTypeColor(lead.leadType)}`}>
        {getLeadTypeLabel(lead.leadType)}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className={`px-2 py-1 rounded-full text-xs ${getSourceColor(lead.source)}`}>
        {getSourceLabel(lead.source)}
      </span>
    </td>
    <td className="px-4 py-3">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadgeColor(lead.score)}`}>
        {lead.score}%
      </span>
    </td>
    <td className="px-4 py-3">
      <span className={`px-2 py-1 rounded-full text-xs ${getLeadStatusColor(lead.status)}`}>
        {getLeadStatusLabel(lead.status)}
      </span>
    </td>
    <td className="px-4 py-3">
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onQualify(lead.id); }}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          title="Qualifier avec IA"
        >
          IA
        </button>
        {lead.status !== 'converted' && (
          <button
            onClick={(e) => { e.stopPropagation(); onConvert(lead.id); }}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Convertir
          </button>
        )}
      </div>
    </td>
  </tr>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const ProspectingDashboard: React.FC<ProspectingDashboardProps> = ({
  language = 'fr',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    type: 'requete' as const,
    targetCount: 100,
  });
  const [scrapingConfig, setScrapingConfig] = useState({
    query: '',
    locations: ['Tunis'],
    leadType: 'requete' as LeadType,
    maxResults: 50,
  });

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
    convertLead,
    qualifyLead,
    scrapePica,
    scrapeSERP,
    scrapeSocial,
    detectOpportunities,
    clearError,
  } = useProspecting();

  // Initial data load
  useEffect(() => {
    loadCampaigns();
    loadSources();
    loadAllStats();
  }, []);

  // Load leads when campaign selected
  useEffect(() => {
    if (selectedCampaignId) {
      loadLeads(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  const handleCreateCampaign = async () => {
    const campaign = await createCampaign(newCampaign);
    if (campaign) {
      setShowCampaignForm(false);
      setNewCampaign({ name: '', description: '', type: 'requete', targetCount: 100 });
    }
  };

  const handleScrape = async (source: 'pica' | 'serp' | 'meta' | 'linkedin') => {
    switch (source) {
      case 'pica':
        await scrapePica(scrapingConfig);
        break;
      case 'serp':
        await scrapeSERP(scrapingConfig);
        break;
      case 'meta':
      case 'linkedin':
        await scrapeSocial(source, scrapingConfig.query, scrapingConfig);
        break;
    }
  };

  const handleDetectOpportunities = async () => {
    await detectOpportunities({
      keywords: scrapingConfig.query.split(' '),
      locations: scrapingConfig.locations,
      leadType: scrapingConfig.leadType,
    });
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: '📊' },
    { id: 'campaigns', label: 'Campagnes', icon: '🎯' },
    { id: 'leads', label: 'Leads', icon: '👥' },
    { id: 'scraping', label: 'Scraping', icon: '🔍' },
    { id: 'ai', label: 'Detection IA', icon: '🤖' },
    { id: 'settings', label: 'Parametres', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prospection Intelligente</h1>
              <p className="text-sm text-gray-500 mt-1">
                Trouvez des opportunites immobilieres avec l&apos;IA
              </p>
            </div>
            <button
              onClick={() => setShowCampaignForm(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              + Nouvelle Campagne
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Leads"
                value={globalStats?.total || 0}
                icon="👥"
                change={12}
              />
              <StatCard
                title="Leads Convertis"
                value={globalStats?.converted || 0}
                icon="✅"
                change={8}
                color="green"
              />
              <StatCard
                title="Taux de Conversion"
                value={`${(globalStats?.conversionRate || 0).toFixed(1)}%`}
                icon="📈"
                change={5}
                color="blue"
              />
              <StatCard
                title="Score Moyen"
                value={`${(globalStats?.avgScore || 0).toFixed(0)}%`}
                icon="⭐"
                color="yellow"
              />
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Campagnes Recentes</h2>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Voir tout →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.slice(0, 3).map(campaign => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onSelect={setSelectedCampaignId}
                    onStart={startCampaign}
                    onPause={pauseCampaign}
                  />
                ))}
                {campaigns.length === 0 && (
                  <p className="text-gray-500 col-span-3 text-center py-8">
                    Aucune campagne. Creez votre premiere campagne de prospection.
                  </p>
                )}
              </div>
            </div>

            {/* Stats by Source */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance par Source</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm text-gray-500">Source</th>
                      <th className="text-left py-2 text-sm text-gray-500">Leads</th>
                      <th className="text-left py-2 text-sm text-gray-500">Conversion</th>
                      <th className="text-left py-2 text-sm text-gray-500">Score Moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceStats.map(stat => (
                      <tr key={stat.source} className="border-b hover:bg-gray-50">
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${getSourceColor(stat.source as any)}`}>
                            {getSourceLabel(stat.source as any)}
                          </span>
                        </td>
                        <td className="py-3 font-medium">{stat.leadsCount}</td>
                        <td className="py-3">{stat.conversionRate.toFixed(1)}%</td>
                        <td className="py-3">{stat.avgScore.toFixed(0)}%</td>
                      </tr>
                    ))}
                    {sourceStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">
                          Pas encore de donnees
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Mes Campagnes</h2>
              <div className="flex gap-2">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">Tous les statuts</option>
                  <option value="active">Actives</option>
                  <option value="paused">En pause</option>
                  <option value="draft">Brouillons</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map(campaign => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSelect={setSelectedCampaignId}
                  onStart={startCampaign}
                  onPause={pauseCampaign}
                />
              ))}
            </div>
            {campaigns.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 mb-4">Aucune campagne trouvee</p>
                <button
                  onClick={() => setShowCampaignForm(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Creer une campagne
                </button>
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Leads</h2>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border rounded-lg text-sm"
                  value={selectedCampaignId || ''}
                  onChange={(e) => setSelectedCampaignId(e.target.value || null)}
                >
                  <option value="">Toutes les campagnes</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">Tous les types</option>
                  <option value="requete">Requete</option>
                  <option value="mandat">Mandat</option>
                </select>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm text-gray-500">Lead</th>
                    <th className="text-left px-4 py-3 text-sm text-gray-500">Type</th>
                    <th className="text-left px-4 py-3 text-sm text-gray-500">Source</th>
                    <th className="text-left px-4 py-3 text-sm text-gray-500">Score</th>
                    <th className="text-left px-4 py-3 text-sm text-gray-500">Statut</th>
                    <th className="text-left px-4 py-3 text-sm text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map(lead => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onSelect={(id) => console.log('Select lead:', id)}
                      onConvert={convertLead}
                      onQualify={qualifyLead}
                    />
                  ))}
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        {selectedCampaignId
                          ? 'Aucun lead dans cette campagne'
                          : 'Selectionnez une campagne pour voir les leads'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Scraping Tab */}
        {activeTab === 'scraping' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration du Scraping</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mots-cles de recherche
                  </label>
                  <input
                    type="text"
                    value={scrapingConfig.query}
                    onChange={(e) => setScrapingConfig(prev => ({ ...prev, query: e.target.value }))}
                    placeholder="appartement vendre tunis..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={scrapingConfig.locations.join(', ')}
                    onChange={(e) => setScrapingConfig(prev => ({
                      ...prev,
                      locations: e.target.value.split(',').map(s => s.trim())
                    }))}
                    placeholder="Tunis, Sousse, Sfax..."
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de lead
                  </label>
                  <select
                    value={scrapingConfig.leadType}
                    onChange={(e) => setScrapingConfig(prev => ({ ...prev, leadType: e.target.value as LeadType }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="requete">Requete (cherche bien)</option>
                    <option value="mandat">Mandat (possede bien)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre max de resultats
                  </label>
                  <input
                    type="number"
                    value={scrapingConfig.maxResults}
                    onChange={(e) => setScrapingConfig(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sources de Donnees</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Pica API */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xl">🔮</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Pica API</h3>
                      <p className="text-xs text-gray-500">SERP + Firecrawl combines</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleScrape('pica')}
                    disabled={scrapingInProgress}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {scrapingInProgress ? 'Scraping...' : 'Lancer Pica'}
                  </button>
                </div>

                {/* Google SERP */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl">🔍</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Google SERP</h3>
                      <p className="text-xs text-gray-500">Resultats de recherche</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleScrape('serp')}
                    disabled={scrapingInProgress}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {scrapingInProgress ? 'Scraping...' : 'Lancer SERP'}
                  </button>
                </div>

                {/* Meta/Facebook */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">📘</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Meta / Facebook</h3>
                      <p className="text-xs text-gray-500">Marketplace & Groupes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleScrape('meta')}
                    disabled={scrapingInProgress}
                    className="w-full px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {scrapingInProgress ? 'Scraping...' : 'Lancer Meta'}
                  </button>
                </div>

                {/* LinkedIn */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <span className="text-xl">💼</span>
                    </div>
                    <div>
                      <h3 className="font-medium">LinkedIn</h3>
                      <p className="text-xs text-gray-500">Profils professionnels</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleScrape('linkedin')}
                    disabled={scrapingInProgress}
                    className="w-full px-3 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {scrapingInProgress ? 'Scraping...' : 'Lancer LinkedIn'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Detection Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detection IA d&apos;Opportunites</h2>
              <p className="text-gray-600 mb-4">
                Utilisez l&apos;intelligence artificielle pour detecter automatiquement des opportunites
                immobilieres a partir de diverses sources.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDetectOpportunities}
                  disabled={aiProcessingInProgress}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {aiProcessingInProgress ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Analyse en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>🤖</span>
                      Detecter des opportunites
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fonctionnalites IA</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="text-3xl mb-2">🎯</div>
                  <h3 className="font-medium mb-1">Classification Automatique</h3>
                  <p className="text-sm text-gray-500">
                    L&apos;IA classe automatiquement les leads en requete ou mandat
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-3xl mb-2">⭐</div>
                  <h3 className="font-medium mb-1">Scoring Intelligent</h3>
                  <p className="text-sm text-gray-500">
                    Attribution d&apos;un score de qualite base sur plusieurs criteres
                  </p>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-3xl mb-2">🔗</div>
                  <h3 className="font-medium mb-1">Matching Automatique</h3>
                  <p className="text-sm text-gray-500">
                    Correspondance automatique entre leads et proprietes
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration des Sources</h2>
              <p className="text-gray-600 mb-4">
                Configurez vos cles API dans le module Parametres pour activer les sources de donnees.
              </p>
              <div className="space-y-3">
                {sources.map(source => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${source.configured ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <span className={`text-sm ${source.configured ? 'text-green-600' : 'text-gray-500'}`}>
                      {source.configured ? 'Configure' : 'Non configure'}
                    </span>
                  </div>
                ))}
                {sources.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Chargement des sources...</p>
                )}
              </div>
              <div className="mt-4">
                <a
                  href="/settings/integrations"
                  className="text-purple-600 hover:text-purple-700 text-sm"
                >
                  → Configurer les integrations dans Parametres
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Campaign Form Modal */}
      {showCampaignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nouvelle Campagne</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ma campagne de prospection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Description de la campagne..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newCampaign.type}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="requete">Requete - Chercheurs de biens</option>
                  <option value="mandat">Mandat - Proprietaires de biens</option>
                  <option value="geographic">Geographique</option>
                  <option value="demographic">Demographique</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objectif de leads</label>
                <input
                  type="number"
                  value={newCampaign.targetCount}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, targetCount: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCampaignForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Creation...' : 'Creer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent" />
          <span className="text-sm text-gray-600">Chargement...</span>
        </div>
      )}
    </div>
  );
};

export default ProspectingDashboard;
