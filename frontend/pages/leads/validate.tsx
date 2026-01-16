import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/shared/components/layout';
import { LeadValidator } from '@/modules/business/prospecting/components/LeadValidator';
import { prospectingAPI, ProspectingLead } from '@/shared/utils/prospecting-api';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer d'abord toutes les campagnes
      const campaigns = await prospectingAPI.getCampaigns();

      // Récupérer les leads de toutes les campagnes
      const allLeadsPromises = campaigns.map(campaign =>
        prospectingAPI.getLeads(campaign.id, {
          status: 'new',
          limit: 100
        })
      );

      const leadsArrays = await Promise.all(allLeadsPromises);
      const allLeads = leadsArrays.flat();

      setLeads(allLeads);
    } catch (err) {
      console.error('Error loading leads:', err);
      setError('Impossible de charger les leads. Veuillez réessayer.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (leadIds: string[]) => {
    // Cette fonction simule une validation API
    // Dans une vraie implémentation, vous appelleriez un endpoint de validation
    return leadIds.map(id => {
      const lead = leads.find(l => l.id === id);
      if (!lead) {
        return {
          leadId: id,
          email: { valid: false, deliverable: false, disposable: false, role: false, score: 0 },
          phone: { valid: false, formatted: '', type: 'unknown' as const },
          name: { valid: false, confidence: 0, issues: ['Lead not found'] },
          overall: { score: 0, status: 'unknown' as const, flags: ['Lead not found'] }
        };
      }

      // Validation basique (sera remplacée par la validation du composant)
      return {
        leadId: id,
        email: {
          valid: true,
          deliverable: true,
          disposable: false,
          role: false,
          score: 90
        },
        phone: {
          valid: true,
          formatted: lead.phone || '',
          type: 'mobile' as const
        },
        name: {
          valid: true,
          confidence: 85,
          issues: []
        },
        overall: {
          score: 85,
          status: 'valid' as const,
          flags: []
        }
      };
    });
  };

  const handleUpdateLead = async (leadId: string, data: Partial<ProspectingLead>) => {
    try {
      await prospectingAPI.updateLead(leadId, data);
      // Mettre à jour l'état local
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.id === leadId ? { ...lead, ...data } : lead
        )
      );
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  if (loading) {
    return (
      <MainLayout
        title="Leads à Valider"
        breadcrumbs={[
          { label: 'Leads', href: '/leads' },
          { label: 'À Valider' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des leads...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout
        title="Leads à Valider"
        breadcrumbs={[
          { label: 'Leads', href: '/leads' },
          { label: 'À Valider' },
        ]}
      >
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadLeads}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Réessayer
          </button>
        </div>
      </MainLayout>
    );
  }

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

        <LeadValidator
          leads={leads}
          onValidate={handleValidate}
          onUpdateLead={handleUpdateLead}
        />
      </div>
    </MainLayout>
  );
};

export default LeadsValidationPage;
