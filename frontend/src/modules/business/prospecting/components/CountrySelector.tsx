import React, { useState, useEffect } from 'react';
import { CountryCode, CountryInfo } from '../types/ai-prospection.types';

/**
 * CountrySelector Component
 *
 * Permet de sélectionner un pays pour le scraping international (20+ pays)
 * Affiche les drapeaux, noms, et sites disponibles par pays
 *
 * Supports:
 * - 🌍 8 pays africains
 * - 🌎 4 pays d'Amérique Latine
 * - 🌐 4 pays Europe + Canada
 * - 🌏 4 pays asiatiques
 */

export interface CountrySelectorProps {
  /** Pays sélectionné */
  value?: CountryCode;

  /** Callback quand le pays change */
  onChange: (country: CountryCode) => void;

  /** Désactive le sélecteur */
  disabled?: boolean;
}

// Mapping des pays avec drapeaux et informations
// Ces données correspondent au backend InternationalScraperService
const COUNTRIES: CountryInfo[] = [
  // France (par défaut)
  {
    code: 'france',
    name: 'France',
    flag: '🇫🇷',
    sites: ['leboncoin.fr', 'seloger.com', 'pap.fr'],
    primary: 'leboncoin.fr',
    language: 'fr',
    currency: 'EUR',
    continent: 'Europe',
  },

  // 🌍 AFRIQUE (8 pays)
  {
    code: 'morocco',
    name: 'Maroc',
    flag: '🇲🇦',
    sites: ['avito.ma', 'mubawab.ma', 'sarouty.ma'],
    primary: 'avito.ma',
    language: 'fr',
    currency: 'MAD',
    continent: 'Africa',
  },
  {
    code: 'algeria',
    name: 'Algérie',
    flag: '🇩🇿',
    sites: ['ouedkniss.com', 'algeriimmo.com'],
    primary: 'ouedkniss.com',
    language: 'fr',
    currency: 'DZD',
    continent: 'Africa',
  },
  {
    code: 'tunisia',
    name: 'Tunisie',
    flag: '🇹🇳',
    sites: ['tayara.tn', 'mubawab.tn'],
    primary: 'tayara.tn',
    language: 'fr',
    currency: 'TND',
    continent: 'Africa',
  },
  {
    code: 'cameroon',
    name: 'Cameroun',
    flag: '🇨🇲',
    sites: ['jumia.cm', 'afrimalin.cm'],
    primary: 'jumia.cm',
    language: 'fr',
    currency: 'XAF',
    continent: 'Africa',
  },
  {
    code: 'ivory-coast',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    sites: ['jumia.ci', 'afrimalin.ci', 'coinafrique.com'],
    primary: 'jumia.ci',
    language: 'fr',
    currency: 'XOF',
    continent: 'Africa',
  },
  {
    code: 'senegal',
    name: 'Sénégal',
    flag: '🇸🇳',
    sites: ['expat-dakar.com', 'coinafrique.com', 'jumia.sn'],
    primary: 'expat-dakar.com',
    language: 'fr',
    currency: 'XOF',
    continent: 'Africa',
  },
  {
    code: 'nigeria',
    name: 'Nigeria',
    flag: '🇳🇬',
    sites: ['propertypro.ng', 'jiji.ng', 'tolet.com.ng'],
    primary: 'propertypro.ng',
    language: 'en',
    currency: 'NGN',
    continent: 'Africa',
  },
  {
    code: 'congo',
    name: 'Congo (RDC)',
    flag: '🇨🇩',
    sites: ['jumia.cd', 'annoncecd.com'],
    primary: 'jumia.cd',
    language: 'fr',
    currency: 'CDF',
    continent: 'Africa',
  },

  // 🌎 AMÉRIQUE LATINE (4 pays)
  {
    code: 'brazil',
    name: 'Brésil',
    flag: '🇧🇷',
    sites: ['vivareal.com.br', 'imovelweb.com.br', 'olx.com.br'],
    primary: 'vivareal.com.br',
    language: 'pt',
    currency: 'BRL',
    continent: 'Americas',
  },
  {
    code: 'colombia',
    name: 'Colombie',
    flag: '🇨🇴',
    sites: ['fincaraiz.com.co', 'metrocuadrado.com', 'properati.com.co'],
    primary: 'fincaraiz.com.co',
    language: 'es',
    currency: 'COP',
    continent: 'Americas',
  },
  {
    code: 'ecuador',
    name: 'Équateur',
    flag: '🇪🇨',
    sites: ['plusvalia.com', 'properati.com.ec', 'mercadolibre.com.ec'],
    primary: 'plusvalia.com',
    language: 'es',
    currency: 'USD',
    continent: 'Americas',
  },
  {
    code: 'bolivia',
    name: 'Bolivie',
    flag: '🇧🇴',
    sites: ['encontacto.bo', 'infocasas.com.bo', 'mercadolibre.com.bo'],
    primary: 'encontacto.bo',
    language: 'es',
    currency: 'BOB',
    continent: 'Americas',
  },

  // 🌐 EUROPE + CANADA (4 pays)
  {
    code: 'canada',
    name: 'Canada',
    flag: '🇨🇦',
    sites: ['realtor.ca', 'centris.ca', 'kijiji.ca', 'zolo.ca'],
    primary: 'realtor.ca',
    language: 'en',
    currency: 'CAD',
    continent: 'Americas',
  },
  {
    code: 'uk',
    name: 'Royaume-Uni',
    flag: '🇬🇧',
    sites: ['rightmove.co.uk', 'zoopla.co.uk', 'onthemarket.com'],
    primary: 'rightmove.co.uk',
    language: 'en',
    currency: 'GBP',
    continent: 'Europe',
  },
  {
    code: 'germany',
    name: 'Allemagne',
    flag: '🇩🇪',
    sites: ['immobilienscout24.de', 'immowelt.de'],
    primary: 'immobilienscout24.de',
    language: 'de',
    currency: 'EUR',
    continent: 'Europe',
  },
  {
    code: 'netherlands',
    name: 'Pays-Bas',
    flag: '🇳🇱',
    sites: ['funda.nl', 'pararius.nl', 'jaap.nl'],
    primary: 'funda.nl',
    language: 'nl',
    currency: 'EUR',
    continent: 'Europe',
  },

  // 🌏 ASIE (4 pays)
  {
    code: 'japan',
    name: 'Japon',
    flag: '🇯🇵',
    sites: ['suumo.jp', 'homes.co.jp', 'athome.co.jp'],
    primary: 'suumo.jp',
    language: 'ja',
    currency: 'JPY',
    continent: 'Asia',
  },
  {
    code: 'south-korea',
    name: 'Corée du Sud',
    flag: '🇰🇷',
    sites: ['zigbang.com', 'dabang.com'],
    primary: 'zigbang.com',
    language: 'ko',
    currency: 'KRW',
    continent: 'Asia',
  },
  {
    code: 'taiwan',
    name: 'Taiwan',
    flag: '🇹🇼',
    sites: ['591.com.tw', 'sinyi.com.tw', 'rakuya.com.tw'],
    primary: '591.com.tw',
    language: 'zh',
    currency: 'TWD',
    continent: 'Asia',
  },
  {
    code: 'india',
    name: 'Inde',
    flag: '🇮🇳',
    sites: ['99acres.com', 'magicbricks.com', 'housing.com'],
    primary: '99acres.com',
    language: 'en',
    currency: 'INR',
    continent: 'Asia',
  },
];

// Groupe les pays par continent
const COUNTRIES_BY_CONTINENT = COUNTRIES.reduce((acc, country) => {
  if (!acc[country.continent]) {
    acc[country.continent] = [];
  }
  acc[country.continent].push(country);
  return acc;
}, {} as Record<string, CountryInfo[]>);

const CONTINENT_EMOJIS = {
  Europe: '🌐',
  Africa: '🌍',
  Americas: '🌎',
  Asia: '🌏',
};

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value = 'france',
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCountry = COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  // Filter countries based on search
  const filteredCountries = COUNTRIES.filter((country) =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered countries by continent
  const filteredByContinent = filteredCountries.reduce((acc, country) => {
    if (!acc[country.continent]) {
      acc[country.continent] = [];
    }
    acc[country.continent].push(country);
    return acc;
  }, {} as Record<string, CountryInfo[]>);

  const handleSelect = (countryCode: CountryCode) => {
    onChange(countryCode);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative">
      {/* Selected Country Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 bg-white border border-gray-300 rounded-lg
          flex items-center justify-between gap-3
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-purple-400 cursor-pointer'}
          transition-colors
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedCountry.flag}</span>
          <div className="text-left">
            <p className="font-medium text-gray-900">{selectedCountry.name}</p>
            <p className="text-xs text-gray-500">
              {selectedCountry.primary} · {selectedCountry.currency}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {/* Search Bar */}
          <div className="sticky top-0 bg-white p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="🔍 Rechercher un pays..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Countries by Continent */}
          {Object.keys(filteredByContinent).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <p className="text-sm">Aucun pays trouvé</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(filteredByContinent).map(([continent, countries]) => (
                <div key={continent} className="mb-2">
                  {/* Continent Header */}
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {CONTINENT_EMOJIS[continent as keyof typeof CONTINENT_EMOJIS]} {continent}
                    </p>
                  </div>

                  {/* Countries */}
                  {countries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelect(country.code)}
                      className={`
                        w-full px-4 py-3 flex items-center gap-3
                        hover:bg-purple-50 transition-colors text-left
                        ${country.code === value ? 'bg-purple-100' : ''}
                      `}
                    >
                      <span className="text-2xl">{country.flag}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{country.name}</p>
                        <p className="text-xs text-gray-500">
                          {country.sites.length} site{country.sites.length > 1 ? 's' : ''} ·{' '}
                          {country.currency}
                        </p>
                      </div>
                      {country.code === value && (
                        <svg
                          className="w-5 h-5 text-purple-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Stats Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-4 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center">
              {COUNTRIES.length} pays disponibles · 4 continents
            </p>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
