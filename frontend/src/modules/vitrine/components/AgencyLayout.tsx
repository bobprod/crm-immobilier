import React from 'react';
import Head from 'next/head';
import { TrackingPixelsLoader } from '@/shared/components/vitrine/TrackingPixelsLoader';
import { AgencyHeader } from './AgencyHeader';
import { AgencyFooter } from './AgencyFooter';
import type { VitrineConfig } from '@/shared/utils/public-vitrine-api';

interface AgencyLayoutProps {
  config: VitrineConfig;
  /** ID utilisateur (pour tracking pixels via API legacy) */
  userId?: string;
  children: React.ReactNode;
  /** SEO – titre de la page courante */
  pageTitle?: string;
  /** SEO – description de la page courante */
  pageDescription?: string;
  /** URL canonique absolue */
  canonical?: string;
  /** URL og:image */
  ogImage?: string;
}

export const AgencyLayout: React.FC<AgencyLayoutProps> = ({
  config,
  userId,
  children,
  pageTitle,
  pageDescription,
  canonical,
  ogImage,
}) => {
  const titleFull = pageTitle
    ? `${pageTitle} | ${config.agencyName}`
    : config.seoTitle || config.agencyName;
  const description = pageDescription || config.seoDescription || '';
  const primaryColor = config.primaryColor || '#1e40af';
  const accentColor = config.accentColor || '#F59E0B';

  return (
    <>
      <Head>
        <title>{titleFull}</title>
        {description && <meta name="description" content={description} />}
        {config.seoKeywords && <meta name="keywords" content={config.seoKeywords} />}

        {/* Open Graph */}
        <meta property="og:title" content={titleFull} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:type" content="website" />
        {canonical && <meta property="og:url" content={canonical} />}
        {(ogImage || config.heroImage) && (
          <meta property="og:image" content={ogImage || config.heroImage!} />
        )}
        {config.agencyName && <meta property="og:site_name" content={config.agencyName} />}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={titleFull} />
        {description && <meta name="twitter:description" content={description} />}

        {canonical && <link rel="canonical" href={canonical} />}

        {/* CSS variables dynamiques pour le thème agence */}
        <style>{`
          :root {
            --agency-primary: ${primaryColor};
            --agency-accent: ${accentColor};
            --agency-secondary: ${config.secondaryColor || '#64748b'};
          }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: 'Inter', system-ui, sans-serif; }
          a { color: inherit; text-decoration: none; }
        `}</style>
      </Head>

      {/* Tracking pixels */}
      {userId && <TrackingPixelsLoader agencyId={userId} />}

      <div className="min-h-screen flex flex-col bg-white text-gray-900">
        <AgencyHeader config={config} />
        <main className="flex-1">{children}</main>
        <AgencyFooter config={config} />
      </div>
    </>
  );
};

export default AgencyLayout;
