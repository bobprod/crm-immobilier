import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import type { VitrineConfig } from '@/shared/utils/public-vitrine-api';

interface AgencyFooterProps {
  config: VitrineConfig;
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

const SocialIcon: React.FC<{ platform: string; url: string }> = ({ platform, url }) => {
  const icons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
  };
  const icon = icons[platform.toLowerCase()];
  if (!icon) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
      aria-label={platform}
    >
      {icon}
    </a>
  );
};

export const AgencyFooter: React.FC<AgencyFooterProps> = ({ config }) => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const base = slug ? `/sites/${slug}` : '';
  const year = new Date().getFullYear();
  const social = config.socialLinks || {};
  const schedule = config.schedule || {};

  return (
    <footer className="text-white" style={{ backgroundColor: 'var(--agency-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1 – Identité */}
          <div>
            {config.logo ? (
              <Image
                src={config.logo}
                alt={config.agencyName}
                width={160}
                height={48}
                style={{
                  objectFit: 'contain',
                  height: 48,
                  width: 'auto',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            ) : (
              <p className="text-xl font-bold">{config.agencyName}</p>
            )}
            {config.aboutText && (
              <p className="mt-3 text-white/70 text-sm leading-relaxed line-clamp-4">
                {config.aboutText}
              </p>
            )}
            {/* Réseaux sociaux */}
            {Object.keys(social).length > 0 && (
              <div className="flex gap-2 mt-4">
                {Object.entries(social).map(([platform, url]) => (
                  <SocialIcon key={platform} platform={platform} url={url as string} />
                ))}
              </div>
            )}
          </div>

          {/* Col 2 – Liens */}
          <div>
            <h3 className="font-semibold text-white mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm text-white/70">
              {[
                { label: 'Accueil', href: '' },
                { label: 'Tous les biens', href: '/biens' },
                { label: 'Notre équipe', href: '/agents' },
                { label: 'Contact', href: '/contact' },
                { label: 'Estimation gratuite', href: '/contact?type=ESTIMATION' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={`${base}${item.href}`} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 – Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-white/70">
              {config.phone && (
                <li>
                  <a
                    href={`tel:${config.phone}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4 shrink-0" /> {config.phone}
                  </a>
                </li>
              )}
              {config.email && (
                <li>
                  <a
                    href={`mailto:${config.email}`}
                    className="flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Mail className="w-4 h-4 shrink-0" /> {config.email}
                  </a>
                </li>
              )}
              {config.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{config.address}</span>
                </li>
              )}
              {config.whatsappNumber && (
                <li>
                  <a
                    href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=Bonjour`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors"
                    style={{ color: '#4ADE80' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    WhatsApp
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Col 4 – Horaires */}
          {Object.keys(schedule).length > 0 && (
            <div>
              <h3 className="font-semibold text-white mb-4">Horaires</h3>
              <ul className="space-y-1 text-sm text-white/70">
                {Object.entries(schedule).map(([day, hours]) => (
                  <li key={day} className="flex justify-between gap-2">
                    <span className="capitalize">{DAYS_FR[day] || day}</span>
                    <span>{hours as string}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <span>
            © {year} {config.agencyName}. Tous droits réservés.
          </span>
          <span>Powered by Immo SaaS</span>
        </div>
      </div>
    </footer>
  );
};

export default AgencyFooter;
