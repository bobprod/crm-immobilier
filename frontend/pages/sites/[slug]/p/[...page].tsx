import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { puckConfig } from '@/modules/vitrine/builder/puck-config';

const Render = dynamic(() => import('@measured/puck').then((mod) => mod.Render), { ssr: true });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PageData {
  page: {
    id: string;
    slug: string;
    title: string;
    puckData: any;
    seoTitle: string | null;
    seoDescription: string | null;
  };
  config: {
    agencyName: string;
    slug: string;
    templateId: string | null;
    customCss: string | null;
  };
  template: {
    name: string;
    fonts: { heading: string; body: string };
    colors: Record<string, string>;
  } | null;
  allPages: { slug: string; title: string; order: number }[];
}

interface Props {
  data: PageData | null;
  slug: string;
  pageSlug: string;
  error: string | null;
}

const PuckPublicPage: NextPage<Props> = ({ data, slug, pageSlug, error }) => {
  if (error || !data || !data.page) {
    return null; // Let Next.js 404 handle it
  }

  const { page, config, template, allPages } = data;
  const puckData = page.puckData && page.puckData.content ? page.puckData : { content: [], root: {} };
  const fonts = template?.fonts;
  const colors = template?.colors;
  const seoTitle = page.seoTitle || `${page.title} - ${config.agencyName}`;
  const seoDescription = page.seoDescription || `${config.agencyName} — ${page.title}`;

  return (
    <>
      <Head>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        {fonts && (
          <link href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.heading)}:wght@400;600;700&family=${encodeURIComponent(fonts.body)}:wght@300;400;500;600&display=swap`} rel="stylesheet" />
        )}
        <link href="https://unpkg.com/@measured/puck@0.20.2/puck.css" rel="stylesheet" />
      </Head>

      <div style={{
        fontFamily: fonts ? `'${fonts.body}', sans-serif` : 'system-ui, sans-serif',
        minHeight: '100vh',
      }}>
        {puckData.content.length > 0 ? (
          <Render config={puckConfig as any} data={puckData} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🚧</p>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Page en construction</h1>
              <p style={{ color: '#666' }}>Cette page sera bientôt disponible.</p>
            </div>
          </div>
        )}
      </div>

      {config.customCss && <style dangerouslySetInnerHTML={{ __html: config.customCss }} />}
      {colors && (
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --color-primary: ${colors.primary || '#1E40AF'};
            --color-secondary: ${colors.secondary || '#7C3AED'};
            --color-accent: ${colors.accent || '#F59E0B'};
            --color-background: ${colors.background || '#FFFFFF'};
            --color-surface: ${colors.surface || '#F8FAFC'};
            --color-text: ${colors.text || '#1E293B'};
            --color-text-light: ${colors.textLight || '#64748B'};
            --font-heading: '${fonts?.heading || 'system-ui'}', sans-serif;
            --font-body: '${fonts?.body || 'system-ui'}', sans-serif;
          }
          h1, h2, h3, h4 { font-family: var(--font-heading); }
          a { color: var(--color-primary); }
          button { font-family: var(--font-body); }
        ` }} />
      )}
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = ctx.params?.slug as string;
  const pageArr = ctx.params?.page as string[] | undefined;
  const pageSlug = pageArr?.[0] || 'accueil';

  try {
    const res = await fetch(`${API_BASE}/vitrine/builder/public/${slug}/pages/${pageSlug}`);
    if (!res.ok) {
      // Fallback : pas de données Puck, on ne bloque pas les pages statiques existantes
      return { notFound: true };
    }
    const data = await res.json();
    return {
      props: {
        data: data || null,
        slug,
        pageSlug,
        error: null,
      },
    };
  } catch (err: any) {
    return { notFound: true };
  }
};

export default PuckPublicPage;
