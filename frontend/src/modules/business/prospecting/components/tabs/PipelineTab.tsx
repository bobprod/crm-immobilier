import React, { useMemo, useState } from 'react';
import { ProspectingLead, LeadStatus } from '@/shared/utils/prospecting-api';
import { SalesFunnel } from '../SalesFunnel';
import { LayoutList, GitMerge, LayoutGrid } from 'lucide-react';

interface PipelineTabProps {
  leads: ProspectingLead[];
  campaigns: any[];
  selectedCampaignId: string | null;
  onCampaignSelect: (campaignId: string | null) => void;
  onLeadClick?: (lead: ProspectingLead) => void;
  onStageChange?: (leadId: string, newStatus: LeadStatus) => void;
}

/**
 * Onglet 3: Pipeline & Leads
 * Gestion du pipeline de conversion — vue Entonnoir, Kanban ou Liste
 */
export const PipelineTab: React.FC<PipelineTabProps> = ({
  leads,
  campaigns,
  selectedCampaignId,
  onCampaignSelect,
  onLeadClick,
  onStageChange,
}) => {
  const [viewMode, setViewMode] = useState<'funnel' | 'kanban' | 'list'>('funnel');

  // Filter by selected campaign only (parent already applies status sub-tab filter)
  const filteredLeads = useMemo(() => {
    if (!selectedCampaignId) return leads;
    return leads.filter((l) => l.campaignId === selectedCampaignId);
  }, [leads, selectedCampaignId]);

  // Stats
  const totalLeads = filteredLeads.length;
  const qualifiedLeads = useMemo(
    () => filteredLeads.filter((l) => l.status === 'qualified').length,
    [filteredLeads]
  );
  const convertedLeads = useMemo(
    () => filteredLeads.filter((l) => l.status === 'converted').length,
    [filteredLeads]
  );
  const conversionRate =
    totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';
  const avgScore =
    totalLeads > 0
      ? Math.round(filteredLeads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads)
      : 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-300';
    return 'text-red-400';
  };

  return (
    <div className="space-y-5">
      {/* Header with Metrics */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              🎯 Pipeline de Conversion
            </h2>
            <p className="text-indigo-100 text-sm mt-0.5">
              Gérez et convertissez vos leads en prospects
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden bg-white/20 p-1">
            {[
              { id: 'funnel', label: 'Entonnoir', icon: GitMerge },
              { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
              { id: 'list', label: 'Liste', icon: LayoutList },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setViewMode(view.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition rounded-md ${
                  viewMode === view.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-white hover:bg-white/10'
                }`}
              >
                <view.icon className="w-3.5 h-3.5" />
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: totalLeads, label: 'Leads' },
            { value: qualifiedLeads, label: 'Qualifiés' },
            { value: `${conversionRate}%`, label: 'Taux de conversion' },
            { value: `${avgScore}`, label: 'Score moyen', className: getScoreColor(avgScore) },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className={`text-2xl font-bold ${s.className || ''}`}>{s.value}</div>
              <div className="text-indigo-100 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
          Filtrer par campagne :
        </label>
        <select
          value={selectedCampaignId || ''}
          onChange={(e) => onCampaignSelect(e.target.value || null)}
          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50"
        >
          <option value="">Toutes les campagnes</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.name} ({campaign.leadsCount || 0} leads)
            </option>
          ))}
        </select>
        {filteredLeads.length > 0 && (
          <span className="text-sm font-bold text-indigo-600 whitespace-nowrap bg-indigo-50 px-3 py-1 rounded-full">
            {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {filteredLeads.length > 0 ? (
        <>
          {(viewMode === 'funnel' || viewMode === 'kanban') && (
            <SalesFunnel
              leads={filteredLeads}
              viewMode={viewMode as 'funnel' | 'kanban'}
              onLeadClick={onLeadClick}
              onStageChange={onStageChange}
            />
          )}

          {viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Lead', 'Contact', 'Type', 'Statut', 'Score', 'Ville', 'Budget'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => onLeadClick?.(lead)}
                        className="hover:bg-purple-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || 'L')}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {lead.firstName} {lead.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{lead.email || '—'}</div>
                          <div className="text-xs text-gray-400">{lead.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.leadType === 'mandat' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                          }`}>
                            {lead.leadType === 'mandat' ? '🏠 Mandat' : '🔍 Requête'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                            lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                            lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {lead.status === 'new' && '🆕 Nouveau'}
                            {lead.status === 'contacted' && '📞 Contacté'}
                            {lead.status === 'qualified' && '✅ Qualifié'}
                            {lead.status === 'converted' && '🎉 Converti'}
                            {lead.status === 'rejected' && '❌ Rejeté'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-semibold ${
                            (lead.score || 0) >= 70 ? 'text-green-600' :
                            (lead.score || 0) >= 40 ? 'text-yellow-600' : 'text-red-500'
                          }`}>
                            {lead.score || 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {lead.city ? `📍 ${lead.city}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {lead.budget
                            ? typeof lead.budget === 'object'
                              ? `${((lead.budget as any).min / 1000).toFixed(0)}k–${((lead.budget as any).max / 1000).toFixed(0)}k`
                              : `${(lead.budget as any / 1000 || 0).toFixed(0)}k`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-14 text-center">
          <div className="text-5xl mb-4 opacity-40">🎯</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun lead trouvé</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
            Aucun lead ne correspond à vos critères de filtrage ou cette campagne est vide.
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
            <span>1️⃣ Créer une campagne</span>
            <span>→</span>
            <span>2️⃣ Valider les leads</span>
            <span>→</span>
            <span>3️⃣ Gérer le pipeline</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineTab;
