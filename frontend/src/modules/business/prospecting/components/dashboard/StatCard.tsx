import React from 'react';

/**
 * StatCard Component
 *
 * Affiche une carte de statistique avec:
 * - Titre
 * - Valeur principale
 * - Icône
 * - Changement optionnel (vs mois dernier)
 * - Couleur personnalisable
 *
 * Extrait de ProspectingDashboard.tsx (Phase 1.3)
 */

export interface StatCardProps {
  /** Titre de la statistique */
  title: string;

  /** Valeur à afficher (nombre ou texte) */
  value: string | number;

  /** Emoji ou icône à afficher */
  icon: string;

  /** Pourcentage de changement vs période précédente */
  change?: number;

  /** Couleur du thème (Tailwind color) */
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  color = 'purple',
}) => (
  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        {change !== undefined && (
          <p
            className={`text-sm mt-2 flex items-center gap-1 ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <span>{change >= 0 ? '↗' : '↘'}</span>
            {Math.abs(change)}% vs mois dernier
          </p>
        )}
      </div>
      <div
        className={`p-4 rounded-2xl bg-gradient-to-br from-${color}-100 to-${color}-200`}
      >
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  </div>
);
