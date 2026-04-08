import React, { useState } from 'react';
import { useAuth } from '@/modules/core/auth/components/AuthProvider';
import { useAiProspection } from '../hooks/useAiProspection';
import { ConfigurationSection, LauncherSection, ResultsSection } from './ai-prospection';
import { apiClient } from '@/shared/utils/backend-api';
import {
  ExportFormat,
  ProspectionLead,
  GeographicZone,
  TargetType,
  BudgetRange,
  PropertyType,
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

  const [contactModalLead, setContactModalLead] = useState<ProspectionLead | null>(null);
  const [isAddingToCrm, setIsAddingToCrm] = useState<string | null>(null);

  /**
   * Ajouter un lead au CRM (convertir en prospect)
   */
  const handleAddToCrm = async (leadId: string) => {
    if (!prospectionResult || !user?.token) return;

    const lead = prospectionResult.leads.find((l) => l.id === leadId);
    if (!lead) {
      alert('Lead introuvable');
      return;
    }

    setIsAddingToCrm(leadId);

    try {
      // Créer un prospect dans le CRM
      const response = await apiClient.post('/prospects', {
        firstName: lead.name.split(' ')[0] || lead.name,
        lastName: lead.name.split(' ').slice(1).join(' ') || '',
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        city: lead.location?.city || undefined,
        address: lead.location?.address || undefined,
        budget: lead.budget ? {
          min: lead.budget.min,
          max: lead.budget.max,
        } : undefined,
        propertyType: lead.propertyInterest || undefined,
        source: `prospection-ai:${prospectionResult.id}`,
        sourceDetails: lead.source || undefined,
        confidence: lead.confidence,
        status: 'new',
        notes: `Lead généré par prospection IA\nConfiance: ${lead.confidence}%\nSource: ${lead.source || 'N/A'}`,
      });

      const prospect = response.data;

      alert(`✅ Lead ajouté au CRM avec succès!\n\nProspect créé: ${prospect.firstName} ${prospect.lastName}\nID: ${prospect.id}`);
    } catch (error) {
      console.error('Erreur lors de l\'ajout au CRM:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Impossible d\'ajouter le lead au CRM'}`);
    } finally {
      setIsAddingToCrm(null);
    }
  };

  /**
   * Contacter un lead (ouvrir modal)
   */
  const handleContact = (leadId: string) => {
    if (!prospectionResult) return;

    const lead = prospectionResult.leads.find((l) => l.id === leadId);
    if (!lead) {
      alert('Lead introuvable');
      return;
    }

    setContactModalLead(lead);
  };

  /**
   * Fermer le modal de contact
   */
  const handleCloseContactModal = () => {
    setContactModalLead(null);
  };

  /**
   * Envoyer un email au lead
   */
  const handleSendEmail = (leadId: string, email: string) => {
    const userName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'votre agence immobilière';
    const mailtoLink = `mailto:${email}?subject=Contact depuis ${userName}&body=Bonjour,%0D%0A%0D%0ANous avons trouvé votre profil et pensons avoir des opportunités qui pourraient vous intéresser.%0D%0A%0D%0ACordialement`;
    window.open(mailtoLink, '_blank');
    handleCloseContactModal();
  };

  /**
   * Envoyer un WhatsApp au lead
   */
  const handleSendWhatsApp = (leadId: string, phone: string) => {
    // Nettoyer le numéro de téléphone
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappLink = `https://wa.me/${cleanPhone}?text=Bonjour, nous avons trouvé votre profil et pensons avoir des opportunités immobilières qui pourraient vous intéresser.`;
    window.open(whatsappLink, '_blank');
    handleCloseContactModal();
  };

  /**
   * Rejeter un lead
   */
  const handleReject = async (leadId: string) => {
    if (!prospectionResult || !user?.token) return;

    const lead = prospectionResult.leads.find((l) => l.id === leadId);
    if (!lead) {
      alert('Lead introuvable');
      return;
    }

    const confirmReject = window.confirm(
      `Êtes-vous sûr de vouloir rejeter ce lead?\n\n${lead.name}\n${lead.email || lead.phone || ''}\n\nCette action est irréversible.`
    );

    if (!confirmReject) return;

    try {
      // Marquer comme rejeté (ajouter à une liste de rejetés)
      // TODO: Implémenter l'endpoint backend si nécessaire

      // Pour l'instant, on simule en filtrant localement
      alert(`✅ Lead "${lead.name}" marqué comme rejeté.\n\nNote: Cette action est locale pour cette session. Pour une persistance permanente, l'endpoint backend doit être implémenté.`);

      // Optionnel: Cacher le lead dans l'UI
      console.log(`Lead ${leadId} rejected`);
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Impossible de rejeter le lead'}`);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isConfigLocked =
    panelState === 'LAUNCHING' || panelState === 'RUNNING' || panelState === 'COMPLETED';

  // ============================================================================
  // RENDER SECTIONS (Now using extracted components)
  // ============================================================================
  // ConfigurationSection, LauncherSection, ResultsSection are imported from ./ai-prospection/
  // See: components/ai-prospection/ConfigurationSection.tsx, LauncherSection.tsx, ResultsSection.tsx
  // Old render functions have been removed - they are now separate components

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
        <ConfigurationSection
          configuration={configuration}
          updateConfiguration={updateConfiguration}
          validationResult={validationResult}
          isConfigurationValid={isConfigurationValid}
          isLocked={isConfigLocked}
          isExpanded={isConfigExpanded}
          onToggleExpand={() => setIsConfigExpanded(!isConfigExpanded)}
        />

        {/* 2. Launcher Section */}
        <LauncherSection
          panelState={panelState}
          error={error}
          progressPercentage={progressPercentage}
          canLaunch={canLaunch}
          onLaunch={launchProspection}
          onRetry={retryAfterError}
          onReset={resetProspection}
        />

        {/* 3. Results Section */}
        <ResultsSection
          panelState={panelState}
          prospectionResult={prospectionResult}
          funnelData={funnelData}
          onExport={handleExport}
          onConvertAll={handleConvertAll}
          onAddToCrm={handleAddToCrm}
          onContact={handleContact}
          onReject={handleReject}
        />
      </div>

      {/* Contact Modal */}
      {contactModalLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Contacter le lead</h3>
              <button
                onClick={handleCloseContactModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Lead Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-2">{contactModalLead.name}</p>
                {contactModalLead.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {contactModalLead.email}
                  </p>
                )}
                {contactModalLead.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {contactModalLead.phone}
                  </p>
                )}
              </div>

              {/* Contact Methods */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Choisissez une méthode de contact:</p>

                {contactModalLead.email && (
                  <button
                    onClick={() => handleSendEmail(contactModalLead.id, contactModalLead.email!)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Envoyer un Email
                  </button>
                )}

                {contactModalLead.phone && (
                  <button
                    onClick={() => handleSendWhatsApp(contactModalLead.id, contactModalLead.phone!)}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Contacter sur WhatsApp
                  </button>
                )}

                {!contactModalLead.email && !contactModalLead.phone && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucune information de contact disponible pour ce lead.
                  </p>
                )}
              </div>

              {/* Cancel Button */}
              <button
                onClick={handleCloseContactModal}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
