'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { School, Building2, ShoppingCart, Bus, Utensils, Droplet, MapPin } from 'lucide-react';

interface NearbyPlace {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'shop' | 'transport' | 'restaurant' | 'park';
  distance: number; // in km
  address?: string;
}

interface NearbyPlacesProps {
  city?: string;
  latitude?: number;
  longitude?: number;
}

// Database of nearby places by city
const NEARBY_PLACES_DB: Record<string, NearbyPlace[]> = {
  tunis: [
    {
      id: '1',
      name: 'Lycée Militaire',
      type: 'school',
      distance: 1.2,
      address: 'Avenue de la Liberté',
    },
    {
      id: '2',
      name: 'Hôpital La Rabta',
      type: 'hospital',
      distance: 0.8,
      address: 'Rue Mongi Slim',
    },
    {
      id: '3',
      name: 'Carrefour Tunis',
      type: 'shop',
      distance: 0.5,
      address: 'Avenue Habib Bourguiba',
    },
    {
      id: '4',
      name: 'Station Metro Tunis',
      type: 'transport',
      distance: 0.3,
      address: "Place de l'Indépendance",
    },
    {
      id: '5',
      name: 'Restaurant Le Cosmos',
      type: 'restaurant',
      distance: 0.6,
      address: 'Rue de Marseille',
    },
    { id: '6', name: 'Parc de Tunis', type: 'park', distance: 1.5, address: 'Rue Bab Bnet' },
  ],
  ariana: [
    {
      id: '7',
      name: 'École Primaire Ariana',
      type: 'school',
      distance: 0.9,
      address: 'Ariana Ville',
    },
    {
      id: '8',
      name: 'Clinique Medical Ariana',
      type: 'hospital',
      distance: 1.1,
      address: 'Rue Ali Mami',
    },
    { id: '9', name: 'Monoprix Ariana', type: 'shop', distance: 0.7, address: 'Centre Commercial' },
    {
      id: '10',
      name: 'Gare Routière Ariana',
      type: 'transport',
      distance: 1.3,
      address: 'Route de Tunis',
    },
  ],
  'la-marsa': [
    { id: '11', name: 'Lycée Pilote La Marsa', type: 'school', distance: 0.8, address: 'La Marsa' },
    { id: '12', name: 'Hôpital Manouba', type: 'hospital', distance: 2.1, address: 'Manouba' },
    {
      id: '13',
      name: 'Port de La Marsa',
      type: 'transport',
      distance: 0.5,
      address: 'Bab Saadoun',
    },
    { id: '14', name: 'Plage de La Marsa', type: 'park', distance: 0.2, address: 'Bord de Mer' },
  ],
  hammamet: [
    { id: '15', name: 'École Intercommunale', type: 'school', distance: 1.0, address: 'Hammamet' },
    {
      id: '16',
      name: 'Hôpital Régional Hammamet',
      type: 'hospital',
      distance: 1.5,
      address: 'Avenue des Martyrs',
    },
    { id: '17', name: 'Souk Hammamet', type: 'shop', distance: 0.3, address: 'Médina' },
    { id: '18', name: 'Gare Hammamet', type: 'transport', distance: 0.8, address: 'Centre-Ville' },
    {
      id: '19',
      name: 'Restaurant Dar Ya',
      type: 'restaurant',
      distance: 0.5,
      address: 'Rue Ennakhel',
    },
    { id: '20', name: 'Plage Hammamet', type: 'park', distance: 0.1, address: 'Côte' },
  ],
  sfax: [
    { id: '21', name: 'Lycée Ibn Khaldoun', type: 'school', distance: 1.3, address: 'Sfax Centre' },
    {
      id: '22',
      name: 'Hôpital Habib Bourguiba',
      type: 'hospital',
      distance: 0.9,
      address: 'Rue de Ryadh',
    },
    { id: '23', name: 'Souk Sfax', type: 'shop', distance: 0.2, address: 'Médina' },
    {
      id: '24',
      name: 'Gare de Sfax',
      type: 'transport',
      distance: 1.1,
      address: 'Avenue de la République',
    },
  ],
  gabes: [
    { id: '25', name: 'Lycée Ghazi Glaïd', type: 'school', distance: 1.2, address: 'Gabès' },
    {
      id: '26',
      name: 'Hôpital Régional Gabès',
      type: 'hospital',
      distance: 1.4,
      address: "Avenue de l'Environnement",
    },
    { id: '27', name: 'Marché Central', type: 'shop', distance: 0.4, address: 'Centre-Ville' },
    { id: '28', name: 'Gare SNCFT', type: 'transport', distance: 0.8, address: 'Avenue Bourguiba' },
  ],
};

const PLACE_TYPE_LABELS: Record<string, string> = {
  school: 'Écoles',
  hospital: 'Santé',
  shop: 'Commerces',
  transport: 'Transport',
  restaurant: 'Restauration',
  park: 'Parc/Loisirs',
};

const PLACE_TYPE_ICONS: Record<string, React.ReactNode> = {
  school: <School className="h-4 w-4" />,
  hospital: <Building2 className="h-4 w-4" />,
  shop: <ShoppingCart className="h-4 w-4" />,
  transport: <Bus className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
  park: <Droplet className="h-4 w-4" />,
};

const PLACE_TYPE_COLORS: Record<string, string> = {
  school: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  hospital: 'bg-red-100 text-red-800 border-red-300',
  shop: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  transport: 'bg-purple-100 text-purple-800 border-purple-300',
  restaurant: 'bg-orange-100 text-orange-800 border-orange-300',
  park: 'bg-green-100 text-green-800 border-green-300',
};

export const NearbyPlaces: React.FC<NearbyPlacesProps> = ({
  city = 'tunis',
  latitude,
  longitude,
}) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | string>('all');

  useEffect(() => {
    const cityKey = city?.toLowerCase().replace(/\s+/g, '-') || 'tunis';
    const placesForCity = NEARBY_PLACES_DB[cityKey] || NEARBY_PLACES_DB['tunis'];
    setPlaces(placesForCity);
    setActiveTab('all');
  }, [city]);

  const placesByType = Array.from(
    places.reduce((acc, place) => {
      if (!acc.has(place.type)) {
        acc.set(place.type, []);
      }
      acc.get(place.type)!.push(place);
      return acc;
    }, new Map<string, NearbyPlace[]>())
  )
    .map(([type, typePlaces]) => ({
      type: type as keyof typeof PLACE_TYPE_LABELS,
      places: typePlaces.sort((a, b) => a.distance - b.distance),
    }))
    .sort((a, b) => {
      const order = ['school', 'hospital', 'shop', 'transport', 'restaurant', 'park'];
      return order.indexOf(a.type) - order.indexOf(b.type);
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Lieux à proximité — {city}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="all" className="text-xs lg:text-sm">
              Tous ({places.length})
            </TabsTrigger>
            {placesByType.map((category) => (
              <TabsTrigger key={category.type} value={category.type} className="text-xs lg:text-sm">
                {PLACE_TYPE_LABELS[category.type]} ({category.places.length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-3 mt-4">
            {places.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun lieu à proximité trouvé pour cette localité.</p>
              </div>
            ) : (
              places
                .sort((a, b) => a.distance - b.distance)
                .map((place) => (
                  <div
                    key={place.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${PLACE_TYPE_COLORS[place.type]}`}
                  >
                    <div className="mt-1 flex-shrink-0">{PLACE_TYPE_ICONS[place.type]}</div>
                    <div className="flex-grow min-w-0">
                      <div className="font-semibold text-sm">{place.name}</div>
                      {place.address && <div className="text-xs opacity-75">{place.address}</div>}
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 whitespace-nowrap">
                      {place.distance.toFixed(1)} km
                    </Badge>
                  </div>
                ))
            )}
          </TabsContent>

          {placesByType.map((category) => (
            <TabsContent key={category.type} value={category.type} className="space-y-3 mt-4">
              {category.places.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">Aucun {PLACE_TYPE_LABELS[category.type].toLowerCase()}</p>
                </div>
              ) : (
                category.places.map((place) => (
                  <div
                    key={place.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${PLACE_TYPE_COLORS[place.type]}`}
                  >
                    <div className="mt-1 flex-shrink-0">{PLACE_TYPE_ICONS[place.type]}</div>
                    <div className="flex-grow min-w-0">
                      <div className="font-semibold text-sm">{place.name}</div>
                      {place.address && <div className="text-xs opacity-75">{place.address}</div>}
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 whitespace-nowrap">
                      {place.distance.toFixed(1)} km
                    </Badge>
                  </div>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 text-xs text-gray-500 italic">
          💡 Les distances sont estimées à partir du centre-ville. Consultez Google Maps pour des
          distances précises.
        </div>
      </CardContent>
    </Card>
  );
};
