import React, { useState, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// ============================================
// TYPES
// ============================================

interface Zone {
  id: string;
  name: string;
  type: 'city' | 'region' | 'radius' | 'polygon' | 'custom';
  coordinates?: { lat: number; lng: number };
  radius?: number;
  polygon?: { lat: number; lng: number }[];
  population?: number;
  avgPrice?: number;
  selected: boolean;
}

interface DemographicCriteria {
  ageRange: { min: number; max: number };
  incomeRange: { min: number; max: number };
  familyStatus: string[];
  propertyIntent: ('buy' | 'rent' | 'sell' | 'invest')[];
  propertyTypes: string[];
  budgetRange: { min: number; max: number };
  urgency: ('immediate' | 'short_term' | 'long_term')[];
  interests: string[];
  professions: string[];
}

export interface UnifiedTargetingConfig {
  zones: Zone[];
  demographics: DemographicCriteria;
}

interface UnifiedTargetingProps {
  onChange: (config: UnifiedTargetingConfig) => void;
  initialConfig?: Partial<UnifiedTargetingConfig>;
  disabled?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const TUNISIAN_REGIONS: Zone[] = [
  { id: 'tunis', name: 'Tunis', type: 'city', coordinates: { lat: 36.8065, lng: 10.1815 }, population: 1056247, avgPrice: 350000, selected: false },
  { id: 'ariana', name: 'Ariana', type: 'city', coordinates: { lat: 36.8663, lng: 10.1647 }, population: 576088, avgPrice: 280000, selected: false },
  { id: 'ben-arous', name: 'Ben Arous', type: 'city', coordinates: { lat: 36.7531, lng: 10.2189 }, population: 631842, avgPrice: 220000, selected: false },
  { id: 'manouba', name: 'Manouba', type: 'city', coordinates: { lat: 36.8101, lng: 10.0863 }, population: 379518, avgPrice: 180000, selected: false },
  { id: 'la-marsa', name: 'La Marsa', type: 'city', coordinates: { lat: 36.8783, lng: 10.3242 }, population: 92987, avgPrice: 550000, selected: false },
  { id: 'carthage', name: 'Carthage', type: 'city', coordinates: { lat: 36.8528, lng: 10.3233 }, population: 21276, avgPrice: 650000, selected: false },
  { id: 'sousse', name: 'Sousse', type: 'city', coordinates: { lat: 35.8288, lng: 10.6405 }, population: 271428, avgPrice: 200000, selected: false },
  { id: 'sfax', name: 'Sfax', type: 'city', coordinates: { lat: 34.7406, lng: 10.7603 }, population: 330440, avgPrice: 180000, selected: false },
  { id: 'hammamet', name: 'Hammamet', type: 'city', coordinates: { lat: 36.4, lng: 10.6167 }, population: 97579, avgPrice: 320000, selected: false },
  { id: 'lac1', name: 'Les Berges du Lac 1', type: 'city', coordinates: { lat: 36.835, lng: 10.235 }, avgPrice: 450000, selected: false },
  { id: 'lac2', name: 'Les Berges du Lac 2', type: 'city', coordinates: { lat: 36.845, lng: 10.255 }, avgPrice: 380000, selected: false },
  { id: 'ennasr', name: 'Ennasr', type: 'city', coordinates: { lat: 36.855, lng: 10.175 }, avgPrice: 320000, selected: false },
];

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Appartement', icon: '🏢' },
  { id: 'villa', label: 'Villa', icon: '🏡' },
  { id: 'house', label: 'Maison', icon: '🏠' },
  { id: 'studio', label: 'Studio', icon: '🛏️' },
  { id: 'duplex', label: 'Duplex', icon: '🏘️' },
  { id: 'land', label: 'Terrain', icon: '🌍' },
  { id: 'commercial', label: 'Local commercial', icon: '🏪' },
  { id: 'office', label: 'Bureau', icon: '🏢' },
];

const PROPERTY_INTENTS = [
  { id: 'buy', label: 'Acheter', icon: '🏠', color: 'green' },
  { id: 'rent', label: 'Louer', icon: '🔑', color: 'blue' },
  { id: 'sell', label: 'Vendre', icon: '💰', color: 'orange' },
  { id: 'invest', label: 'Investir', icon: '📈', color: 'purple' },
];

const FAMILY_STATUS = [
  { id: 'single', label: 'Célibataire', icon: '👤' },
  { id: 'couple', label: 'Couple sans enfants', icon: '👫' },
  { id: 'family_small', label: 'Famille (1-2 enfants)', icon: '👨‍👩‍👧' },
  { id: 'family_large', label: 'Famille nombreuse', icon: '👨‍👩‍👧‍👦' },
  { id: 'retired', label: 'Retraité', icon: '👴' },
];

// Composant carte Leaflet chargé dynamiquement (SSR safe)
const LeafletMap = dynamic(() => import('./LeafletMapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-2">🗺️</div>
        <p className="text-gray-600">Chargement de la carte...</p>
      </div>
    </div>
  ),
});

// ============================================
// COMPONENT
// ============================================

export const UnifiedTargeting: React.FC<UnifiedTargetingProps> = ({
  onChange,
  initialConfig,
  disabled,
}) => {
  // Geographic state
  const [zones, setZones] = useState<Zone[]>(TUNISIAN_REGIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [radiusMode, setRadiusMode] = useState(false);
  const [customRadius, setCustomRadius] = useState(5);

  // Demographic state
  const [criteria, setCriteria] = useState<DemographicCriteria>({
    ageRange: { min: 25, max: 65 },
    incomeRange: { min: 2000, max: 15000 },
    familyStatus: [],
    propertyIntent: [],
    propertyTypes: [],
    budgetRange: { min: 100000, max: 500000 },
    urgency: [],
    interests: [],
    professions: [],
    ...initialConfig?.demographics,
  });

  // Selected zones
  const selectedZones = useMemo(() => zones.filter((z) => z.selected), [zones]);

  // Filtered zones
  const filteredZones = useMemo(
    () => zones.filter((zone) => zone.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [zones, searchQuery]
  );

  // Toggle zone selection
  const toggleZone = useCallback((zoneId: string) => {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, selected: !z.selected } : z)));
  }, []);

  // Remove zone
  const removeZone = useCallback((zoneId: string) => {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, selected: false } : z)));
  }, []);

  // Add radius zone
  const addRadiusZone = useCallback(
    (lat: number, lng: number) => {
      const newZone: Zone = {
        id: `radius-${Date.now()}`,
        name: `Zone ${customRadius}km`,
        type: 'radius',
        coordinates: { lat, lng },
        radius: customRadius,
        selected: true,
        population: Math.round(customRadius * customRadius * 1000),
      };
      setZones((prev) => [...prev, newZone]);
      setRadiusMode(false);
    },
    [customRadius]
  );

  // Handle map click
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (radiusMode) {
        addRadiusZone(lat, lng);
      }
    },
    [radiusMode, addRadiusZone]
  );

  // Toggle array item
  const toggleArrayItem = <K extends keyof DemographicCriteria>(key: K, value: string) => {
    setCriteria((prev) => {
      const arr = prev[key] as string[];
      const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  // Notify parent on change
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const isFirstRender = React.useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChangeRef.current({
      zones: selectedZones,
      demographics: criteria,
    });
  }, [selectedZones, criteria]);

  // Estimated reach
  const estimatedReach = useMemo(() => {
    const baseReach = selectedZones.reduce((sum, z) => sum + (z.population || 50000), 0);
    const ageSpan = criteria.ageRange.max - criteria.ageRange.min;
    const ageFactor = ageSpan / 40;
    const statusFactor = criteria.familyStatus.length > 0 ? criteria.familyStatus.length / 5 : 1;
    const intentFactor = criteria.propertyIntent.length > 0 ? criteria.propertyIntent.length / 4 : 1;
    return Math.round(baseReach * ageFactor * statusFactor * intentFactor);
  }, [selectedZones, criteria]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🎯</span> Ciblage Complet
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Géographique + Démographique unifiés
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{(estimatedReach / 1000).toFixed(0)}k</div>
            <div className="text-blue-100 text-sm">portée estimée</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* SECTION 1: CIBLAGE GÉOGRAPHIQUE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📍</span> Zones Géographiques
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedZones.length} sélectionnée(s)</span>
              <div className="flex rounded-lg overflow-hidden border">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm font-medium transition ${
                    viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 Liste
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 text-sm font-medium transition ${
                    viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🗺️ Carte
                </button>
              </div>
            </div>
          </div>

          {/* Search & Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Rechercher une ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setRadiusMode(!radiusMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                radiusMode ? 'bg-orange-500 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⭕ {radiusMode ? 'Cliquez sur la carte' : 'Zone par rayon'}
            </button>
          </div>

          {/* Radius config */}
          {radiusMode && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-800">Rayon:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(Number(e.target.value))}
                  className="w-32"
                />
                <span className="text-lg font-bold text-orange-900">{customRadius} km</span>
              </div>
            </div>
          )}

          {/* Map or List View */}
          {viewMode === 'map' ? (
            <LeafletMap
              zones={filteredZones as any}
              selectedZones={selectedZones as any}
              onZoneClick={toggleZone}
              onMapClick={handleMapClick}
              radiusMode={radiusMode}
              customRadius={customRadius}
              heatmapEnabled={false}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
              {filteredZones.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    zone.selected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{zone.name}</h4>
                      <div className="text-xs text-gray-500 mt-1">
                        {zone.type === 'radius' ? `⭕ Rayon ${zone.radius}km` : '📍 Ville'}
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        zone.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {zone.selected && <span className="text-white text-xs">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected zones summary */}
          {selectedZones.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Zones sélectionnées:</span>
                <button
                  onClick={() => setZones((prev) => prev.map((z) => ({ ...z, selected: false })))}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Tout désélectionner
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedZones.map((zone) => (
                  <span
                    key={zone.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {zone.name}
                    <button onClick={() => removeZone(zone.id)} className="hover:opacity-70">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: CIBLAGE DÉMOGRAPHIQUE */}
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>👥</span> Profil Démographique
            </h3>
          </div>

          {/* Property Intent */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span>🎯</span> Intention immobilière
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PROPERTY_INTENTS.map((intent) => (
                <button
                  key={intent.id}
                  onClick={() => toggleArrayItem('propertyIntent', intent.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    criteria.propertyIntent.includes(intent.id as any)
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{intent.icon}</div>
                  <div className="font-medium text-gray-900 text-sm">{intent.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Property Types */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span>🏠</span> Types de biens
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleArrayItem('propertyTypes', type.id)}
                  className={`p-2 rounded-lg border-2 transition-all flex items-center gap-2 text-sm ${
                    criteria.propertyTypes.includes(type.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{type.icon}</span>
                  <span className="font-medium text-gray-900">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span>💰</span> Budget
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min (TND)</label>
                <input
                  type="number"
                  value={criteria.budgetRange.min}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      budgetRange: { ...prev.budgetRange, min: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max (TND)</label>
                <input
                  type="number"
                  value={criteria.budgetRange.max}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      budgetRange: { ...prev.budgetRange, max: Number(e.target.value) },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Family Status */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span>👨‍👩‍👧‍👦</span> Situation familiale
            </h4>
            <div className="flex flex-wrap gap-2">
              {FAMILY_STATUS.map((status) => (
                <button
                  key={status.id}
                  onClick={() => toggleArrayItem('familyStatus', status.id)}
                  className={`px-3 py-2 rounded-full border-2 transition-all flex items-center gap-2 text-sm ${
                    criteria.familyStatus.includes(status.id)
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{status.icon}</span>
                  <span>{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <span>🎂</span> Tranche d'âge
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-600">De {criteria.ageRange.min} ans</label>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={criteria.ageRange.min}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      ageRange: { ...prev.ageRange, min: Number(e.target.value) },
                    }))
                  }
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600">À {criteria.ageRange.max} ans</label>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={criteria.ageRange.max}
                  onChange={(e) =>
                    setCriteria((prev) => ({
                      ...prev,
                      ageRange: { ...prev.ageRange, max: Number(e.target.value) },
                    }))
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium text-sm">
                {criteria.ageRange.min} - {criteria.ageRange.max} ans
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Résumé du ciblage</h4>
            <p className="text-sm text-gray-600 mt-1">
              {selectedZones.length} zone(s) • {criteria.propertyIntent.length} intention(s) •{' '}
              {criteria.propertyTypes.length} type(s) de bien
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ~{(estimatedReach / 1000).toFixed(0)}k
            </div>
            <div className="text-sm text-gray-500">prospects potentiels</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedTargeting;
