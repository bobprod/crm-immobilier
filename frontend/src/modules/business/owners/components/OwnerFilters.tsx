import React, { useState } from 'react';
import { OwnerFilters as IOwnerFilters } from '@/shared/utils/owners-api';

interface OwnerFiltersProps {
  onFilterChange: (filters: IOwnerFilters) => void;
  initialFilters?: IOwnerFilters;
}

export const OwnerFilters: React.FC<OwnerFiltersProps> = ({
  onFilterChange,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<IOwnerFilters>(initialFilters);

  const handleFilterChange = (key: keyof IOwnerFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters: IOwnerFilters = {};
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== ''
  );

  return (
    <div className="bg-white shadow rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Recherche */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Recherche
          </label>
          <input
            type="text"
            id="search"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Nom, email, téléphone..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Ville */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Ville
          </label>
          <input
            type="text"
            id="city"
            value={filters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            placeholder="Filtrer par ville..."
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        {/* Statut */}
        <div>
          <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            id="isActive"
            value={
              filters.isActive === undefined
                ? ''
                : filters.isActive
                ? 'true'
                : 'false'
            }
            onChange={(e) =>
              handleFilterChange(
                'isActive',
                e.target.value === '' ? undefined : e.target.value === 'true'
              )
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Bouton de réinitialisation */}
      {hasActiveFilters && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="-ml-0.5 mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};
