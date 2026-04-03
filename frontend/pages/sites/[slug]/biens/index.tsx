import React, { useState, useCallback } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import { SlidersHorizontal, X } from 'lucide-react';
import { AgencyLayout, PropertyGrid, WhatsAppWidget } from '@/modules/vitrine/components';
import { publicVitrineApi } from '@/shared/utils/public-vitrine-api';
import type {
  VitrineConfig,
  PublicProperty,
  PropertyFilters,
} from '@/shared/utils/public-vitrine-api';

interface BiensPageProps {
  config: VitrineConfig;
  properties: PublicProperty[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  filtersData: { cities: string[] };
  initialFilters: PropertyFilters;
  slug: string;
}

const PROPERTY_TYPES = ['Appartement', 'Villa', 'Maison', 'Bureau', 'Local', 'Terrain', 'Immeuble'];
const CATEGORIES = [
  { value: '', label: 'Toutes transactions' },
  { value: 'SALE', label: 'À Vendre' },
  { value: 'RENT', label: 'À Louer' },
  { value: 'SEASONAL_RENT', label: 'Location saisonnière' },
];

const BiensPage: NextPage<BiensPageProps> = ({
  config,
  properties,
  meta,
  filtersData,
  initialFilters,
  slug,
}) => {
  const router = useRouter();
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const primaryColor = config.primaryColor || '#1e40af';

  const updateURL = useCallback(
    (newFilters: PropertyFilters) => {
      const query: Record<string, string> = { slug };
      if (newFilters.type) query.type = newFilters.type;
      if (newFilters.category) query.category = newFilters.category;
      if (newFilters.city) query.city = newFilters.city;
      if (newFilters.minPrice) query.minPrice = String(newFilters.minPrice);
      if (newFilters.maxPrice) query.maxPrice = String(newFilters.maxPrice);
      if (newFilters.bedrooms) query.bedrooms = String(newFilters.bedrooms);
      if (newFilters.sort) query.sort = newFilters.sort;
      if (newFilters.page && newFilters.page > 1) query.page = String(newFilters.page);
      router.push({ pathname: `/sites/[slug]/biens`, query }, undefined, { shallow: false });
    },
    [router, slug]
  );

  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const FiltersPanel = () => (
    <div className="space-y-5">
      {/* Catégorie */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Transaction
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                handleFiltersChange({ ...filters, category: cat.value || undefined, page: 1 })
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                (filters.category || '') === cat.value
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={
                (filters.category || '') === cat.value ? { backgroundColor: primaryColor } : {}
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Type de bien
        </label>
        <select
          value={filters.type || ''}
          onChange={(e) =>
            handleFiltersChange({ ...filters, type: e.target.value || undefined, page: 1 })
          }
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
        >
          <option value="">Tous les types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Prix */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Budget (TND)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) =>
              handleFiltersChange({
                ...filters,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) =>
              handleFiltersChange({
                ...filters,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Chambres */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Chambres min.
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() =>
                handleFiltersChange({
                  ...filters,
                  bedrooms: filters.bedrooms === n ? undefined : n,
                  page: 1,
                })
              }
              className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors ${
                filters.bedrooms === n
                  ? 'text-white border-transparent'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={filters.bedrooms === n ? { backgroundColor: primaryColor } : {}}
            >
              {n}+
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      {Object.values(filters).some(Boolean) && (
        <button
          onClick={() => handleFiltersChange({ page: 1 })}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <X className="w-3.5 h-3.5" /> Effacer les filtres
        </button>
      )}
    </div>
  );

  return (
    <AgencyLayout config={config} pageTitle="Tous nos biens">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nos biens immobiliers</h1>
            <p className="text-gray-500 text-sm mt-1">
              {meta.total} bien{meta.total > 1 ? 's' : ''} disponible{meta.total > 1 ? 's' : ''}
            </p>
          </div>
          {/* Mobile filter toggle */}
          <button
            className="md:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtres
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filtres desktop */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Filtres
              </h2>
              <FiltersPanel />
            </div>
          </aside>

          {/* Mobile filtres */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-gray-900">Filtres</h2>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <FiltersPanel />
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            <PropertyGrid
              properties={properties}
              meta={meta}
              filters={filters}
              primaryColor={primaryColor}
              availableCities={filtersData.cities}
              onFiltersChange={handleFiltersChange}
              onPageChange={handlePageChange}
            />
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
    const filters: PropertyFilters = {
      type: (query.type as string) || null,
      category: (query.category as string) || null,
      city: (query.city as string) || null,
      minPrice: query.minPrice ? Number(query.minPrice) : null,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : null,
      bedrooms: query.bedrooms ? Number(query.bedrooms) : null,
      sort: (query.sort as PropertyFilters['sort']) || null,
      page: query.page ? Number(query.page) : 1,
      limit: 12,
    };

    const data = await publicVitrineApi.getProperties(slug, filters);
    const home = await publicVitrineApi.getHome(slug);

    return {
      props: {
        config: home.config,
        properties: data.data || [],
        meta: data.meta || { total: 0, page: 1, limit: 12, totalPages: 0 },
        filtersData: { cities: data.filters?.cities || [] },
        initialFilters: filters,
        slug,
      },
    };
  } catch {
    return { notFound: true };
  }
};

export default BiensPage;
