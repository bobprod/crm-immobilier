import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Phone,
  Mail,
  Plus,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Clock,
  TrendingUp,
  Calendar,
  Home,
  FileText,
  GripVertical,
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
 * ProspectKanbanPipeline — Bitrix24/Odoo-inspired visual kanban pipeline with drag-and-drop.
 *
 * Features:
 * - Drag-and-drop cards between columns (@dnd-kit)
 * - Visual columns per pipeline stage (Nouveau → Contacté → Qualifié → Visite → Offre → Gagné/Perdu)
 * - Uses Enhanced Stage API for timeline tracking
 * - Score indicator on each card
 * - Stage action suggestions (create RDV on Visite, create transaction on Gagné)
 * - Move forward/backward/lost with buttons
 * - Lost Reason Modal (Odoo-inspired)
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

// Maps pipeline column keys to the status string sent to backend
const STAGE_TO_STATUS: Record<string, string> = {
  nouveau: 'new',
  contacte: 'active',
  qualifie: 'qualified',
  visite: 'meeting',
  offre: 'negotiation',
  gagne: 'converted',
  perdu: 'lost',
};

const STAGE_ORDER = ['nouveau', 'contacte', 'qualifie', 'visite', 'offre', 'gagne'];

// Stage action suggestions — what to offer when entering a stage
const STAGE_ACTIONS: Record<string, { icon: React.ElementType; label: string; path: (id: string) => string }[]> = {
  visite: [
    { icon: Calendar, label: 'Créer un RDV', path: (id) => `/appointments?prospectId=${id}` },
    { icon: Home, label: 'Voir les matchs', path: (id) => `/matching?prospectId=${id}` },
  ],
  offre: [
    { icon: FileText, label: 'Générer une offre', path: (id) => `/documents/generate?prospectId=${id}` },
  ],
  gagne: [
    { icon: FileText, label: 'Créer une transaction', path: (id) => `/transactions-dashboard?fromProspect=${id}` },
  ],
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

// ── Draggable Card ──────────────────────────────────────────────────────

function DraggableCard({
  card,
  stageKey,
  onMoveForward,
  onMoveBackward,
  onMarkLost,
  onOpen,
}: {
  card: ProspectPipelineCard;
  stageKey: string;
  onMoveForward: (card: ProspectPipelineCard) => void;
  onMoveBackward: (card: ProspectPipelineCard) => void;
  onMarkLost: (card: ProspectPipelineCard) => void;
  onOpen: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { card, stageKey },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  const fullName = [card.firstName, card.lastName].filter(Boolean).join(' ') || 'Sans nom';
  const budget = card.budget as any;
  const budgetAmount = budget?.amount || budget?.max || budget?.min;
  const stageIdx = STAGE_ORDER.indexOf(stageKey);
  const canGoForward = stageIdx >= 0 && stageIdx < STAGE_ORDER.length - 1;
  const canGoBackward = stageIdx > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all p-3 cursor-pointer group ${isDragging ? 'ring-2 ring-blue-400 shadow-lg' : ''}`}
      onClick={() => onOpen(card.id)}
    >
      {/* Drag handle + Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <div
            {...listeners}
            {...attributes}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{fullName}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {TYPE_LABELS[card.type] || card.type}
            </div>
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

      {/* Next Activity */}
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
        {canGoBackward && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveBackward(card); }}
            className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-1.5 py-1 rounded-md transition-colors"
            title="Reculer"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
        )}
        {canGoForward && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveForward(card); }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors"
            title="Avancer dans le pipeline"
          >
            <ArrowRight className="w-3 h-3" />
            Avancer
          </button>
        )}
        {stageKey !== 'perdu' && stageKey !== 'gagne' && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkLost(card); }}
            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
            title="Marquer comme perdu"
          >
            Perdu
          </button>
        )}
      </div>
    </div>
  );
}

// ── Droppable Column ──────────────────────────────────────────────────────

function DroppableColumn({
  column,
  onMoveForward,
  onMoveBackward,
  onMarkLost,
  onOpen,
  isOver,
}: {
  column: ProspectPipelineColumn;
  onMoveForward: (card: ProspectPipelineCard) => void;
  onMoveBackward: (card: ProspectPipelineCard) => void;
  onMarkLost: (card: ProspectPipelineCard) => void;
  onOpen: (id: string) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: column.key });

  return (
    <div className="flex-shrink-0 w-60 flex flex-col" ref={setNodeRef}>
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

      {/* Cards area */}
      <div
        className={`flex-1 rounded-b-lg p-2 space-y-2 overflow-y-auto min-h-[120px] max-h-[calc(100vh-300px)] transition-colors ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}
        style={isOver ? undefined : { backgroundColor: column.color + '08', border: `1px solid ${column.color}22` }}
      >
        {column.cards.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            {isOver ? 'Déposer ici' : 'Aucun prospect'}
          </div>
        ) : (
          column.cards.map((card) => (
            <DraggableCard
              key={card.id}
              card={card}
              stageKey={column.key}
              onMoveForward={onMoveForward}
              onMoveBackward={onMoveBackward}
              onMarkLost={onMarkLost}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Stage Action Toast ──────────────────────────────────────────────────

function StageActionToast({
  stageKey,
  prospectId,
  prospectName,
  onDismiss,
}: {
  stageKey: string;
  prospectId: string;
  prospectName: string;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const actions = STAGE_ACTIONS[stageKey];
  if (!actions) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="text-sm font-semibold text-gray-900 mb-2">
        💡 Actions suggérées pour {prospectName}
      </div>
      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => { router.push(action.path(prospectId)); onDismiss(); }}
            className="flex items-center gap-2 w-full text-sm text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors"
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="mt-2 text-xs text-gray-400 hover:text-gray-600"
      >
        Fermer
      </button>
    </div>
  );
}

// ── Main Pipeline Component ──────────────────────────────────────────────

interface ProspectKanbanPipelineProps {
  onAddProspect?: () => void;
}

export function ProspectKanbanPipeline({ onAddProspect }: ProspectKanbanPipelineProps) {
  const router = useRouter();
  const [data, setData] = useState<ProspectPipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFunnel, setShowFunnel] = useState(false);
  const [activeCard, setActiveCard] = useState<ProspectPipelineCard | null>(null);
  const [overColumnKey, setOverColumnKey] = useState<string | null>(null);
  const [stageAction, setStageAction] = useState<{ stageKey: string; prospectId: string; prospectName: string } | null>(null);

  // Lost reason modal state
  const [lostModal, setLostModal] = useState<{
    card: ProspectPipelineCard;
    saving: boolean;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

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

  const getCurrentStageKey = (card: ProspectPipelineCard): string => {
    if (!data) return 'nouveau';
    for (const col of data.columns) {
      if (col.cards.some((c) => c.id === card.id)) return col.key;
    }
    return 'nouveau';
  };

  // Change stage via Enhanced API (tracks timeline)
  const changeStage = async (cardId: string, targetStageKey: string, extra?: Record<string, any>) => {
    const targetStatus = STAGE_TO_STATUS[targetStageKey];
    if (!targetStatus) return;

    try {
      // Use enhanced API for timeline tracking
      await apiClient.put(`/prospects-enhanced/${cardId}/stage`, {
        stage: targetStatus,
        ...extra,
      });

      // Optimistic update for instant UI feedback
      setData((prev) => {
        if (!prev) return prev;
        let movedCard: ProspectPipelineCard | null = null;
        const columns = prev.columns.map((col) => {
          const filtered = col.cards.filter((c) => {
            if (c.id === cardId) { movedCard = { ...c, status: targetStatus }; return false; }
            return true;
          });
          return { ...col, cards: filtered, count: filtered.length };
        });
        if (movedCard) {
          const targetCol = columns.find((c) => c.key === targetStageKey);
          if (targetCol) {
            targetCol.cards.push(movedCard);
            targetCol.count = targetCol.cards.length;
          }
        }
        return { ...prev, columns };
      });

      // Show stage action suggestions
      if (STAGE_ACTIONS[targetStageKey]) {
        const card = data?.columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
        if (card) {
          const name = [card.firstName, card.lastName].filter(Boolean).join(' ') || 'Ce prospect';
          setStageAction({ stageKey: targetStageKey, prospectId: cardId, prospectName: name });
          setTimeout(() => setStageAction(null), 10000);
        }
      }
    } catch {
      // Fallback: full refresh on error
      await fetchPipeline();
    }
  };

  const handleMoveForward = async (card: ProspectPipelineCard) => {
    const currentKey = getCurrentStageKey(card);
    const idx = STAGE_ORDER.indexOf(currentKey);
    if (idx < 0 || idx >= STAGE_ORDER.length - 1) return;
    await changeStage(card.id, STAGE_ORDER[idx + 1]);
  };

  const handleMoveBackward = async (card: ProspectPipelineCard) => {
    const currentKey = getCurrentStageKey(card);
    const idx = STAGE_ORDER.indexOf(currentKey);
    if (idx <= 0) return;
    await changeStage(card.id, STAGE_ORDER[idx - 1]);
  };

  const handleMarkLost = (card: ProspectPipelineCard) => {
    setLostModal({ card, saving: false });
  };

  const handleLostConfirm = async (reason: string) => {
    if (!lostModal) return;
    setLostModal((prev) => prev && { ...prev, saving: true });
    try {
      await apiClient.put(`/prospects-enhanced/${lostModal.card.id}/stage`, {
        stage: 'lost',
      });
      await apiClient.put(`/prospects/${lostModal.card.id}`, { lostReason: reason });
      setLostModal(null);
      await fetchPipeline();
    } catch {
      setLostModal((prev) => prev && { ...prev, saving: false });
    }
  };

  // ── DnD Handlers ────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const { card } = event.active.data.current as { card: ProspectPipelineCard; stageKey: string };
    setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    setOverColumnKey(overId && data?.columns.some((c) => c.key === overId) ? overId : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    setOverColumnKey(null);

    const { active, over } = event;
    if (!over || !data) return;

    const sourceStageKey = (active.data.current as any)?.stageKey;
    const targetStageKey = over.id as string;

    // Only process if dropped on a different column
    if (sourceStageKey === targetStageKey) return;
    if (!data.columns.some((c) => c.key === targetStageKey)) return;

    // If dropping to "perdu", open Lost Reason modal
    if (targetStageKey === 'perdu') {
      const card = (active.data.current as any)?.card;
      if (card) handleMarkLost(card);
      return;
    }

    await changeStage(active.id as string, targetStageKey);
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setOverColumnKey(null);
  };

  // ── Render ────────────────────────────────────────────────────────

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

      {/* Kanban Columns with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {data.columns.map((col) => (
            <DroppableColumn
              key={col.key}
              column={col}
              onMoveForward={handleMoveForward}
              onMoveBackward={handleMoveBackward}
              onMarkLost={handleMarkLost}
              onOpen={(id) => router.push(`/prospects/${id}`)}
              isOver={overColumnKey === col.key}
            />
          ))}
        </div>

        {/* Drag Overlay — ghost card that follows cursor */}
        <DragOverlay>
          {activeCard && (
            <div className="bg-white rounded-lg border-2 border-blue-400 shadow-xl p-3 w-56 opacity-90 rotate-2">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {[activeCard.firstName, activeCard.lastName].filter(Boolean).join(' ') || 'Sans nom'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {TYPE_LABELS[activeCard.type] || activeCard.type}
              </div>
              <div className={`text-xs font-bold px-1.5 py-0.5 rounded-full mt-1 inline-block ${scoreColor(activeCard.score)}`}>
                {activeCard.score}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

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

      {/* Stage Action Toast */}
      {stageAction && (
        <StageActionToast
          stageKey={stageAction.stageKey}
          prospectId={stageAction.prospectId}
          prospectName={stageAction.prospectName}
          onDismiss={() => setStageAction(null)}
        />
      )}
    </div>
  );
}

export default ProspectKanbanPipeline;
