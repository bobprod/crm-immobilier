import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout';
import { LeadValidator } from '@/modules/business/prospecting/components/LeadValidator';
import { ProspectingLead } from '@/shared/utils/prospecting-api';

/**
 * Page de Validation des Leads
 *
 * Permet de valider et qualifier les leads en attente.
 * Utilise le composant LeadValidator existant dans le nouveau layout.
 *
 * Phase 2: UX/UI Restructuring
 */

const LeadsValidationPage: React.FC = () => {
  const [leads, setLeads] = useState<ProspectingLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch leads from API
    setLoading(false);
  }, []);

  const handleValidate = async (leadIds: string[]) => {
    // TODO: Call validation API
    return [];
  };

  const handleUpdateLead = (leadId: string, data: Partial<ProspectingLead>) => {
    setLeads(prev => prev.map(lead =>
      lead.id === leadId ? { ...lead, ...data } : lead
    ));
  };

  return (
    <MainLayout
      title="Leads à Valider"
      breadcrumbs={[
        { label: 'Leads', href: '/leads' },
        { label: 'À Valider' },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-gray-900">Validation des Leads</h3>
              <p className="text-sm text-gray-600">
                Examinez et qualifiez les leads générés par vos campagnes de prospection.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <LeadValidator
            leads={leads}
            onValidate={handleValidate}
            onUpdateLead={handleUpdateLead}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default LeadsValidationPage;
