import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../src/modules/core/layout/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import {
  ArrowLeft,
  Sparkles,
  Save,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../../lib/api-client';
import { toast } from '@/shared/components/ui/use-toast';

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  surface: number;
  address: string;
  city: string;
  images?: string[];
}

interface SeoOptimization {
  id: string;
  propertyId: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  altTexts?: Record<string, string>;
  score?: number;
  suggestions?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function PropertySeoDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [seoData, setSeoData] = useState<SeoOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [generatingAltText, setGeneratingAltText] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (id) {
      loadData();
    }
  }, [user, router, id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propertyRes, seoRes] = await Promise.all([
        api.get(`/properties/${id}`),
        api.get(`/seo-ai/property/${id}`).catch(() => ({ data: null })),
      ]);
      setProperty(propertyRes.data);
      setSeoData(seoRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      const response = await api.post(`/seo-ai/optimize/${id}`);
      setSeoData(response.data);
      toast({
        title: 'Succès',
        description: 'Optimisation SEO effectuée avec succès',
      });
    } catch (error) {
      console.error('Error optimizing:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'optimiser",
        variant: 'destructive',
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleGenerateAltText = async () => {
    if (!property?.images || property.images.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucune image à traiter',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingAltText(true);
      await api.post('/seo-ai/generate/alt-text', {
        propertyId: id,
        images: property.images,
      });
      toast({
        title: 'Succès',
        description: 'Textes alternatifs générés',
      });
      loadData();
    } catch (error) {
      console.error('Error generating alt text:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer les textes alternatifs',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAltText(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Propriété non trouvée</p>
              <Link href="/seo-ai">
                <Button>Retour à l'optimisation SEO</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/seo-ai">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
              <p className="text-gray-600 mt-1">
                {property.city} - {property.address}
              </p>
            </div>
            <Button onClick={handleOptimize} disabled={optimizing}>
              {optimizing ? (
                <>Optimisation...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {seoData ? 'Ré-optimiser' : 'Optimiser'}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* SEO Score */}
        {seoData?.score && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Score SEO</h3>
                  <p className="text-sm text-gray-600">Évaluation globale du référencement</p>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-purple-600">{seoData.score}</div>
                  <div className="text-sm text-gray-500">/ 100</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meta Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Balises Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title{' '}
                {seoData?.metaTitle && <CheckCircle className="inline h-4 w-4 text-green-600" />}
              </label>
              <Textarea
                value={seoData?.metaTitle || property.title}
                readOnly
                rows={2}
                className="bg-gray-50"
              />
              {seoData?.metaTitle && (
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.metaTitle.length} caractères (optimal: 50-60)
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description{' '}
                {seoData?.metaDescription && (
                  <CheckCircle className="inline h-4 w-4 text-green-600" />
                )}
              </label>
              <Textarea
                value={seoData?.metaDescription || property.description}
                readOnly
                rows={3}
                className="bg-gray-50"
              />
              {seoData?.metaDescription && (
                <p className="text-xs text-gray-500 mt-1">
                  {seoData.metaDescription.length} caractères (optimal: 150-160)
                </p>
              )}
            </div>

            {seoData?.keywords && seoData.keywords.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mots-clés</label>
                <div className="flex flex-wrap gap-2">
                  {seoData.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Images Alt Text */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Textes alternatifs des images</CardTitle>
            <Button
              size="sm"
              onClick={handleGenerateAltText}
              disabled={generatingAltText || !property.images || property.images.length === 0}
            >
              {generatingAltText ? (
                <>Génération...</>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Générer Alt Text
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {property.images && property.images.length > 0 ? (
              <div className="space-y-3">
                {property.images.map((image, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <div className="flex-shrink-0">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Image {index + 1}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {seoData?.altTexts?.[image] || 'Aucun texte alternatif'}
                      </p>
                    </div>
                    {seoData?.altTexts?.[image] && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucune image disponible</p>
            )}
          </CardContent>
        </Card>

        {/* Suggestions */}
        {seoData?.suggestions && seoData.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggestions d'amélioration</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {seoData.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600 mt-1 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
