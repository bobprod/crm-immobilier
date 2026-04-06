import { useEffect, useState } from 'react';
import Link from 'next/link';
import { dashboardService } from '@/modules/dashboard/services/dashboard.service';
import type {
  DashboardStats,
  DashboardAlerts,
  RecentActivities,
  TopPerformers,
} from '@/modules/dashboard/types/dashboard.types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlerts | null>(null);
  const [activities, setActivities] = useState<RecentActivities | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, al, ac, tp] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getAlerts(),
          dashboardService.getRecentActivities(),
          dashboardService.getTopPerformers(),
        ]);
        setStats(s);
        setAlerts(al);
        setActivities(ac);
        setTopPerformers(tp);
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Tableau de bord</h1>
          <p style={{ color: '#666', margin: '4px 0 0' }}>Vue d&apos;ensemble de votre activité CRM</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/analytics" style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, textDecoration: 'none', color: '#374151' }}>
            Analytics
          </Link>
          <Link href="/intelligence" style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 6, textDecoration: 'none' }}>
            Intelligence IA
          </Link>
        </div>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: '#b91c1c' }}>Erreur: {error}</p>}

      {!loading && !error && (
        <>
          {/* Alerts */}
          {alerts && alerts.alerts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {alerts.alerts.map((alert, i) => (
                <div key={i} style={{
                  padding: '10px 16px',
                  marginBottom: 8,
                  borderRadius: 6,
                  background: alert.type === 'warning' ? '#fef3c7' : alert.type === 'error' ? '#fee2e2' : '#dbeafe',
                  border: `1px solid ${alert.type === 'warning' ? '#fcd34d' : alert.type === 'error' ? '#fca5a5' : '#93c5fd'}`,
                  color: alert.type === 'warning' ? '#92400e' : alert.type === 'error' ? '#991b1b' : '#1e40af',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span>{alert.message}</span>
                  <Link href={alert.action} style={{ fontSize: 12, textDecoration: 'underline' }}>Voir</Link>
                </div>
              ))}
            </div>
          )}

          {/* KPI Stats */}
          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <StatCard label="Prospects actifs" value={stats.activeProspects} color="#2563eb" href="/prospects" />
              <StatCard label="Biens disponibles" value={stats.availableProperties} color="#16a34a" href="/properties" />
              <StatCard label="RDV aujourd'hui" value={stats.todayAppointments} color="#9333ea" href="/appointments" />
              <StatCard label="Matchs en attente" value={stats.totalMatches} color="#ea580c" href="/matching" />
              <StatCard label="Tâches en cours" value={stats.pendingTasks} color="#dc2626" href="/tasks" />
              <StatCard label="Campagnes actives" value={stats.activeCampaigns} color="#0891b2" href="/prospecting" />
              <StatCard label="Taux de conversion" value={`${stats.conversionRate}%`} color="#7c3aed" />
              <StatCard label="Taux de match" value={`${stats.matchSuccessRate}%`} color="#b45309" />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Activités récentes */}
            {activities && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Activités récentes</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activities.recentProspects.slice(0, 3).map((p) => (
                    <ActivityRow key={p.id} type="Prospect" label={`${p.firstName} ${p.lastName}`} status={p.status} date={p.createdAt} />
                  ))}
                  {activities.recentProperties.slice(0, 3).map((p) => (
                    <ActivityRow key={p.id} type="Bien" label={p.title} status={p.status} date={p.createdAt} />
                  ))}
                  {activities.recentAppointments.slice(0, 2).map((a) => (
                    <ActivityRow key={a.id} type="RDV" label={a.title} status={a.status} date={a.startTime} />
                  ))}
                </div>
              </div>
            )}

            {/* Top performers */}
            {topPerformers && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Top performers</h2>
                <div>
                  <h3 style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>Meilleurs biens</h3>
                  {topPerformers.topProperties.slice(0, 3).map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{p.title}</span>
                      <span style={{ color: '#6b7280' }}>{p.viewsCount} vues · {p._count.matches} matchs</span>
                    </div>
                  ))}
                  <h3 style={{ fontSize: 13, color: '#6b7280', margin: '12px 0 6px' }}>Meilleurs prospects</h3>
                  {topPerformers.topProspects.slice(0, 3).map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13, borderBottom: '1px solid #f1f5f9' }}>
                      <span>{p.firstName} {p.lastName}</span>
                      <span style={{ color: '#6b7280' }}>Score: {p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value, color, href }: { label: string; value: number | string; color: string; href?: string }) {
  const content = (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  );
  if (href) return <Link href={href} style={{ textDecoration: 'none' }}>{content}</Link>;
  return content;
}

function ActivityRow({ type, label, status, date }: { type: string; label: string; status: string; date: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <span style={{ fontSize: 11, background: '#f1f5f9', borderRadius: 4, padding: '2px 6px', marginRight: 8 }}>{type}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <span style={{ color: '#9ca3af', fontSize: 11 }}>{new Date(date).toLocaleDateString('fr-FR')}</span>
    </div>
  );
}
