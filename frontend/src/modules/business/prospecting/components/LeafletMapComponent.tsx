import React from 'react';

interface Zone {
  id: string;
  name: string;
  type: 'city' | 'region' | 'radius' | 'polygon';
  coordinates?: { lat: number; lng: number };
  radius?: number;
  polygon?: { lat: number; lng: number }[];
  population?: number;
  avgPrice?: number;
  selected: boolean;
}

interface LeafletMapComponentProps {
  zones: Zone[];
  selectedZones: Zone[];
  onZoneClick: (zoneId: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  radiusMode: boolean;
  customRadius: number;
  heatmapEnabled: boolean;
}

// Simple zone selection component - replaces react-leaflet due to React 18 compatibility issues
const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({
  zones,
  onZoneClick,
  radiusMode,
}) => {
  // Group zones by area
  const tunisCityZones = zones.filter(z =>
    ['tunis', 'ariana', 'ben-arous', 'manouba', 'la-marsa', 'carthage'].includes(z.id) ||
    ['lac1', 'lac2', 'ennasr', 'menzah', 'manar', 'centre-ville', 'bardo', 'soukra'].includes(z.id)
  );
  const otherZones = zones.filter(z =>
    !tunisCityZones.some(tz => tz.id === z.id) && z.type !== 'radius'
  );
  const radiusZones = zones.filter(z => z.type === 'radius');

  return (
    <div className="h-[450px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 overflow-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          <span>🗺️</span>
          <span>Selection des zones</span>
        </div>
      </div>

      {/* Tunis & Greater Tunis Area */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>🏛️</span> Grand Tunis
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {tunisCityZones.map(zone => (
            <ZoneCard key={zone.id} zone={zone} onZoneClick={onZoneClick} />
          ))}
        </div>
      </div>

      {/* Other Cities */}
      {otherZones.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>🏙️</span> Autres villes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {otherZones.map(zone => (
              <ZoneCard key={zone.id} zone={zone} onZoneClick={onZoneClick} />
            ))}
          </div>
        </div>
      )}

      {/* Custom Radius Zones */}
      {radiusZones.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>⭕</span> Zones personnalisees
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {radiusZones.map(zone => (
              <ZoneCard key={zone.id} zone={zone} onZoneClick={onZoneClick} />
            ))}
          </div>
        </div>
      )}

      {radiusMode && (
        <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg text-center">
          <p className="text-sm text-orange-800">
            Le mode rayon n&apos;est pas disponible dans cette vue.
            <br />
            <span className="text-xs">Selectionnez des zones predefinies ci-dessus.</span>
          </p>
        </div>
      )}
    </div>
  );
};

// Zone card component
const ZoneCard: React.FC<{
  zone: Zone;
  onZoneClick: (zoneId: string) => void;
}> = ({ zone, onZoneClick }) => (
  <button
    onClick={() => onZoneClick(zone.id)}
    className={`p-2 rounded-lg text-left transition-all ${
      zone.selected
        ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
        : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-300'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm truncate">{zone.name}</span>
      {zone.selected && <span className="text-xs">✓</span>}
    </div>
    <div className={`text-xs mt-1 ${zone.selected ? 'text-blue-100' : 'text-gray-500'}`}>
      {zone.type === 'radius' && zone.radius ? (
        <span>⭕ {zone.radius}km</span>
      ) : zone.avgPrice ? (
        <span>💰 {(zone.avgPrice / 1000).toFixed(0)}k TND</span>
      ) : zone.population ? (
        <span>👥 {(zone.population / 1000).toFixed(0)}k</span>
      ) : null}
    </div>
  </button>
);

export default LeafletMapComponent;
