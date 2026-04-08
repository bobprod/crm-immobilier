import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  getCommitments,
  getAlertStatus,
  getYearlySummary,
  toggleCommitment,
  deleteCommitment,
  createCommitment,
  FinancialCommitment,
  CreateCommitmentData,
  AlertStatusResponse,
  YearlySummaryResponse,
} from '../../../shared/utils/provision-api';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Juin','Jul','Aoû','Sep','Oct','Nov','Déc'];

const CATEGORIES: Record<string, string> = {
  INVESTOR: '🏦 Investisseur',
  RENT:     '🏢 Loyer',
  LOAN:     '🏛️ Emprunt',
  TAX:      '📋 Fiscal',
  SALARY:   '👥 Salaires',
  CUSTOM:   '⚙️ Autre',
};

const ALERT_COLORS: Record<string, string> = {
  GREEN:    'bg-green-100 text-green-800 border-green-300',
  ORANGE:   'bg-orange-100 text-orange-800 border-orange-300',
  RED:      'bg-red-100 text-red-800 border-red-300',
  CRITICAL: 'bg-red-200 text-red-900 border-red-500',
};

const ALERT_LABELS: Record<string, string> = {
  GREEN:    '✅ Tout est à jour',
  ORANGE:   '⚠️ Échéances imminentes',
  RED:      '🔴 Provisions en retard',
  CRITICAL: '🚨 ALERTE CRITIQUE — Action requise',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DONE:    'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  WAIVED:  'bg-gray-100 text-gray-600',
};

const FREQUENCIES: Record<string, string> = {
  MONTHLY:   'Mensuelle',
  QUARTERLY: 'Trimestrielle',
  YEARLY:    'Annuelle',
  CUSTOM:    'Personnalisée',
};

interface FormState extends CreateCommitmentData {
  endDate?: string;
  totalOccurrences?: number;
  alertLevel?: string;
}

export default function ProvisionsPage() {
  const router = useRouter();
  const [commitments, setCommitments] = useState<FinancialCommitment[]>([]);
  const [alertStatus, setAlertStatus] = useState<AlertStatusResponse | null>(null);
  const [yearlySummary, setYearlySummary] = useState<YearlySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth() + 1;
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    category: 'INVESTOR',
    type: 'provision_capital',
    amount: 0,
    currency: 'TND',
    frequency: 'MONTHLY',
    gracePeriodDays: 5,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    totalOccurrences: 12,
    alertLevel: 'HIGH',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [c, a, y] = await Promise.all([
        getCommitments(),
        getAlertStatus(),
        getYearlySummary(selectedYear),
      ]);
      setCommitments(c.data);
      setAlertStatus(a.data);
      setYearlySummary(y.data);
    } catch (e: any) {
      console.error('Erreur lors du chargement:', e);
      setError(e.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload: CreateCommitmentData = {
        name: form.name,
        description: form.description,
        category: form.category as any,
        type: form.type as any,
        amount: Number(form.amount),
        currency: form.currency,
        frequency: form.frequency as any,
        gracePeriodDays: Number(form.gracePeriodDays),
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        totalOccurrences: form.totalOccurrences ? Number(form.totalOccurrences) : undefined,
        alertLevel: form.alertLevel as any,
      };
      await createCommitment(payload);
      setShowModal(false);
      setForm({
        name: '',
        description: '',
        category: 'INVESTOR',
        type: 'provision_capital',
        amount: 0,
        currency: 'TND',
        frequency: 'MONTHLY',
        gracePeriodDays: 5,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        totalOccurrences: 12,
        alertLevel: 'HIGH',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
      console.error(err);
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleCommitment(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la modification');
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet engagement ?')) return;
    try {
      await deleteCommitment(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentMonthData = yearlySummary?.byMonth?.[currentMonth];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

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

      {/* Bandeau alerte */}
      {alertStatus && alertStatus.status !== 'GREEN' && (
        <div className={`border-2 rounded-xl p-4 font-semibold text-center text-lg ${ALERT_COLORS[alertStatus.status]}`}>
          {ALERT_LABELS[alertStatus.status]}
          {alertStatus.details?.length > 0 && (
            <p className="text-sm font-normal mt-1">
              {alertStatus.details.length} engagement(s) en retard
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Provisions & Engagements</h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des engagements financiers récurrents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          + Nouvel engagement
        </button>
      </div>

      {/* KPIs mois courant */}
      {currentMonthData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total dû ce mois', value: `${currentMonthData.total.toLocaleString()} TND`, color: 'text-gray-900' },
            { label: 'Versé', value: `${currentMonthData.done.toLocaleString()} TND`, color: 'text-green-600' },
            { label: 'En attente', value: currentMonthData.hasPending ? 'Oui' : 'Non', color: currentMonthData.hasPending ? 'text-yellow-600' : 'text-green-600' },
            { label: 'En retard', value: currentMonthData.hasOverdue ? 'Oui' : 'Non', color: currentMonthData.hasOverdue ? 'text-red-600' : 'text-green-600' },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{kpi.label}</p>
              <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grille 12 mois */}
      {yearlySummary && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-700 mb-3">Calendrier {selectedYear}</h2>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const d = yearlySummary.byMonth[m];
              const isCurrent = m === currentMonth;
              const bg = !d?.occurrences?.length ? 'bg-gray-50'
                : d.hasOverdue ? 'bg-red-100 border-red-300'
                : d.hasPending ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200';
              return (
                <div key={m} className={`rounded-lg border p-2 text-center cursor-pointer hover:opacity-80 ${bg} ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                  <p className="text-xs font-semibold text-gray-600">{MONTHS[m - 1]}</p>
                  {d?.total > 0 && <p className="text-xs text-gray-500 mt-0.5">{d.total.toLocaleString()}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-200 rounded inline-block" /> À jour</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded inline-block" /> En attente</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-300 rounded inline-block" /> En retard</span>
          </div>
        </div>
      )}

      {/* Liste des engagements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">Engagements actifs ({commitments.filter(c => c.isActive).length})</h2>
        </div>
        {commitments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📋</p>
            <p>Aucun engagement configuré</p>
            <button onClick={() => setShowModal(true)} className="mt-3 text-blue-600 underline text-sm">
              Créer le premier engagement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {commitments.map((c) => {
              const lastOcc = c.occurrences?.[0];
              return (
                <div key={c.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${!c.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {CATEGORIES[c.category] || c.category}
                        </span>
                        {!c.isActive && <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Inactif</span>}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {c.amount.toLocaleString()} {c.currency} · {FREQUENCIES[c.frequency]}
                        {c.totalOccurrences && ` · ${c._count?.occurrences || 0}/${c.totalOccurrences} occurrences`}
                      </p>
                    </div>
                    {lastOcc && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_BADGE[lastOcc.status] || 'bg-gray-100'}`}>
                        {lastOcc.status === 'DONE' ? '✅ À jour' : lastOcc.status === 'OVERDUE' ? '🔴 En retard' : lastOcc.status === 'WAIVED' ? '⚫ Dispensé' : '🕐 En attente'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => router.push(`/finance/provisions/${c.id}`)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Détail
                    </button>
                    <button
                      onClick={() => handleToggle(c.id)}
                      className={`text-xs px-2 py-1 rounded ${c.isActive ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' : 'bg-green-100 hover:bg-green-200 text-green-700'}`}
                    >
                      {c.isActive ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">Nouvel engagement financier</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="ex: Provision capital investisseur" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence *</label>
                  <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {Object.entries(FREQUENCIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: Number(e.target.value)})} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="6667" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    {['TND','EUR','USD','MAD','DZD'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date début *</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                  <input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nb occurrences</label>
                  <input type="number" value={form.totalOccurrences || ''} onChange={e => setForm({...form, totalOccurrences: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Délai de grâce (jours)</label>
                  <input type="number" value={form.gracePeriodDays} onChange={e => setForm({...form, gracePeriodDays: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau d'alerte</label>
                <select value={form.alertLevel} onChange={e => setForm({...form, alertLevel: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="LOW">🟡 Faible</option>
                  <option value="MEDIUM">🟠 Moyen</option>
                  <option value="HIGH">🔴 Élevé</option>
                  <option value="CRITICAL">🚨 Critique</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm hover:bg-gray-50">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">
                  Créer l'engagement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
