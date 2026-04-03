import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowRight, Home, Star, Phone } from 'lucide-react';
import {
  AgencyLayout,
  HeroSection,
  PropertyCard,
  AgentCard,
  StatsSection,
  ContactForm,
  WhatsAppWidget,
} from '@/modules/vitrine/components';
import { publicVitrineApi } from '@/shared/utils/public-vitrine-api';
import type { VitrineConfig, PublicProperty, PublicAgent } from '@/shared/utils/public-vitrine-api';

interface HomePageProps {
  config: VitrineConfig;
  featuredProperties: PublicProperty[];
  agents: PublicAgent[];
  stats: {
    totalPublishedProperties?: number;
    totalAgents?: number;
    totalLeads?: number;
    totalViews?: number;
  };
  slug: string;
}

const VitrinePage: NextPage<HomePageProps> = ({
  config,
  featuredProperties,
  agents,
  stats,
  slug,
}) => {
  const base = `/sites/${slug}`;
  const primaryColor = config.primaryColor || '#1e40af';

  return (
    <AgencyLayout config={config} pageTitle="Accueil" canonical={`https://${slug}.immo-saas.tn`}>
      {/* HERO */}
      <HeroSection config={config} />

      {/* STATS */}
      {config.sectionsConfig?.stats !== false && (
        <StatsSection stats={stats} primaryColor={primaryColor} />
      )}

      {/* FEATURED PROPERTIES */}
      {config.sectionsConfig?.properties !== false && featuredProperties.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p
                  className="text-sm font-semibold uppercase tracking-wide mb-1"
                  style={{ color: primaryColor }}
                >
                  Sélection
                </p>
                <h2 className="text-3xl font-bold text-gray-900">Biens à la une</h2>
              </div>
              <Link
                href={`${base}/biens`}
                className="flex items-center gap-1 text-sm font-medium hover:gap-2 transition-all"
                style={{ color: primaryColor }}
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProperties.slice(0, 8).map((p) => (
                <PropertyCard key={p.id} property={p} primaryColor={primaryColor} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href={`${base}/biens`}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white font-semibold"
                style={{ backgroundColor: primaryColor }}
              >
                <Home className="w-4 h-4" />
                Tous nos biens ({stats.totalPublishedProperties || 0}+)
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SERVICES */}
      {config.sectionsConfig?.services !== false &&
        config.services &&
        config.services.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Nos services</h2>
                <p className="text-gray-600 mt-2">Votre partenaire immobilier de confiance</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.services.map((service: any, i: number) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {service.icon && <div className="text-3xl mb-3">{service.icon}</div>}
                    <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-600">{service.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* TEAM */}
      {config.sectionsConfig?.team !== false && agents.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p
                  className="text-sm font-semibold uppercase tracking-wide mb-1"
                  style={{ color: primaryColor }}
                >
                  L'équipe
                </p>
                <h2 className="text-3xl font-bold text-gray-900">Nos experts immobiliers</h2>
              </div>
              <Link
                href={`${base}/agents`}
                className="flex items-center gap-1 text-sm font-medium hover:gap-2 transition-all"
                style={{ color: primaryColor }}
              >
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.slice(0, 4).map((agent) => (
                <AgentCard key={agent.id} agent={agent} primaryColor={primaryColor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ABOUT */}
      {config.sectionsConfig?.about !== false && config.aboutText && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Qui sommes-nous ?</h2>
            <p className="text-gray-600 leading-relaxed text-lg">{config.aboutText}</p>
            <Link
              href={`${base}/contact`}
              className="inline-flex items-center gap-2 mt-8 px-8 py-3 rounded-lg text-white font-semibold"
              style={{ backgroundColor: primaryColor }}
            >
              <Phone className="w-4 h-4" /> Nous contacter
            </Link>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {config.sectionsConfig?.testimonials !== false &&
        config.testimonials &&
        config.testimonials.length > 0 && (
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-900">Ils nous font confiance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.testimonials.map((t: any, i: number) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <div className="flex gap-0.5 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-4 h-4"
                          fill={s <= (t.rating || 5) ? '#F59E0B' : 'none'}
                          stroke={s <= (t.rating || 5) ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                    </div>
                    <p className="text-gray-700 italic mb-4">"{t.text}"</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {(t.name || '?').charAt(0)}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{t.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* CONTACT CTA */}
      {config.sectionsConfig?.contact !== false && (
        <section className="py-16" style={{ backgroundColor: primaryColor }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white">Prêt à trouver votre bien ?</h2>
              <p className="text-white/80 mt-2">Contactez-nous dès maintenant</p>
            </div>
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl">
              <ContactForm slug={slug} primaryColor={primaryColor} />
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp Widget */}
      {config.whatsappNumber && (
        <WhatsAppWidget phoneNumber={config.whatsappNumber} agencyName={config.agencyName} />
      )}
    </AgencyLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  try {
    const data = await publicVitrineApi.getHome(slug);
    return {
      props: {
        config: data.config,
        featuredProperties: data.featuredProperties || [],
        agents: data.agents || [],
        stats: data.stats || {},
        slug,
      },
    };
  } catch {
    return { notFound: true };
  }
};

export default VitrinePage;
