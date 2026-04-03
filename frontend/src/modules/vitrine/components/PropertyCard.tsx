import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bed, Bath, Maximize2, MapPin, Eye, MessageSquare } from 'lucide-react';
import { PropertyBadges } from './PropertyBadges';
import type { PublicProperty } from '@/shared/utils/public-vitrine-api';

interface PropertyCardProps {
  property: PublicProperty;
  primaryColor?: string;
  view?: 'grid' | 'list';
}

const formatPrice = (price: number, currency = 'TND') => {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(2)} M ${currency}`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)} K ${currency}`;
  return `${price.toLocaleString('fr-TN')} ${currency}`;
};

const CATEGORY_LABEL: Record<string, string> = {
  SALE: 'À Vendre',
  RENT: 'À Louer',
  SEASONAL_RENT: 'Location saisonnière',
  COMMERCIAL_SALE: 'Vente commerciale',
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  primaryColor,
  view = 'grid',
}) => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const base = slug ? `/sites/${slug}` : '';
  const href = `${base}/biens/${property.seo?.slug || property.id}`;
  const mainImage = property.images?.[0];
  const categoryLabel = CATEGORY_LABEL[property.category] || property.category;

  if (view === 'list') {
    return (
      <Link href={href} className="block group">
        <div className="flex gap-4 bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
          {/* Image */}
          <div className="relative w-48 shrink-0 bg-gray-100">
            {mainImage ? (
              <Image src={mainImage} alt={property.title} fill style={{ objectFit: 'cover' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <Maximize2 className="w-8 h-8" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <PropertyBadges property={property} />
            </div>
          </div>
          {/* Info */}
          <div className="flex-1 py-4 pr-4">
            <p
              className="text-xs font-medium uppercase tracking-wide mb-1"
              style={{ color: primaryColor || 'var(--agency-primary)' }}
            >
              {property.type} · {categoryLabel}
            </p>
            <h3 className="font-semibold text-gray-900 group-hover:text-[var(--agency-primary)] line-clamp-2">
              {property.title}
            </h3>
            {property.city && (
              <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {property.city}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
              {property.area && (
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5" />
                  {property.area} m²
                </span>
              )}
              {property.bedrooms && (
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5" />
                  {property.bedrooms}
                </span>
              )}
              {property.bathrooms && (
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5" />
                  {property.bathrooms}
                </span>
              )}
            </div>
            <p
              className="mt-2 font-bold text-lg"
              style={{ color: primaryColor || 'var(--agency-primary)' }}
            >
              {formatPrice(property.price, property.currency)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage}
              alt={property.title}
              fill
              style={{ objectFit: 'cover' }}
              className="group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Maximize2 className="w-10 h-10" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            <PropertyBadges property={property} />
          </div>

          {/* Category badge */}
          <div className="absolute top-2 right-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: primaryColor || 'var(--agency-primary)' }}
            >
              {categoryLabel}
            </span>
          </div>

          {/* Stats overlay */}
          <div className="absolute bottom-2 right-2 flex gap-2 text-xs text-white">
            {property.viewsCount > 0 && (
              <span className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                <Eye className="w-3 h-3" /> {property.viewsCount}
              </span>
            )}
            {property.contactCount != null && property.contactCount > 0 && (
              <span className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                <MessageSquare className="w-3 h-3" /> {property.contactCount}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <p
            className="text-xs font-medium uppercase tracking-wide mb-1"
            style={{ color: primaryColor || 'var(--agency-primary)' }}
          >
            {property.type} · {property.city || ''}
          </p>
          <h3 className="font-semibold text-gray-900 group-hover:text-[var(--agency-primary)] line-clamp-2 flex-1">
            {property.title}
          </h3>

          {/* Specs */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-3 pt-3 border-t border-gray-50">
            {property.area && (
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5" /> {property.area} m²
              </span>
            )}
            {property.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="w-3.5 h-3.5" /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="w-3.5 h-3.5" /> {property.bathrooms}
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mt-3 flex items-end justify-between">
            <p
              className="font-bold text-xl"
              style={{ color: primaryColor || 'var(--agency-primary)' }}
            >
              {formatPrice(property.price, property.currency)}
            </p>
            <span className="text-xs text-gray-400">
              Réf: {property.reference || property.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
