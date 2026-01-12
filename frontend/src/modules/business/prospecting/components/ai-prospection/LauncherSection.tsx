import React from 'react';
import { ProspectionPanelState } from '../../types/ai-prospection.types';

/**
 * LauncherSection Component
 *
 * Section de lancement de la prospection IA avec différents états:
 * - READY: Bouton de lancement
 * - LAUNCHING/RUNNING: Indicateur de progression
 * - ERROR: Message d'erreur + boutons retry/reset
 * - COMPLETED: Bouton pour nouvelle prospection
 *
 * Extrait de AiProspectionPanel.tsx (Phase 1.4)
 */

export interface LauncherSectionProps {
  /** État actuel du panneau */
  panelState: ProspectionPanelState;

  /** Message d'erreur (si état ERROR) */
  error?: string | null;

  /** Pourcentage de progression (0-100) */
  progressPercentage: number;

  /** Indique si le lancement est possible */
  canLaunch: boolean;

  /** Callback pour lancer la prospection */
  onLaunch: () => void;

  /** Callback pour réessayer après erreur */
  onRetry: () => void;

  /** Callback pour réinitialiser la prospection */
  onReset: () => void;
}

export const LauncherSection: React.FC<LauncherSectionProps> = ({
  panelState,
  error,
  progressPercentage,
  canLaunch,
  onLaunch,
  onRetry,
  onReset,
}) => {
  // COMPLETED state: Show "New Prospection" button
  if (panelState === 'COMPLETED') {
    return (
      <div className="text-center">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 text-base font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Nouvelle Prospection
        </button>
      </div>
    );
  }

  // LAUNCHING or RUNNING state: Show progress
  if (panelState === 'LAUNCHING' || panelState === 'RUNNING') {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <div>
              <h3 className="text-lg font-semibold">
                {panelState === 'LAUNCHING' ? 'Lancement en cours...' : 'Prospection en cours...'}
              </h3>
              <p className="text-sm text-purple-100 mt-1">
                {panelState === 'LAUNCHING'
                  ? 'Initialisation de la prospection IA'
                  : `Progression: ${progressPercentage}% - Les résultats se mettent à jour automatiquement`}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ERROR state: Show error message with retry/reset buttons
  if (panelState === 'ERROR') {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <svg
            className="w-8 h-8 text-red-600 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900">Erreur lors de la prospection</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={onReset}
                className="px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
              >
                Nouvelle Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: CONFIGURING or READY state - Show launch button
  return (
    <div className="text-center">
      <button
        onClick={onLaunch}
        disabled={!canLaunch}
        className={`
          inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-lg
          transition-all duration-200 transform
          ${
            canLaunch
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
            clipRule="evenodd"
          />
        </svg>
        {canLaunch ? 'Lancer la Prospection IA' : 'Veuillez compléter la configuration'}
      </button>
      {canLaunch && (
        <p className="text-sm text-gray-500 mt-3">
          Tout est prêt ! Cliquez pour lancer la prospection avec l'IA.
        </p>
      )}
    </div>
  );
};
