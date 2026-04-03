import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { builderApi, VitrinePage } from '@/modules/vitrine/builder/api';
import { puckConfig } from '@/modules/vitrine/builder/puck-config';

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

  const handlePublish = useCallback(async (data: any) => {
    if (!page) return;
    setSaving(true);
    try {
      await builderApi.savePuckData(page.id, data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }, [page]);

  const handlePageSwitch = useCallback(async (p: VitrinePage) => {
    setPage(p);
    setShowPageMenu(null);
    router.replace({ query: { pageId: p.id } }, undefined, { shallow: true });
  }, [router]);

  const handleCreatePage = useCallback(async () => {
    if (!newPageTitle.trim()) return;
    try {
      const slug = newPageTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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

  const handleDeletePage = useCallback(async (pageToDelete: VitrinePage) => {
    if (pageToDelete.isDefault) { setError('Impossible de supprimer la page par défaut'); return; }
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
  }, [pages, page]);

  const handleRenamePage = useCallback(async (pageToRename: VitrinePage) => {
    if (!renameValue.trim()) return;
    try {
      await builderApi.updatePage(pageToRename.id, { title: renameValue.trim() });
      setPages((prev) => prev.map((p) => p.id === pageToRename.id ? { ...p, title: renameValue.trim() } : p));
      if (page?.id === pageToRename.id) setPage({ ...pageToRename, title: renameValue.trim() });
      setRenamingPage(null);
    } catch (err: any) {
      setError(err.message || 'Erreur renommage');
    }
  }, [renameValue, page]);

  const handlePreview = useCallback(() => {
    if (!siteSlug || !page) return;
    window.open(`/sites/${siteSlug}/p/${page.slug}`, '_blank');
  }, [siteSlug, page]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🏗️</div>
          <p style={{ color: '#666' }}>Chargement de l'éditeur...</p>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f5f5' }}>
        <div style={{ textAlign: 'center', maxWidth: 500, padding: 40, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Aucune page créée</h2>
          <p style={{ color: '#666', marginBottom: 24 }}>Commencez par choisir un template pour créer vos pages automatiquement.</p>
          <button onClick={() => router.push('/vitrine/templates')}
            style={{ padding: '12px 32px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
            Choisir un template
          </button>
        </div>
      </div>
    );
  }

  if (!page) return null;

  const initialData = page.puckData && typeof page.puckData === 'object' && page.puckData.content
    ? page.puckData
    : { content: [], root: {} };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', background: '#1a1a2e', color: '#fff', fontSize: 14, zIndex: 200 }}>
        <button onClick={() => router.push('/vitrine')} style={{ background: 'none', border: 'none', color: '#93C5FD', cursor: 'pointer', fontSize: 14 }}>
          ← Retour
        </button>
        <span style={{ color: '#555' }}>|</span>
        <span style={{ fontWeight: 600 }}>🏗️ Éditeur</span>

        {/* Page tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 16, position: 'relative' }}>
          {pages.map((p) => (
            <div key={p.id} style={{ position: 'relative' }}>
              {renamingPage === p.id ? (
                <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenamePage(p); if (e.key === 'Escape') setRenamingPage(null); }}
                  onBlur={() => handleRenamePage(p)} autoFocus
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #1E40AF', fontSize: 13, background: '#fff', color: '#333', width: 100 }} />
              ) : (
                <button onClick={() => handlePageSwitch(p)}
                  onContextMenu={(e) => { e.preventDefault(); setShowPageMenu(showPageMenu === p.id ? null : p.id); }}
                  style={{
                    padding: '4px 14px', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer',
                    background: p.id === page.id ? '#1E40AF' : 'rgba(255,255,255,0.1)',
                    color: p.id === page.id ? '#fff' : '#aaa',
                    fontWeight: p.id === page.id ? 600 : 400,
                  }}>
                  {p.title}
                </button>
              )}
              {showPageMenu === p.id && (
                <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300, minWidth: 140, padding: 4, marginTop: 4 }}>
                  <button onClick={() => { setRenamingPage(p.id); setRenameValue(p.title); setShowPageMenu(null); }}
                    style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 4, color: '#333' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                    ✏️ Renommer
                  </button>
                  {!p.isDefault && (
                    <button onClick={() => handleDeletePage(p)}
                      style={{ display: 'block', width: '100%', padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderRadius: 4, color: '#DC2626' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#FEE2E2')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                      🗑️ Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {/* Add page button */}
          {showNewPage ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <input value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePage(); if (e.key === 'Escape') setShowNewPage(false); }}
                placeholder="Nom de la page" autoFocus
                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #1E40AF', fontSize: 13, background: '#fff', color: '#333', width: 130 }} />
              <button onClick={handleCreatePage} style={{ padding: '4px 10px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>✓</button>
              <button onClick={() => setShowNewPage(false)} style={{ padding: '4px 10px', background: '#666', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setShowNewPage(true)}
              style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', color: '#93C5FD', border: '1px dashed rgba(147,197,253,0.4)', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
              + Page
            </button>
          )}
        </div>

        {/* Right side actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {saving && <span style={{ color: '#93C5FD', fontSize: 12 }}>Sauvegarde...</span>}
          {error && <span style={{ color: '#F87171', fontSize: 12 }}>{error}</span>}
          {siteSlug && (
            <button onClick={handlePreview}
              style={{ padding: '4px 14px', background: '#22C55E', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              👁️ Aperçu
            </button>
          )}
          <button onClick={() => router.push('/vitrine/templates')} style={{ padding: '4px 14px', background: 'rgba(255,255,255,0.1)', color: '#ccc', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer' }}>
            🎨 Templates
          </button>
        </div>
      </div>

      {/* Click overlay to close menus */}
      {showPageMenu && <div onClick={() => setShowPageMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />}

      {/* Puck Editor */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Puck
          config={puckConfig as any}
          data={initialData}
          onPublish={handlePublish}
        />
      </div>

      {/* Puck CSS imports */}
      <style jsx global>{`
        @import url('https://unpkg.com/@measured/puck@0.20.2/puck.css');
      `}</style>
    </div>
  );
}
