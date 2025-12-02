import React, { useEffect, useState } from 'react';

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

// Simple map component using static image as fallback for react-leaflet compatibility issues
const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({
  zones,
  selectedZones,
  onZoneClick,
  onMapClick,
  radiusMode,
  customRadius,
  heatmapEnabled,
}) => {
  const [mapError, setMapError] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);

  useEffect(() => {
    // Try to load react-leaflet dynamically
    const loadLeaflet = async () => {
      try {
        // Check if we're in browser
        if (typeof window === 'undefined') return;

        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix default icon issue
        const DefaultIcon = L.default.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        L.default.Marker.prototype.options.icon = DefaultIcon;

        // Try loading react-leaflet
        const rl = await import('react-leaflet');
        setLeafletComponents(rl);
      } catch (error) {
        console.error('[LeafletMap] Error loading leaflet:', error);
        setMapError(true);
      }
    };

    loadLeaflet();
  }, []);

  // If there's an error or components aren't loaded, show fallback
  if (mapError || !LeafletComponents) {
    return (
      <FallbackMapView
        zones={zones}
        selectedZones={selectedZones}
        onZoneClick={onZoneClick}
        radiusMode={radiusMode}
      />
    );
  }

  // Try to render the actual map with error boundary
  try {
    const { MapContainer, TileLayer, Marker, Circle, Popup } = LeafletComponents;
    const tunisiaCenter: [number, number] = [36.8, 10.18];

    return (
      <div className="relative">
        <MapContainer
          center={tunisiaCenter}
          zoom={10}
          style={{ height: '450px', width: '100%', borderRadius: '0.5rem' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render zone markers */}
          {zones
            .filter(zone => zone.coordinates && zone.type !== 'radius')
            .map(zone => (
              <Marker
                key={zone.id}
                position={[zone.coordinates!.lat, zone.coordinates!.lng]}
                eventHandlers={{
                  click: () => onZoneClick(zone.id),
                }}
              >
                <Popup>
                  <div className="min-w-[150px]">
                    <h3 className="font-bold text-gray-900">{zone.name}</h3>
                    {zone.population && (
                      <p className="text-sm text-gray-600">
                        Population: {(zone.population / 1000).toFixed(0)}k
                      </p>
                    )}
                    {zone.avgPrice && (
                      <p className="text-sm text-green-600">
                        Prix moyen: {(zone.avgPrice / 1000).toFixed(0)}k TND
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Render radius zones */}
          {zones
            .filter(zone => zone.type === 'radius' && zone.coordinates && zone.radius)
            .map(zone => (
              <Circle
                key={zone.id}
                center={[zone.coordinates!.lat, zone.coordinates!.lng]}
                radius={zone.radius! * 1000}
                pathOptions={{
                  color: zone.selected ? '#3b82f6' : '#9ca3af',
                  fillColor: zone.selected ? '#3b82f6' : '#9ca3af',
                  fillOpacity: zone.selected ? 0.3 : 0.1,
                  weight: 2,
                }}
                eventHandlers={{
                  click: () => onZoneClick(zone.id),
                }}
              />
            ))}
        </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('[LeafletMap] Error rendering map:', error);
    return (
      <FallbackMapView
        zones={zones}
        selectedZones={selectedZones}
        onZoneClick={onZoneClick}
        radiusMode={radiusMode}
      />
    );
  }
};

// Fallback component that shows zones in a visual grid layout
const FallbackMapView: React.FC<{
  zones: Zone[];
  selectedZones: Zone[];
  onZoneClick: (zoneId: string) => void;
  radiusMode: boolean;
}> = ({ zones, selectedZones, onZoneClick, radiusMode }) => {
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
          <span>Vue simplifiée des zones</span>
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
            <span>⭕</span> Zones personnalisées
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
            ⚠️ Le mode rayon nécessite la carte interactive.
            <br />
            <span className="text-xs">Basculez vers la vue liste pour sélectionner des zones prédéfinies.</span>
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
