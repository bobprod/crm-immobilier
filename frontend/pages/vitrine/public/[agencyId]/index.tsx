import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { TrackingPixelsLoader, useVitrineTracking } from '@/shared/components/vitrine/TrackingPixelsLoader';
import { HeatmapTracker } from '@/shared/components/vitrine/HeatmapTracker';
import { PropertyViewTracker } from '@/shared/components/vitrine/PropertyViewTracker';
import api from '@/shared/utils/backend-api';
import { Home, MapPin, Bed, Bath, Square, Phone, Mail, MapPinned } from 'lucide-react';

interface VitrineConfig {
  agencyName: string;
  slogan?: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
  heroImage?: string;
  aboutText?: string;
  primaryColor?: string;
  secondaryColor?: string;
  socialLinks?: any;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
}

interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  city: string;
  address?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  images?: string[];
  type: string;
  category: 'sale' | 'rent';
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

/**
 * Page d'accueil publique de la vitrine
 * Accessible sans authentification
 * URL: /vitrine/public/[agencyId]
 */
export default function PublicVitrinePage() {
  const router = useRouter();
  const { agencyId } = router.query;
  const { trackSearch } = useVitrineTracking();

  const [config, setConfig] = useState<VitrineConfig | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agencyId) {
      loadVitrineData();
    }
  }, [agencyId]);

  const loadVitrineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger la vitrine publique
      const response = await api.get(`/vitrine/public/${agencyId}`);

      setConfig(response.data.config);
      setProperties(response.data.properties || []);
    } catch (err: any) {
      console.error('Erreur chargement vitrine:', err);
      setError("Cette vitrine n'est pas disponible ou n'existe pas.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Vitrine non disponible</h1>
          <p className="text-gray-600">{error || "Cette agence n'a pas de vitrine active."}</p>
        </div>
      </div>
    );
  }

  const saleProperties = properties.filter((p) => p.category === 'sale');
  const rentProperties = properties.filter((p) => p.category === 'rent');
  const featuredProperties = properties.slice(0, 6);

  return (
    <>
      <Head>
        <title>{config.seoTitle || `${config.agencyName} - Agence Immobilière`}</title>
        <meta
          name="description"
          content={
            config.seoDescription ||
            `Découvrez les biens immobiliers de ${config.agencyName}. Achat, vente et location de maisons et appartements.`
          }
        />
        {config.seoKeywords && config.seoKeywords.length > 0 && (
          <meta name="keywords" content={config.seoKeywords.join(', ')} />
        )}
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={config.seoTitle || config.agencyName} />
        <meta property="og:description" content={config.seoDescription || ''} />
        <meta property="og:type" content="website" />
      </Head>

      {/* Charger automatiquement les pixels de tracking configurés pour cette agence */}
      {typeof agencyId === 'string' && (
        <>
          <TrackingPixelsLoader agencyId={agencyId} />
          <HeatmapTracker agencyId={agencyId} enabled={true} />
        </>
      )}

      <div className="min-h-screen bg-white">
        {/* Header / Navigation */}
        <header className="bg-white border-b shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {config.logo && <img src={config.logo} alt={config.agencyName} className="h-12" />}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{config.agencyName}</h1>
                  {config.slogan && <p className="text-sm text-gray-600">{config.slogan}</p>}
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-6">
                <Link href={`/vitrine/public/${agencyId}`}>
                  <a className="text-gray-700 hover:text-blue-600 font-medium">Accueil</a>
                </Link>
                <Link href={`/vitrine/public/${agencyId}/offres`}>
                  <a className="text-gray-700 hover:text-blue-600 font-medium">Nos Offres</a>
                </Link>
                <Link href={`/vitrine/public/${agencyId}/contact`}>
                  <a className="text-gray-700 hover:text-blue-600 font-medium">Contact</a>
                </Link>
              </nav>

              <Link href={`/vitrine/public/${agencyId}/contact`}>
                <Button
                  style={{
                    backgroundColor: config.primaryColor || '#3B82F6',
                    color: 'white',
                  }}
                >
                  Nous Contacter
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section
          className="relative h-[500px] bg-cover bg-center"
          style={{
            backgroundImage: config.heroImage
              ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${config.heroImage})`
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h2 className="text-5xl font-bold mb-4">
                {config.slogan || 'Trouvez votre bien idéal'}
              </h2>
              <p className="text-xl mb-8 text-gray-100">
                {config.aboutText ||
                  `${config.agencyName} vous accompagne dans votre projet immobilier`}
              </p>
              <div className="flex gap-4">
                <Link href={`/vitrine/public/${agencyId}/offres?type=sale`}>
                  <Button size="lg" variant="default">
                    Acheter
                  </Button>
                </Link>
                <Link href={`/vitrine/public/${agencyId}/offres?type=rent`}>
                  <Button size="lg" variant="outline" className="bg-white text-gray-900">
                    Louer
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{properties.length}</div>
                  <p className="text-gray-600">Biens disponibles</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {saleProperties.length}
                  </div>
                  <p className="text-gray-600">Biens à vendre</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {rentProperties.length}
                  </div>
                  <p className="text-gray-600">Biens à louer</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Biens en Vedette</h2>
              <p className="text-gray-600">Découvrez notre sélection de biens immobiliers</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  id={`property-${property.id}`}
                  data-property-id={property.id}
                  data-property-data={JSON.stringify({
                    title: property.title,
                    price: property.price,
                    city: property.city,
                    type: property.type,
                    category: property.category,
                  })}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Tracker automatique pour ce bien */}
                  {typeof agencyId === 'string' && (
                    <PropertyViewTracker
                      agencyId={agencyId}
                      propertyId={property.id}
                      propertyData={{
                        title: property.title,
                        price: property.price,
                        city: property.city,
                        type: property.type,
                        category: property.category,
                        bedrooms: property.bedrooms,
                        bathrooms: property.bathrooms,
                        surface: property.surface,
                      }}
                    />
                  )}
                  <div className="relative h-48 bg-gray-200">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.seo?.metaTitle || property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <Badge
                      className="absolute top-3 right-3"
                      style={{
                        backgroundColor: property.category === 'sale' ? '#10B981' : '#3B82F6',
                      }}
                    >
                      {property.category === 'sale' ? 'Vente' : 'Location'}
                    </Badge>
                  </div>

                  <CardContent className="p-4">
                    <div className="mb-2">
                      <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {property.city}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                      {property.bedrooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          {property.bedrooms}
                        </div>
                      )}
                      {property.bathrooms && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          {property.bathrooms}
                        </div>
                      )}
                      {property.surface && (
                        <div className="flex items-center gap-1">
                          <Square className="h-4 w-4" />
                          {property.surface}m²
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {property.price.toLocaleString('fr-FR')} €
                        </p>
                      </div>
                      <Link href={`/vitrine/public/${agencyId}/offres/${property.id}`}>
                        <Button size="sm" variant="outline">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href={`/vitrine/public/${agencyId}/offres`}>
                <Button size="lg">Voir toutes nos offres →</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About Section */}
        {config.aboutText && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  À propos de {config.agencyName}
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">{config.aboutText}</p>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{config.agencyName}</h3>
                <p className="text-gray-400">{config.slogan}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Navigation</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href={`/vitrine/public/${agencyId}`}>
                      <a className="text-gray-400 hover:text-white">Accueil</a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/vitrine/public/${agencyId}/offres`}>
                      <a className="text-gray-400 hover:text-white">Nos Offres</a>
                    </Link>
                  </li>
                  <li>
                    <Link href={`/vitrine/public/${agencyId}/contact`}>
                      <a className="text-gray-400 hover:text-white">Contact</a>
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  {config.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {config.phone}
                    </li>
                  )}
                  {config.email && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {config.email}
                    </li>
                  )}
                  {config.address && (
                    <li className="flex items-center gap-2">
                      <MapPinned className="h-4 w-4" />
                      {config.address}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>
                © {new Date().getFullYear()} {config.agencyName}. Tous droits réservés.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
