import React, { useState, useMemo, useCallback } from 'react';
import { ProspectingCampaign, ProspectingLead } from '@/shared/utils/prospecting-api';
import { CampaignCard, StatCard } from '../dashboard';
import { LeadValidator } from '../LeadValidator';

interface CampaignsTabProps {
  campaigns: ProspectingCampaign[];
  leads: ProspectingLead[];
  selectedCampaignId: string | null;
  onCampaignSelect: (campaignId: string | null) => void;
  onNewCampaign: () => void;
  onStartCampaign: (campaignId: string) => void;
  onPauseCampaign: (campaignId: string) => void;
  onLeadUpdate: (leadId: string, data: Partial<ProspectingLead>) => void;
  onValidateLeads: (leadIds: string[]) => Promise<any[]>;
  loading?: boolean;
}

/**
 * Onglet 2: Campagnes
 * Gestion des campagnes + validation intégrée + historique
 */
export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  leads,
  selectedCampaignId,
  onCampaignSelect,
  onNewCampaign,
  onStartCampaign,
  onPauseCampaign,
  onLeadUpdate,
  onValidateLeads,
  loading,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const [validatingTool, setValidatingTool] = useState<string | null>(null);

  // Filter campaigns by status
  const activeCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'active'),
    [campaigns]
  );
  const completedCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'completed'),
    [campaigns]
  );
  const pausedCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'paused'),
    [campaigns]
  );

  // Stats
  const totalLeads = useMemo(() => leads.length, [leads]);
  const validatedLeads = useMemo(() => leads.filter((l) => l.validated).length, [leads]);
  const validationRate = totalLeads > 0 ? Math.round((validatedLeads / totalLeads) * 100) : 0;
  const spamLeads = useMemo(() => leads.filter((l) => l.spam).length, [leads]);

  // Leads for selected campaign
  const campaignLeads = useMemo(() => {
    if (!selectedCampaignId) return leads;
    return leads.filter((l) => l.campaignId === selectedCampaignId);
  }, [leads, selectedCampaignId]);

  // Validation handlers
  const handleEmailValidation = useCallback(async () => {
    setValidatingTool('email');
    const emailLeads = campaignLeads.filter((l) => l.email && !l.validated);
    if (emailLeads.length > 0) {
      await onValidateLeads(emailLeads.map((l) => l.id));
    }
    setValidatingTool(null);
  }, [campaignLeads, onValidateLeads]);

  const handlePhoneValidation = useCallback(async () => {
    setValidatingTool('phone');
    const phoneLeads = campaignLeads.filter((l) => l.phone && !l.validated);
    if (phoneLeads.length > 0) {
      await onValidateLeads(phoneLeads.map((l) => l.id));
    }
    setValidatingTool(null);
  }, [campaignLeads, onValidateLeads]);

  const handleSpamDetection = useCallback(async () => {
    setValidatingTool('spam');
    const nonSpamLeads = campaignLeads.filter((l) => !l.spam);
    if (nonSpamLeads.length > 0) {
      await onValidateLeads(nonSpamLeads.map((l) => l.id));
    }
    setValidatingTool(null);
  }, [campaignLeads, onValidateLeads]);

  const handleDuplicateDetection = useCallback(async () => {
    setValidatingTool('duplicate');
    // Logic for duplicate detection
    const uniqueEmails = new Set<string>();
    const duplicates: string[] = [];
    campaignLeads.forEach((lead) => {
      if (lead.email) {
        if (uniqueEmails.has(lead.email)) {
          duplicates.push(lead.id);
        } else {
          uniqueEmails.add(lead.email);
        }
      }
    });
    // Mark duplicates as spam
    for (const id of duplicates) {
      onLeadUpdate(id, { spam: true });
    }
    setValidatingTool(null);
  }, [campaignLeads, onLeadUpdate]);

  const handleAIClean = useCallback(async () => {
    setValidatingTool('ai');
    // AI-powered cleaning
    if (campaignLeads.length > 0) {
      await onValidateLeads(campaignLeads.map((l) => l.id));
    }
    setValidatingTool(null);
  }, [campaignLeads, onValidateLeads]);

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Mes Campagnes</h2>
          <p className="text-gray-600 mt-1">Gérez vos campagnes et validez vos leads</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon="📋"
            title="Total campagnes"
            value={campaigns.length}
            color="blue"
          />
          <StatCard
            icon="👥"
            title="Leads collectés"
            value={totalLeads}
            color="purple"
          />
          <StatCard
            icon="✅"
            title="Taux de validation"
            value={`${validationRate}%`}
            color="green"
          />
          <StatCard
            icon="🛡️"
            title="Spams détectés"
            value={spamLeads}
            color="red"
          />
        </div>
      </div>

      {/* Tabs: Active Campaigns | History */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setShowHistory(false)}
          className={`px-4 py-2 font-medium transition border-b-2 ${!showHistory
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          Campagnes actives
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`px-4 py-2 font-medium transition border-b-2 ${showHistory
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
        >
          Historique ({completedCampaigns.length})
        </button>
      </div>

      {!showHistory ? (
        <>
          {/* Active Campaigns Grid */}
          {activeCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onSelect={onCampaignSelect}
                  onStart={onStartCampaign}
                  onPause={onPauseCampaign}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-5xl mb-4 opacity-40">📋</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune campagne active</h3>
              <p className="text-sm text-gray-500">
                Utilisez le bouton <strong>+ Nouvelle campagne</strong> en haut à droite pour démarrer.
              </p>
            </div>
          )}

          {/* Paused Campaigns */}
          {pausedCampaigns.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span>⏸️</span> Campagnes en pause ({pausedCampaigns.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pausedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onSelect={onCampaignSelect}
                    onStart={onStartCampaign}
                    onPause={onPauseCampaign}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Validation Section (Integrated) */}
          {selectedCampaignId && campaignLeads.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span>🔍</span> Validation & Nettoyage
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Validez et nettoyez vos leads pour améliorer la qualité
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{validationRate}%</div>
                  <div className="text-sm text-gray-500">Taux de validation</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {validatedLeads} / {totalLeads} leads validés
                  </span>
                  <span className="font-medium text-purple-600">{validationRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${validationRate}%` }}
                  />
                </div>
              </div>

              {/* Validation Tools (Horizontal) */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <button
                  onClick={handleEmailValidation}
                  disabled={validatingTool !== null}
                  className="p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition">✉️</div>
                  <div className="font-medium text-gray-900 text-sm">Vérifier Emails</div>
                  <div className="text-xs text-gray-500 mt-1">Syntaxe & domaines</div>
                </button>

                <button
                  onClick={handlePhoneValidation}
                  disabled={validatingTool !== null}
                  className="p-4 border-2 border-green-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition">📱</div>
                  <div className="font-medium text-gray-900 text-sm">Vérifier Tél</div>
                  <div className="text-xs text-gray-500 mt-1">Format E.164</div>
                </button>

                <button
                  onClick={handleSpamDetection}
                  disabled={validatingTool !== null}
                  className="p-4 border-2 border-red-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition">🛡️</div>
                  <div className="font-medium text-gray-900 text-sm">Détecter Spam</div>
                  <div className="text-xs text-gray-500 mt-1">IA + Patterns</div>
                </button>

                <button
                  onClick={handleDuplicateDetection}
                  disabled={validatingTool !== null}
                  className="p-4 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition">🔄</div>
                  <div className="font-medium text-gray-900 text-sm">Suppr. Doublons</div>
                  <div className="text-xs text-gray-500 mt-1">Dédupliquer</div>
                </button>

                <button
                  onClick={handleAIClean}
                  disabled={validatingTool !== null}
                  className="p-4 border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition">🤖</div>
                  <div className="font-medium text-gray-900 text-sm">Nettoyer IA</div>
                  <div className="text-xs text-gray-500 mt-1">Enrichir & corriger</div>
                </button>
              </div>

              {/* Validation in progress indicator */}
              {validatingTool && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 flex items-center gap-3">
                  <div className="animate-spin text-2xl">⚙️</div>
                  <div>
                    <div className="font-medium text-purple-900">Validation en cours...</div>
                    <div className="text-sm text-purple-700">
                      {validatingTool === 'email' && 'Vérification des emails'}
                      {validatingTool === 'phone' && 'Vérification des téléphones'}
                      {validatingTool === 'spam' && 'Détection de spam'}
                      {validatingTool === 'duplicate' && 'Suppression des doublons'}
                      {validatingTool === 'ai' && 'Nettoyage avec IA'}
                    </div>
                  </div>
                </div>
              )}

              {/* Leads Table with inline actions */}
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Nom
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email / Téléphone
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Statut
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaignLeads.slice(0, 20).map((lead) => (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {lead.firstName} {lead.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div>{lead.email || '-'}</div>
                            <div className="text-xs text-gray-500">{lead.phone || '-'}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${lead.score >= 70
                                  ? 'bg-green-100 text-green-800'
                                  : lead.score >= 40
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {lead.score}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {lead.validated ? (
                              <span className="text-green-600">✅ Validé</span>
                            ) : lead.spam ? (
                              <span className="text-red-600">🛡️ Spam</span>
                            ) : (
                              <span className="text-gray-500">⏳ En attente</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => onLeadUpdate(lead.id, { validated: true })}
                              disabled={lead.validated}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Valider
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {campaignLeads.length > 20 && (
                  <div className="bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
                    et {campaignLeads.length - 20} autres leads...
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* History Section */
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📜</span> Historique des campagnes
            </h3>
            {completedCampaigns.length > 0 ? (
              <div className="space-y-3">
                {completedCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                    onClick={() => onCampaignSelect(campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{campaign.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {campaign.foundCount || 0}
                        </div>
                        <div className="text-xs text-gray-500">leads</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-3">📭</div>
                <p>Aucune campagne terminée</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsTab;
