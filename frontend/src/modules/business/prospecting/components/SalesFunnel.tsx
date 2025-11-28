import React, { useState, useMemo } from 'react';
import { ProspectingLead, LeadStatus } from '@/shared/utils/prospecting-api';

interface FunnelStage {
  id: LeadStatus;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

interface SalesFunnelProps {
  leads: ProspectingLead[];
  onLeadClick?: (lead: ProspectingLead) => void;
  onStageChange?: (leadId: string, newStatus: LeadStatus) => void;
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: 'new',
    name: 'Nouveaux',
    icon: '🆕',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Leads fraichement captures',
  },
  {
    id: 'contacted',
    name: 'Contactes',
    icon: '📞',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Premier contact etabli',
  },
  {
    id: 'qualified',
    name: 'Qualifies',
    icon: '✅',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Besoin confirme et budget valide',
  },
  {
    id: 'converted',
    name: 'Convertis',
    icon: '🎉',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    description: 'Devenus prospects actifs',
  },
  {
    id: 'rejected',
    name: 'Rejetes',
    icon: '❌',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Non qualifies ou desinteresses',
  },
];

const LeadCard: React.FC<{
  lead: ProspectingLead;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}> = ({ lead, onClick, onDragStart }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-all hover:border-purple-300"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
            {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || 'L')}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {lead.firstName || ''} {lead.lastName || 'Sans nom'}
            </p>
            <p className="text-xs text-gray-500">{lead.email || lead.phone || '-'}</p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full ${getScoreColor(lead.score)} flex items-center justify-center`}>
          <span className="text-white text-xs font-bold">{lead.score}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-full ${
          lead.leadType === 'mandat' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
        }`}>
          {lead.leadType === 'mandat' ? '🏠 Mandat' : '🔍 Requete'}
        </span>
        {lead.city && (
          <span className="text-gray-500">📍 {lead.city}</span>
        )}
      </div>
      {lead.budget && (
        <div className="mt-2 text-xs text-gray-600">
          💰 {typeof lead.budget === 'object'
            ? `${((lead.budget as any).min / 1000).toFixed(0)}k - ${((lead.budget as any).max / 1000).toFixed(0)}k`
            : `${(lead.budget / 1000).toFixed(0)}k`} TND
        </div>
      )}
    </div>
  );
};

export const SalesFunnel: React.FC<SalesFunnelProps> = ({
  leads,
  onLeadClick,
  onStageChange,
}) => {
  const [draggedLead, setDraggedLead] = useState<ProspectingLead | null>(null);
  const [viewMode, setViewMode] = useState<'funnel' | 'kanban'>('funnel');

  // Group leads by status
  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStatus, ProspectingLead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      converted: [],
      rejected: [],
    };

    leads.forEach(lead => {
      if (grouped[lead.status]) {
        grouped[lead.status].push(lead);
      }
    });

    return grouped;
  }, [leads]);

  // Calculate conversion rates
  const conversionRates = useMemo(() => {
    const total = leads.length;
    const stages = FUNNEL_STAGES.filter(s => s.id !== 'rejected');

    return stages.map(stage => {
      const count = leadsByStage[stage.id].length;
      const rate = total > 0 ? (count / total) * 100 : 0;
      return { ...stage, count, rate };
    });
  }, [leads, leadsByStage]);

  // Handle drag and drop
  const handleDragStart = (lead: ProspectingLead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: LeadStatus) => {
    if (draggedLead && onStageChange) {
      onStageChange(draggedLead.id, stageId);
    }
    setDraggedLead(null);
  };

  // Stats
  const totalLeads = leads.length;
  const convertedCount = leadsByStage.converted.length;
  const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0';
  const avgScore = totalLeads > 0
    ? (leads.reduce((sum, l) => sum + l.score, 0) / totalLeads).toFixed(0)
    : '0';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>🎯</span> Tunnel de Conversion
            </h2>
            <p className="text-indigo-100 text-sm mt-1">
              Suivez la progression de vos leads
            </p>
          </div>
          <div className="flex rounded-lg overflow-hidden bg-white/20">
            <button
              onClick={() => setViewMode('funnel')}
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === 'funnel' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
              }`}
            >
              Entonnoir
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === 'kanban' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'
              }`}
            >
              Kanban
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{totalLeads}</div>
            <div className="text-indigo-100 text-sm">Total leads</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{convertedCount}</div>
            <div className="text-indigo-100 text-sm">Convertis</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-indigo-100 text-sm">Taux conversion</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{avgScore}</div>
            <div className="text-indigo-100 text-sm">Score moyen</div>
          </div>
        </div>
      </div>

      {viewMode === 'funnel' ? (
        /* Funnel View */
        <div className="p-6">
          <div className="relative">
            {conversionRates.map((stage, index) => {
              const width = 100 - (index * 15);
              const nextStage = conversionRates[index + 1];
              const dropRate = nextStage
                ? ((stage.count - nextStage.count) / Math.max(stage.count, 1) * 100).toFixed(0)
                : null;

              return (
                <div key={stage.id} className="mb-2">
                  <div
                    className={`relative mx-auto ${stage.bgColor} rounded-lg transition-all hover:shadow-lg cursor-pointer`}
                    style={{ width: `${width}%`, minHeight: '80px' }}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{stage.icon}</span>
                        <div>
                          <h4 className={`font-semibold ${stage.color}`}>{stage.name}</h4>
                          <p className="text-sm text-gray-600">{stage.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${stage.color}`}>{stage.count}</div>
                        <div className="text-sm text-gray-500">{stage.rate.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Lead avatars */}
                    {leadsByStage[stage.id].length > 0 && (
                      <div className="px-4 pb-3 flex -space-x-2 overflow-hidden">
                        {leadsByStage[stage.id].slice(0, 8).map((lead, i) => (
                          <div
                            key={lead.id}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            title={`${lead.firstName} ${lead.lastName}`}
                          >
                            {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || '')}
                          </div>
                        ))}
                        {leadsByStage[stage.id].length > 8 && (
                          <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                            +{leadsByStage[stage.id].length - 8}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Drop rate indicator */}
                  {dropRate && Number(dropRate) > 0 && (
                    <div className="text-center my-1">
                      <span className="text-xs text-red-500">
                        ↓ -{dropRate}% perte
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Rejected section */}
            <div className="mt-6 pt-4 border-t border-dashed border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-600 flex items-center gap-2">
                  <span>❌</span> Leads rejetes
                </h4>
                <span className="text-red-600 font-bold">{leadsByStage.rejected.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {leadsByStage.rejected.slice(0, 5).map(lead => (
                  <span
                    key={lead.id}
                    className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm"
                  >
                    {lead.firstName} {lead.lastName}
                  </span>
                ))}
                {leadsByStage.rejected.length > 5 && (
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm">
                    +{leadsByStage.rejected.length - 5} autres
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {FUNNEL_STAGES.map(stage => (
              <div
                key={stage.id}
                className="w-72 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className={`${stage.bgColor} rounded-t-lg p-3`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{stage.icon}</span>
                      <span className={`font-semibold ${stage.color}`}>{stage.name}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.color} text-sm font-bold`}>
                      {leadsByStage[stage.id].length}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-b-lg p-3 min-h-[400px] space-y-2">
                  {leadsByStage[stage.id].map(lead => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => onLeadClick?.(lead)}
                      onDragStart={() => handleDragStart(lead)}
                    />
                  ))}
                  {leadsByStage[stage.id].length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <div className="text-3xl mb-2">📭</div>
                      <p className="text-sm">Aucun lead</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{totalLeads}</span> leads au total •
          <span className="text-green-600 font-medium ml-1">{conversionRate}%</span> taux de conversion
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 transition">
            📊 Exporter stats
          </button>
          <button className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            🔄 Relancer les inactifs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;
