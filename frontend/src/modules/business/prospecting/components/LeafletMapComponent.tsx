import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icones Leaflet avec Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const SelectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const UnselectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

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

// Composant pour gerer les evenements de la carte
const MapEvents: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
  radiusMode: boolean;
}> = ({ onMapClick, radiusMode }) => {
  useMapEvents({
    click: (e) => {
      if (radiusMode) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

// Composant pour afficher le curseur de rayon
const RadiusCursor: React.FC<{ customRadius: number }> = ({ customRadius }) => {
  const map = useMap();
  const cursorRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.setLatLng(e.latlng);
      } else {
        cursorRef.current = L.circle(e.latlng, {
          radius: customRadius * 1000,
          color: '#f97316',
          fillColor: '#f97316',
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
      }
    };

    map.on('mousemove', handleMouseMove);
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('mousemove', handleMouseMove);
      map.getContainer().style.cursor = '';
      if (cursorRef.current) {
        map.removeLayer(cursorRef.current);
        cursorRef.current = null;
      }
    };
  }, [map, customRadius]);

  return null;
};

// Composant pour la heatmap simple (sans plugin externe)
const SimpleHeatmap: React.FC<{ zones: Zone[] }> = ({ zones }) => {
  const map = useMap();

  useEffect(() => {
    const heatCircles: L.Circle[] = [];

    zones.forEach(zone => {
      if (zone.coordinates && zone.population) {
        const intensity = Math.min(zone.population / 500000, 1);
        const radius = 5000 + (intensity * 15000);

        const circle = L.circle([zone.coordinates.lat, zone.coordinates.lng], {
          radius,
          color: 'transparent',
          fillColor: `hsl(${(1 - intensity) * 60}, 100%, 50%)`,
          fillOpacity: 0.3,
        }).addTo(map);

        heatCircles.push(circle);
      }
    });

    return () => {
      heatCircles.forEach(circle => map.removeLayer(circle));
    };
  }, [map, zones]);

  return null;
};

// Error boundary wrapper for the map
class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[LeafletMap] Error rendering map:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const LeafletMapComponent: React.FC<LeafletMapComponentProps> = ({
  zones,
  selectedZones,
  onZoneClick,
  onMapClick,
  radiusMode,
  customRadius,
  heatmapEnabled,
}) => {
  // Centre de la Tunisie
  const tunisiaCenter: [number, number] = [36.8, 10.18];
  const [mapReady, setMapReady] = React.useState(false);

  React.useEffect(() => {
    // Ensure we're on client side
    if (typeof window !== 'undefined') {
      setMapReady(true);
    }
  }, []);

  if (!mapReady) {
    return (
      <div className="h-[450px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Initialisation de la carte...</p>
      </div>
    );
  }

  const fallbackMap = (
    <div className="h-[450px] bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-2">Carte temporairement indisponible</p>
        <p className="text-sm text-gray-500">Les zones peuvent être sélectionnées dans la liste</p>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <MapErrorBoundary fallback={fallbackMap}>
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

        {/* Gestion des evenements */}
        <MapEvents onMapClick={onMapClick} radiusMode={radiusMode} />

        {/* Curseur de rayon en mode rayon */}
        {radiusMode && <RadiusCursor customRadius={customRadius} />}

        {/* Heatmap */}
        {heatmapEnabled && <SimpleHeatmap zones={zones} />}

        {/* Marqueurs des villes */}
        {zones
          .filter(zone => zone.coordinates && zone.type !== 'radius')
          .map(zone => (
            <Marker
              key={zone.id}
              position={[zone.coordinates!.lat, zone.coordinates!.lng]}
              icon={zone.selected ? SelectedIcon : UnselectedIcon}
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
                  <button
                    onClick={() => onZoneClick(zone.id)}
                    className={`mt-2 w-full px-3 py-1 rounded text-sm font-medium ${
                      zone.selected
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {zone.selected ? 'Deselectionner' : 'Selectionner'}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Cercles pour les zones de rayon */}
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
            >
              <Popup>
                <div className="min-w-[150px]">
                  <h3 className="font-bold text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-600">Rayon: {zone.radius}km</p>
                  {zone.population && (
                    <p className="text-sm text-gray-600">
                      Portee estimee: ~{(zone.population / 1000).toFixed(0)}k
                    </p>
                  )}
                  <button
                    onClick={() => onZoneClick(zone.id)}
                    className={`mt-2 w-full px-3 py-1 rounded text-sm font-medium ${
                      zone.selected
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                  >
                    {zone.selected ? 'Deselectionner' : 'Selectionner'}
                  </button>
                </div>
              </Popup>
            </Circle>
          ))}

        {/* Cercles de selection pour les villes selectionnees */}
        {selectedZones
          .filter(zone => zone.type !== 'radius' && zone.coordinates)
          .map(zone => (
            <Circle
              key={`selection-${zone.id}`}
              center={[zone.coordinates!.lat, zone.coordinates!.lng]}
              radius={3000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '5, 5',
              }}
            />
          ))}
        </MapContainer>
      </MapErrorBoundary>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Legende</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Zone selectionnee</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Zone disponible</span>
          </div>
          {radiusMode && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 opacity-50"></div>
              <span>Mode rayon actif</span>
            </div>
          )}
        </div>
      </div>

      {/* Zoom controls info */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 z-[1000] text-xs text-gray-600">
        Scroll pour zoomer
      </div>
    </div>
  );
};

export default LeafletMapComponent;
