// Main Components
export { ProspectingDashboard } from './components/ProspectingDashboard';
export { AiProspectionPanel } from './components/AiProspectionPanel';

// Sub Components
export { GeographicTargeting } from './components/GeographicTargeting';
export { DemographicTargeting } from './components/DemographicTargeting';
export { CampaignSettings } from './components/CampaignSettings';
export { ProgressTracker } from './components/ProgressTracker';
export { LeadsTable } from './components/LeadsTable';
export { ConversionFunnel } from './components/ConversionFunnel';
export { SalesFunnel } from './components/SalesFunnel';
export { LeadValidator } from './components/LeadValidator';

// Hooks
export { useAiProspection } from './hooks/useAiProspection';

// Types
export type {
  GeographicZone,
  TargetType,
  PropertyType,
  BudgetRange,
  CampaignSettings as CampaignSettingsType,
  ProspectionConfiguration,
  StartProspectionRequest,
  StartProspectionResponse,
  ProspectionLead,
  ProspectionResult,
  ProspectionPanelState,
  ConversionFunnelData,
  ExportFormat,
} from './types/ai-prospection.types';
