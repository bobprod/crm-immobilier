import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  getCommitment,
  markOccurrenceDone,
  markOccurrenceWaived,
  getCumulativeProgress,
  FinancialCommitment,
  ProvisionOccurrence,
  CumulativeProgressResponse,
  MarkOccurrenceDoneData,
} from '../../../shared/utils/provision-api';

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  PENDING: { cls: 'bg-yellow-100 text-yellow-800 border border-yellow-200', label: '🕐 En attente' },
  DONE:    { cls: 'bg-green-100 text-green-800 border border-green-200',   label: '✅ Versé' },
  OVERDUE: { cls: 'bg-red-100 text-red-800 border border-red-200',          label: '🔴 En retard' },
  WAIVED:  { cls: 'bg-gray-100 text-gray-500 border border-gray-200',       label: '⚫ Dispensé' },
};

interface ActionModalState {
  occId: string;
  type: 'done' | 'waived';
}

export default function CommitmentDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [commitment, setCommitment] = useState<FinancialCommitment | null>(null);
  const [progress, setProgress] = useState<CumulativeProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModalState | null>(null);
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([
        getCommitment(id!),
        getCumulativeProgress(id!),
      ]);
      setCommitment(c.data);
      setProgress(p.data);
    } catch (e: any) {
      console.error('Erreur lors du chargement:', e);
      setError(e.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDone() {
    if (!actionModal) return;
    setError(null);
    try {
      const data: MarkOccurrenceDoneData = {
        paymentRef: payRef,
        notes: payNotes,
      };
      await markOccurrenceDone(actionModal.occId, data);
      setActionModal(null);
      setPayRef('');
      setPayNotes('');
      loadData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la mise à jour');
      console.error(e);
    }
  }

  async function handleMarkWaived() {
    if (!actionModal) return;
    setError(null);
    try {
      await markOccurrenceWaived(actionModal.occId, payNotes || undefined);
      setActionModal(null);
      setPayNotes('');
      loadData();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la mise à jour');
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!commitment) {
    return (
      <div className="p-6">
        <button onClick={() => router.push('/finance/provisions')} className="text-sm text-blue-600 hover:underline mb-4">
          ← Retour aux provisions
        </button>
        <div className="text-gray-500 text-center py-8">Engagement introuvable</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Message d'erreur */}
      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700 text-xs mt-1 underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Back */}
      <button onClick={() => router.push('/finance/provisions')} className="text-sm text-blue-600 hover:underline">
        ← Retour aux provisions
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{commitment.name}</h1>
            {commitment.description && <p className="text-gray-500 text-sm mt-1">{commitment.description}</p>}
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{commitment.category}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{commitment.frequency}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${commitment.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {commitment.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {commitment.amount.toLocaleString()} <span className="text-base text-gray-500">{commitment.currency}</span>
            </p>
            <p className="text-xs text-gray-400">par occurrence</p>
          </div>
        </div>
      </div>

      {/* Barre de progression cumulative */}
      {progress && progress.totalExpected > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-700">Progression cumulative</p>
            <p className="text-sm font-bold text-blue-600">{progress.progressPercent}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
              style={{ width: `${Math.min(progress.progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Versé : <strong className="text-green-600">{progress.totalPaid.toLocaleString()} {commitment.currency}</strong></span>
            <span>Objectif : <strong>{progress.totalExpected.toLocaleString()} {commitment.currency}</strong></span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {progress.occurrencesDone} / {progress.occurrencesTotal} occurrences versées
          </p>
        </div>
      )}

      {/* Tableau des occurrences */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Échéancier ({commitment.occurrences?.length || 0} occurrences)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(commitment.occurrences || []).map((occ: ProvisionOccurrence) => {
            const badge = STATUS_BADGE[occ.status] || STATUS_BADGE.PENDING;
            return (
              <div key={occ.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{occ.periodLabel}</p>
                    <p className="text-xs text-gray-400">
                      Échéance : {new Date(occ.dueDate).toLocaleDateString('fr-FR')}
                    </p>
                    {occ.paidAt && (
                      <p className="text-xs text-green-600">
                        Versé le {new Date(occ.paidAt).toLocaleDateString('fr-FR')}
                        {occ.paymentRef && ` · Réf: ${occ.paymentRef}`}
                      </p>
                    )}
                    {occ.notes && <p className="text-xs text-gray-400 italic">{occ.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">
                      {occ.status === 'DONE' ? (occ.paidAmount || occ.expectedAmount).toLocaleString() : occ.expectedAmount.toLocaleString()} {occ.currency}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${badge.cls}`}>{badge.label}</span>
                  </div>
                  {(occ.status === 'PENDING' || occ.status === 'OVERDUE') && (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActionModal({ occId: occ.id, type: 'done' })}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 whitespace-nowrap"
                      >
                        ✓ Marquer versé
                      </button>
                      <button
                        onClick={() => setActionModal({ occId: occ.id, type: 'waived' })}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 whitespace-nowrap"
                      >
                        Dispenser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal action */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <h2 className="text-lg font-bold mb-4">
              {actionModal.type === 'done' ? '✅ Marquer comme versé' : '⚫ Dispenser cette occurrence'}
            </h2>
            <div className="space-y-3">
              {actionModal.type === 'done' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Référence paiement</label>
                  <input value={payRef} onChange={e => setPayRef(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Numéro virement, chèque..." />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes {actionModal.type === 'waived' ? '(raison)' : ''}
                </label>
                <textarea value={payNotes} onChange={e => setPayNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2} placeholder="Notes optionnelles..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setActionModal(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                Annuler
              </button>
              <button
                onClick={actionModal.type === 'done' ? handleMarkDone : handleMarkWaived}
                className={`flex-1 text-white rounded-lg py-2 text-sm font-medium ${actionModal.type === 'done' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
