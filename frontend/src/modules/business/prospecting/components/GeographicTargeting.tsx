import React, { useState, useCallback, useEffect } from 'react';

// Types pour le ciblage geographique
interface Zone {
  id: string;
  name: string;
  type: 'city' | 'region' | 'radius' | 'polygon';
  coordinates?: { lat: number; lng: number };
  radius?: number; // en km
  polygon?: { lat: number; lng: number }[];
  population?: number;
  avgPrice?: number;
  selected: boolean;
}

interface GeographicTargetingProps {
  onZonesChange: (zones: Zone[]) => void;
  initialZones?: Zone[];
}

// Donnees des zones tunisiennes
const TUNISIAN_REGIONS: Zone[] = [
  { id: 'tunis', name: 'Tunis', type: 'city', coordinates: { lat: 36.8065, lng: 10.1815 }, population: 1056247, avgPrice: 350000, selected: false },
  { id: 'ariana', name: 'Ariana', type: 'city', coordinates: { lat: 36.8663, lng: 10.1647 }, population: 576088, avgPrice: 280000, selected: false },
  { id: 'ben-arous', name: 'Ben Arous', type: 'city', coordinates: { lat: 36.7531, lng: 10.2189 }, population: 631842, avgPrice: 220000, selected: false },
  { id: 'manouba', name: 'Manouba', type: 'city', coordinates: { lat: 36.8101, lng: 10.0863 }, population: 379518, avgPrice: 180000, selected: false },
  { id: 'la-marsa', name: 'La Marsa', type: 'city', coordinates: { lat: 36.8783, lng: 10.3242 }, population: 92987, avgPrice: 550000, selected: false },
  { id: 'carthage', name: 'Carthage', type: 'city', coordinates: { lat: 36.8528, lng: 10.3233 }, population: 21276, avgPrice: 650000, selected: false },
  { id: 'sousse', name: 'Sousse', type: 'city', coordinates: { lat: 35.8288, lng: 10.6405 }, population: 271428, avgPrice: 200000, selected: false },
  { id: 'sfax', name: 'Sfax', type: 'city', coordinates: { lat: 34.7406, lng: 10.7603 }, population: 330440, avgPrice: 180000, selected: false },
  { id: 'hammamet', name: 'Hammamet', type: 'city', coordinates: { lat: 36.4000, lng: 10.6167 }, population: 97579, avgPrice: 320000, selected: false },
  { id: 'nabeul', name: 'Nabeul', type: 'city', coordinates: { lat: 36.4561, lng: 10.7376 }, population: 79628, avgPrice: 190000, selected: false },
  { id: 'bizerte', name: 'Bizerte', type: 'city', coordinates: { lat: 37.2744, lng: 9.8739 }, population: 142966, avgPrice: 150000, selected: false },
  { id: 'monastir', name: 'Monastir', type: 'city', coordinates: { lat: 35.7643, lng: 10.8113 }, population: 104535, avgPrice: 210000, selected: false },
];

const QUARTIERS_TUNIS: Zone[] = [
  { id: 'lac1', name: 'Les Berges du Lac 1', type: 'city', coordinates: { lat: 36.8350, lng: 10.2350 }, avgPrice: 450000, selected: false },
  { id: 'lac2', name: 'Les Berges du Lac 2', type: 'city', coordinates: { lat: 36.8450, lng: 10.2550 }, avgPrice: 380000, selected: false },
  { id: 'ennasr', name: 'Ennasr', type: 'city', coordinates: { lat: 36.8550, lng: 10.1750 }, avgPrice: 320000, selected: false },
  { id: 'menzah', name: 'El Menzah', type: 'city', coordinates: { lat: 36.8350, lng: 10.1450 }, avgPrice: 280000, selected: false },
  { id: 'manar', name: 'El Manar', type: 'city', coordinates: { lat: 36.8450, lng: 10.1350 }, avgPrice: 300000, selected: false },
  { id: 'centre-ville', name: 'Centre Ville', type: 'city', coordinates: { lat: 36.8000, lng: 10.1800 }, avgPrice: 250000, selected: false },
  { id: 'bardo', name: 'Le Bardo', type: 'city', coordinates: { lat: 36.8089, lng: 10.1347 }, avgPrice: 200000, selected: false },
  { id: 'soukra', name: 'La Soukra', type: 'city', coordinates: { lat: 36.8650, lng: 10.1950 }, avgPrice: 350000, selected: false },
];

export const GeographicTargeting: React.FC<GeographicTargetingProps> = ({
  onZonesChange,
  initialZones = [],
}) => {
  const [zones, setZones] = useState<Zone[]>([...TUNISIAN_REGIONS, ...QUARTIERS_TUNIS]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZones, setSelectedZones] = useState<Zone[]>(initialZones);
  const [radiusMode, setRadiusMode] = useState(false);
  const [customRadius, setCustomRadius] = useState(5);
  const [centerPoint, setCenterPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [priceFilter, setPriceFilter] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 });

  // Filtrer les zones par recherche
  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!zone.avgPrice || (zone.avgPrice >= priceFilter.min && zone.avgPrice <= priceFilter.max))
  );

  // Toggle selection d'une zone
  const toggleZone = useCallback((zoneId: string) => {
    setZones(prev => prev.map(z =>
      z.id === zoneId ? { ...z, selected: !z.selected } : z
    ));
  }, []);

  // Mettre a jour les zones selectionnees
  useEffect(() => {
    const selected = zones.filter(z => z.selected);
    setSelectedZones(selected);
    onZonesChange(selected);
  }, [zones, onZonesChange]);

  // Ajouter une zone de rayon personnalise
  const addRadiusZone = useCallback(() => {
    if (!centerPoint) return;

    const newZone: Zone = {
      id: `radius-${Date.now()}`,
      name: `Rayon ${customRadius}km`,
      type: 'radius',
      coordinates: centerPoint,
      radius: customRadius,
      selected: true,
    };

    setZones(prev => [...prev, newZone]);
    setRadiusMode(false);
    setCenterPoint(null);
  }, [centerPoint, customRadius]);

  // Estimation du reach
  const estimatedReach = selectedZones.reduce((sum, z) => sum + (z.population || 50000), 0);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📍</span> Ciblage Geographique
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Selectionnez les zones pour votre prospection
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{selectedZones.length}</div>
            <div className="text-blue-100 text-sm">zones selectionnees</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une ville, quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📋 Liste
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🗺️ Carte
            </button>
          </div>

          {/* Radius mode */}
          <button
            onClick={() => setRadiusMode(!radiusMode)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              radiusMode
                ? 'bg-orange-500 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
            }`}
          >
            ⭕ Zone par rayon
          </button>
        </div>

        {/* Radius configuration */}
        {radiusMode && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-medium text-orange-800 mb-3">Configurer une zone circulaire</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Point central</label>
                <select
                  onChange={(e) => {
                    const zone = zones.find(z => z.id === e.target.value);
                    if (zone?.coordinates) setCenterPoint(zone.coordinates);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Choisir un point...</option>
                  {zones.filter(z => z.coordinates).map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Rayon: {customRadius} km</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={addRadiusZone}
                  disabled={!centerPoint}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  Ajouter la zone
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price filter */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-600">Filtrer par prix moyen:</span>
          <input
            type="number"
            placeholder="Min"
            value={priceFilter.min || ''}
            onChange={(e) => setPriceFilter(prev => ({ ...prev, min: Number(e.target.value) }))}
            className="w-24 px-2 py-1 border rounded text-sm"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceFilter.max || ''}
            onChange={(e) => setPriceFilter(prev => ({ ...prev, max: Number(e.target.value) }))}
            className="w-24 px-2 py-1 border rounded text-sm"
          />
          <span className="text-sm text-gray-500">TND</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'list' ? (
          /* List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredZones.map(zone => (
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
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      {zone.type === 'radius' ? (
                        <span>⭕ Rayon {zone.radius}km</span>
                      ) : (
                        <span>📍 {zone.type === 'city' ? 'Ville' : 'Region'}</span>
                      )}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    zone.selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}>
                    {zone.selected && <span className="text-white text-sm">✓</span>}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  {zone.population && (
                    <span className="text-gray-600">
                      👥 {(zone.population / 1000).toFixed(0)}k hab.
                    </span>
                  )}
                  {zone.avgPrice && (
                    <span className="text-green-600 font-medium">
                      💰 {(zone.avgPrice / 1000).toFixed(0)}k TND moy.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Map View - Placeholder for actual map integration */
          <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-600">
                  Integration carte (Leaflet/Mapbox)
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Cliquez sur la carte pour selectionner des zones
                </p>
              </div>
            </div>
            {/* Simulated map pins */}
            <div className="absolute inset-0 pointer-events-none">
              {selectedZones.map((zone, idx) => (
                <div
                  key={zone.id}
                  className="absolute w-8 h-8 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    left: `${20 + (idx * 15) % 60}%`,
                    top: `${20 + (idx * 20) % 60}%`,
                  }}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected zones summary */}
      {selectedZones.length > 0 && (
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Zones selectionnees</h4>
            <button
              onClick={() => setZones(prev => prev.map(z => ({ ...z, selected: false })))}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Tout deselectionner
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedZones.map(zone => (
              <span
                key={zone.id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {zone.name}
                <button
                  onClick={() => toggleZone(zone.id)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">Portee estimee:</span>
              <span className="font-bold text-blue-900">
                ~{(estimatedReach / 1000).toFixed(0)}k personnes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeographicTargeting;
