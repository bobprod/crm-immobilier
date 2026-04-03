import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Search, ChevronDown } from 'lucide-react';
import type { VitrineConfig } from '@/shared/utils/public-vitrine-api';

interface HeroSectionProps {
  config: VitrineConfig;
  onSearch?: (params: SearchParams) => void;
}

export interface SearchParams {
  type?: string;
  category?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
}

const PROPERTY_TYPES = ['Appartement', 'Villa', 'Maison', 'Bureau', 'Local', 'Terrain', 'Immeuble'];
const CATEGORIES = [
  { value: 'SALE', label: 'À Vendre' },
  { value: 'RENT', label: 'À Louer' },
  { value: 'SEASONAL_RENT', label: 'Location saisonnière' },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ config, onSearch }) => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const base = slug ? `/sites/${slug}` : '';

  const [category, setCategory] = useState('SALE');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: SearchParams = { category };
    if (type) params.type = type;
    if (city) params.city = city;
    onSearch?.(params);
    const qs = new URLSearchParams(params as any).toString();
    router.push(`${base}/biens?${qs}`);
  };

  const heroBg = config.heroImage;
  const primaryColor = config.primaryColor || '#1e40af';

  return (
    <section className="relative min-h-[560px] flex items-center overflow-hidden">
      {/* Background */}
      {heroBg ? (
        <>
          <Image
            src={heroBg}
            alt="Hero"
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="-z-10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent -z-10" />
        </>
      ) : (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 50%, ${primaryColor}88 100%)`,
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl">
          {/* Slogan */}
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight drop-shadow">
            {config.slogan || `Trouvez le bien de vos rêves`}
          </h1>
          <p className="mt-4 text-white/80 text-lg">
            {config.agencyName} — votre partenaire immobilier de confiance.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row gap-3"
          >
            {/* Category tabs */}
            <div className="flex gap-1 sm:hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === cat.value ? 'text-white' : 'text-gray-600 bg-gray-100'
                  }`}
                  style={category === cat.value ? { backgroundColor: primaryColor } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Transaction (desktop - inside form) */}
            <div className="hidden sm:flex items-center">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm font-medium text-gray-700 bg-transparent border-r border-gray-200 pr-4 focus:outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="relative flex-1">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white"
              >
                <option value="">Type de bien</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* City */}
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville ou quartier"
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
            />

            {/* Submit */}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-semibold text-sm shrink-0 transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              <Search className="w-4 h-4" />
              Rechercher
            </button>
          </form>

          {/* Quick stats */}
          {config.sectionsConfig?.stats !== false && (
            <div className="mt-6 flex gap-6 text-white/80 text-sm">
              <span>🏠 Biens disponibles en ligne</span>
              <span>⭐ Agence certifiée</span>
              <span>💬 Réponse rapide</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
