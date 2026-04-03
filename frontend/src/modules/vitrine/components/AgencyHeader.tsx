import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Phone, Menu, X, ChevronDown } from 'lucide-react';
import type { VitrineConfig } from '@/shared/utils/public-vitrine-api';

interface AgencyHeaderProps {
  config: VitrineConfig;
}

const NAV_ITEMS = [
  { label: 'Accueil', href: '' },
  { label: 'Biens', href: '/biens' },
  { label: 'Notre équipe', href: '/agents' },
  { label: 'Contact', href: '/contact' },
];

export const AgencyHeader: React.FC<AgencyHeaderProps> = ({ config }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const base = slug ? `/sites/${slug}` : '';

  const whatsappUrl = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=Bonjour, je souhaite avoir des informations`
    : null;

  return (
    <header
      className="sticky top-0 z-50 bg-white shadow-sm border-b"
      style={{ borderColor: 'var(--agency-primary)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href={base || '/'} className="flex items-center gap-3 shrink-0">
          {config.logo ? (
            <Image
              src={config.logo}
              alt={config.agencyName}
              width={140}
              height={40}
              style={{ objectFit: 'contain', height: 40, width: 'auto' }}
              priority
            />
          ) : (
            <span className="font-bold text-lg" style={{ color: 'var(--agency-primary)' }}>
              {config.agencyName}
            </span>
          )}
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={`${base}${item.href}`}
              className="hover:text-[var(--agency-primary)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: '#25D366' }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp
            </a>
          )}
          <a
            href={`tel:${config.phone}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: 'var(--agency-primary)' }}
          >
            <Phone className="w-4 h-4" />
            {config.phone}
          </a>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Menu mobile */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={`${base}${item.href}`}
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${config.phone}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold mt-2"
              style={{ backgroundColor: 'var(--agency-primary)' }}
            >
              <Phone className="w-4 h-4" /> {config.phone}
            </a>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-white font-semibold"
                style={{ backgroundColor: '#25D366' }}
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default AgencyHeader;
