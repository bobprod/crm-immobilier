import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import {
  MapPin,
  Home,
  Bed,
  Bath,
  Eye,
  Maximize2,
  Minimize2,
  Layers,
  School,
  Building2,
  ShoppingCart,
  Bus,
  Utensils,
  Droplet,
} from 'lucide-react';
import type { Property } from '@/shared/utils/properties-api';

interface PropertyMapProps {
  properties: Property[];
  onPropertyClick?: (property: Property) => void;
  height?: string;
  center?: [number, number];
  zoom?: number;
  showNearbyPlaces?: boolean;
}

interface NearbyPlace {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'shop' | 'transport' | 'restaurant' | 'park';
  distance: number; // in km
  lat: number;
  lng: number;
}

// ── Map tile providers ────────────────────────────────────────────────────────
type TileProvider = {
  id: string;
  label: string;
  icon: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
};

const MAP_PROVIDERS: TileProvider[] = [
  {
    id: 'osm',
    label: 'Standard',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'carto-light',
    label: 'Clair',
    icon: '☀️',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  {
    id: 'carto-dark',
    label: 'Sombre',
    icon: '🌙',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  {
    id: 'esri-satellite',
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  {
    id: 'topo',
    label: 'Topo',
    icon: '⛰️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  {
    id: 'google',
    label: 'Google Maps',
    icon: '🌐',
    url: '',
    attribution: '© Google Maps',
    maxZoom: 22,
  },
];

// Sample nearby places database by Tunisian city
const NEARBY_PLACES_DB: Record<string, NearbyPlace[]> = {
  tunis: [
    { id: '1', name: 'Lycée Militaire', type: 'school', distance: 1.2, lat: 36.8065, lng: 10.1815 },
    { id: '2', name: 'Hôpital La Rabta', type: 'hospital', distance: 0.8, lat: 36.8, lng: 10.185 },
    {
      id: '3',
      name: 'Centre Commercial Carrefour',
      type: 'shop',
      distance: 0.5,
      lat: 36.81,
      lng: 10.18,
    },
    {
      id: '4',
      name: 'Station Metro Tunis',
      type: 'transport',
      distance: 0.3,
      lat: 36.806,
      lng: 10.183,
    },
    {
      id: '5',
      name: 'Restaurant Le Cosmos',
      type: 'restaurant',
      distance: 0.6,
      lat: 36.805,
      lng: 10.187,
    },
    { id: '6', name: 'Parc de Tunis', type: 'park', distance: 1.5, lat: 36.81, lng: 10.17 },
  ],
  ariana: [
    {
      id: '7',
      name: 'École Primaire Ariana',
      type: 'school',
      distance: 0.9,
      lat: 36.856,
      lng: 10.165,
    },
    {
      id: '8',
      name: 'Clinique Med Ariana',
      type: 'hospital',
      distance: 1.1,
      lat: 36.86,
      lng: 10.17,
    },
    { id: '9', name: 'Supermarché Monoprix', type: 'shop', distance: 0.7, lat: 36.85, lng: 10.16 },
    {
      id: '10',
      name: 'Gare Routière Ariana',
      type: 'transport',
      distance: 1.3,
      lat: 36.87,
      lng: 10.15,
    },
  ],
  'la-marsa': [
    { id: '11', name: 'Lycée Pilote', type: 'school', distance: 0.8, lat: 36.898, lng: 10.318 },
    { id: '12', name: 'Hôpital Manouba', type: 'hospital', distance: 2.1, lat: 36.91, lng: 10.31 },
    {
      id: '13',
      name: 'Port de La Marsa',
      type: 'transport',
      distance: 0.5,
      lat: 36.898,
      lng: 10.32,
    },
    { id: '14', name: 'Plage de La Marsa', type: 'park', distance: 0.2, lat: 36.898, lng: 10.318 },
  ],
};

const NEARBY_PLACE_ICONS: Record<string, React.ReactNode> = {
  school: <School className="h-4 w-4" />,
  hospital: <Building2 className="h-4 w-4" />,
  shop: <ShoppingCart className="h-4 w-4" />,
  transport: <Bus className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
  park: <Droplet className="h-4 w-4" />,
};

const NEARBY_PLACE_COLORS: Record<string, string> = {
  school: '#06b6d4', // cyan
  hospital: '#ef4444', // red
  shop: '#eab308', // yellow
  transport: '#8b5cf6', // purple
  restaurant: '#f97316', // orange
  park: '#22c55e', // green
};

const POI_EMOJI: Record<string, string> = {
  school: '🎓',
  hospital: '🏥',
  shop: '🛒',
  transport: '🚌',
  restaurant: '🍽️',
  park: '🌳',
};

const POI_LABELS: Record<string, string> = {
  school: 'École',
  hospital: 'Hôpital',
  shop: 'Commerce',
  transport: 'Transport',
  restaurant: 'Restaurant',
  park: 'Parc',
};

const STATUS_COLORS: Record<string, string> = {
  available: '#22c55e',
  reserved: '#eab308',
  sold: '#ef4444',
  rented: '#3b82f6',
  draft: '#9ca3af',
  pending: '#f97316',
  archived: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
  apartment: 'Appartement',
  house: 'Maison',
  villa: 'Villa',
  studio: 'Studio',
  land: 'Terrain',
  commercial: 'Commercial',
  office: 'Bureau',
  garage: 'Garage',
  other: 'Autre',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  sold: 'Vendu',
  rented: 'Loué',
  pending: 'En attente',
  draft: 'Brouillon',
  archived: 'Archivé',
};

export function PropertyMap({
  properties,
  onPropertyClick,
  height = '450px',
  center,
  zoom = 10,
  showNearbyPlaces = false,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const poiMarkersRef = useRef<any[]>([]);
  const tileLayerRef = useRef<any>(null);
  const layerMenuRef = useRef<HTMLDivElement>(null);
  const activeProviderRef = useRef<TileProvider>(MAP_PROVIDERS[0]);
  // Google Maps
  const gmapRef = useRef<HTMLDivElement>(null);
  const gmapInstance = useRef<any>(null);
  const gmapMarkersRef = useRef<any[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [poiVisible, setPoiVisible] = useState(showNearbyPlaces);
  const [activePoiTypes, setActivePoiTypes] = useState<Set<string>>(
    new Set(['school', 'hospital', 'shop', 'transport', 'restaurant', 'park'])
  );
  const [activeProvider, setActiveProvider] = useState<TileProvider>(MAP_PROVIDERS[0]);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [gmapsKey, setGmapsKey] = useState<string>('');

  // Charger la clé Google Maps depuis localStorage au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored =
      localStorage.getItem('crm_gmaps_key') || (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '');
    setGmapsKey(stored);
  }, []);

  // Filtrer les propriétés avec coordonnées
  const geoProperties = properties.filter(
    (p) => p.latitude && p.longitude && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    let L: any;
    const initMap = async () => {
      L = (await import('leaflet')).default;

      // Fix icon paths pour Leaflet avec webpack/next
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (mapInstance.current) {
        mapInstance.current.remove();
      }

      // Centre par défaut : Tunis
      const defaultCenter = center || [36.8065, 10.1815];

      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom,
        scrollWheelZoom: true,
      });

      const provider = activeProviderRef.current;
      tileLayerRef.current = L.tileLayer(
        provider.url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: provider.attribution,
          maxZoom: provider.maxZoom,
          ...(provider.subdomains ? { subdomains: provider.subdomains } : {}),
        }
      ).addTo(map);

      mapInstance.current = map;
      setMapReady(true);

      // Ajouter marqueurs
      const bounds: any[] = [];
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      geoProperties.forEach((property) => {
        const lat = property.latitude!;
        const lng = property.longitude!;
        const color = STATUS_COLORS[property.status] || '#6b7280';

        const icon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background: ${color};
            color: white;
            padding: 4px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 3px;
          ">
            ${property.isFeatured ? '⭐ ' : ''}${formatPrice(property.price)} ${property.currency || 'TND'}
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [50, 15],
        });

        const imageUrl = property.images?.[0]
          ? (property.images[0] as string).startsWith('http')
            ? property.images[0]
            : `http://localhost:3001${property.images[0]}`
          : null;

        const popup = L.popup({ maxWidth: 280, closeButton: true }).setContent(`
          <div style="font-family: system-ui; min-width: 220px;">
            ${imageUrl ? `<img src="${imageUrl}" style="width:100%;height:120px;object-fit:cover;border-radius:6px 6px 0 0;margin:-14px -20px 8px -20px;width:calc(100% + 40px);" onerror="this.style.display='none'" />` : ''}
            <div style="padding: 0 2px;">
              <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${escapeHtml(property.title)}</div>
              ${property.city ? `<div style="color:#6b7280;font-size:12px;margin-bottom:6px;">📍 ${escapeHtml(property.city)}${property.delegation ? ', ' + escapeHtml(property.delegation) : ''}</div>` : ''}
              <div style="display:flex;gap:8px;font-size:12px;color:#374151;margin-bottom:6px;">
                ${property.area ? `<span>📐 ${property.area} m²</span>` : ''}
                ${property.bedrooms ? `<span>🛏 ${property.bedrooms}</span>` : ''}
                ${property.bathrooms ? `<span>🚿 ${property.bathrooms}</span>` : ''}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;color:#7C3AED;font-size:15px;">${formatPrice(property.price)} TND</span>
                <span style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:11px;">${STATUS_LABELS[property.status] || property.status}</span>
              </div>
            </div>
          </div>
        `);

        const marker = L.marker([lat, lng], { icon }).addTo(map).bindPopup(popup);

        marker.on('click', () => {
          if (onPropertyClick) onPropertyClick(property);
        });

        markersRef.current.push(marker);
        bounds.push([lat, lng]);
      });

      // Ajuster la vue pour voir tous les marqueurs
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }

      // Ajouter les POI si activés
      if (poiVisible) {
        addPoiMarkers(L, map);
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [properties, expanded]);

  // Gérer les POI séparément pour pouvoir les toggle
  useEffect(() => {
    if (!mapInstance.current || typeof window === 'undefined') return;

    const loadAndToggle = async () => {
      const L = (await import('leaflet')).default;
      // Supprimer les anciens POI
      poiMarkersRef.current.forEach((m) => m.remove());
      poiMarkersRef.current = [];

      if (poiVisible) {
        addPoiMarkers(L, mapInstance.current);
      }
    };

    loadAndToggle();
  }, [poiVisible, activePoiTypes]);

  // Changer le fond de carte sans réinitialiser la vue
  useEffect(() => {
    activeProviderRef.current = activeProvider;
    if (!mapInstance.current || typeof window === 'undefined') return;

    if (activeProvider.id === 'google') return;

    setTimeout(() => mapInstance.current?.invalidateSize?.(), 100);

    const switchTile = async () => {
      const L = (await import('leaflet')).default;
      if (tileLayerRef.current) tileLayerRef.current.remove();
      tileLayerRef.current = L.tileLayer(activeProvider.url, {
        attribution: activeProvider.attribution,
        maxZoom: activeProvider.maxZoom,
        ...(activeProvider.subdomains ? { subdomains: activeProvider.subdomains } : {}),
      }).addTo(mapInstance.current);
    };

    switchTile();
  }, [activeProvider]);

  // Google Maps — initialisation et mise à jour des marqueurs
  useEffect(() => {
    if (activeProvider.id !== 'google' || !gmapsKey || typeof window === 'undefined') return;
    if (!gmapRef.current) return;

    const initGmap = async () => {
      if (!(window as any).google?.maps) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[data-gmaps]');
          if (existing) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${gmapsKey}`;
          script.setAttribute('data-gmaps', '1');
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Impossible de charger Google Maps'));
          document.head.appendChild(script);
        });
      }

      const G = (window as any).google.maps;
      const defaultCenter = center || [36.8065, 10.1815];

      if (!gmapInstance.current) {
        gmapInstance.current = new G.Map(gmapRef.current, {
          center: { lat: defaultCenter[0], lng: defaultCenter[1] },
          zoom,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
        });
      }

      const map = gmapInstance.current;
      gmapMarkersRef.current.forEach((m) => m.setMap(null));
      gmapMarkersRef.current = [];

      const bounds = new G.LatLngBounds();
      const infoWindowActive = new G.InfoWindow();

      geoProperties.forEach((property) => {
        const color = STATUS_COLORS[property.status] || '#6b7280';
        const marker = new G.Marker({
          position: { lat: property.latitude!, lng: property.longitude! },
          map,
          title: property.title,
          label: {
            text: formatPrice(property.price) + ' TND',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
          },
          icon: {
            path: G.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: 'white',
            strokeWeight: 2,
            scale: 14,
          },
        });

        const content = `
          <div style="font-family:system-ui;min-width:200px;">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${escapeHtml(property.title)}</div>
            ${property.city ? `<div style="color:#6b7280;font-size:12px;margin-bottom:6px;">📍 ${escapeHtml(property.city)}</div>` : ''}
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;color:#7C3AED;font-size:14px;">${formatPrice(property.price)} TND</span>
              <span style="background:${color};color:white;padding:2px 8px;border-radius:12px;font-size:11px;">${STATUS_LABELS[property.status] || property.status}</span>
            </div>
          </div>`;

        marker.addListener('click', () => {
          infoWindowActive.setContent(content);
          infoWindowActive.open(map, marker);
          if (onPropertyClick) onPropertyClick(property);
        });

        gmapMarkersRef.current.push(marker);
        bounds.extend({ lat: property.latitude!, lng: property.longitude! });
      });

      if (geoProperties.length > 0) map.fitBounds(bounds);
    };

    initGmap().catch(console.error);
  }, [activeProvider, gmapsKey, properties]);

  // Fermer le menu layers en cliquant ailleurs
  useEffect(() => {
    if (!layerMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (layerMenuRef.current && !layerMenuRef.current.contains(e.target as Node)) {
        setLayerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [layerMenuOpen]);

  function addPoiMarkers(L: any, map: any) {
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];

    // Déterminer les villes des propriétés visibles
    const cities = new Set(
      geoProperties.map((p) => (p.city || '').toLowerCase().replace(/\s+/g, '-')).filter(Boolean)
    );

    // Ajouter aussi "tunis" par défaut si pas de villes
    if (cities.size === 0) cities.add('tunis');

    cities.forEach((city) => {
      const places = NEARBY_PLACES_DB[city] || [];
      places
        .filter((place) => activePoiTypes.has(place.type))
        .forEach((place) => {
          const color = NEARBY_PLACE_COLORS[place.type] || '#6b7280';
          const icon = L.divIcon({
            className: 'poi-marker',
            html: `<div style="
              background: ${color};
              color: white;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              border: 2px solid white;
            ">${POI_EMOJI[place.type] || '📍'}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });

          const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(map)
            .bindPopup(
              `<div style="font-family:system-ui;padding:4px;">
                <strong>${escapeHtml(place.name)}</strong><br/>
                <span style="color:${color};font-size:12px;">${POI_LABELS[place.type] || place.type}</span>
                <span style="color:#6b7280;font-size:12px;"> · ${place.distance} km</span>
              </div>`
            );

          poiMarkersRef.current.push(marker);
        });
    });
  }

  if (geoProperties.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Aucune propriété géolocalisée.
            <br />
            <span className="text-xs">
              Ajoutez latitude/longitude à vos biens pour les voir sur la carte.
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            Carte — {geoProperties.length} bien(s) géolocalisé(s)
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* Sélecteur de fond de carte */}
          <div className="relative" ref={layerMenuRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 px-2"
              onClick={() => setLayerMenuOpen((v) => !v)}
              title="Changer le fond de carte"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{activeProvider.icon}</span>
              <span className="hidden sm:inline">{activeProvider.label}</span>
            </Button>
            {layerMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-[9999] bg-white border rounded-lg shadow-xl py-1 w-44 text-sm">
                <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b mb-1">
                  Fond de carte
                </div>
                {MAP_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                      activeProvider.id === p.id
                        ? 'font-semibold text-primary bg-primary/5'
                        : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setActiveProvider(p);
                      setLayerMenuOpen(false);
                    }}
                  >
                    <span className="text-base leading-none">{p.icon}</span>
                    <span className="flex-1 text-xs">{p.label}</span>
                    {activeProvider.id === p.id && <span className="text-primary text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant={poiVisible ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPoiVisible(!poiVisible)}
          >
            📍 POI
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      {poiVisible && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b bg-gray-50/50 flex-wrap">
          {Object.entries(POI_LABELS).map(([type, label]) => {
            const isActive = activePoiTypes.has(type);
            return (
              <button
                key={type}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                style={isActive ? { backgroundColor: NEARBY_PLACE_COLORS[type] } : {}}
                onClick={() => {
                  setActivePoiTypes((prev) => {
                    const next = new Set(prev);
                    if (next.has(type)) next.delete(type);
                    else next.add(type);
                    return next;
                  });
                }}
              >
                {POI_EMOJI[type]} {label}
              </button>
            );
          })}
        </div>
      )}
      {/* Leaflet container — masqué quand Google Maps est actif */}
      <div
        ref={mapRef}
        style={{
          height: expanded ? '700px' : height,
          width: '100%',
          display: activeProvider.id === 'google' ? 'none' : 'block',
        }}
      />
      {/* Google Maps container */}
      {activeProvider.id === 'google' &&
        (gmapsKey ? (
          <div ref={gmapRef} style={{ height: expanded ? '700px' : height, width: '100%' }} />
        ) : (
          <div
            style={{ height: expanded ? '700px' : height }}
            className="flex flex-col items-center justify-center text-center p-8 bg-gray-50"
          >
            <span className="text-5xl mb-3">🌐</span>
            <p className="font-semibold text-gray-700">Clé Google Maps non configurée</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Allez dans <strong>Intégrations → Google Maps</strong> pour ajouter votre clé API.
            </p>
          </div>
        ))}
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
    </Card>
  );
}

function formatPrice(price: number): string {
  if (price >= 1000000) return (price / 1000000).toFixed(1).replace('.0', '') + 'M';
  if (price >= 1000) return (price / 1000).toFixed(0) + 'K';
  return price.toString();
}

function escapeHtml(text: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (div) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text.replace(
    /[&<>"']/g,
    (m) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[m] || m
  );
}
