import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { builderApi, VitrineTemplate } from '@/modules/vitrine/builder/api';
import { Palette, Layers, ArrowLeft, Star, ExternalLink } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  all: 'Tous',
  premium: 'Premium',
  general: 'Général',
};

const templateEmoji: Record<string, string> = {
  tpl_elegance: '✨',
  tpl_moderne: '🔷',
  tpl_prestige: '👑',
  tpl_nature: '🌿',
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

  return (
    <MainLayout title="Templates Vitrine" breadcrumbs={[{ label: 'Site Vitrine', href: '/vitrine' }, { label: 'Templates' }]}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates Vitrine</h1>
          <p className="text-gray-500 text-sm mt-1">Choisissez un design et personnalisez-le avec l'éditeur</p>
        </div>
        <button
          onClick={() => router.push('/vitrine')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors border ${
              filter === key
                ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="h-52 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded animate-pulse w-2/3" />
                <div className="h-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Palette className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Aucun template disponible</p>
          <p className="text-gray-400 text-sm mt-1">Les templates seront disponibles prochainement</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-200 group"
            >
              {/* Preview visuelle colorée */}
              <div
                className="h-52 relative flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${t.colors?.primary || '#1E3A5F'} 0%, ${t.colors?.accent || '#D97706'} 100%)` }}
              >
                {/* Simulation de layout */}
                <div className="absolute inset-0 opacity-20">
                  <div className="h-8 bg-white/30 mx-4 mt-3 rounded" />
                  <div className="h-16 bg-white/20 mx-4 mt-2 rounded" />
                  <div className="grid grid-cols-3 gap-2 mx-4 mt-2">
                    <div className="h-12 bg-white/20 rounded" />
                    <div className="h-12 bg-white/20 rounded" />
                    <div className="h-12 bg-white/20 rounded" />
                  </div>
                </div>
                <div className="relative text-center text-white">
                  <div className="text-4xl mb-2">{templateEmoji[t.slug] || '🏠'}</div>
                  <p className="font-bold text-lg" style={{ fontFamily: t.fonts?.heading || 'Inter, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                    {t.name}
                  </p>
                </div>
                {t.category === 'premium' && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                    <Star className="w-3 h-3" /> PREMIUM
                  </span>
                )}
              </div>

              {/* Infos */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <div className="flex gap-1.5 ml-3 shrink-0">
                    {t.colors && Object.values(t.colors).slice(0, 4).map((color, i) => (
                      <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: color as string }} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{t.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {t.defaultPages?.length || 0} pages</span>
                  <span>Police : {t.fonts?.heading || 'Inter'}</span>
                </div>

                <button
                  onClick={() => handleApply(t.slug)}
                  disabled={applying === t.slug}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    applying === t.slug
                      ? 'bg-gray-100 text-gray-400 cursor-wait'
                      : 'bg-[#1E3A5F] text-white hover:bg-[#162d4a]'
                  }`}
                >
                  {applying === t.slug ? 'Application en cours...' : 'Appliquer ce template'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

