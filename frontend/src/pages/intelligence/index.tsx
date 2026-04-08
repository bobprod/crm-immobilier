import { useState } from 'react';
import Link from 'next/link';
import { aiOrchestratorAPI, OrchestrationResponse } from '@/shared/utils/ai-orchestrator-api';

const OBJECTIVES = [
  { value: 'prospection', label: 'Prospection de leads', description: 'Identifier et qualifier de nouveaux prospects' },
  { value: 'investment_benchmark', label: 'Benchmark investissement', description: 'Analyser et comparer les opportunités d\'investissement' },
  { value: 'property_analysis', label: 'Analyse de bien', description: 'Évaluation détaillée d\'un bien immobilier' },
  { value: 'lead_enrichment', label: 'Enrichissement de lead', description: 'Compléter et enrichir les données d\'un prospect' },
];

export default function IntelligencePage() {
  const [objective, setObjective] = useState('prospection');
  const [contextText, setContextText] = useState('');
  const [maxCost, setMaxCost] = useState('0.5');
  const [result, setResult] = useState<OrchestrationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrchestrate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let context: Record<string, any> = {};
      if (contextText.trim()) {
        try {
          context = JSON.parse(contextText);
        } catch {
          context = { description: contextText };
        }
      }
      const res = await aiOrchestratorAPI.orchestrate({
        objective,
        context,
        options: { maxCost: parseFloat(maxCost) || 0.5 },
      });
      setResult(res);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Erreur d\'orchestration');
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'completed') return '#16a34a';
    if (status === 'partial') return '#ea580c';
    if (status === 'failed') return '#dc2626';
    return '#6b7280';
  };

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Intelligence IA</h1>
          <p style={{ color: '#666', margin: '4px 0 0' }}>Orchestrateur IA multi-objectifs pour votre CRM immobilier</p>
        </div>
        <Link href="/dashboard" style={{ padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 6, textDecoration: 'none', color: '#374151' }}>
          ← Tableau de bord
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20 }}>
        {/* Panneau de configuration */}
        <div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, background: '#fff' }}>
            <h2 style={{ fontSize: 15, margin: '0 0 16px' }}>Nouvelle orchestration</h2>

            {/* Objectif */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Objectif
              </label>
              {OBJECTIVES.map((obj) => (
                <div
                  key={obj.value}
                  onClick={() => setObjective(obj.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: `2px solid ${objective === obj.value ? '#2563eb' : '#e5e7eb'}`,
                    background: objective === obj.value ? '#eff6ff' : '#fff',
                    marginBottom: 6,
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: objective === obj.value ? '#1d4ed8' : '#111827' }}>{obj.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>{obj.description}</p>
                </div>
              ))}
            </div>

            {/* Contexte */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Contexte (optionnel)
              </label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder='Description libre ou JSON {"city": "Paris", "budget": 300000}'
                rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Budget max */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, color: '#374151', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Coût max (USD)
              </label>
              <input
                type="number"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
                min="0.1"
                max="5"
                step="0.1"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13, boxSizing: 'border-box' }}
              />
            </div>

            <button
              onClick={handleOrchestrate}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px 0',
                background: loading ? '#93c5fd' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Orchestration en cours...' : 'Lancer l\'orchestration'}
            </button>
          </div>

          {/* Modules synchronisés */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginTop: 16, background: '#f9fafb' }}>
            <h3 style={{ fontSize: 13, margin: '0 0 10px', color: '#374151' }}>Modules synchronisés</h3>
            {[
              { label: 'Prospects', href: '/prospects', color: '#2563eb' },
              { label: 'Propriétés', href: '/properties', color: '#16a34a' },
              { label: 'Matching IA', href: '/matching', color: '#9333ea' },
              { label: 'Analytics', href: '/analytics', color: '#ea580c' },
              { label: 'Prospecting AI', href: '/prospecting', color: '#0891b2' },
              { label: 'Auto-reports', href: '/reports', color: '#b45309' },
            ].map((m) => (
              <Link key={m.label} href={m.href} style={{ display: 'inline-block', margin: '0 6px 6px 0', padding: '4px 10px', borderRadius: 12, background: `${m.color}15`, color: m.color, fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Résultats */}
        <div>
          {error && (
            <div style={{ padding: 16, background: '#fee2e2', borderRadius: 8, color: '#991b1b', border: '1px solid #fca5a5', marginBottom: 16 }}>
              <strong>Erreur:</strong> {error}
            </div>
          )}

          {loading && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 32, textAlign: 'center', color: '#6b7280' }}>
              <p style={{ margin: 0, fontSize: 16 }}>⚙️ Orchestration en cours...</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Analyse des intentions · Planification · Exécution des outils</p>
            </div>
          )}

          {result && !loading && (
            <div>
              {/* Status header */}
              <div style={{ border: `2px solid ${statusColor(result.status)}`, borderRadius: 8, padding: 16, marginBottom: 16, background: `${statusColor(result.status)}08` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: statusColor(result.status) }}>
                      Statut: {result.status}
                    </span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151' }}>
                      Objectif: <strong>{OBJECTIVES.find((o) => o.value === objective)?.label}</strong>
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#6b7280' }}>
                    <p style={{ margin: 0 }}>{result.metrics.totalDurationMs}ms</p>
                    {result.metrics.totalTokensUsed && <p style={{ margin: '2px 0 0' }}>{result.metrics.totalTokensUsed} tokens</p>}
                    {result.metrics.totalCost && <p style={{ margin: '2px 0 0' }}>${result.metrics.totalCost.toFixed(4)}</p>}
                    <p style={{ margin: '2px 0 0' }}>✅ {result.metrics.successfulCalls} · ❌ {result.metrics.failedCalls}</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div style={{ border: '1px solid #fca5a5', borderRadius: 8, padding: 12, background: '#fff7f7', marginBottom: 16 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 600, color: '#991b1b' }}>Erreurs</p>
                  {result.errors.map((e, i) => <p key={i} style={{ margin: '2px 0', fontSize: 12, color: '#dc2626' }}>{e}</p>)}
                </div>
              )}

              {/* Final result */}
              {result.finalResult && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>Résultat final</p>
                  <pre style={{ margin: 0, fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f9fafb', padding: 12, borderRadius: 6 }}>
                    {JSON.stringify(result.finalResult, null, 2)}
                  </pre>
                </div>
              )}

              {/* Plan */}
              {result.plan && (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}>
                  <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    Plan d&apos;exécution ({result.plan.toolCalls?.length || 0} étapes)
                  </p>
                  {result.plan.toolCalls?.map((call: any, i: number) => (
                    <div key={i} style={{ padding: '8px 12px', marginBottom: 6, background: '#f9fafb', borderRadius: 6, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: '#1d4ed8' }}>{call.tool}</span>
                      {call.description && <span style={{ color: '#6b7280', marginLeft: 8 }}>{call.description}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!result && !loading && !error && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 48, textAlign: 'center', color: '#9ca3af', background: '#fafafa' }}>
              <p style={{ fontSize: 32, margin: '0 0 12px' }}>🤖</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Prêt à orchestrer</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Sélectionnez un objectif et lancez l&apos;orchestration pour voir les résultats.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
