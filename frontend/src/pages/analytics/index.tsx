import { useEffect, useState } from 'react';
import Link from 'next/link';
import { analyticsAPI } from '@/shared/utils/analytics-api';

interface KPIs {
  totalProspects: number;
  conversionRate: number;
  totalProperties: number;
  availableProperties: number;
  avgPropertyPrice: number;
  totalRevenue: number;
}

interface Trends {
  period: string;
  startDate: string;
  endDate: string;
  prospects: number;
  properties: number;
  communications: number;
}

interface ProspectsStats {
  total: number;
  active: number;
  converted: number;
  thisMonth: number;
  conversionRate: number;
  byStatus: { status: string; count: number }[];
}

interface PropertiesStats {
  total: number;
  available: number;
  sold: number;
  rented: number;
  avgPrice: number;
  byType: { type: string; count: number }[];
}

type TrendPeriod = 'week' | 'month' | 'year';

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [prospectsStats, setProspectsStats] = useState<ProspectsStats | null>(null);
  const [propertiesStats, setPropertiesStats] = useState<PropertiesStats | null>(null);
  const [period, setPeriod] = useState<TrendPeriod>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [k, t, ps, props] = await Promise.all([
          analyticsAPI.getKPIs(),
          analyticsAPI.getTrends(period),
          analyticsAPI.getProspectsStats(),
          analyticsAPI.getPropertiesStats(),
        ]);
        setKpis(k);
        setTrends(t);
        setProspectsStats(ps);
        setPropertiesStats(props);
      } catch (e: any) {
        setError(e?.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Analytics & Business Intelligence</h1>
          <p style={{ color: '#666', margin: '4px 0 0' }}>KPIs, tendances et performances de votre portefeuille</p>
        </div>
        <Link href="/dashboard" style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, textDecoration: 'none', color: '#374151' }}>
          ← Tableau de bord
        </Link>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['week', 'month', 'year'] as TrendPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: `1px solid ${period === p ? '#2563eb' : '#e5e7eb'}`,
              background: period === p ? '#2563eb' : '#fff',
              color: period === p ? '#fff' : '#374151',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {p === 'week' ? 'Cette semaine' : p === 'month' ? 'Ce mois' : 'Cette année'}
          </button>
        ))}
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: '#b91c1c' }}>Erreur: {error}</p>}

      {!loading && !error && (
        <>
          {/* KPIs */}
          {kpis && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, color: '#374151', marginBottom: 12 }}>KPIs Globaux</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                <KPICard label="Total Prospects" value={kpis.totalProspects} />
                <KPICard label="Taux de conversion" value={`${kpis.conversionRate}%`} />
                <KPICard label="Total Biens" value={kpis.totalProperties} />
                <KPICard label="Biens disponibles" value={kpis.availableProperties} />
                <KPICard label="Prix moyen" value={`${kpis.avgPropertyPrice.toLocaleString('fr-FR')} €`} />
                <KPICard label="Revenu total" value={`${kpis.totalRevenue.toLocaleString('fr-FR')} €`} />
              </div>
            </section>
          )}

          {/* Tendances */}
          {trends && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, color: '#374151', marginBottom: 12 }}>Tendances — {trends.period === 'week' ? 'Semaine' : trends.period === 'month' ? 'Mois' : 'Année'}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <TrendCard label="Nouveaux prospects" value={trends.prospects} color="#2563eb" />
                <TrendCard label="Nouveaux biens" value={trends.properties} color="#16a34a" />
                <TrendCard label="Communications" value={trends.communications} color="#9333ea" />
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
                Du {new Date(trends.startDate).toLocaleDateString('fr-FR')} au {new Date(trends.endDate).toLocaleDateString('fr-FR')}
              </p>
            </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Prospects by status */}
            {prospectsStats && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <h2 style={{ fontSize: 15, color: '#374151', margin: '0 0 12px' }}>Répartition prospects</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <MiniStat label="Total" value={prospectsStats.total} />
                  <MiniStat label="Actifs" value={prospectsStats.active} />
                  <MiniStat label="Convertis" value={prospectsStats.converted} />
                  <MiniStat label="Ce mois" value={prospectsStats.thisMonth} />
                </div>
                <div>
                  {prospectsStats.byStatus.map((s) => (
                    <StatusBar key={s.status} label={s.status} count={s.count} total={prospectsStats.total} />
                  ))}
                </div>
              </div>
            )}

            {/* Properties by type */}
            {propertiesStats && (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                <h2 style={{ fontSize: 15, color: '#374151', margin: '0 0 12px' }}>Répartition biens</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <MiniStat label="Total" value={propertiesStats.total} />
                  <MiniStat label="Disponibles" value={propertiesStats.available} />
                  <MiniStat label="Vendus" value={propertiesStats.sold} />
                  <MiniStat label="Loués" value={propertiesStats.rented} />
                </div>
                <div>
                  {propertiesStats.byType.map((t) => (
                    <StatusBar key={t.type} label={t.type} count={t.count} total={propertiesStats.total} />
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

function KPICard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 14, background: '#fff' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>{value}</p>
    </div>
  );
}

function TrendCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ border: `2px solid ${color}20`, borderRadius: 8, padding: 14, background: `${color}08` }}>
      <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#f9fafb', borderRadius: 6, padding: '8px 12px' }}>
      <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#111827' }}>{value}</p>
    </div>
  );
}

function StatusBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
        <span style={{ color: '#374151' }}>{label}</span>
        <span style={{ color: '#6b7280' }}>{count} ({pct}%)</span>
      </div>
      <div style={{ background: '#f1f5f9', borderRadius: 4, height: 6 }}>
        <div style={{ background: '#2563eb', borderRadius: 4, height: 6, width: `${pct}%` }} />
      </div>
    </div>
  );
}
