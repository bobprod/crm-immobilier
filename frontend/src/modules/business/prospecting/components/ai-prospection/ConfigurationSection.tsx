import React from 'react';
import { GeographicTargeting } from '../GeographicTargeting';
import { DemographicTargeting } from '../DemographicTargeting';
import { CampaignSettings } from '../CampaignSettings';
import {
  ProspectionConfiguration,
  ConfigurationValidation,
  GeographicZone,
  BudgetRange,
} from '../../types/ai-prospection.types';

/**
 * ConfigurationSection Component
 *
 * Section de configuration de la prospection IA avec:
 * - Ciblage géographique
 * - Critères démographiques
 * - Paramètres de campagne
 * - Validation des erreurs
 *
 * Extrait de AiProspectionPanel.tsx (Phase 1.4)
 */

export interface ConfigurationSectionProps {
  /** Configuration actuelle */
  configuration: ProspectionConfiguration;

  /** Fonction pour mettre à jour la configuration */
  updateConfiguration: (updates: Partial<ProspectionConfiguration>) => void;

  /** Résultat de la validation */
  validationResult: ConfigurationValidation;

  /** Indique si la configuration est valide */
  isConfigurationValid: boolean;

  /** Indique si la configuration est verrouillée (prospection lancée) */
  isLocked: boolean;

  /** Indique si la section est expandée */
  isExpanded: boolean;

  /** Callback pour toggle l'expansion */
  onToggleExpand: () => void;
}

export const ConfigurationSection: React.FC<ConfigurationSectionProps> = ({
  configuration,
  updateConfiguration,
  validationResult,
  isConfigurationValid,
  isLocked,
  isExpanded,
  onToggleExpand,
}) => {
  const handleZoneChange = (zone: GeographicZone) => {
    updateConfiguration({ zone });
  };

  const handleBudgetChange = (budgetRange?: BudgetRange) => {
    updateConfiguration({ budget: budgetRange });
  };

  const handleCampaignSettingsChange = (campaignSettings: any) => {
    updateConfiguration({ campaignSettings });
  };

  const handleDemographicChange = (criteria: any) => {
    updateConfiguration({
      targetType: configuration.targetType,
      propertyType: configuration.propertyType,
      budget: criteria.budgetRange,
      keywords: criteria.interests || configuration.keywords,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header - Collapsible */}
      <button
        onClick={onToggleExpand}
        disabled={isLocked && isExpanded}
        className={`
          w-full px-6 py-4 flex items-center justify-between
          ${isLocked && isExpanded ? 'cursor-not-allowed' : 'hover:bg-gray-50'}
          transition-colors
        `}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-gray-900">Configuration de la Prospection</h2>
            {isLocked && !isExpanded && (
              <p className="text-sm text-gray-500">✓ Configuré - Cliquez pour modifier</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLocked && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-300">
              🔒 Verrouillé
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
          {/* Geographic Targeting */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              1. Ciblage Géographique
            </h3>
            <GeographicTargeting
              value={configuration.zone}
              onChange={handleZoneChange}
              disabled={isLocked}
            />
          </div>

          {/* Demographic Targeting */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              2. Critères de Ciblage
            </h3>
            <DemographicTargeting
              initialCriteria={{
                propertyIntent:
                  configuration.targetType === 'buyers'
                    ? ['buy']
                    : configuration.targetType === 'sellers'
                      ? ['sell']
                      : configuration.targetType === 'investors'
                        ? ['invest']
                        : ['rent'],
                propertyTypes: [configuration.propertyType],
                ...(configuration.budget && { budgetRange: configuration.budget }),
              }}
              onChange={handleDemographicChange}
              disabled={isLocked}
            />
          </div>

          {/* Campaign Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              3. Paramètres de Campagne
            </h3>
            <CampaignSettings
              value={configuration.campaignSettings!}
              onChange={handleCampaignSettingsChange}
              disabled={isLocked}
              errors={validationResult.errors.reduce((acc, err) => {
                if (err.field.startsWith('campaignSettings.')) {
                  const field = err.field.replace('campaignSettings.', '');
                  acc[field] = err.message;
                }
                return acc;
              }, {} as Record<string, string>)}
            />
          </div>

          {/* Validation Errors */}
          {!isConfigurationValid && validationResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm font-medium text-red-900 mb-2">
                    Veuillez corriger les erreurs suivantes:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationResult.errors.map((err, idx) => (
                      <li key={idx}>• {err.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
