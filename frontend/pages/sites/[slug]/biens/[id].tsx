import React, { useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Bed,
  Bath,
  Maximize2,
  MapPin,
  Eye,
  Phone,
  ChevronLeft,
  ChevronRight,
  Share2,
  Heart,
  Tag,
} from 'lucide-react';
import {
  AgencyLayout,
  PropertyCard,
  MortgageCalculator,
  ContactForm,
  WhatsAppWidget,
  PropertyBadges,
} from '@/modules/vitrine/components';
import { publicVitrineApi } from '@/shared/utils/public-vitrine-api';
import type { VitrineConfig, PublicProperty } from '@/shared/utils/public-vitrine-api';

interface PropertyPageProps {
  config: VitrineConfig;
  property: PublicProperty;
  slug: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  sale: 'À Vendre',
  rent: 'À Louer',
  seasonal_rent: 'Location saisonnière',
  SALE: 'À Vendre',
  RENT: 'À Louer',
  SEASONAL_RENT: 'Location saisonnière',
};
const fmt = (n: number) => n.toLocaleString('fr-TN');

const PropertyDetailPage: NextPage<PropertyPageProps> = ({ config, property, slug }) => {
  const primaryColor = config.primaryColor || '#1e40af';
  const normalizedCategory = (property.category || '').toLowerCase();
  const [imageIdx, setImageIdx] = useState(0);
  const images = property.images || [];

  const waMessage = property.title
    ? `Bonjour, je suis intéressé(e) par le bien "${property.title}" (Réf: ${property.reference || property.id.slice(0, 8)}). Pouvez-vous me contacter ?`
    : undefined;

  const handleShare = () => {
    if (navigator?.share) {
      navigator.share({ title: property.title, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  // Schema.org structured data
  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: typeof window !== 'undefined' ? window.location.href : '',
    image: images[0],
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
    },
    price: property.price,
    priceCurrency: property.currency,
    numberOfRooms: property.bedrooms,
  };

  return (
    <AgencyLayout
      config={config}
      userId={config.userId}
      pageTitle={property.title}
      pageDescription={property.seo?.metaDescription || property.description}
      ogImage={images[0]}
    >
      {/* Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href={`/sites/${slug}`} className="hover:text-gray-700">
            Accueil
          </Link>
          <span>/</span>
          <Link href={`/sites/${slug}/biens`} className="hover:text-gray-700">
            Biens
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">{property.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT — Gallery + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="relative rounded-2xl overflow-hidden bg-gray-100">
              {images.length > 0 ? (
                <>
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={images[imageIdx]}
                      alt={`${property.title} - photo ${imageIdx + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  </div>

                  {/* Nav arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setImageIdx((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setImageIdx((i) => (i + 1) % images.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {imageIdx + 1} / {images.length}
                      </div>
                    </>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    <PropertyBadges property={property} />
                  </div>
                </>
              ) : (
                <div className="aspect-[16/9] flex items-center justify-center text-gray-300">
                  <Maximize2 className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setImageIdx(i)}
                    className={`relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === imageIdx
                        ? 'border-transparent'
                        : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                    style={i === imageIdx ? { borderColor: primaryColor } : {}}
                  >
                    <Image src={img} alt={`thumb ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Header info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {CATEGORY_LABEL[property.category] ||
                        CATEGORY_LABEL[normalizedCategory] ||
                        property.category}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                      {property.type}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                  {property.city && (
                    <p className="flex items-center gap-1.5 text-gray-500 mt-1.5">
                      <MapPin className="w-4 h-4" /> {property.city}
                      {property.delegation ? `, ${property.delegation}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price */}
              <p className="text-3xl font-bold mt-4" style={{ color: primaryColor }}>
                {fmt(property.price)} {property.currency}
                {normalizedCategory === 'rent' && (
                  <span className="text-lg font-normal text-gray-500"> / mois</span>
                )}
              </p>

              {/* Specs */}
              <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-50 text-sm text-gray-600">
                {property.area && (
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" style={{ color: primaryColor }} />
                    <strong>{property.area}</strong> m²
                  </span>
                )}
                {property.bedrooms != null && (
                  <span className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4" style={{ color: primaryColor }} />
                    <strong>{property.bedrooms}</strong> chambre{property.bedrooms > 1 ? 's' : ''}
                  </span>
                )}
                {property.bathrooms != null && (
                  <span className="flex items-center gap-1.5">
                    <Bath className="w-4 h-4" style={{ color: primaryColor }} />
                    <strong>{property.bathrooms}</strong> salle{property.bathrooms > 1 ? 's' : ''}{' '}
                    de bain
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Tag className="w-4 h-4" />
                  Réf: {property.reference || property.id.slice(0, 8)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Eye className="w-4 h-4" /> {property.viewsCount} vues
                </span>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            )}

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.features.map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map placeholder */}
            {property.latitude && property.longitude && (
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 mb-3">Localisation</h2>
                <div className="rounded-lg overflow-hidden h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  <a
                    href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MapPin className="w-4 h-4" /> Voir sur Google Maps
                  </a>
                </div>
              </div>
            )}

            {/* Mortgage Calculator */}
            {normalizedCategory === 'sale' && (
              <MortgageCalculator defaultAmount={property.price} primaryColor={primaryColor} />
            )}
          </div>

          {/* RIGHT — Contact sticky card */}
          <aside className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Contacter l'agence</h2>

              {/* Agency quick contact */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  {(config.agencyName || 'A').charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{config.agencyName}</p>
                  <a
                    href={`tel:${config.phone}`}
                    className="text-xs text-gray-500 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> {config.phone}
                  </a>
                </div>
              </div>

              <ContactForm
                slug={slug}
                propertyId={property.id}
                primaryColor={primaryColor}
                defaultType="VISIT_REQUEST"
              />

              {config.whatsappNumber && (
                <a
                  href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white text-sm font-semibold"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Contacter via WhatsApp
                </a>
              )}
            </div>
          </aside>
        </div>

        {/* Similar properties */}
        {property.similarProperties && property.similarProperties.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Biens similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {property.similarProperties.slice(0, 4).map((p) => (
                <PropertyCard key={p.id} property={p} primaryColor={primaryColor} />
              ))}
            </div>
          </section>
        )}
      </div>

      {config.whatsappNumber && (
        <WhatsAppWidget
          phoneNumber={config.whatsappNumber}
          agencyName={config.agencyName}
          propertyTitle={property.title}
          propertyRef={property.reference}
        />
      )}
    </AgencyLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const slug = params?.slug as string;
  const id = params?.id as string;
  try {
    const [property, home] = await Promise.all([
      publicVitrineApi.getProperty(slug, id),
      publicVitrineApi.getHome(slug),
    ]);
    return {
      props: { config: home.config, property, slug },
    };
  } catch {
    return { notFound: true };
  }
};

export default PropertyDetailPage;
