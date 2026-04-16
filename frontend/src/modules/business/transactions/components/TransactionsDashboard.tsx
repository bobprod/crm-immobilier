import React, { useState, useEffect, useCallback } from 'react';
import {
  transactionsAPI,
  Transaction,
  TransactionStatus,
  TransactionType,
  CreateTransactionDTO,
  getTransactionStatusLabel,
  getTransactionStatusColor,
  getTransactionTypeLabel,
  formatTransactionPrice,
  getTransactionProgress,
  Pipeline,
} from '@/shared/utils/transactions-api';
import {
  ArrowLeftRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
  X,
  Trash2,
  Eye,
} from 'lucide-react';

interface TransactionsDashboardProps {
  language?: 'fr' | 'en';
}

const PIPELINE_STAGES: { status: TransactionStatus; label: string; color: string; bg: string }[] = [
  {
    status: TransactionStatus.OFFER_RECEIVED,
    label: 'Offre reçue',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    status: TransactionStatus.OFFER_ACCEPTED,
    label: 'Offre acceptée',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
  },
  {
    status: TransactionStatus.PROMISE_SIGNED,
    label: 'Promesse signée',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    status: TransactionStatus.COMPROMIS_SIGNED,
    label: 'Compromis signé',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    status: TransactionStatus.FINAL_DEED_SIGNED,
    label: 'Acte final',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
];

const EMPTY_FORM = {
  reference: '',
  type: TransactionType.SALE,
  propertyId: '',
  buyerName: '',
  buyerEmail: '',
  buyerPhone: '',
  offerPrice: '',
  notaryName: '',
  notes: '',
};

export const TransactionsDashboard: React.FC<TransactionsDashboardProps> = ({
  language = 'fr',
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [properties, setProperties] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txList, pipeData, statsData] = await Promise.all([
        transactionsAPI.list().catch(() => []),
        transactionsAPI.getPipeline().catch(() => null),
        transactionsAPI.getStats().catch(() => null),
      ]);
      setTransactions(txList);
      setPipeline(pipeData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Erreur de chargement des transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProperties = useCallback(async () => {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmt = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(amount);
  };

  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setSelectedTx(null);
    loadProperties();
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reference.trim() || !formData.propertyId) {
      setError('La référence et le bien sont obligatoires');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const dto: CreateTransactionDTO = {
        reference: formData.reference.trim(),
        type: formData.type,
        propertyId: formData.propertyId,
        buyerName: formData.buyerName || undefined,
        buyerEmail: formData.buyerEmail || undefined,
        buyerPhone: formData.buyerPhone || undefined,
        offerPrice: formData.offerPrice ? Number(formData.offerPrice) : undefined,
        notaryName: formData.notaryName || undefined,
        notes: formData.notes || undefined,
      };
      await transactionsAPI.create(dto);
      setShowModal(false);
      setFormData(EMPTY_FORM);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    try {
      await transactionsAPI.delete(id);
      await loadData();
      setSelectedTx(null);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleStatusChange = async (id: string, newStatus: TransactionStatus) => {
    try {
      await transactionsAPI.update(id, { status: newStatus });
      await loadData();
      if (selectedTx?.id === id) {
        setSelectedTx((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    }
  };

  const inProgress = transactions.filter(
    (t) =>
      t.status !== TransactionStatus.FINAL_DEED_SIGNED && t.status !== TransactionStatus.CANCELLED
  );
  const completed = transactions.filter((t) => t.status === TransactionStatus.FINAL_DEED_SIGNED);
  const cancelled = transactions.filter((t) => t.status === TransactionStatus.CANCELLED);
  const totalValue = completed.reduce(
    (s, t) => s + (t.finalPrice || t.negotiatedPrice || t.offerPrice || 0),
    0
  );
  const pendingValue = inProgress.reduce((s, t) => s + (t.negotiatedPrice || t.offerPrice || 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">Pipeline des transactions immobilières</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nouvelle transaction
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <ArrowLeftRight className="w-4 h-4" /> Total
          </div>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
            <Clock className="w-4 h-4" /> En cours
          </div>
          <p className="text-2xl font-bold">{inProgress.length}</p>
          <p className="text-xs text-gray-400">{fmt(pendingValue)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircle className="w-4 h-4" /> Finalisées
          </div>
          <p className="text-2xl font-bold">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <TrendingUp className="w-4 h-4" /> Revenu total
          </div>
          <p className="text-2xl font-bold">{fmt(totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-red-500 text-sm mb-1">
            <XCircle className="w-4 h-4" /> Annulées
          </div>
          <p className="text-2xl font-bold">{cancelled.length}</p>
        </div>
      </div>

      {/* Pipeline Kanban */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Pipeline</h2>
        </div>
        <div className="p-4 grid grid-cols-5 gap-3 min-h-[200px]">
          {PIPELINE_STAGES.map((stage) => {
            const stageTransactions = transactions.filter((t) => t.status === stage.status);
            const stageValue = stageTransactions.reduce(
              (s, t) => s + (t.negotiatedPrice || t.offerPrice || 0),
              0
            );
            return (
              <div key={stage.status} className={`rounded-lg border p-3 ${stage.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-semibold ${stage.color}`}>{stage.label}</h3>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.color} bg-white/60`}
                  >
                    {stageTransactions.length}
                  </span>
                </div>
                {stageValue > 0 && <p className="text-xs text-gray-500 mb-2">{fmt(stageValue)}</p>}
                <div className="space-y-2">
                  {stageTransactions.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4">Aucune</p>
                  ) : (
                    stageTransactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="bg-white rounded-lg p-2 shadow-sm border text-xs cursor-pointer hover:shadow-md transition"
                        onClick={() => setSelectedTx(tx)}
                      >
                        <p className="font-medium text-gray-900 truncate">{tx.reference}</p>
                        <p className="text-gray-500 truncate">{tx.buyerName || 'N/A'}</p>
                        <p className="font-semibold text-gray-700 mt-1">
                          {fmt(tx.negotiatedPrice || tx.offerPrice)}
                        </p>
                      </div>
                    ))
                  )}
                  {stageTransactions.length > 5 && (
                    <p className="text-xs text-center text-gray-400">
                      +{stageTransactions.length - 5} autres
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Toutes les transactions</h2>
          <span className="text-sm text-gray-500">{transactions.length} transaction(s)</span>
        </div>
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction</h3>
            <p className="text-gray-500 mb-4">Les transactions apparaîtront ici automatiquement</p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Créer une transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Acheteur</th>
                  <th className="px-4 py-3 text-left">Montant</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Progression</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{tx.reference}</td>
                    <td className="px-4 py-3 text-gray-600">{getTransactionTypeLabel(tx.type)}</td>
                    <td className="px-4 py-3 text-gray-600">{tx.buyerName || '—'}</td>
                    <td className="px-4 py-3 font-semibold">
                      {fmt(tx.finalPrice || tx.negotiatedPrice || tx.offerPrice)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionStatusColor(tx.status)}`}
                      >
                        {getTransactionStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${getTransactionProgress(tx.status)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== CREATE MODAL ===== */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold">Nouvelle transaction</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence *
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData((p) => ({ ...p, reference: e.target.value }))}
                    placeholder={`TX-${Date.now().toString(36).toUpperCase().slice(-6)}`}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, type: e.target.value as TransactionType }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={TransactionType.SALE}>Vente</option>
                    <option value={TransactionType.RENTAL}>Location</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bien immobilier *
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData((p) => ({ ...p, propertyId: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Sélectionner un bien --</option>
                  {properties.map((prop: any) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.title || prop.reference || prop.id} — {prop.city || ''}{' '}
                      {prop.price ? `(${fmt(prop.price)})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom acheteur
                  </label>
                  <input
                    type="text"
                    value={formData.buyerName}
                    onChange={(e) => setFormData((p) => ({ ...p, buyerName: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={formData.buyerPhone}
                    onChange={(e) => setFormData((p) => ({ ...p, buyerPhone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email acheteur
                  </label>
                  <input
                    type="email"
                    value={formData.buyerEmail}
                    onChange={(e) => setFormData((p) => ({ ...p, buyerEmail: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix offre (DT)
                  </label>
                  <input
                    type="number"
                    value={formData.offerPrice}
                    onChange={(e) => setFormData((p) => ({ ...p, offerPrice: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notaire</label>
                <input
                  type="text"
                  value={formData.notaryName}
                  onChange={(e) => setFormData((p) => ({ ...p, notaryName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== SLIDE-OVER DETAIL MODAL (Bitrix24 Style) ===== */}
      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end transition-opacity"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedTx.reference}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {getTransactionTypeLabel(selectedTx.type)} • Créé le{' '}
                  {new Date(selectedTx.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(selectedTx.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setSelectedTx(null)}
                  className="p-2 hover:bg-gray-200 rounded-lg transition"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Visual Stepper */}
            <div className="px-6 py-5 border-b bg-white">
              <div className="flex items-center justify-between gap-1">
                {PIPELINE_STAGES.map((stage, index) => {
                  const currentIndex = PIPELINE_STAGES.findIndex(
                    (s) => s.status === selectedTx.status
                  );
                  const stageIndex = index;
                  const isCompleted =
                    stageIndex < currentIndex ||
                    selectedTx.status === TransactionStatus.FINAL_DEED_SIGNED;
                  const isCurrent =
                    stageIndex === currentIndex &&
                    selectedTx.status !== TransactionStatus.FINAL_DEED_SIGNED;

                  let stepClasses =
                    'flex-1 h-10 flex border-y border-r first:border-l items-center justify-center text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer relative ';

                  if (isCompleted) {
                    stepClasses += 'bg-green-500 border-green-600 text-white';
                  } else if (isCurrent) {
                    stepClasses += 'bg-blue-600 border-blue-700 text-white shadow-inner';
                  } else {
                    stepClasses += 'bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200';
                  }

                  // Shape classes for the arrow effect
                  if (index === 0) stepClasses += ' rounded-l-md';
                  if (index === PIPELINE_STAGES.length - 1) stepClasses += ' rounded-r-md';

                  return (
                    <div
                      key={stage.status}
                      onClick={() => handleStatusChange(selectedTx.id, stage.status)}
                      className={stepClasses}
                      title="Cliquez pour changer l'étape"
                    >
                      {/* Arrow polygon overlay for completion effect */}
                      {isCompleted && index < PIPELINE_STAGES.length - 1 && (
                        <div className="absolute -right-3 top-0 bottom-0 w-3 z-10 overflow-hidden">
                          <div className="w-6 h-10 bg-green-500 transform origin-top-left rotate-45 border-r border-green-600" />
                        </div>
                      )}
                      {isCurrent && index < PIPELINE_STAGES.length - 1 && (
                        <div className="absolute -right-3 top-0 bottom-0 w-3 z-10 overflow-hidden">
                          <div className="w-6 h-10 bg-blue-600 transform origin-top-left rotate-45 border-r border-blue-700" />
                        </div>
                      )}
                      <span className="z-20 truncate px-2 text-center">{stage.label}</span>
                    </div>
                  );
                })}
              </div>
              {selectedTx.status === TransactionStatus.CANCELLED && (
                <div className="mt-3 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg text-sm flex items-center justify-center font-medium">
                  <XCircle className="w-5 h-5 mr-2" /> Transaction annulée
                </div>
              )}
            </div>

            {/* scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {/* Quick Actions (Bitrix Style) */}
              <div className="flex gap-3 mb-6 pb-6 border-b">
                <button className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-xl hover:shadow-md transition text-blue-600 hover:border-blue-200">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-2">
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">Tâche</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-xl hover:shadow-md transition text-purple-600 hover:border-purple-200">
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-2">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">Message</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-xl hover:shadow-md transition text-amber-600 hover:border-amber-200">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">RDV</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center p-3 bg-white border rounded-xl hover:shadow-md transition text-green-600 hover:border-green-200">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-2">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold">Document</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border">
                  <span className="text-gray-500 text-xs font-semibold uppercase">Acheteur</span>
                  <p className="font-medium mt-1 text-base">{selectedTx.buyerName || '—'}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" /> {selectedTx.buyerEmail || 'Non renseigné'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" /> {selectedTx.buyerPhone || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border">
                  <span className="text-gray-500 text-xs font-semibold uppercase">
                    Données Financières
                  </span>
                  <div className="mt-2 space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Prix initial / Offre</span>
                        <span className="font-medium text-gray-900">
                          {fmt(selectedTx.offerPrice)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Prix négocié</span>
                        <span className="font-medium text-blue-600">
                          {fmt(selectedTx.negotiatedPrice)}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">Prix Final</span>
                        <span className="font-bold text-green-600">
                          {fmt(selectedTx.finalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border">
                <span className="text-gray-500 text-xs font-semibold uppercase">
                  Détails de la transaction
                </span>
                <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                  <div>
                    <span className="text-gray-500">Notaire en charge : </span>
                    <span className="font-medium">{selectedTx.notaryName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Propriété liée : </span>
                    <span className="font-medium text-blue-600 cursor-pointer hover:underline">
                      {selectedTx.propertyId}
                    </span>
                  </div>
                </div>
                {selectedTx.notes && (
                  <div className="mt-4 pt-4 border-t text-sm">
                    <span className="text-gray-500 flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4" /> Notes additionnelles
                    </span>
                    <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                      {selectedTx.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              {selectedTx.status !== TransactionStatus.CANCELLED ? (
                <button
                  onClick={() => handleStatusChange(selectedTx.id, TransactionStatus.CANCELLED)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Annuler la transaction
                </button>
              ) : (
                <div></div>
              )}
              <button
                onClick={() => setSelectedTx(null)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition shadow-sm"
              >
                Fermer le panneau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsDashboard;
