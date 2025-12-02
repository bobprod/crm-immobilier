import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/shared/components/ui/card';
import { Badge } from '../../src/shared/components/ui/badge';
import { Button } from '../../src/shared/components/ui/button';
import { ArrowLeft, MapPin, Home, DollarSign, Edit, Trash2, User, Calendar } from 'lucide-react';
import { propertiesAPI, Property } from '../../src/shared/utils/properties-api';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadProperty(id);
    }
  }, [id]);

  const loadProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await propertiesAPI.getById(propertyId);
      setProperty(data);
    } catch (err: any) {
      console.error('Erreur chargement bien:', err);
      setError(err?.message || 'Erreur lors du chargement du bien');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!property || !confirm('Etes-vous sur de vouloir supprimer ce bien ?')) return;

    try {
      await propertiesAPI.delete(property.id);
      router.push('/properties');
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-red-100 text-red-800';
      case 'rented': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'reserved': return 'Reserve';
      case 'sold': return 'Vendu';
      case 'rented': return 'Loue';
      default: return status;
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

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (error || !property) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Bien non trouve'}</p>
          <Button onClick={() => router.push('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux proprietes
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/properties')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/properties/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Images */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {property.images && property.images.length > 0 ? (
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Home className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                {property.images && property.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {property.images.slice(1, 5).map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`${property.title} ${idx + 2}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {property.description || 'Aucune description disponible.'}
                </p>
              </CardContent>
            </Card>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Caracteristiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {property.features.map((feature, idx) => (
                      <Badge key={idx} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Main Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{property.title}</CardTitle>
                  <Badge className={getStatusColor(property.status)}>
                    {getStatusLabel(property.status)}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{property.type}</Badge>
                  {property.priority && (
                    <Badge className={getPriorityColor(property.priority)}>
                      {property.priority}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">
                    {new Intl.NumberFormat('fr-TN', { style: 'currency', currency: property.currency || 'TND' }).format(property.price)}
                  </span>
                </div>

                {(property.area || property.surface) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Home className="h-5 w-5" />
                    <span>{property.area || property.surface} m2</span>
                    {property.bedrooms && <span>- {property.bedrooms} ch.</span>}
                    {property.bathrooms && <span>- {property.bathrooms} sdb.</span>}
                  </div>
                )}

                {(property.address || property.city) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-5 w-5" />
                    <span>
                      {property.address && `${property.address}, `}
                      {property.city}
                      {property.delegation && `, ${property.delegation}`}
                    </span>
                  </div>
                )}

                {property.reference && (
                  <div className="text-sm text-gray-500">
                    Ref: {property.reference}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            {property.owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Proprietaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {property.owner.firstName} {property.owner.lastName}
                    </p>
                    {property.owner.email && (
                      <p className="text-sm text-gray-600">{property.owner.email}</p>
                    )}
                    {property.owner.phone && (
                      <p className="text-sm text-gray-600">{property.owner.phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Details */}
            {(property.netPrice || property.fees) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Details financiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {property.netPrice && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Net vendeur:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('fr-TN').format(property.netPrice)} TND
                      </span>
                    </div>
                  )}
                  {property.fees && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Honoraires:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('fr-TN').format(property.fees)} TND
                        {property.feesPercentage && ` (${property.feesPercentage}%)`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Meta */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Cree le {new Date(property.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {property.viewsCount !== undefined && property.viewsCount > 0 && (
                  <div className="text-sm text-gray-500 mt-2">
                    {property.viewsCount} vue(s)
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {property.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes internes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{property.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
