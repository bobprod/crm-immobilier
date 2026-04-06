import Link from 'next/link';
import { usePersonnel } from '@/shared/hooks/usePersonnel';

export default function PersonnelCommissionsPage() {
  const { commissionConfig, annualBonusConfig, loading, error } = usePersonnel();

  return (
    <main style={{ maxWidth: 840, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Commissions</h1>
      <p style={{ marginBottom: 16 }}>
        <Link href="/personnel">Retour à la liste</Link>
      </p>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: '#b91c1c' }}>Erreur: {error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12 }}>
          <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h2>Configuration commission</h2>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {JSON.stringify(commissionConfig, null, 2)}
            </pre>
          </section>

          <section style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h2>Prime annuelle</h2>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
              {JSON.stringify(annualBonusConfig, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </main>
  );
}

