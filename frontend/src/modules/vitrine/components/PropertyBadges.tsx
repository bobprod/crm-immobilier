import React from 'react';
import type { PublicProperty } from '@/shared/utils/public-vitrine-api';

interface PropertyBadgesProps {
  property: PublicProperty;
}

const isNew = (createdAt: string) => {
  const diff = Date.now() - new Date(createdAt).getTime();
  return diff < 14 * 24 * 60 * 60 * 1000; // 14 days
};

export const PropertyBadges: React.FC<PropertyBadgesProps> = ({ property }) => {
  const badges: { label: string; color: string; bg: string }[] = [];

  if (property.isFeatured) {
    badges.push({ label: 'EXCLUSIF', color: '#fff', bg: '#7C3AED' });
  }
  if (property.tags?.includes('featured') || property.isFeatured) {
    // already covered
  }
  if (property.tags?.includes('price_reduced') || property.tags?.includes('prix_reduit')) {
    badges.push({ label: 'PRIX RÉDUIT', color: '#fff', bg: '#EF4444' });
  }
  if (property.tags?.includes('verified') || property.tags?.includes('verifie')) {
    badges.push({ label: 'VÉRIFIÉ', color: '#fff', bg: '#10B981' });
  }
  if (property.tags?.includes('popular') || property.viewsCount > 100) {
    badges.push({ label: 'POPULAIRE', color: '#fff', bg: '#F59E0B' });
  }
  if (property.createdAt && isNew(property.createdAt)) {
    badges.push({ label: 'NOUVEAU', color: '#fff', bg: '#3B82F6' });
  }

  if (badges.length === 0) return null;

  return (
    <>
      {badges.map((badge) => (
        <span
          key={badge.label}
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: badge.bg, color: badge.color }}
        >
          {badge.label}
        </span>
      ))}
    </>
  );
};

export default PropertyBadges;
