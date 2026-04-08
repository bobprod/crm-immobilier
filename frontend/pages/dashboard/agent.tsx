import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/shared/components/layout';
import { ProtectedRoute } from '@/modules/core/auth/components/ProtectedRoute';
import { fetchAgencyDashboard } from '@/shared/utils/agent-dashboard-api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentPerf {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  revenueThisMonth: number;
  targetMonthly: number;
  targetProgressPercent: number;
  commissionThisMonth: number;
  commissionPending: number;
  transactionsThisMonth: number;
  transactionsPending: number;
  mandatesTotal: number;
  mandatesExclusive: number;
  mandatesExclusivePercent: number;
  performanceScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface AgencyData {
  agencyRevenueThisMonth: number;
  agencyRevenueLastMonth: number;
  agencyRevenueYTD: number;
  survivalThreshold: number;
  recommendedThreshold: number;
  survivalStatus: 'safe' | 'warning' | 'danger';
  agents: AgentPerf[];
  agentsAboveTarget: number;
  agentsBelowTarget: number;
  topAgent: AgentPerf | null;
  provisionAlertStatus: string;
  provisionThisMonth: number;
  provisionDone: boolean;
  monthlyTarget: number;
  targetProgressPercent: number;
  transactionsTotal: number;
  transactionsClosed: number;
  transactionsPending: number;
  revenueTimeline: { month: string; revenue: number; target: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-TN', { maximumFractionDigits: 0 }).format(n) + ' TND';
}

function pct(n: number) {
  return Math.min(Math.max(n, 0), 100);
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// ─── Sous-composants ──────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  status?: 'safe' | 'warning' | 'danger' | 'neutral';
  progress?: number;
  icon: string;
}> = ({ title, value, sub, status = 'neutral', progress, icon }) => {
  const statusColors = {
    safe: 'border-green-300 bg-green-50',
    warning: 'border-orange-300 bg-orange-50',
    danger: 'border-red-300 bg-red-50',
    neutral: 'border-gray-200 bg-white',
  };
  const progressColors = {
    safe: 'bg-green-500',
    warning: 'bg-orange-500',
    danger: 'bg-red-500',
    neutral: 'bg-blue-500',
  };

  return (
    <div className={`rounded-xl border-2 p-5 shadow-sm ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {status !== 'neutral' && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            status === 'safe' ? 'bg-green-100 text-green-700' :
            status === 'warning' ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'
          }`}>
            {status === 'safe' ? '✓ OK' : status === 'warning' ? '⚠ ATTENTION' : '✗ ALERTE'}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Progression</span>
            <span className="font-semibold">{pct(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${progressColors[status]}`}
              style={{ width: `${pct(progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  if (trend === 'up') return <span className="text-green-600 font-bold">↑</span>;
  if (trend === 'down') return <span className="text-red-600 font-bold">↓</span>;
  return <span className="text-gray-400">→</span>;
};

const MiniBar: React.FC<{ value: number; max: number; color?: string }> = ({ value, max, color = 'bg-blue-500' }) => {
  const pctVal = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const barColor = pctVal >= 100 ? 'bg-green-500' : pctVal >= 50 ? 'bg-orange-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[60px]">
        <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pctVal}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8">{Math.round(pctVal)}%</span>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const AgentDashboardPage: React.FC = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAgencyDashboard(year, month);
      setData(result);
    } catch (e: any) {
      setError(e.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const survivalStatus = data?.survivalStatus ?? 'neutral';
  const hasCriticalAlert =
    data?.provisionAlertStatus === 'CRITICAL' ||
    data?.provisionAlertStatus === 'RED' ||
    data?.survivalStatus === 'danger';

  const provisionStatus: 'safe' | 'warning' | 'danger' | 'neutral' =
    data?.provisionAlertStatus === 'GREEN' ? 'safe' :
    data?.provisionAlertStatus === 'ORANGE' ? 'warning' :
    (data?.provisionAlertStatus === 'RED' || data?.provisionAlertStatus === 'CRITICAL') ? 'danger' : 'neutral';

  return (
    <ProtectedRoute>
      <MainLayout
        title="Performance Agents"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Performance Agents' }]}
      >
        <div className="space-y-6 pb-8">

          {/* ── Bandeau alerte critique ── */}
          {hasCriticalAlert && (
            <div className="bg-red-600 text-white rounded-xl p-4 flex items-center gap-3 shadow-lg animate-pulse">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-bold text-lg">Alerte critique détectée</p>
                <p className="text-red-100 text-sm">
                  {data?.survivalStatus === 'danger' && `CA (${fmt(data.agencyRevenueThisMonth)}) sous le seuil de survie (${fmt(data.survivalThreshold)}). `}
                  {(data?.provisionAlertStatus === 'RED' || data?.provisionAlertStatus === 'CRITICAL') && 'Provision investisseur en retard — action immédiate requise.'}
                </p>
              </div>
              <a href="/finance/provisions" className="ml-auto bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
                Voir provisions →
              </a>
            </div>
          )}

          {/* ── Header + filtres ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📊 Performance Commerciale</h1>
              <p className="text-gray-500 text-sm mt-1">Suivi CA, objectifs et commissions par agent</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:outline-none"
              >
                {MONTHS.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-300 focus:outline-none"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={load}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2"
              >
                {loading ? <span className="animate-spin">↻</span> : '↻'} Actualiser
              </button>
            </div>
          </div>

          {/* ── Chargement / Erreur ── */}
          {loading && (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* ── KPIs Agence ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon="💰"
                  title="CA Agence ce mois"
                  value={fmt(data.agencyRevenueThisMonth)}
                  sub={`vs ${fmt(data.agencyRevenueLastMonth)} mois dernier`}
                  status={data.survivalStatus === 'safe' ? 'safe' : data.survivalStatus === 'warning' ? 'warning' : 'danger'}
                  progress={data.targetProgressPercent}
                />
                <KpiCard
                  icon="🎯"
                  title="Objectif Agence"
                  value={fmt(data.monthlyTarget)}
                  sub={`${data.agentsAboveTarget} agents au-dessus · ${data.agentsBelowTarget} en dessous`}
                  status="neutral"
                  progress={data.targetProgressPercent}
                />
                <KpiCard
                  icon="📈"
                  title="CA Annuel (YTD)"
                  value={fmt(data.agencyRevenueYTD)}
                  sub={`${data.transactionsClosed} ventes conclues · ${data.transactionsPending} en cours`}
                  status="neutral"
                />
                <KpiCard
                  icon="🏦"
                  title="Provision Investisseur"
                  value={data.provisionDone ? '✓ Effectuée' : '⏳ En attente'}
                  sub={`${fmt(data.provisionThisMonth)} ce mois`}
                  status={provisionStatus}
                />
              </div>

              {/* ── Seuils survie ── */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  📉 Seuils de Viabilité
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Seuil de survie</span>
                      <span className={`font-semibold ${data.agencyRevenueThisMonth >= data.survivalThreshold ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(data.survivalThreshold)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 relative">
                      <div className="bg-red-400 h-3 rounded-full" style={{ width: `${(data.survivalThreshold / data.monthlyTarget) * 100}%` }} />
                      <div
                        className="absolute top-0 left-0 bg-purple-600 h-3 rounded-full opacity-80"
                        style={{ width: `${Math.min((data.agencyRevenueThisMonth / data.monthlyTarget) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span>Survie {fmt(data.survivalThreshold)}</span>
                      <span>Recommandé {fmt(data.recommendedThreshold)}</span>
                      <span>Objectif {fmt(data.monthlyTarget)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tableau des agents ── */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">👥 Performance par Agent — {MONTHS[month - 1]} {year}</h2>
                  <span className="text-xs text-gray-400">{data.agents.length} agents</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left">Agent</th>
                        <th className="px-4 py-3 text-right">CA mois</th>
                        <th className="px-4 py-3 text-left">vs 13 000 TND</th>
                        <th className="px-4 py-3 text-right">Commission</th>
                        <th className="px-4 py-3 text-center">Tx</th>
                        <th className="px-4 py-3 text-center">Mandats Excl.</th>
                        <th className="px-4 py-3 text-center">Score</th>
                        <th className="px-4 py-3 text-center">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.agents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                            Aucune donnée pour cette période
                          </td>
                        </tr>
                      ) : (
                        data.agents.map((agent) => (
                          <tr key={agent.userId} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                                  {(agent.firstName?.[0] ?? '?')}{(agent.lastName?.[0] ?? '')}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{agent.firstName} {agent.lastName}</p>
                                  <p className="text-xs text-gray-400">{agent.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={`font-semibold ${agent.revenueThisMonth >= agent.targetMonthly ? 'text-green-600' : agent.revenueThisMonth >= agent.targetMonthly * 0.5 ? 'text-orange-600' : 'text-red-600'}`}>
                                {fmt(agent.revenueThisMonth)}
                              </span>
                            </td>
                            <td className="px-4 py-3 min-w-[120px]">
                              <MiniBar value={agent.revenueThisMonth} max={agent.targetMonthly} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="text-gray-900 font-medium">{fmt(agent.commissionThisMonth)}</div>
                              {agent.commissionPending > 0 && (
                                <div className="text-xs text-orange-500">{fmt(agent.commissionPending)} en attente</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-semibold text-gray-900">{agent.transactionsThisMonth}</span>
                              {agent.transactionsPending > 0 && (
                                <span className="text-xs text-gray-400 block">+{agent.transactionsPending} en cours</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`font-semibold ${agent.mandatesExclusivePercent >= 50 ? 'text-green-600' : 'text-gray-700'}`}>
                                {agent.mandatesExclusive}/{agent.mandatesTotal}
                              </span>
                              <span className="text-xs text-gray-400 block">{agent.mandatesExclusivePercent}% excl.</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className={`font-bold text-sm ${agent.performanceScore >= 70 ? 'text-green-600' : agent.performanceScore >= 40 ? 'text-orange-600' : 'text-red-600'}`}>
                                  {agent.performanceScore}
                                </span>
                                <div className="w-12 bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${agent.performanceScore >= 70 ? 'bg-green-500' : agent.performanceScore >= 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                                    style={{ width: `${agent.performanceScore}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-lg">
                              <TrendIcon trend={agent.trend} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Graphique CA 12 mois ── */}
              {data.revenueTimeline.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="font-semibold text-gray-900 mb-4">📅 CA Mensuel {year} vs Objectif {fmt(data.monthlyTarget)}</h2>
                  <div className="flex items-end gap-1.5 h-40">
                    {data.revenueTimeline.map((item, i) => {
                      const maxVal = Math.max(...data.revenueTimeline.map((t) => Math.max(t.revenue, t.target)), 1);
                      const revenueH = Math.round((item.revenue / maxVal) * 100);
                      const targetH = Math.round((item.target / maxVal) * 100);
                      const isCurrentMonth = i + 1 === month;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="w-full flex items-end gap-0.5 h-32">
                            {/* Barre objectif (trait pointillé simulé) */}
                            <div
                              className="flex-1 bg-gray-200 rounded-t opacity-60"
                              style={{ height: `${targetH}%` }}
                              title={`Objectif: ${fmt(item.target)}`}
                            />
                            {/* Barre CA réel */}
                            <div
                              className={`flex-1 rounded-t transition-all ${
                                item.revenue >= item.target ? 'bg-green-500' :
                                item.revenue >= item.target * 0.5 ? 'bg-orange-400' : 'bg-red-400'
                              } ${isCurrentMonth ? 'ring-2 ring-purple-500 ring-offset-1' : ''}`}
                              style={{ height: `${revenueH}%` }}
                              title={`CA: ${fmt(item.revenue)}`}
                            />
                          </div>
                          <span className={`text-xs ${isCurrentMonth ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>
                            {item.month}
                          </span>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-10">
                            {item.month}: {fmt(item.revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded inline-block" /> CA ≥ objectif</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded inline-block" /> CA partiel</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded inline-block" /> CA insuffisant</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded inline-block" /> Objectif</span>
                  </div>
                </div>
              )}

              {/* ── Top agent ── */}
              {data.topAgent && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🏆</span>
                    <div>
                      <p className="text-purple-200 text-sm uppercase tracking-wide">Meilleur Agent du Mois</p>
                      <p className="text-xl font-bold">{data.topAgent.firstName} {data.topAgent.lastName}</p>
                      <p className="text-purple-200 text-sm">
                        {fmt(data.topAgent.revenueThisMonth)} · {data.topAgent.transactionsThisMonth} transaction(s) · Score {data.topAgent.performanceScore}/100
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
};

export default AgentDashboardPage;
