import React from 'react';
import { ProgressTracker } from '../ProgressTracker';
import { LeadsTable } from '../LeadsTable';
import { ConversionFunnel } from '../ConversionFunnel';
import {
  ProspectionResult,
  ConversionFunnelData,
  ExportFormat,
  ProspectionPanelState,
} from '../../types/ai-prospection.types';

/**
 * ResultsSection Component
 *
 * Section d'affichage des résultats de la prospection:
 * - ProgressTracker: Indicateur de progression
 * - LeadsTable: Liste des leads trouvés avec actions
 * - ConversionFunnel: Entonnoir de conversion (uniquement si COMPLETED)
 *
 * Extrait de AiProspectionPanel.tsx (Phase 1.4)
 */

export interface ResultsSectionProps {
  /** État actuel du panneau */
  panelState: ProspectionPanelState;

  /** Résultat de la prospection */
  prospectionResult: ProspectionResult | null;

  /** Données du funnel de conversion */
  funnelData: ConversionFunnelData | null;

  /** Callback pour exporter les résultats */
  onExport: (format: ExportFormat) => Promise<void>;

  /** Callback pour convertir tous les leads en prospects */
  onConvertAll: () => Promise<void>;

  /** Callback pour ajouter un lead au CRM */
  onAddToCrm: (leadId: string) => Promise<void>;

  /** Callback pour contacter un lead */
  onContact: (leadId: string) => void;

  /** Callback pour rejeter un lead */
  onReject: (leadId: string) => Promise<void>;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
  panelState,
  prospectionResult,
  funnelData,
  onExport,
  onConvertAll,
  onAddToCrm,
  onContact,
  onReject,
}) => {
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
          onExport={onExport}
          onConvertAll={onConvertAll}
          onAddToCrm={onAddToCrm}
          onContact={onContact}
          onReject={onReject}
        />
      )}

      {/* Conversion Funnel - Only show when completed */}
      {panelState === 'COMPLETED' && funnelData && (
        <div className="mt-6">
          <ConversionFunnel funnelData={funnelData} />
        </div>
      )}
    </div>
  );
};
