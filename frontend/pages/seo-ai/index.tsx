import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/shared/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { Search, Sparkles, Eye, TrendingUp, FileText, Image as ImageIcon } from 'lucide-react';
import { api } from '../../lib/api-client';
import { useToast } from '@/shared/components/ui/use-toast';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  surface: number;
  address: string;
  city: string;
  seoOptimized?: boolean;
  seoScore?: number;
}

export default function SeoAiPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else {
      loadProperties();
    }
  }, [user, router]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get('/properties');
      setProperties(response.data.properties || response.data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les propriétés',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (propertyId: string) => {
    try {
      setOptimizing(propertyId);
      await api.post(`/seo-ai/optimize/${propertyId}`);
      toast({
        title: 'Succès',
        description: 'Optimisation SEO effectuée avec succès',
      });
      loadProperties();
    } catch (error) {
      console.error('Error optimizing property:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'optimiser la propriété",
        variant: 'destructive',
      });
    } finally {
      setOptimizing(null);
    }
  };

  const handleOptimizeBatch = async () => {
    if (!confirm('Voulez-vous optimiser toutes les propriétés non optimisées ?')) {
      return;
    }

    try {
      setLoading(true);
      const unoptimizedProperties = properties.filter((p) => !p.seoOptimized).map((p) => p.id);

      await api.post('/seo-ai/optimize/batch', {
        propertyIds: unoptimizedProperties,
      });

      toast({
        title: 'Succès',
        description: `${unoptimizedProperties.length} propriétés optimisées`,
      });

      loadProperties();
    } catch (error) {
      console.error('Error batch optimizing:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'optimiser en masse",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.address?.toLowerCase().includes(search.toLowerCase())
  );

  const optimizedCount = properties.filter((p) => p.seoOptimized).length;
  const averageScore =
    properties.length > 0
      ? properties.reduce((sum, p) => sum + (p.seoScore || 0), 0) / properties.length
      : 0;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optimisation SEO AI</h1>
            <p className="text-gray-600 mt-1">
              Optimisez automatiquement le référencement de vos propriétés avec l'IA
            </p>
          </div>
          <Button onClick={handleOptimizeBatch} disabled={loading}>
            <Sparkles className="h-4 w-4 mr-2" />
            Optimiser tout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Propriétés</p>
                  <p className="text-2xl font-bold">{properties.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Optimisées</p>
                  <p className="text-2xl font-bold">{optimizedCount}</p>
                  <p className="text-xs text-gray-500">
                    {properties.length > 0
                      ? ((optimizedCount / properties.length) * 100).toFixed(0)
                      : 0}
                    %
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score Moyen</p>
                  <p className="text-2xl font-bold">{averageScore.toFixed(0)}/100</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">À optimiser</p>
                  <p className="text-2xl font-bold">{properties.length - optimizedCount}</p>
                </div>
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher une propriété..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <div className="grid gap-4">
          {filteredProperties.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <p className="text-gray-500">Aucune propriété trouvée</p>
              </CardContent>
            </Card>
          ) : (
            filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{property.title}</h3>
                        {property.seoOptimized ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Optimisé
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Non optimisé</Badge>
                        )}
                        {property.seoScore && (
                          <Badge variant="outline">Score: {property.seoScore}/100</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {property.description}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>{property.surface} m²</span>
                        <span>{property.price.toLocaleString('fr-FR')} €</span>
                        <span>{property.city}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/seo-ai/property/${property.id}`}>
                        <Button variant="ghost" size="sm" title="Voir détails">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant={property.seoOptimized ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleOptimize(property.id)}
                        disabled={optimizing === property.id}
                      >
                        {optimizing === property.id ? (
                          <>Optimisation...</>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {property.seoOptimized ? 'Ré-optimiser' : 'Optimiser'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
