import React from 'react';
import { AiProspectionPanel } from '../AiProspectionPanel';

interface AiProspectionTabProps {
  language?: 'fr' | 'en';
}

/**
 * Onglet 1: Prospection IA
 * Délègue directement au panel (qui contient son propre header + configuration).
 */
export const AiProspectionTab: React.FC<AiProspectionTabProps> = ({ language = 'fr' }) => {
  return <AiProspectionPanel language={language} />;
};

export default AiProspectionTab;

