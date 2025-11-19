import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Building2, MapPin, Euro, Calendar, Plus } from 'lucide-react';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  address: string;
  type: 'house' | 'apartment' | 'land' | 'commercial';
  status: 'available' | 'sold' | 'rented';
  surface: number;
  rooms: number;
  createdAt: string;
}

export function PropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'house':
        return 'Maison';
      case 'apartment':
        return 'Appartement';
      case 'land':
        return 'Terrain';
      case 'commercial':
        return 'Commercial';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Propriétés</h1>
        <Link href="/properties/new">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouvelle propriété</span>
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <Card key={property.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{property.title}</CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                  {property.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">{getTypeLabel(property.type)}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{property.address}</span>
              </div>

              <div className="flex items-center space-x-2 text-gray-600">
                <Euro className="h-4 w-4" />
                <span className="text-lg font-semibold text-green-600">
                  {property.price.toLocaleString('fr-FR')} €
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{property.surface} m²</span>
                <span>{property.rooms} pièces</span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>

              <div className="flex items-center space-x-2 text-gray-500 text-xs">
                <Calendar className="h-3 w-3" />
                <span>Ajouté le {new Date(property.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>

              <div className="flex space-x-2 pt-4">
                <Link href={`/properties/${property.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Voir détails
                  </Button>
                </Link>
                <Link href={`/properties/${property.id}/edit`} className="flex-1">
                  <Button size="sm" className="w-full">
                    Modifier
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune propriété</h3>
          <p className="mt-1 text-sm text-gray-500">Commencez par ajouter votre première propriété.</p>
          <div className="mt-6">
            <Link href="/properties/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle propriété
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
