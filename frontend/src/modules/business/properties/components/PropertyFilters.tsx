import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Search, X, MapPin, Navigation } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

interface PropertyFiltersProps {
  onFilterChange: (filters: any) => void;
}

// Villes tunisiennes courantes pour l'autocomplétion
const TUNISIAN_CITIES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Le Kef',
  'Siliana',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Gafsa',
  'Tozeur',
  'Kébili',
  'Gabès',
  'Médenine',
  'Tataouine',
  'La Marsa',
  'Carthage',
  'Sidi Bou Saïd',
  'Hammamet',
  'Gammarth',
  'Lac 1',
  'Lac 2',
  'Les Berges du Lac',
  'Ennasr',
  'El Menzah',
  'El Manar',
  'Mutuelle Ville',
  'Centre Urbain Nord',
];

export function PropertyFilters({ onFilterChange }: PropertyFiltersProps) {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    priority: 'all',
    category: 'all',
    city: '',
    minPrice: '',
    maxPrice: '',
  });
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geoLocating, setGeoLocating] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Fermer suggestions au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCityChange = (value: string) => {
    const newFilters = { ...filters, city: value };
    setFilters(newFilters);
    if (value.length >= 2) {
      const matches = TUNISIAN_CITIES.filter((c) => c.toLowerCase().includes(value.toLowerCase()));
      setCitySuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
    // N'envoyer le filtre que si la ville est vide ou assez longue
    if (value === '' || value.length >= 2) {
      onFilterChange(newFilters);
    }
  };

  const selectCity = (city: string) => {
    const newFilters = { ...filters, city };
    setFilters(newFilters);
    setShowSuggestions(false);
    onFilterChange(newFilters);
  };

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newFilters = {
          ...filters,
          nearLat: position.coords.latitude.toString(),
          nearLng: position.coords.longitude.toString(),
          nearRadius: '5',
        };
        setFilters(newFilters as any);
        onFilterChange(newFilters);
        setGeoLocating(false);
      },
      () => setGeoLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [filters, onFilterChange]);

  const clearFilters = () => {
    const reset = {
      search: '',
      type: 'all',
      status: 'all',
      priority: 'all',
      category: 'all',
      city: '',
      minPrice: '',
      maxPrice: '',
    };
    setFilters(reset);
    onFilterChange(reset);
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Rechercher..."
              className="pl-9"
              value={filters.search}
              onChange={(e) => handleChange('search', e.target.value)}
            />
          </div>

          {/* City autocomplete */}
          <div className="relative" ref={cityRef}>
            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Ville..."
              className="pl-9 pr-9"
              value={filters.city}
              onChange={(e) => handleCityChange(e.target.value)}
              onFocus={() =>
                filters.city.length >= 2 && citySuggestions.length > 0 && setShowSuggestions(true)
              }
            />
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={geoLocating}
              className="absolute right-2 top-2 text-gray-400 hover:text-primary"
              title="Ma position"
            >
              <Navigation className={`h-4 w-4 ${geoLocating ? 'animate-spin' : ''}`} />
            </button>
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {citySuggestions.map((city) => (
                  <button
                    key={city}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => selectCity(city)}
                  >
                    <MapPin className="h-3 w-3 text-gray-400" /> {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Type */}
          <Select value={filters.type} onValueChange={(value) => handleChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Type de bien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="apartment">Appartement</SelectItem>
              <SelectItem value="house">Maison</SelectItem>
              <SelectItem value="villa">Villa</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="land">Terrain</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="office">Bureau</SelectItem>
            </SelectContent>
          </Select>

          {/* Category */}
          <Select
            value={filters.category}
            onValueChange={(value) => handleChange('category', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="sale">Vente</SelectItem>
              <SelectItem value="rent">Location</SelectItem>
              <SelectItem value="vacation_rental">Location saisonnière</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select value={filters.status} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="reserved">Réservé</SelectItem>
              <SelectItem value="sold">Vendu</SelectItem>
              <SelectItem value="rented">Loué</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority */}
          <Select
            value={filters.priority}
            onValueChange={(value) => handleChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
              <SelectItem value="medium">Moyenne</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Range */}
          <Input
            type="number"
            placeholder="Prix min"
            value={filters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
          />
          <Input
            type="number"
            placeholder="Prix max"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
          />

          {/* Actions */}
          <div className="flex items-center gap-2 lg:col-span-2 justify-end">
            <Button variant="outline" onClick={clearFilters} className="w-full sm:w-auto">
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
