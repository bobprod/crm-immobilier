import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Phone,
  Mail,
  Plus,
  RefreshCw,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import prospectsAPI, {
  ProspectPipelineData,
  ProspectPipelineColumn,
  ProspectPipelineCard,
} from '@/shared/utils/prospects-api';
import apiClient from '@/shared/utils/backend-api';
import { LostReasonModal } from './LostReasonModal';
import { PipelineFunnelChart } from './PipelineFunnelChart';

/**
 * ProspectKanbanPipeline — Bitrix24/Odoo-inspired visual kanban pipeline for prospects.
 *
 * Features:
 * - Visual columns per pipeline stage (Nouveau → Contacté → Qualifié → Visite → Offre → Gagné/Perdu)
 * - Score indicator on each card (like Odoo lead scoring)
 * - Next scheduled activity displayed on card (Bitrix24 activity icons)
 * - Quick action buttons: call, email, schedule meeting
 * - Move to next/lost stage with one click
 * - Lost Reason Modal when marking as lost (Odoo feature)
 * - Conversion funnel chart
 */

const TYPE_LABELS: Record<string, string> = {
  buyer: 'Acheteur',
  seller: 'Vendeur',
  tenant: 'Locataire',
  landlord: 'Bailleur',
  investor: 'Investisseur',
  other: 'Autre',
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: '📞',
  email: '📧',
  meeting: '🤝',
  visit: '🏠',
  sms: '💬',
  whatsapp: '💬',
};

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50';
  if (score >= 50) return 'text-amber-600 bg-amber-50';
  return 'text-red-500 bg-red-50';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  if (diffDays < 0) return `Il y a ${Math.abs(diffDays)}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function ProspectMiniCard({
  card,
  onMoveForward,
  onMarkLost,
  onOpen,
}: {
  card: ProspectPipelineCard;
  onMoveForward: (card: ProspectPipelineCard) => void;
  onMarkLost: (card: ProspectPipelineCard) => void;
  onOpen: (id: string) => void;
}) {
  const fullName = [card.firstName, card.lastName].filter(Boolean).join(' ') || 'Sans nom';
  const budget = card.budget as any;
  const budgetAmount = budget?.amount || budget?.max || budget?.min;

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-3 cursor-pointer group"
      onClick={() => onOpen(card.id)}
    >
      {/* Header row: name + score */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{fullName}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {TYPE_LABELS[card.type] || card.type}
          </div>
        </div>
        <div
          className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${scoreColor(card.score)}`}
          title={`Score: ${card.score}/100`}
        >
          {card.score}
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1 mb-2.5">
        {card.phone && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="w-3 h-3 shrink-0" />
            <span className="truncate">{card.phone}</span>
          </div>
        )}
        {card.email && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{card.email}</span>
          </div>
        )}
        {budgetAmount && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span>
              {typeof budgetAmount === 'number'
                ? budgetAmount.toLocaleString('fr-TN') + ' TND'
                : budgetAmount}
            </span>
          </div>
        )}
      </div>

      {/* Next Activity — Bitrix24 style activity indicator */}
      {card.nextActivity && (
        <div
          className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 rounded-md px-2 py-1 mb-2"
          title={card.nextActivity.nextAction || card.nextActivity.channel}
        >
          <Clock className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {ACTIVITY_ICONS[card.nextActivity.channel] || '📋'}{' '}
            {formatDate(card.nextActivity.nextActionDate)}
          </span>
        </div>
      )}

      {/* Actions — shown on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveForward(card);
          }}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
          title="Avancer dans le pipeline"
        >
          <ArrowRight className="w-3 h-3" />
          Avancer
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMarkLost(card);
          }}
          className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          title="Marquer comme perdu"
        >
          Perdu
        </button>
      </div>
    </div>
  );
}

interface ProspectKanbanPipelineProps {
  onAddProspect?: () => void;
}

export function ProspectKanbanPipeline({ onAddProspect }: ProspectKanbanPipelineProps) {
  const router = useRouter();
  const [data, setData] = useState<ProspectPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFunnel, setShowFunnel] = useState(false);

  // Lost reason modal state
  const [lostModal, setLostModal] = useState<{
    card: ProspectPipelineCard;
    saving: boolean;
  } | null>(null);

  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await prospectsAPI.getPipeline();
      setData(result);
    } catch (err) {
      setError('Impossible de charger le pipeline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Pipeline stage order for "move forward" action
  const STAGE_ORDER = ['nouveau', 'contacte', 'qualifie', 'visite', 'offre', 'gagne'];

  const getNextStageStatus = (currentStageKey: string): string | null => {
    const idx = STAGE_ORDER.indexOf(currentStageKey);
    const nextKey = STAGE_ORDER[idx + 1];
    const STATUS_MAP: Record<string, string> = {
      nouveau: 'active',
      contacte: 'qualified',
      qualifie: 'meeting',
      visite: 'negotiation',
      offre: 'converted',
      gagne: 'converted',
    };
    return STATUS_MAP[nextKey] ?? null;
  };

  const getCurrentStageKey = (card: ProspectPipelineCard): string => {
    if (!data) return 'nouveau';
    for (const col of data.columns) {
      if (col.cards.some((c) => c.id === card.id)) return col.key;
    }
    return 'nouveau';
  };

  const handleMoveForward = async (card: ProspectPipelineCard) => {
    const currentKey = getCurrentStageKey(card);
    const nextStatus = getNextStageStatus(currentKey);
    if (!nextStatus) return;
    try {
      await apiClient.put(`/prospects/${card.id}`, { status: nextStatus });
      await fetchPipeline();
    } catch {
      // silently fail
    }
  };

  const handleMarkLost = (card: ProspectPipelineCard) => {
    setLostModal({ card, saving: false });
  };

  const handleLostConfirm = async (reason: string) => {
    if (!lostModal) return;
    setLostModal((prev) => prev && { ...prev, saving: true });
    try {
      await apiClient.put(`/prospects/${lostModal.card.id}`, {
        status: 'lost',
        lostReason: reason,
      });
      setLostModal(null);
      await fetchPipeline();
    } catch {
      setLostModal((prev) => prev && { ...prev, saving: false });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">Chargement du pipeline...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-sm">{error || 'Erreur de chargement'}</p>
        <Button variant="outline" className="mt-4" onClick={fetchPipeline}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            Pipeline CRM
            <span className="ml-2 text-xs font-normal text-gray-400">
              {data.total} prospect{data.total !== 1 ? 's' : ''}
            </span>
          </h2>
          <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
            {data.conversionRate.toFixed(1)}% converti
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFunnel((v) => !v)}
            className="text-xs"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            {showFunnel ? 'Masquer' : 'Funnel'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPipeline} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Actualiser
          </Button>
          {onAddProspect && (
            <Button size="sm" onClick={onAddProspect} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nouveau prospect
            </Button>
          )}
        </div>
      </div>

      {/* Funnel Chart (toggleable) */}
      {showFunnel && (
        <PipelineFunnelChart
          columns={data.columns}
          total={data.total}
          conversionRate={data.conversionRate}
        />
      )}

      {/* Kanban Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
        {data.columns.map((col) => (
          <KanbanColumn
            key={col.key}
            column={col}
            onMoveForward={handleMoveForward}
            onMarkLost={handleMarkLost}
            onOpen={(id) => router.push(`/prospects/${id}`)}
          />
        ))}
      </div>

      {/* Lost Reason Modal */}
      {lostModal && (
        <LostReasonModal
          prospectName={
            [lostModal.card.firstName, lostModal.card.lastName].filter(Boolean).join(' ') ||
            'Ce prospect'
          }
          onConfirm={handleLostConfirm}
          onCancel={() => setLostModal(null)}
          loading={lostModal.saving}
        />
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  onMoveForward,
  onMarkLost,
  onOpen,
}: {
  column: ProspectPipelineColumn;
  onMoveForward: (card: ProspectPipelineCard) => void;
  onMarkLost: (card: ProspectPipelineCard) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <div className="flex-shrink-0 w-60 flex flex-col">
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-t-lg mb-0.5"
        style={{ backgroundColor: column.color + '18', borderTop: `3px solid ${column.color}` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: column.color }}>
            {column.label}
          </span>
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ backgroundColor: column.color }}
          >
            {column.count}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div
        className="flex-1 rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[120px] max-h-[calc(100vh-300px)]"
        style={{ backgroundColor: column.color + '08', border: `1px solid ${column.color}22` }}
      >
        {column.cards.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">Aucun prospect</div>
        ) : (
          column.cards.map((card) => (
            <ProspectMiniCard
              key={card.id}
              card={card}
              onMoveForward={onMoveForward}
              onMarkLost={onMarkLost}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProspectKanbanPipeline;
