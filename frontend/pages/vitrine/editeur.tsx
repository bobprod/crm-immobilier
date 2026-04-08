import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { builderApi, VitrinePage } from '@/modules/vitrine/builder/api';
import { puckConfig } from '@/modules/vitrine/builder/puck-config';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import {
  Eye,
  ExternalLink,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight,
  Globe,
  Loader2,
  LayoutTemplate,
  ArrowLeft,
} from 'lucide-react';

const Puck = dynamic(() => import('@measured/puck').then((mod) => mod.Puck), { ssr: false });

export default function VitrineEditeur() {
  const router = useRouter();
  const { pageId } = router.query;
  const [page, setPage] = useState<VitrinePage | null>(null);
  const [pages, setPages] = useState<VitrinePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [siteSlug, setSiteSlug] = useState('');
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showPageMenu, setShowPageMenu] = useState<string | null>(null);
  const [renamingPage, setRenamingPage] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const loadPages = useCallback(async () => {
    try {
      const [data, config] = await Promise.all([
        builderApi.getPages(),
        builderApi.getConfig().catch(() => null),
      ]);
      setPages(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
      if (config?.slug) setSiteSlug(config.slug);
      if (data.length > 0) {
        const target = pageId ? data.find((p) => p.id === pageId) : data[0];
        if (target) setPage(target);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const handlePublish = useCallback(
    async (data: any) => {
      if (!page) return;
      setSaving(true);
      try {
        const updated = await builderApi.savePuckData(page.id, data);
        setPage(updated);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Erreur de sauvegarde');
      } finally {
        setSaving(false);
      }
    },
    [page]
  );

  const handlePageSwitch = useCallback(
    async (p: VitrinePage) => {
      setPage(p);
      setShowPageMenu(null);
      router.replace({ query: { pageId: p.id } }, undefined, { shallow: true });
    },
    [router]
  );

  const handleCreatePage = useCallback(async () => {
    if (!newPageTitle.trim()) return;
    try {
      const slug = newPageTitle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const created = await builderApi.createPage({ slug, title: newPageTitle.trim() });
      setPages((prev) => [...prev, created]);
      setPage(created);
      setShowNewPage(false);
      setNewPageTitle('');
      router.replace({ query: { pageId: created.id } }, undefined, { shallow: true });
    } catch (err: any) {
      setError(err.message || 'Erreur création page');
    }
  }, [newPageTitle, router]);

  const handleDeletePage = useCallback(
    async (pageToDelete: VitrinePage) => {
      if (pageToDelete.isDefault) {
        setError('Impossible de supprimer la page par défaut');
        return;
      }
      if (!confirm(`Supprimer la page "${pageToDelete.title}" ?`)) return;
      try {
        await builderApi.deletePage(pageToDelete.id);
        const remaining = pages.filter((p) => p.id !== pageToDelete.id);
        setPages(remaining);
        if (page?.id === pageToDelete.id && remaining.length > 0) {
          setPage(remaining[0]);
        }
        setShowPageMenu(null);
      } catch (err: any) {
        setError(err.message || 'Erreur suppression');
      }
    },
    [pages, page]
  );

  const handleRenamePage = useCallback(
    async (pageToRename: VitrinePage) => {
      if (!renameValue.trim()) return;
      try {
        await builderApi.updatePage(pageToRename.id, { title: renameValue.trim() });
        setPages((prev) =>
          prev.map((p) => (p.id === pageToRename.id ? { ...p, title: renameValue.trim() } : p))
        );
        if (page?.id === pageToRename.id) setPage({ ...pageToRename, title: renameValue.trim() });
        setRenamingPage(null);
      } catch (err: any) {
        setError(err.message || 'Erreur renommage');
      }
    },
    [renameValue, page]
  );

  const handlePreview = useCallback(() => {
    if (!siteSlug || !page) return;
    window.open(`/sites/${siteSlug}/p/${page.slug}`, '_blank');
  }, [siteSlug, page]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Sidebar collapsed={true} onToggleCollapse={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 opacity-60" />
            <p className="text-gray-400 text-sm">Chargement de l'éditeur...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar collapsed={true} onToggleCollapse={() => {}} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-8 py-12 bg-white rounded-2xl shadow-lg">
            <LayoutTemplate className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune page créée</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Commencez par choisir un template pour créer vos pages automatiquement.
            </p>
            <button
              onClick={() => router.push('/vitrine/templates')}
              className="px-6 py-3 bg-[#1E3A5F] text-white rounded-xl font-semibold text-sm hover:bg-[#162d4a] transition-colors"
            >
              Choisir un template
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!page) return null;

  const initialData =
    page.puckData && typeof page.puckData === 'object' && page.puckData.content
      ? page.puckData
      : { content: [], root: {} };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar navigation — toujours visible, collapsée */}
      <Sidebar collapsed={true} onToggleCollapse={() => {}} />

      {/* Panneau éditeur — contient topbar + Puck */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar de l'éditeur */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#0F1729] text-white text-sm z-50 border-b border-white/10 flex-shrink-0">
          {/* Retour */}
          <button
            onClick={() => router.push('/vitrine')}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white transition-colors text-xs px-2 py-1 rounded hover:bg-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Vitrine
          </button>
          <span className="text-white/20">|</span>

          {/* Onglets pages */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {pages.map((p) => (
              <div key={p.id} className="relative flex-shrink-0 group">
                {renamingPage === p.id ? (
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenamePage(p);
                      if (e.key === 'Escape') setRenamingPage(null);
                    }}
                    onBlur={() => handleRenamePage(p)}
                    autoFocus
                    className="px-2 py-1 rounded border border-blue-400 bg-white text-gray-900 text-xs w-24"
                  />
                ) : (
                  <button
                    onClick={() => handlePageSwitch(p)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      p.id === page.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p.title}
                  </button>
                )}
                {/* Context menu button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPageMenu(showPageMenu === p.id ? null : p.id);
                  }}
                  className="ml-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/20 text-gray-400 hover:text-white transition-all"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
                {showPageMenu === p.id && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-50 min-w-36 py-1">
                    <button
                      onClick={() => {
                        setRenamingPage(p.id);
                        setRenameValue(p.title);
                        setShowPageMenu(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Renommer
                    </button>
                    {!p.isDefault && (
                      <button
                        onClick={() => handleDeletePage(p)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Ajouter une page */}
            {showNewPage ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreatePage();
                    if (e.key === 'Escape') setShowNewPage(false);
                  }}
                  placeholder="Nom de la page"
                  autoFocus
                  className="px-2 py-1 rounded border border-blue-400 bg-white text-gray-900 text-xs w-32"
                />
                <button
                  onClick={handleCreatePage}
                  className="px-2 py-1 bg-emerald-500 text-white rounded text-xs font-bold"
                >
                  ✓
                </button>
                <button
                  onClick={() => setShowNewPage(false)}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPage(true)}
                className="flex items-center gap-1 px-2 py-1.5 text-blue-300 hover:text-white border border-dashed border-white/20 hover:border-blue-400 rounded text-xs transition-colors flex-shrink-0"
              >
                <Plus className="w-3 h-3" /> Page
              </button>
            )}
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {saving && (
              <span className="flex items-center gap-1 text-blue-300 text-xs">
                <Loader2 className="w-3 h-3 animate-spin" /> Sauvegarde...
              </span>
            )}
            {error && <span className="text-red-400 text-xs max-w-48 truncate">{error}</span>}

            <button
              onClick={() => router.push('/vitrine/templates')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded text-xs transition-colors"
            >
              <LayoutTemplate className="w-3.5 h-3.5" /> Templates
            </button>

            {siteSlug && (
              <>
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Aperçu
                </button>
                <button
                  onClick={() => window.open(`/sites/${siteSlug}`, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Voir le site
                </button>
              </>
            )}
          </div>
        </div>

        {/* Overlay fermeture menu contextuel */}
        {showPageMenu && (
          <div onClick={() => setShowPageMenu(null)} className="fixed inset-0 z-40" />
        )}

        {/* Puck Editor — prend tout l'espace restant */}
        <div className="flex-1 overflow-hidden">
          <Puck
            key={page.id}
            config={puckConfig as any}
            data={initialData}
            onPublish={handlePublish}
          />
        </div>
      </div>

      {/* Puck CSS */}
      <Head>
        <link rel="stylesheet" href="https://unpkg.com/@measured/puck@0.20.2/puck.css" />
      </Head>
      <style jsx global>{`
        /* Forcer Puck à remplir son conteneur */
        .Puck {
          height: 100% !important;
        }
        .Puck-root {
          height: 100% !important;
          display: flex;
          flex-direction: column;
        }
        .Puck-root > div:last-child {
          flex: 1;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
