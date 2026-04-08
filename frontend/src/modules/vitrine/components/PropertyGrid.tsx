import React, { useState } from 'react';
import { Grid, List, Map, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { PropertyCard } from './PropertyCard';
import type { PublicProperty, PropertyFilters } from '@/shared/utils/public-vitrine-api';

interface PropertyGridProps {
  properties: PublicProperty[];
  meta: { total: number; page: number; limit: number; totalPages: number };
  filters?: PropertyFilters;
  primaryColor?: string;
  onFiltersChange?: (filters: PropertyFilters) => void;
  onPageChange?: (page: number) => void;
  availableCities?: string[];
}

type ViewMode = 'grid' | 'list';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'area_desc', label: 'Surface décroissante' },
];

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  meta,
  filters = {} as PropertyFilters,
  primaryColor,
  onFiltersChange,
  onPageChange,
  availableCities = [],
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleSort = (sort: string) => {
    onFiltersChange?.({ ...filters, sort: sort as PropertyFilters['sort'], page: 1 });
  };

  const handleCity = (city: string) => {
    onFiltersChange?.({ ...filters, city: city || undefined, page: 1 });
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{meta.total}</span> bien
          {meta.total > 1 ? 's' : ''} trouvé{meta.total > 1 ? 's' : ''}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          {/* City filter */}
          {availableCities.length > 0 && (
            <select
              value={filters.city || ''}
              onChange={(e) => handleCity(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="">Toutes les villes</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={filters.sort || 'date_desc'}
            onChange={(e) => handleSort(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
              style={
                viewMode === 'grid'
                  ? { backgroundColor: primaryColor || 'var(--agency-primary)' }
                  : {}
              }
              title="Vue grille"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'text-white' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
              style={
                viewMode === 'list'
                  ? { backgroundColor: primaryColor || 'var(--agency-primary)' }
                  : {}
              }
              title="Vue liste"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid / List */}
      {properties.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Aucun bien trouvé</p>
          <p className="text-sm mt-1">Modifiez vos critères de recherche</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} primaryColor={primaryColor} view="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} primaryColor={primaryColor} view="list" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => onPageChange?.(meta.page - 1)}
            disabled={meta.page <= 1}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
            let page = i + 1;
            if (meta.totalPages > 7) {
              const half = 3;
              if (meta.page <= half + 1) page = i + 1;
              else if (meta.page >= meta.totalPages - half) page = meta.totalPages - 6 + i;
              else page = meta.page - half + i;
            }
            return (
              <button
                key={page}
                onClick={() => onPageChange?.(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  meta.page === page
                    ? 'text-white'
                    : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                style={
                  meta.page === page
                    ? { backgroundColor: primaryColor || 'var(--agency-primary)' }
                    : {}
                }
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => onPageChange?.(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
            className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PropertyGrid;
