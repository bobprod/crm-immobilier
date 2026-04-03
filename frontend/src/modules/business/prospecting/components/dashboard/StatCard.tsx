import React from 'react';
import { TrendingUp, LucideIcon } from 'lucide-react';

/**
 * StatCard Component
 *
 * Affiche une carte de statistique avec:
 * - Titre
 * - Valeur principale
 * - Icône (Lucide React ou React node)
 * - Changement optionnel (vs mois dernier)
 * - Variante de couleur Navy/Amber/Emerald/Slate
 *
 * Phase 2 UX/UI – Navy/Amber premium palette
 */

export interface StatCardProps {
  /** Titre de la statistique */
  title: string;

  /** Valeur à afficher (nombre ou texte) */
  value: string | number;

  /** Icône Lucide React ou nœud React */
  icon: LucideIcon | React.ReactNode;

  /** Pourcentage de changement vs période précédente */
  change?: number;

  /** Variante de couleur */
  variant?: 'navy' | 'amber' | 'emerald' | 'slate';

  /**
   * @deprecated Utilisez `variant` à la place.
   * Conservé pour compatibilité rétroactive.
   */
  color?: string;
}

const variantStyles: Record<string, { bg: string; icon: string; ring: string }> = {
  navy: { bg: 'bg-navy-100', icon: 'text-navy-600', ring: 'ring-navy-200' },
  amber: { bg: 'bg-amber-100', icon: 'text-amber-600', ring: 'ring-amber-200' },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
  slate: { bg: 'bg-slate-100', icon: 'text-slate-600', ring: 'ring-slate-200' },
  // Legacy color → variant mappings
  purple: { bg: 'bg-navy-100', icon: 'text-navy-600', ring: 'ring-navy-200' },
  blue: { bg: 'bg-navy-100', icon: 'text-navy-600', ring: 'ring-navy-200' },
  green: { bg: 'bg-emerald-100', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
  yellow: { bg: 'bg-amber-100', icon: 'text-amber-600', ring: 'ring-amber-200' },
};

const isLucideIcon = (icon: LucideIcon | React.ReactNode): icon is LucideIcon =>
  typeof icon === 'function' && !React.isValidElement(icon);

const renderIcon = (icon: LucideIcon | React.ReactNode): React.ReactNode => {
  if (isLucideIcon(icon)) {
    const IconComponent = icon;
    return <IconComponent size={22} strokeWidth={1.75} />;
  }
  return icon as React.ReactNode;
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  variant,
  color,
}) => {
  const key = variant ?? color ?? 'navy';
  const styles = variantStyles[key] ?? variantStyles.navy;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 group cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{value}</p>
          {change !== undefined && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                change >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              <TrendingUp className={`w-3.5 h-3.5 ${change < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(change)}% vs mois dernier
            </p>
          )}
        </div>
        <div
          className={`p-3.5 rounded-2xl ${styles.bg} ring-1 ${styles.ring} ${styles.icon} group-hover:scale-105 transition-transform duration-200 flex-shrink-0`}
        >
          {renderIcon(icon)}
        </div>
      </div>
    </div>
  );
};
