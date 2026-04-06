import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { matchingAPI, MatchingResult, MatchingStats } from '@/shared/utils/matching-api';

interface MatchingDashboardProps {
  language?: 'fr' | 'en';
}

type TabType = 'results' | 'generate';

/* --- Helpers --- */
const formatPrice = (price: number, currency = 'TND') =>
  new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const MATCH_STATUS: Record<string, { label: string; color: string; icon: string; order: number }> =
  {
    pending: { label: 'En attente', color: 'bg-gray-100 text-gray-700', icon: '\u23F3', order: 0 },
    contacted: {
      label: 'Contact\u00E9',
      color: 'bg-blue-100 text-blue-700',
      icon: '\uD83D\uDCDE',
      order: 1,
    },
    visited: {
      label: 'Visit\u00E9',
      color: 'bg-purple-100 text-purple-700',
      icon: '\uD83C\uDFE0',
      order: 2,
    },
    offered: {
      label: 'Offre faite',
      color: 'bg-amber-100 text-amber-700',
      icon: '\uD83D\uDCB0',
      order: 3,
    },
    negotiating: {
      label: 'N\u00E9gociation',
      color: 'bg-orange-100 text-orange-700',
      icon: '\uD83E\uDD1D',
      order: 4,
    },
    accepted: {
      label: 'Accept\u00E9',
      color: 'bg-emerald-100 text-emerald-700',
      icon: '\u2705',
      order: 5,
    },
    rejected: { label: 'Refus\u00E9', color: 'bg-red-100 text-red-700', icon: '\u274C', order: 6 },
    success: {
      label: 'Conclu',
      color: 'bg-green-100 text-green-700',
      icon: '\uD83C\uDF89',
      order: 7,
    },
  };

const getStatus = (s?: string) => MATCH_STATUS[s || 'pending'] || MATCH_STATUS.pending;

const PROSPECT_TYPE: Record<string, { label: string; color: string }> = {
  buyer: { label: 'Acheteur', color: 'bg-blue-100 text-blue-800' },
  seller: { label: 'Vendeur', color: 'bg-green-100 text-green-800' },
  renter: { label: 'Locataire', color: 'bg-purple-100 text-purple-800' },
  landlord: { label: 'Bailleur', color: 'bg-orange-100 text-orange-800' },
  investor: { label: 'Investisseur', color: 'bg-yellow-100 text-yellow-800' },
};

type StatusFilter = 'all' | string;
type SortKey = 'score' | 'date' | 'status';

/**
 * Module Matching - Dashboard epure
 * Tab 1 : Resultats (tous les matchs avec pipeline + actions)
 * Tab 2 : Generer  (batch generation + statistiques)
 */
export const MatchingDashboard: React.FC<MatchingDashboardProps> = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('results');
  const [matches, setMatches] = useState<MatchingResult[]>([]);
  const [stats, setStats] = useState<MatchingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('score');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [matchesData, statsData] = await Promise.all([
        matchingAPI.getAllMatches(),
        matchingAPI.getStats(),
      ]);
      setMatches(matchesData || []);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading matches:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateAll = async () => {
    setGenerating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const generated = await matchingAPI.generateAllMatches();
      const count = Array.isArray(generated) ? generated.length : 0;
      setSuccessMsg(`${count} correspondance(s) generee(s) avec succes !`);
      await loadData();
    } catch (err: any) {
      console.error('Error generating:', err);
      setError(err.message || 'Erreur lors de la generation');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateStatus = async (matchId: string, newStatus: string) => {
    try {
      await matchingAPI.updateMatchStatus(matchId, newStatus);
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: newStatus } : m)));
    } catch (err: any) {
      setError(err.message || 'Erreur');
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Supprimer cette correspondance ?')) return;
    try {
      await matchingAPI.deleteMatch(matchId);
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    } catch (err: any) {
      setError(err.message || 'Erreur');
    }
  };

  // Filtrage et tri
  const filtered = matches
    .filter((m) => {
      if (statusFilter !== 'all' && (m.status || 'pending') !== statusFilter) return false;
      if (searchTerm) {
        const prop = m.properties || m.property;
        const pros = m.prospects || m.prospect;
        const text = [
          prop?.title,
          prop?.city,
          prop?.type,
          pros?.firstName,
          pros?.lastName,
          pros?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!text.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'date')
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'status') return getStatus(a.status).order - getStatus(b.status).order;
      return 0;
    });

  // Pipeline stats
  const pipelineCounts = matches.reduce<Record<string, number>>((acc, m) => {
    const st = m.status || 'pending';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: 'results', label: 'R\u00E9sultats', icon: '\uD83C\uDFAF', count: matches.length },
    { id: 'generate', label: 'G\u00E9n\u00E9rer', icon: '\u26A1' },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Matching IA</h1>
        <p className="text-gray-500">
          Correspondances automatiques entre prospects et biens immobiliers
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-start">
          <div>
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-start">
          <div>
            <p className="font-medium">{'\u2705'} Succ&egrave;s</p>
            <p className="text-sm">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-green-400 hover:text-green-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ====== TAB RESULTATS ====== */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* Pipeline overview */}
          {matches.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Tous ({matches.length})
              </button>
              {Object.entries(pipelineCounts)
                .sort(([a], [b]) => getStatus(a).order - getStatus(b).order)
                .map(([status, count]) => {
                  const info = getStatus(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        statusFilter === status
                          ? 'ring-2 ring-purple-400 ' + info.color
                          : info.color + ' hover:opacity-80'
                      }`}
                    >
                      {info.icon} {info.label} ({count})
                    </button>
                  );
                })}
            </div>
          )}

          {/* Search & Sort */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="Rechercher prospect, bien, ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="score">Trier par score</option>
              <option value="date">Trier par date</option>
              <option value="status">Trier par statut</option>
            </select>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm"
            >
              {loading ? '...' : '\u21BB Actualiser'}
            </button>
          </div>

          {/* Match Cards */}
          {loading ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500">Chargement des correspondances...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <span className="text-5xl block mb-4">{'\uD83C\uDFAF'}</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {matches.length === 0
                  ? 'Aucune correspondance'
                  : 'Aucun r\u00E9sultat pour ce filtre'}
              </h3>
              <p className="text-gray-500 mb-6">
                {matches.length === 0
                  ? 'Utilisez l\'onglet "G\u00E9n\u00E9rer" pour lancer le matching IA automatique.'
                  : 'Essayez de modifier vos filtres de recherche.'}
              </p>
              {matches.length === 0 && (
                <button
                  onClick={() => setActiveTab('generate')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition"
                >
                  {'\u26A1'} G&eacute;n&eacute;rer les matchs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">{filtered.length} correspondance(s)</p>
              {filtered.map((match) => {
                const prop = match.properties || match.property;
                const pros = match.prospects || match.prospect;
                const st = getStatus(match.status);
                const score = match.score || 0;
                const prosType = PROSPECT_TYPE[pros?.type || ''] || {
                  label: pros?.type || '\u2014',
                  color: 'bg-gray-100 text-gray-700',
                };

                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Property image */}
                        {prop?.images?.[0] ? (
                          <img
                            src={prop.images[0]}
                            alt={prop.title}
                            className="h-24 w-32 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-24 w-32 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl text-gray-300">{'\uD83C\uDFE0'}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 truncate">
                                {prop?.title || 'Bien sans titre'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {prop?.city || '\u2014'} &middot; {prop?.type || '\u2014'}
                                {prop?.bedrooms ? ` \u00B7 ${prop.bedrooms} ch.` : ''}
                                {prop?.area ? ` \u00B7 ${prop.area} m\u00B2` : ''}
                              </p>
                              <p className="text-sm font-semibold text-emerald-600 mt-0.5">
                                {prop?.price ? formatPrice(prop.price, prop.currency) : '\u2014'}
                              </p>
                            </div>

                            {/* Score */}
                            <div className="flex-shrink-0 text-center">
                              <div
                                className={`text-2xl font-black ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-gray-500'}`}
                              >
                                {Math.round(score)}%
                              </div>
                              <div className="text-xs text-gray-400">score</div>
                            </div>
                          </div>

                          {/* Prospect info */}
                          <div className="mt-3 flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">{'\uD83D\uDC64'}</span>
                              <Link
                                href={`/prospects/${pros?.id || match.prospectId}`}
                                className="font-medium text-gray-700 hover:text-purple-600"
                              >
                                {pros?.firstName || ''} {pros?.lastName || 'Prospect inconnu'}
                              </Link>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${prosType.color}`}
                            >
                              {prosType.label}
                            </span>
                            {pros?.budget?.max && (
                              <span className="text-xs text-gray-500">
                                Budget: {formatPrice(pros.budget.max)}
                              </span>
                            )}
                          </div>

                          {/* Reasons */}
                          {match.reasons?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {match.reasons.slice(0, 4).map((r: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-200"
                                >
                                  {'\u2713'} {r}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Status + Actions */}
                          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}
                              >
                                {st.icon} {st.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                {formatDate(match.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {(match.status || 'pending') === 'pending' && (
                                <button
                                  onClick={() => handleUpdateStatus(match.id, 'contacted')}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition"
                                >
                                  {'\uD83D\uDCDE'} Contacter
                                </button>
                              )}
                              {match.status === 'contacted' && (
                                <button
                                  onClick={() => handleUpdateStatus(match.id, 'visited')}
                                  className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-100 transition"
                                >
                                  {'\uD83C\uDFE0'} Visite faite
                                </button>
                              )}
                              {match.status === 'visited' && (
                                <button
                                  onClick={() => handleUpdateStatus(match.id, 'offered')}
                                  className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition"
                                >
                                  {'\uD83D\uDCB0'} Offre
                                </button>
                              )}
                              {match.status === 'offered' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(match.id, 'accepted')}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                                  >
                                    {'\u2705'} Accepter
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(match.id, 'rejected')}
                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                                  >
                                    {'\u274C'} Refuser
                                  </button>
                                </>
                              )}
                              {prop?.id && (
                                <Link
                                  href={`/properties/${prop.id}`}
                                  className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition"
                                >
                                  {'\uD83C\uDFE0'} Voir bien
                                </Link>
                              )}
                              <button
                                onClick={() => handleDeleteMatch(match.id)}
                                className="px-2 py-1.5 text-gray-400 hover:text-red-600 rounded-lg text-xs transition"
                                title="Supprimer"
                              >
                                {'\uD83D\uDDD1'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== TAB GENERER ====== */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs mb-1">Total matchs</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs mb-1">{'Excellents (\u226580%)'}</p>
              <p className="text-3xl font-bold text-green-600">{stats?.excellent || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs mb-1">Bons (60-79%)</p>
              <p className="text-3xl font-bold text-yellow-600">{stats?.good || 0}</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs mb-1">Score moyen</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats?.avgScore?.toFixed(0) || 0}%
              </p>
            </div>
          </div>

          {/* Score distribution visual */}
          {stats && stats.total > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Distribution des scores</h3>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                {stats.excellent > 0 && (
                  <div
                    className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(stats.excellent / stats.total) * 100}%` }}
                    title={`Excellents: ${stats.excellent}`}
                  >
                    {stats.excellent}
                  </div>
                )}
                {stats.good > 0 && (
                  <div
                    className="bg-yellow-500 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(stats.good / stats.total) * 100}%` }}
                    title={`Bons: ${stats.good}`}
                  >
                    {stats.good}
                  </div>
                )}
                {stats.average > 0 && (
                  <div
                    className="bg-red-400 flex items-center justify-center text-white text-xs font-medium"
                    style={{ width: `${(stats.average / stats.total) * 100}%` }}
                    title={`Moyens: ${stats.average}`}
                  >
                    {stats.average}
                  </div>
                )}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-500 inline-block" />{' '}
                  {'Excellents (\u226580%)'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> Bons (60-79%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-400 inline-block" /> {'Moyens (<60%)'}
                </span>
              </div>
            </div>
          )}

          {/* Pipeline overview */}
          {Object.keys(pipelineCounts).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pipeline des correspondances</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(pipelineCounts)
                  .sort(([a], [b]) => getStatus(a).order - getStatus(b).order)
                  .map(([status, count]) => {
                    const info = getStatus(status);
                    return (
                      <div key={status} className={`p-3 rounded-lg text-center ${info.color}`}>
                        <div className="text-2xl mb-1">{info.icon}</div>
                        <div className="text-xl font-bold">{count}</div>
                        <div className="text-xs">{info.label}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Generate action */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-8 text-center">
            <span className="text-5xl block mb-4">{'\uD83E\uDD16'}</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Matching IA Automatique</h3>
            <p className="text-gray-600 max-w-lg mx-auto mb-6">
              Analysez tous vos prospects actifs et biens disponibles pour g&eacute;n&eacute;rer
              automatiquement les meilleures correspondances bas&eacute;es sur le budget, la
              localisation, le type de bien et les crit&egrave;res de recherche.
            </p>
            <button
              onClick={handleGenerateAll}
              disabled={generating}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-wait transition text-lg shadow-lg shadow-purple-200"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  G&eacute;n&eacute;ration en cours...
                </span>
              ) : (
                <>{'\u26A1'} G&eacute;n&eacute;rer tous les matchs</>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-3">
              Les correspondances existantes seront mises &agrave; jour (pas de doublons)
            </p>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/prospects"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{'\uD83D\uDC65'}</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                    Prospects
                  </p>
                  <p className="text-xs text-gray-500">G&eacute;rer les acheteurs et locataires</p>
                </div>
              </div>
            </Link>
            <Link
              href="/mandates"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{'\uD83D\uDCCB'}</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                    Mandats
                  </p>
                  <p className="text-xs text-gray-500">
                    G&eacute;rer les mandats de vente/location
                  </p>
                </div>
              </div>
            </Link>
            <Link
              href="/properties"
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{'\uD83C\uDFE0'}</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                    Biens
                  </p>
                  <p className="text-xs text-gray-500">
                    Voir le catalogue de propri&eacute;t&eacute;s
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
