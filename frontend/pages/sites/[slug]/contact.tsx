import React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { AgencyLayout, ContactForm, WhatsAppWidget } from '@/modules/vitrine/components';
import { publicVitrineApi } from '@/shared/utils/public-vitrine-api';
import type { VitrineConfig, SubmitLeadData } from '@/shared/utils/public-vitrine-api';

interface ContactPageProps {
  config: VitrineConfig;
  slug: string;
  defaultType?: SubmitLeadData['type'];
}

const DAYS_FR: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const ContactPage: NextPage<ContactPageProps> = ({ config, slug, defaultType }) => {
  const primaryColor = config.primaryColor || '#1e40af';
  const schedule = config.schedule || {};

  return (
    <AgencyLayout config={config} userId={config.userId} pageTitle="Contact">
      {/* Page Header */}
      <div
        className="py-16 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold">Contactez-nous</h1>
          <p className="mt-3 text-white/80 text-lg">
            Notre équipe vous répond dans les meilleurs délais
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Envoyer un message</h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <ContactForm slug={slug} primaryColor={primaryColor} defaultType={defaultType} />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos coordonnées</h2>
              <div className="space-y-4">
                {config.phone && (
                  <a
                    href={`tel:${config.phone}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Téléphone</p>
                      <p className="font-semibold text-gray-900 group-hover:text-[var(--agency-primary)]">
                        {config.phone}
                      </p>
                    </div>
                  </a>
                )}

                {config.email && (
                  <a
                    href={`mailto:${config.email}`}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow group"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="font-semibold text-gray-900 group-hover:text-[var(--agency-primary)]">
                        {config.email}
                      </p>
                    </div>
                  </a>
                )}

                {config.address && (
                  <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${primaryColor}15` }}
                    >
                      <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Adresse</p>
                      <p className="font-semibold text-gray-900">{config.address}</p>
                    </div>
                  </div>
                )}

                {config.whatsappNumber && (
                  <a
                    href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=Bonjour`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: '#25D36615' }}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">WhatsApp</p>
                      <p className="font-semibold text-gray-900">{config.whatsappNumber}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* Horaires */}
            {Object.keys(schedule).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-gray-900">Horaires d'ouverture</h3>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
                  {Object.entries(schedule).map(([day, hours]) => (
                    <div key={day} className="flex justify-between px-4 py-2.5 text-sm">
                      <span className="text-gray-600 capitalize">{DAYS_FR[day] || day}</span>
                      <span className="font-medium text-gray-900">{hours as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {config.whatsappNumber && (
        <WhatsAppWidget phoneNumber={config.whatsappNumber} agencyName={config.agencyName} />
      )}
    </AgencyLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params, query }) => {
  const slug = params?.slug as string;
  try {
    const home = await publicVitrineApi.getHome(slug);
    return {
      props: {
        config: home.config,
        slug,
        defaultType: query.type || 'CONTACT',
      },
    };
  } catch {
    return { notFound: true };
  }
};

export default ContactPage;
