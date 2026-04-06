import Link from 'next/link';
import { usePersonnel } from '@/shared/hooks/usePersonnel';

export default function PersonnelIndexPage() {
  const { agents, loading, error } = usePersonnel();

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Personnel</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Gestion des profils agents et du suivi commercial.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <Link href="/personnel/new">Ajouter un agent</Link>
        <Link href="/personnel/commissions">Commissions</Link>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: '#b91c1c' }}>Erreur: {error}</p>}

      {!loading && !error && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={{ padding: 10 }}>Nom</th>
                <th style={{ padding: 10 }}>Email</th>
                <th style={{ padding: 10 }}>Poste</th>
                <th style={{ padding: 10 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 10 }}>
                    <Link href={`/personnel/${agent.id}`}>
                      {(agent.user?.firstName || '') + ' ' + (agent.user?.lastName || '')}
                    </Link>
                  </td>
                  <td style={{ padding: 10 }}>{agent.user?.email || '-'}</td>
                  <td style={{ padding: 10 }}>{agent.jobTitle || '-'}</td>
                  <td style={{ padding: 10 }}>{agent.isActive ? 'Actif' : 'Inactif'}</td>
                </tr>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 12, color: '#666' }}>
                    Aucun agent trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

