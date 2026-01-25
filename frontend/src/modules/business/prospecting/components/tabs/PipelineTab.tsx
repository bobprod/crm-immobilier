import React, { useMemo, useState } from 'react';
import { ProspectingLead, LeadStatus } from '@/shared/utils/prospecting-api';
import { SalesFunnel } from '../SalesFunnel';

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
 * Gestion du pipeline de conversion avec vue Kanban par défaut
 */
export const PipelineTab: React.FC<PipelineTabProps> = ({
  leads,
  campaigns,
  selectedCampaignId,
  onCampaignSelect,
  onLeadClick,
  onStageChange,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'funnel' | 'list'>('kanban');

  // Filter leads - only validated leads
  const validatedLeads = useMemo(
    () => leads.filter((l) => l.validated && !l.spam),
    [leads]
  );

  // Filter by selected campaign
  const filteredLeads = useMemo(() => {
    if (!selectedCampaignId) return validatedLeads;
    return validatedLeads.filter((l) => l.campaignId === selectedCampaignId);
  }, [validatedLeads, selectedCampaignId]);

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
      ? Math.round(filteredLeads.reduce((sum, l) => sum + l.score, 0) / totalLeads)
      : 0;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🎯</span> Pipeline de Conversion
            </h2>
            <p className="text-indigo-100 mt-1">
              Gérez et convertissez vos leads validés en prospects
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden bg-white/20">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
                }`}
            >
              📊 Kanban
            </button>
            <button
              onClick={() => setViewMode('funnel')}
              className={`px-4 py-2 text-sm font-medium transition ${viewMode === 'funnel' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
                }`}
            >
              🔽 Entonnoir
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium transition ${viewMode === 'list' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
                }`}
            >
              📋 Liste
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold">{totalLeads}</div>
            <div className="text-indigo-100 text-sm mt-1">Leads qualifiés</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold">{qualifiedLeads}</div>
            <div className="text-indigo-100 text-sm mt-1">Prêts à contacter</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl font-bold">{conversionRate}%</div>
            <div className="text-indigo-100 text-sm mt-1">Taux de conversion</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className={`text-3xl font-bold ${getScoreColor(avgScore)}`}>
              {avgScore}%
            </div>
            <div className="text-indigo-100 text-sm mt-1">Score moyen</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par campagne
            </label>
            <select
              value={selectedCampaignId || ''}
              onChange={(e) => onCampaignSelect(e.target.value || null)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Toutes les campagnes</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.leadsCount || 0} leads)
                </option>
              ))}
            </select>
          </div>

          {filteredLeads.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Affichage:</span>
              <span className="font-medium text-purple-600">
                {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content based on view mode */}
      {filteredLeads.length > 0 ? (
        <>
          {(viewMode === 'kanban' || viewMode === 'funnel') && (
            <SalesFunnel
              leads={filteredLeads}
              onLeadClick={onLeadClick}
              onStageChange={onStageChange}
            />
          )}

          {viewMode === 'list' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localisation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => onLeadClick?.(lead)}
                        className="hover:bg-gray-50 cursor-pointer transition"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                              {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || 'L')}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {lead.firstName} {lead.lastName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{lead.email || '-'}</div>
                          <div className="text-sm text-gray-500">{lead.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.leadType === 'mandat'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                              }`}
                          >
                            {lead.leadType === 'mandat' ? '🏠 Mandat' : '🔍 Requête'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.status === 'converted'
                                ? 'bg-green-100 text-green-800'
                                : lead.status === 'qualified'
                                  ? 'bg-blue-100 text-blue-800'
                                  : lead.status === 'contacted'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {lead.status === 'new' && '🆕 Nouveau'}
                            {lead.status === 'contacted' && '📞 Contacté'}
                            {lead.status === 'qualified' && '✅ Qualifié'}
                            {lead.status === 'converted' && '🎉 Converti'}
                            {lead.status === 'rejected' && '❌ Rejeté'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lead.score >= 70
                                  ? 'bg-green-100 text-green-800'
                                  : lead.score >= 40
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {lead.score}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.city ? `📍 ${lead.city}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.budget
                            ? typeof lead.budget === 'object'
                              ? `${((lead.budget as any).min / 1000).toFixed(0)}k - ${((lead.budget as any).max / 1000).toFixed(0)}k TND`
                              : `${(lead.budget / 1000).toFixed(0)}k TND`
                            : '-'}
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
        <div className="bg-white rounded-xl shadow p-16 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun lead dans le pipeline</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Les leads validés de vos campagnes apparaîtront ici automatiquement. Assurez-vous de
            valider vos leads dans l'onglet "Campagnes".
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>1️⃣</span>
              <span>Créer une campagne</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-2">
              <span>2️⃣</span>
              <span>Valider les leads</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-2">
              <span>3️⃣</span>
              <span>Convertir ici</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineTab;
