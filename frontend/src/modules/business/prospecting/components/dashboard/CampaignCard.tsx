import React from 'react';
import {
  getCampaignStatusLabel,
  getCampaignStatusColor,
  ProspectingCampaign,
} from '@/shared/utils/prospecting-api';

/**
 * CampaignCard Component
 *
 * Affiche une carte de campagne de prospection avec:
 * - Nom et description
 * - Statut (draft, active, paused, completed)
 * - Barre de progression
 * - Compteurs (leads trouvés, matchs)
 * - Actions (Lancer, Pause)
 *
 * Extrait de ProspectingDashboard.tsx (Phase 1.3)
 */

export interface CampaignCardProps {
  /** Campagne à afficher */
  campaign: ProspectingCampaign;

  /** Callback quand l'utilisateur clique sur la carte */
  onSelect: (id: string) => void;

  /** Callback pour lancer la campagne */
  onStart: (id: string) => void;

  /** Callback pour mettre en pause la campagne */
  onPause: (id: string) => void;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({
  campaign,
  onSelect,
  onStart,
  onPause,
}) => (
  <div
    className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all cursor-pointer border border-gray-100 group"
    onClick={() => onSelect(campaign.id)}
  >
    {/* Header: Nom, Description, Statut */}
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
          {campaign.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {campaign.description || 'Pas de description'}
        </p>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${getCampaignStatusColor(
          campaign.status
        )}`}
      >
        {getCampaignStatusLabel(campaign.status)}
      </span>
    </div>

    {/* Barre de progression */}
    <div className="flex items-center gap-4 mb-4">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
          style={{
            width: `${Math.min(
              (campaign.foundCount / (campaign.targetCount || 100)) * 100,
              100
            )}%`,
          }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">
        {campaign.foundCount}/{campaign.targetCount || '∞'}
      </span>
    </div>

    {/* Footer: Compteurs et Actions */}
    <div className="flex items-center justify-between">
      {/* Compteurs */}
      <div className="flex gap-3">
        <span className="inline-flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">
          👥 {campaign.foundCount} leads
        </span>
        <span className="inline-flex items-center gap-1 text-sm text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          🎯 {campaign.matchedCount} matchs
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {(campaign.status === 'draft' || campaign.status === 'paused') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart(campaign.id);
            }}
            className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all shadow-md"
          >
            ▶ Lancer
          </button>
        )}
        {campaign.status === 'active' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPause(campaign.id);
            }}
            className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 transition-all shadow-md"
          >
            ⏸ Pause
          </button>
        )}
      </div>
    </div>
  </div>
);
