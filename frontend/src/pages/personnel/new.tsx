import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { usePersonnel } from '@/shared/hooks/usePersonnel';

export default function PersonnelNewPage() {
  const router = useRouter();
  const { createAgent } = usePersonnel();

  const [userId, setUserId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAgent({ userId, jobTitle, phone, isActive: true });
      router.push('/personnel');
    } catch (err: any) {
      setError(err?.message || 'Impossible de créer l’agent');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Nouvel agent</h1>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Saisis l&apos;ID utilisateur existant pour créer le profil personnel.
      </p>
      <p style={{ marginBottom: 16 }}>
        <Link href="/personnel">Retour à la liste</Link>
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          User ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} required />
        </label>
        <label>
          Poste
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </label>
        <label>
          Téléphone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>

        {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Création...' : 'Créer'}
        </button>
      </form>
    </main>
  );
}

