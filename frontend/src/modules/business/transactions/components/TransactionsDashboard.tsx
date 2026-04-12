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
import { ArrowLeftRight, TrendingUp, CheckCircle, XCircle, Clock, Plus, RefreshCw, X, Trash2, Eye } from 'lucide-react';

interface TransactionsDashboardProps {
    language?: 'fr' | 'en';
}

const PIPELINE_STAGES: { status: TransactionStatus; label: string; color: string; bg: string }[] = [
    { status: TransactionStatus.OFFER_RECEIVED, label: 'Offre reçue', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
    { status: TransactionStatus.OFFER_ACCEPTED, label: 'Offre acceptée', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    { status: TransactionStatus.PROMISE_SIGNED, label: 'Promesse signée', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    { status: TransactionStatus.COMPROMIS_SIGNED, label: 'Compromis signé', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    { status: TransactionStatus.FINAL_DEED_SIGNED, label: 'Acte final', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
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

export const TransactionsDashboard: React.FC<TransactionsDashboardProps> = ({ language = 'fr' }) => {
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
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

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
                setSelectedTx(prev => prev ? { ...prev, status: newStatus } : null);
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la mise à jour');
        }
    };

    const inProgress = transactions.filter(t =>
        t.status !== TransactionStatus.FINAL_DEED_SIGNED && t.status !== TransactionStatus.CANCELLED
    );
    const completed = transactions.filter(t => t.status === TransactionStatus.FINAL_DEED_SIGNED);
    const cancelled = transactions.filter(t => t.status === TransactionStatus.CANCELLED);
    const totalValue = completed.reduce((s, t) => s + (t.finalPrice || t.negotiatedPrice || t.offerPrice || 0), 0);
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
                    <button onClick={loadData} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Rafraîchir">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nouvelle transaction
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
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
                        const stageTransactions = transactions.filter(t => t.status === stage.status);
                        const stageValue = stageTransactions.reduce((s, t) => s + (t.negotiatedPrice || t.offerPrice || 0), 0);
                        return (
                            <div key={stage.status} className={`rounded-lg border p-3 ${stage.bg}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className={`text-sm font-semibold ${stage.color}`}>{stage.label}</h3>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.color} bg-white/60`}>
                                        {stageTransactions.length}
                                    </span>
                                </div>
                                {stageValue > 0 && (
                                    <p className="text-xs text-gray-500 mb-2">{fmt(stageValue)}</p>
                                )}
                                <div className="space-y-2">
                                    {stageTransactions.length === 0 ? (
                                        <p className="text-xs text-gray-400 italic text-center py-4">Aucune</p>
                                    ) : (
                                        stageTransactions.slice(0, 5).map(tx => (
                                            <div key={tx.id} className="bg-white rounded-lg p-2 shadow-sm border text-xs cursor-pointer hover:shadow-md transition" onClick={() => setSelectedTx(tx)}>
                                                <p className="font-medium text-gray-900 truncate">{tx.reference}</p>
                                                <p className="text-gray-500 truncate">{tx.buyerName || 'N/A'}</p>
                                                <p className="font-semibold text-gray-700 mt-1">
                                                    {fmt(tx.negotiatedPrice || tx.offerPrice)}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                    {stageTransactions.length > 5 && (
                                        <p className="text-xs text-center text-gray-400">+{stageTransactions.length - 5} autres</p>
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
                        <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm">
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
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{tx.reference}</td>
                                        <td className="px-4 py-3 text-gray-600">{getTransactionTypeLabel(tx.type)}</td>
                                        <td className="px-4 py-3 text-gray-600">{tx.buyerName || '—'}</td>
                                        <td className="px-4 py-3 font-semibold">{fmt(tx.finalPrice || tx.negotiatedPrice || tx.offerPrice)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionStatusColor(tx.status)}`}>
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
                                                <button onClick={() => setSelectedTx(tx)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Voir">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(tx.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Supprimer">
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
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-bold">Nouvelle transaction</h2>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Référence *</label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={e => setFormData(p => ({ ...p, reference: e.target.value }))}
                                        placeholder={`TX-${Date.now().toString(36).toUpperCase().slice(-6)}`}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData(p => ({ ...p, type: e.target.value as TransactionType }))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value={TransactionType.SALE}>Vente</option>
                                        <option value={TransactionType.RENTAL}>Location</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bien immobilier *</label>
                                <select
                                    value={formData.propertyId}
                                    onChange={e => setFormData(p => ({ ...p, propertyId: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">-- Sélectionner un bien --</option>
                                    {properties.map((prop: any) => (
                                        <option key={prop.id} value={prop.id}>
                                            {prop.title || prop.reference || prop.id} — {prop.city || ''} {prop.price ? `(${fmt(prop.price)})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom acheteur</label>
                                    <input
                                        type="text"
                                        value={formData.buyerName}
                                        onChange={e => setFormData(p => ({ ...p, buyerName: e.target.value }))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input
                                        type="tel"
                                        value={formData.buyerPhone}
                                        onChange={e => setFormData(p => ({ ...p, buyerPhone: e.target.value }))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email acheteur</label>
                                    <input
                                        type="email"
                                        value={formData.buyerEmail}
                                        onChange={e => setFormData(p => ({ ...p, buyerEmail: e.target.value }))}
                                        className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix offre (DT)</label>
                                    <input
                                        type="number"
                                        value={formData.offerPrice}
                                        onChange={e => setFormData(p => ({ ...p, offerPrice: e.target.value }))}
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
                                    onChange={e => setFormData(p => ({ ...p, notaryName: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">
                                    Annuler
                                </button>
                                <button type="submit" disabled={submitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center gap-2">
                                    {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== DETAIL MODAL ===== */}
            {selectedTx && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTx(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h2 className="text-lg font-bold">{selectedTx.reference}</h2>
                            <button onClick={() => setSelectedTx(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTransactionStatusColor(selectedTx.status)}`}>
                                    {getTransactionStatusLabel(selectedTx.status)}
                                </span>
                                <span className="text-sm text-gray-500">{getTransactionTypeLabel(selectedTx.type)}</span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-500">Progression</span>
                                    <span className="text-sm font-medium">{getTransactionProgress(selectedTx.status)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${getTransactionProgress(selectedTx.status)}%` }} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500">Acheteur</span><p className="font-medium">{selectedTx.buyerName || '—'}</p></div>
                                <div><span className="text-gray-500">Email</span><p className="font-medium">{selectedTx.buyerEmail || '—'}</p></div>
                                <div><span className="text-gray-500">Téléphone</span><p className="font-medium">{selectedTx.buyerPhone || '—'}</p></div>
                                <div><span className="text-gray-500">Prix offre</span><p className="font-medium">{fmt(selectedTx.offerPrice)}</p></div>
                                <div><span className="text-gray-500">Prix négocié</span><p className="font-medium">{fmt(selectedTx.negotiatedPrice)}</p></div>
                                <div><span className="text-gray-500">Prix final</span><p className="font-medium">{fmt(selectedTx.finalPrice)}</p></div>
                                <div><span className="text-gray-500">Notaire</span><p className="font-medium">{selectedTx.notaryName || '—'}</p></div>
                                <div><span className="text-gray-500">Date</span><p className="font-medium">{new Date(selectedTx.createdAt).toLocaleDateString('fr-FR')}</p></div>
                            </div>
                            {selectedTx.notes && (
                                <div className="text-sm">
                                    <span className="text-gray-500">Notes</span>
                                    <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedTx.notes}</p>
                                </div>
                            )}
                            {/* Status change buttons */}
                            {selectedTx.status !== TransactionStatus.FINAL_DEED_SIGNED && selectedTx.status !== TransactionStatus.CANCELLED && (
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Changer le statut</p>
                                    <div className="flex flex-wrap gap-2">
                                        {PIPELINE_STAGES.filter(s => s.status !== selectedTx.status).map(s => (
                                            <button
                                                key={s.status}
                                                onClick={() => handleStatusChange(selectedTx.id, s.status)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:shadow ${s.bg} ${s.color}`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => handleStatusChange(selectedTx.id, TransactionStatus.CANCELLED)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 bg-red-50 text-red-700 hover:shadow transition"
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t">
                                <button onClick={() => handleDelete(selectedTx.id)} className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Supprimer
                                </button>
                                <button onClick={() => setSelectedTx(null)} className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 text-sm">
                                    Fermer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsDashboard;
