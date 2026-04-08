import React, { useState, useMemo, useCallback } from 'react';
import { ProspectingLead, LeadStatus } from '@/shared/utils/prospecting-api';
import { TrendingUp, LayoutList, GitMerge, ChevronRight } from 'lucide-react';

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
  viewMode: 'funnel' | 'kanban';
  onLeadClick?: (lead: ProspectingLead) => void;
  onStageChange?: (leadId: string, newStatus: LeadStatus) => void;
  onExportStats?: () => void;
  onRelaunchInactive?: (inactiveLeadIds: string[]) => void;
}

const FUNNEL_STAGES: FunnelStage[] = [
  {
    id: 'new',
    name: 'Nouveaux',
    icon: '🆕',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Leads fraîchement capturés',
  },
  {
    id: 'contacted',
    name: 'Contactés',
    icon: '📞',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Premier contact établi',
  },
  {
    id: 'qualified',
    name: 'Qualifiés',
    icon: '✅',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Besoin confirmé et budget validé',
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
    name: 'Rejetés',
    icon: '❌',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Non qualifiés ou désintéressés',
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
            <p className="font-medium text-gray-900 text-sm truncate w-24">
              {lead.firstName || ''} {lead.lastName || ''}
            </p>
          </div>
        </div>
        <div className={`w-5 h-5 rounded-full ${getScoreColor(lead.score || 0)} flex items-center justify-center`}>
          <span className="text-white text-[10px] font-bold">{lead.score || 0}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className={`px-1.5 py-0.5 rounded-full ${lead.leadType === 'mandat' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
          {lead.leadType === 'mandat' ? '🏠 Mandat' : '🔍 Requête'}
        </span>
        {lead.city && <span className="text-gray-400 truncate flex-1">📍 {lead.city}</span>}
      </div>
    </div>
  );
};

export const SalesFunnel: React.FC<SalesFunnelProps> = ({
  leads,
  viewMode,
  onLeadClick,
  onStageChange,
  onExportStats,
  onRelaunchInactive,
}) => {
  const [draggedLead, setDraggedLead] = useState<ProspectingLead | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStatus, ProspectingLead[]> = {
      new: [], contacted: [], qualified: [], converted: [], rejected: [],
    };
    leads.forEach((lead) => {
      if (grouped[lead.status]) grouped[lead.status].push(lead);
    });
    return grouped;
  }, [leads]);

  const conversionRates = useMemo(() => {
    const total = leads.length;
    const stages = FUNNEL_STAGES.filter((s) => s.id !== 'rejected');
    return stages.map((stage) => {
      const count = leadsByStage[stage.id].length;
      const rate = total > 0 ? (count / total) * 100 : 0;
      return { ...stage, count, rate };
    });
  }, [leads, leadsByStage]);

  const handleDragStart = (lead: ProspectingLead) => setDraggedLead(lead);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (stageId: LeadStatus) => {
    if (draggedLead && onStageChange) onStageChange(draggedLead.id, stageId);
    setDraggedLead(null);
  };

  const totalLeads = leads.length;
  const convertedCount = leadsByStage.converted.length;
  const conversionRate = totalLeads > 0 ? ((convertedCount / totalLeads) * 100).toFixed(1) : '0';
  const inactiveLeads = leads.filter((lead) => lead.status === 'new' || lead.status === 'contacted');

  const handleExportStats = () => {
    if (onExportStats) return onExportStats();
    const csvContent = "Étape,Nombre,Taux (%)\n" + 
      FUNNEL_STAGES.map(s => `${s.name},${leadsByStage[s.id].length},${(leadsByStage[s.id].length / (totalLeads || 1) * 100).toFixed(1)}`).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url;
    link.download = `funnel-stats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRelaunchInactive = () => {
    const inactiveIds = inactiveLeads.map((l) => l.id);
    if (onRelaunchInactive) {
      onRelaunchInactive(inactiveIds);
      showNotification(`${inactiveIds.length} leads relancés!`);
    } else if (onStageChange && inactiveIds.length > 0) {
      inactiveLeads.filter(l => l.status === 'new').forEach(l => onStageChange(l.id, 'contacted'));
      showNotification(`${inactiveIds.length} leads relancés!`);
    }
  };

  return (
    <div className="relative">
      {notification && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce ${
          notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <span>{notification.type === 'success' ? '✓' : '✕'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {viewMode === 'funnel' ? (
        <div className="p-4 space-y-3">
          {conversionRates.map((stage, index) => {
            const width = 100 - index * 12;
            const nextStage = conversionRates[index + 1];
            const dropRate = nextStage ? (((stage.count - nextStage.count) / Math.max(stage.count, 1)) * 100).toFixed(0) : null;

            return (
              <div key={stage.id} className="relative group">
                <div 
                  className={`mx-auto ${stage.bgColor} rounded-xl transition-all border border-transparent group-hover:border-purple-300 p-4 flex items-center justify-between min-h-[70px] shadow-sm`}
                  style={{ width: `${width}%` }}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{stage.icon}</span>
                    <div className="min-w-0">
                      <h4 className={`font-bold text-sm ${stage.color}`}>{stage.name}</h4>
                      <p className="text-[10px] text-gray-400 hidden sm:block">{stage.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-black ${stage.color}`}>{stage.count}</div>
                    <div className="text-[10px] text-gray-400">{stage.rate.toFixed(1)}%</div>
                  </div>
                </div>
                {dropRate && Number(dropRate) > 0 && (
                  <div className="text-center py-1 flex items-center justify-center gap-1">
                    <div className="h-px w-8 bg-red-100" />
                    <span className="text-[10px] font-bold text-red-400">-{dropRate}% perte</span>
                    <div className="h-px w-8 bg-red-100" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {FUNNEL_STAGES.map((stage) => (
              <div key={stage.id} className="w-64 flex-shrink-0" onDragOver={handleDragOver} onDrop={() => handleDrop(stage.id)}>
                <div className={`${stage.bgColor} rounded-t-xl p-3 border-b-2 border-white/50 flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <span className={`font-bold text-sm ${stage.color}`}>{stage.name}</span>
                  </div>
                  <span className="text-[10px] font-black bg-white/40 px-2 py-0.5 rounded-full">{leadsByStage[stage.id].length}</span>
                </div>
                <div className="bg-gray-50/50 rounded-b-xl p-3 min-h-[300px] space-y-2 border border-gray-100">
                  {leadsByStage[stage.id].map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick?.(lead)} onDragStart={() => handleDragStart(lead)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl p-4 shadow-xl">
        <div className="text-xs text-gray-500">
          <span className="font-bold text-gray-900">{totalLeads}</span> leads capturés • 
          <span className="text-emerald-600 font-bold ml-1">{conversionRate}%</span> conversion finale
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportStats} className="px-3 py-2 text-[10px] font-bold border border-gray-200 rounded-lg hover:bg-gray-50 transition uppercase tracking-wider">
            📊 Stats CSV
          </button>
          <button 
            onClick={handleRelaunchInactive} 
            disabled={inactiveLeads.length === 0}
            className="px-3 py-2 text-[10px] font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 uppercase tracking-wider"
          >
            🔄 Relance auto ({inactiveLeads.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;
