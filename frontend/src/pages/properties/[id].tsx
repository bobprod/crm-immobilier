import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, MapPin, Home, DollarSign } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  surface: number;
  rooms: number;
  address: string;
  city: string;
  description: string;
  status: string;
  images: string[];
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      const response = await fetch(`/api/properties/${id}`);
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error('Erreur chargement bien:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!property) return <div>Bien non trouvé</div>;

  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <img
                src={property.images[0] || '/placeholder.jpg'}
                alt={property.title}
                className="w-full h-96 object-cover rounded-lg"
              />
            </CardContent>
          </Card>
        </div>

        {/* Informations principales */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{property.title}</CardTitle>
              <Badge>{property.type}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-2xl font-bold">{property.price.toLocaleString()} €</span>
              </div>

              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                <span>{property.surface} m² - {property.rooms} pièces</span>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>{property.address}, {property.city}</span>
              </div>

              <div className="pt-4">
                <p className="text-gray-600">{property.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
