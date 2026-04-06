import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { usePersonnel } from '@/shared/hooks/usePersonnel';

export default function PersonnelDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { agents, loading, error } = usePersonnel();

  const agent = useMemo(() => agents.find((a) => a.id === id), [agents, id]);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Détail agent</h1>
      <p style={{ marginBottom: 16 }}>
        <Link href="/personnel">Retour à la liste</Link>
      </p>

      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: '#b91c1c' }}>Erreur: {error}</p>}

      {!loading && !error && !agent && <p>Agent introuvable.</p>}

      {!loading && !error && agent && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
          <p>
            <strong>Nom:</strong> {(agent.user?.firstName || '') + ' ' + (agent.user?.lastName || '')}
          </p>
          <p>
            <strong>Email:</strong> {agent.user?.email || '-'}
          </p>
          <p>
            <strong>Poste:</strong> {agent.jobTitle || '-'}
          </p>
          <p>
            <strong>Téléphone:</strong> {agent.phone || '-'}
          </p>
          <p>
            <strong>Statut:</strong> {agent.isActive ? 'Actif' : 'Inactif'}
          </p>
        </div>
      )}
    </main>
  );
}

