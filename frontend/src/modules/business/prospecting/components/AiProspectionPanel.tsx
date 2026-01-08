import React, { useState } from 'react';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { useAiProspection } from '../hooks/useAiProspection';
import { GeographicTargeting } from './GeographicTargeting';
import { DemographicTargeting } from './DemographicTargeting';
import { CampaignSettings } from './CampaignSettings';
import { ProgressTracker } from './ProgressTracker';
import { LeadsTable } from './LeadsTable';
import { ConversionFunnel } from './ConversionFunnel';
import {
  GeographicZone,
  TargetType,
  PropertyType,
  BudgetRange,
  ExportFormat,
} from '../types/ai-prospection.types';

export interface AiProspectionPanelProps {
  language?: 'fr' | 'en';
}

export const AiProspectionPanel: React.FC<AiProspectionPanelProps> = ({
  language = 'fr',
}) => {
  const { user } = useAuth();
  const authToken = user?.token || '';

  const {
    panelState,
    prospectionResult,
    funnelData,
    error,
    isPolling,
    configuration,
    updateConfiguration,
    validationResult,
    launchProspection,
    resetProspection,
    retryAfterError,
    exportResults,
    convertAllToProspects,
    isConfigurationValid,
    canLaunch,
    progressPercentage,
  } = useAiProspection(authToken);

  // Local UI state
  const [isConfigExpanded, setIsConfigExpanded] = useState(true);

  // Auto-collapse configuration when prospection starts
  React.useEffect(() => {
    if (panelState === 'LAUNCHING' || panelState === 'RUNNING') {
      setIsConfigExpanded(false);
    }
  }, [panelState]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleZoneChange = (zone: GeographicZone) => {
    updateConfiguration({ zone });
  };

  const handleTargetTypeChange = (targetType: TargetType) => {
    updateConfiguration({ targetType });
  };

  const handlePropertyTypeChange = (propertyType: PropertyType) => {
    updateConfiguration({ propertyType });
  };

  const handleBudgetChange = (budget?: BudgetRange) => {
    updateConfiguration({ budget });
  };

  const handleKeywordsChange = (keywords: string[]) => {
    updateConfiguration({ keywords });
  };

  const handleCampaignSettingsChange = (campaignSettings: any) => {
    updateConfiguration({ campaignSettings });
  };

  const handleExport = async (format: ExportFormat) => {
    await exportResults(format);
  };

  const handleConvertAll = async () => {
    await convertAllToProspects();
  };

  const handleAddToCrm = (leadId: string) => {
    console.log('Add to CRM:', leadId);
    // TODO: Implement CRM integration
    alert(`Lead ${leadId} sera ajouté au CRM (fonction à implémenter)`);
  };

  const handleContact = (leadId: string) => {
    console.log('Contact lead:', leadId);
    // TODO: Implement contact flow
    alert(`Contacter le lead ${leadId} (fonction à implémenter)`);
  };

  const handleReject = (leadId: string) => {
    console.log('Reject lead:', leadId);
    // TODO: Implement rejection
    alert(`Lead ${leadId} sera rejeté (fonction à implémenter)`);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderConfigurationSection = () => {
    const isLocked = panelState === 'LAUNCHING' || panelState === 'RUNNING' || panelState === 'COMPLETED';

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLocked ? 'bg-gray-100' : 'bg-purple-100'}`}>
              <svg className={`w-5 h-5 ${isLocked ? 'text-gray-600' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-gray-900">Configuration de la Prospection</h2>
              {isLocked && !isConfigExpanded && (
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
              className={`w-5 h-5 text-gray-500 transform transition-transform ${isConfigExpanded ? 'rotate-180' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {/* Content */}
        {isConfigExpanded && (
          <div className="border-t border-gray-200 p-6 space-y-6 bg-gray-50">
            {/* Geographic Targeting */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
                  budgetRange: configuration.budget || undefined,
                }}
                onChange={(criteria) => {
                  updateConfiguration({
                    targetType: configuration.targetType,
                    propertyType: configuration.propertyType,
                    budget: criteria.budgetRange,
                    keywords: criteria.interests || configuration.keywords,
                  });
                }}
                disabled={isLocked}
              />
            </div>

            {/* Campaign Settings */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
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
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-2">Veuillez corriger les erreurs suivantes:</p>
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

  const renderLauncherSection = () => {
    if (panelState === 'COMPLETED') {
      return null; // Hide launcher when completed
    }

    if (panelState === 'LAUNCHING' || panelState === 'RUNNING') {
      return (
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

    if (panelState === 'ERROR') {
      return (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900">Erreur lors de la prospection</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={retryAfterError}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={resetProspection}
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

    // Default: CONFIGURING or READY state
    return (
      <div className="text-center">
        <button
          onClick={launchProspection}
          disabled={!canLaunch}
          className={`
            inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-lg
            transition-all duration-200 transform
            ${canLaunch
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
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

  const renderResultsSection = () => {
    if (!prospectionResult) {
      return null;
    }

    return (
      <div className="space-y-6">
        {/* Progress Tracker */}
        <ProgressTracker prospectionResult={prospectionResult} />

        {/* Leads Table */}
        {prospectionResult.leads && prospectionResult.leads.length > 0 && (
          <LeadsTable
            leads={prospectionResult.leads}
            onExport={handleExport}
            onConvertAll={handleConvertAll}
            onAddToCrm={handleAddToCrm}
            onContact={handleContact}
            onReject={handleReject}
          />
        )}
      </div>
    );
  };

  const renderFunnelSection = () => {
    if (panelState !== 'COMPLETED' || !funnelData) {
      return null;
    }

    return (
      <div>
        <ConversionFunnel funnelData={funnelData} />
      </div>
    );
  };

  const renderNewProspectionButton = () => {
    if (panelState !== 'COMPLETED') {
      return null;
    }

    return (
      <div className="text-center">
        <button
          onClick={resetProspection}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 text-base font-semibold rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nouvelle Prospection
        </button>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Prospection IA Automatisée</h1>
            <p className="text-purple-100 mt-1">
              Trouvez des leads qualifiés en quelques minutes grâce à l'intelligence artificielle
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Rapide et automatisé</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Leads qualifiés par IA</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Export CRM direct</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* 1. Configuration Section */}
        {renderConfigurationSection()}

        {/* 2. Launcher / Status Section */}
        {renderLauncherSection()}

        {/* 3. Results Section */}
        {renderResultsSection()}

        {/* 4. Funnel Section */}
        {renderFunnelSection()}

        {/* 5. New Prospection Button */}
        {renderNewProspectionButton()}
      </div>
    </div>
  );
};
