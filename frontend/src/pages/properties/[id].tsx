import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { ArrowLeft, MapPin, Home, DollarSign, Tag, AlertCircle, FileText, User } from 'lucide-react';
import { propertiesAPI } from '@/shared/utils/properties-api';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  description: string;
  status: string;
  images: string[];
  priority?: string;
  tags?: string[];
  notes?: string;
  ownerId?: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  netPrice?: number;
  fees?: number;
  feesPercentage?: number;
  createdAt: string;
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      const data = await propertiesAPI.getById(id as string);
      setProperty(data as any);
    } catch (error) {
      console.error('Erreur chargement bien:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </Layout>
  );

  if (!property) return (
    <Layout>
      <div className="flex items-center justify-center p-8 text-red-500">
        Bien non trouvé
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/properties/${id}/edit`)}>
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Images */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <img
                  src={property.images?.[0] || '/placeholder.jpg'}
                  alt={property.title}
                  className="w-full h-96 object-cover"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-line">{property.description}</p>
              </CardContent>
            </Card>

            {property.notes && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardHeader>
                  <CardTitle className="text-yellow-800 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Notes Internes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-yellow-900">{property.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informations principales */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{property.title}</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{property.type}</Badge>
                      <Badge className={getPriorityColor(property.priority)}>
                        {property.priority || 'medium'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 text-2xl font-bold text-primary">
                  <DollarSign className="h-6 w-6" />
                  {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(property.price)}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Surface</p>
                      <p className="font-medium">{property.surface} m²</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Pièces</p>
                      <p className="font-medium">{property.rooms || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Localisation</p>
                    <p className="font-medium">{property.address}, {property.city}</p>
                  </div>
                </div>

                {property.tags && property.tags.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2 flex items-center">
                      <Tag className="h-4 w-4 mr-1" /> Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {property.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="bg-gray-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" /> Statut
                  </p>
                  <Badge variant={property.status === 'available' ? 'default' : 'secondary'}>
                    {property.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

          {/* Propriétaire */}
          {property.owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Propriétaire
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{property.owner.firstName} {property.owner.lastName}</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>{property.owner.email}</p>
                  <p>{property.owner.phone}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => router.push(`/prospects/${property.ownerId}`)}>
                  Voir le profil
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Financier */}
          {(property.netPrice || property.fees) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {property.netPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Net Vendeur</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(property.netPrice)}
                    </span>
                  </div>
                )}
                {property.fees && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Honoraires {property.feesPercentage ? `(${property.feesPercentage}%)` : ''}</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: 'TND' }).format(property.fees)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </Layout >
  );
}
