import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { builderApi, VitrineTemplate } from '@/modules/vitrine/builder/api';

const categoryLabels: Record<string, string> = {
  all: 'Tous',
  premium: 'Premium',
  general: 'Général',
};

export default function VitrineTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<VitrineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    builderApi.getTemplates()
      .then(setTemplates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleApply = async (slug: string) => {
    if (!confirm('Appliquer ce template ? Cela remplacera vos pages existantes.')) return;
    setApplying(slug);
    setError('');
    try {
      await builderApi.applyTemplate(slug);
      router.push('/vitrine/editeur');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'application');
    } finally {
      setApplying('');
    }
  };

  const filtered = filter === 'all' ? templates : templates.filter((t) => t.category === filter);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>Chargement des templates...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ background: '#1a1a2e', color: '#fff', padding: '40px 20px', textAlign: 'center' }}>
        <button onClick={() => router.push('/vitrine')} style={{ position: 'absolute', left: 24, top: 24, background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 8 }}>🎨 Choisissez votre template</h1>
        <p style={{ color: '#aaa', maxWidth: 500, margin: '0 auto' }}>
          Sélectionnez un design pour votre vitrine. Vous pourrez personnaliser chaque section avec l'éditeur drag & drop.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '24px 20px' }}>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{
              padding: '8px 24px', borderRadius: 20, border: 'none', fontSize: 14, cursor: 'pointer',
              background: filter === key ? '#1E40AF' : '#fff',
              color: filter === key ? '#fff' : '#555',
              fontWeight: filter === key ? 600 : 400,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ maxWidth: 600, margin: '0 auto 16px', padding: '12px 16px', background: '#FEE2E2', color: '#991B1B', borderRadius: 8, textAlign: 'center', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
        {filtered.map((t) => (
          <div key={t.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}>
            {/* Preview */}
            <div style={{ height: 200, background: `linear-gradient(135deg, ${t.colors?.primary || '#1E40AF'}, ${t.colors?.secondary || '#f5f5f5'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ textAlign: 'center', color: '#fff' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>
                  {t.slug === 'tpl_elegance' ? '✨' : t.slug === 'tpl_moderne' ? '🔷' : t.slug === 'tpl_prestige' ? '👑' : t.slug === 'tpl_nature' ? '🌿' : '🏙️'}
                </div>
                <p style={{ fontFamily: t.fonts?.heading, fontSize: '1.3rem', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{t.name}</p>
              </div>
              {t.category === 'premium' && (
                <span style={{ position: 'absolute', top: 12, right: 12, background: '#F59E0B', color: '#fff', padding: '3px 12px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>PREMIUM</span>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{t.name}</h3>
              <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{t.description}</p>

              {/* Colors preview */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {t.colors && Object.entries(t.colors).slice(0, 5).map(([name, color]) => (
                  <div key={name} title={name} style={{ width: 28, height: 28, borderRadius: '50%', background: color as string, border: '2px solid #eee' }} />
                ))}
              </div>

              {/* Fonts */}
              <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
                📝 {t.fonts?.heading} / {t.fonts?.body}
              </div>

              {/* Pages count */}
              <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
                📄 {t.defaultPages?.length || 0} pages pré-configurées
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleApply(t.slug)} disabled={applying === t.slug}
                  style={{
                    flex: 1, padding: '10px 20px', background: applying === t.slug ? '#93C5FD' : '#1E40AF',
                    color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: applying === t.slug ? 'wait' : 'pointer',
                  }}>
                  {applying === t.slug ? '⏳ Application...' : '✨ Appliquer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
