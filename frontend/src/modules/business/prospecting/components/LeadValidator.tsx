import React, { useState, useCallback } from 'react';
import { ProspectingLead } from '@/shared/utils/prospecting-api';

interface ValidationResult {
  leadId: string;
  email: {
    valid: boolean;
    deliverable: boolean;
    disposable: boolean;
    role: boolean;
    score: number;
    suggestion?: string;
  };
  phone: {
    valid: boolean;
    formatted: string;
    carrier?: string;
    type: 'mobile' | 'landline' | 'unknown';
  };
  name: {
    valid: boolean;
    confidence: number;
    issues: string[];
  };
  overall: {
    score: number;
    status: 'valid' | 'suspicious' | 'spam' | 'unknown';
    flags: string[];
  };
}

interface LeadValidatorProps {
  leads: ProspectingLead[];
  onValidate: (leadIds: string[]) => Promise<ValidationResult[]>;
  onUpdateLead: (leadId: string, data: Partial<ProspectingLead>) => void;
}

// Patterns de detection de spam
const SPAM_PATTERNS = {
  emailPatterns: [
    /^test\d*@/i,
    /^fake\d*@/i,
    /^spam\d*@/i,
    /\d{8,}@/,
    /@(mailinator|guerrillamail|tempmail|throwaway)/i,
  ],
  namePatterns: [
    /^(test|fake|spam|xxx|asdf|qwerty)/i,
    /\d{4,}/,
    /^[a-z]{1,2}$/i,
    /^(mr|mme|monsieur|madame)$/i,
  ],
  phonePatterns: [/^0{6,}/, /^1234567/, /^(\d)\1{6,}/],
};

export const LeadValidator: React.FC<LeadValidatorProps> = ({
  leads,
  onValidate,
  onUpdateLead,
}) => {
  const [validationResults, setValidationResults] = useState<Map<string, ValidationResult>>(
    new Map()
  );
  const [isValidating, setIsValidating] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'valid' | 'suspicious' | 'spam'>('all');

  // Validation locale rapide
  const quickValidate = useCallback((lead: ProspectingLead): ValidationResult => {
    const issues: string[] = [];
    let score = 100;

    // Validation email
    const emailValid = lead.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email) : false;
    const emailDisposable = lead.email
      ? SPAM_PATTERNS.emailPatterns.some((p) => p.test(lead.email!))
      : false;

    if (!lead.email) {
      issues.push('Email manquant');
      score -= 30;
    } else if (!emailValid) {
      issues.push('Email invalide');
      score -= 25;
    } else if (emailDisposable) {
      issues.push('Email jetable/suspect');
      score -= 40;
    }

    // Validation nom
    const hasFirstName = lead.firstName && lead.firstName.length > 1;
    const hasLastName = lead.lastName && lead.lastName.length > 1;
    const nameSpam = SPAM_PATTERNS.namePatterns.some(
      (p) => p.test(lead.firstName || '') || p.test(lead.lastName || '')
    );

    if (!hasFirstName || !hasLastName) {
      issues.push('Nom incomplet');
      score -= 15;
    }
    if (nameSpam) {
      issues.push('Nom suspect');
      score -= 30;
    }

    // Validation telephone
    const phoneValid = lead.phone
      ? /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(
        lead.phone.replace(/\s/g, '')
      )
      : false;
    const phoneSpam = lead.phone
      ? SPAM_PATTERNS.phonePatterns.some((p) => p.test(lead.phone!))
      : false;

    if (!lead.phone) {
      issues.push('Telephone manquant');
      score -= 10;
    } else if (!phoneValid) {
      issues.push('Telephone invalide');
      score -= 15;
    } else if (phoneSpam) {
      issues.push('Telephone suspect');
      score -= 25;
    }

    // Determiner le statut
    let status: 'valid' | 'suspicious' | 'spam' | 'unknown' = 'valid';
    if (score < 40) status = 'spam';
    else if (score < 70) status = 'suspicious';

    return {
      leadId: lead.id,
      email: {
        valid: emailValid,
        deliverable: emailValid && !emailDisposable,
        disposable: emailDisposable,
        role: false,
        score: emailValid ? (emailDisposable ? 40 : 90) : 0,
        suggestion: emailValid ? undefined : "Verifiez le format de l'email",
      },
      phone: {
        valid: phoneValid,
        formatted: lead.phone || '',
        type: 'mobile',
      },
      name: {
        valid: hasFirstName && hasLastName && !nameSpam,
        confidence: nameSpam ? 20 : hasFirstName && hasLastName ? 90 : 50,
        issues: nameSpam ? ['Nom potentiellement faux'] : [],
      },
      overall: {
        score: Math.max(0, score),
        status,
        flags: issues,
      },
    };
  }, []);

  // Valider tous les leads selectionnes
  const handleValidateSelected = async () => {
    if (selectedLeads.size === 0) return;

    setIsValidating(true);

    try {
      // D'abord validation locale rapide
      const localResults = leads.filter((l) => selectedLeads.has(l.id)).map(quickValidate);

      // Mettre a jour les resultats
      const newResults = new Map(validationResults);
      localResults.forEach((result) => {
        newResults.set(result.leadId, result);
      });
      setValidationResults(newResults);

      // Puis appeler l'API pour validation approfondie
      try {
        const apiResults = await onValidate(Array.from(selectedLeads));
        apiResults.forEach((result) => {
          newResults.set(result.leadId, result);
        });
        setValidationResults(new Map(newResults));
      } catch {
        // Garder les resultats locaux en cas d'erreur API
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Valider tous les leads
  const handleValidateAll = async () => {
    const allLeadIds = leads.map((l) => l.id);
    setSelectedLeads(new Set(allLeadIds));
    setIsValidating(true);

    try {
      // D'abord validation locale rapide
      const localResults = leads.map(quickValidate);
      const newResults = new Map<string, ValidationResult>();
      localResults.forEach((result) => {
        newResults.set(result.leadId, result);
      });
      setValidationResults(newResults);

      // Puis appeler l'API pour validation approfondie
      try {
        const apiResults = await onValidate(allLeadIds);
        apiResults.forEach((result) => {
          newResults.set(result.leadId, result);
        });
        setValidationResults(new Map(newResults));
      } catch {
        // Garder les resultats locaux en cas d'erreur API
        console.warn('API validation failed, using local results');
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Filtrer les leads
  const filteredLeads = leads.filter((lead) => {
    const result = validationResults.get(lead.id);
    if (filter === 'all') return true;
    if (!result) return false;
    return result.overall.status === filter;
  });

  // Stats
  const stats = {
    total: leads.length,
    validated: validationResults.size,
    valid: Array.from(validationResults.values()).filter((r) => r.overall.status === 'valid')
      .length,
    suspicious: Array.from(validationResults.values()).filter(
      (r) => r.overall.status === 'suspicious'
    ).length,
    spam: Array.from(validationResults.values()).filter((r) => r.overall.status === 'spam').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return (
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            ✓ Valide
          </span>
        );
      case 'suspicious':
        return (
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
            ⚠ Suspect
          </span>
        );
      case 'spam':
        return (
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
            🚫 Spam
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
            ? Non valide
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Header amélioré */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <span>Nettoyage & Validation</span>
            </h2>
            <p className="text-emerald-100 text-sm mt-2">
              Validez emails, téléphones, détectez spams et doublons
            </p>
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <button
              onClick={handleValidateSelected}
              disabled={isValidating || selectedLeads.size === 0}
              className="px-4 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition disabled:opacity-50 font-semibold flex items-center gap-2"
            >
              {isValidating ? (
                <>
                  <span className="animate-spin">⏳</span> Validation...
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{selectedLeads.size > 0 ? `Valider ${selectedLeads.size}` : 'Valider selection'}</span>
                </>
              )}
            </button>
            <button
              onClick={handleValidateAll}
              disabled={isValidating}
              className="px-4 py-2.5 bg-white text-emerald-700 rounded-lg hover:bg-emerald-50 transition font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <span>🚀</span> Valider tout
            </button>
          </div>
        </div>

        {/* Stats améliorées */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
            <div className="text-emerald-100 text-xs font-medium mt-1">📊 Total</div>
          </div>
          <div className="bg-blue-400/20 backdrop-blur-sm rounded-lg p-3 border border-blue-200/30">
            <div className="text-2xl sm:text-3xl font-bold">{stats.validated}</div>
            <div className="text-blue-100 text-xs font-medium mt-1">✔ Validés</div>
          </div>
          <div className="bg-green-400/25 backdrop-blur-sm rounded-lg p-3 border border-green-200/30">
            <div className="text-2xl sm:text-3xl font-bold">{stats.valid}</div>
            <div className="text-green-100 text-xs font-medium mt-1">✅ Prêts</div>
          </div>
          <div className="bg-yellow-400/25 backdrop-blur-sm rounded-lg p-3 border border-yellow-200/30">
            <div className="text-2xl sm:text-3xl font-bold">{stats.suspicious}</div>
            <div className="text-yellow-100 text-xs font-medium mt-1">⚠️ Suspects</div>
          </div>
          <div className="bg-red-400/25 backdrop-blur-sm rounded-lg p-3 border border-red-200/30">
            <div className="text-2xl sm:text-3xl font-bold">{stats.spam}</div>
            <div className="text-red-100 text-xs font-medium mt-1">🚫 Spam</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'valid', 'suspicious', 'spam'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === f
                ? 'bg-teal-600 text-white'
                : 'bg-white border text-gray-700 hover:bg-gray-50'
                }`}
            >
              {f === 'all'
                ? 'Tous'
                : f === 'valid'
                  ? '✓ Valides'
                  : f === 'suspicious'
                    ? '⚠ Suspects'
                    : '🚫 Spam'}
            </button>
          ))}
        </div>
        <div className="text-sm text-gray-500">{filteredLeads.length} lead(s) affiche(s)</div>
      </div>

      {/* Leads List */}
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {filteredLeads.map((lead) => {
          const result = validationResults.get(lead.id);
          const isSelected = selectedLeads.has(lead.id);

          return (
            <div
              key={lead.id}
              className={`p-4 hover:bg-gray-50 transition ${isSelected ? 'bg-teal-50' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newSelected = new Set(selectedLeads);
                      if (e.target.checked) {
                        newSelected.add(lead.id);
                      } else {
                        newSelected.delete(lead.id);
                      }
                      setSelectedLeads(newSelected);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                      {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || 'L')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {lead.firstName || ''} {lead.lastName || 'Sans nom'}
                        </p>
                        {result && getStatusBadge(result.overall.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          📧 {lead.email || "Pas d'email"}
                          {result &&
                            (result.email.valid ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            ))}
                        </span>
                        <span className="flex items-center gap-1">
                          📞 {lead.phone || 'Pas de tel'}
                          {result &&
                            (result.phone.valid ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗</span>
                            ))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Validation details */}
                  {result && (
                    <div className="mt-3 pl-13">
                      {/* Score bar */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-600">Score:</span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${result.overall.score >= 70
                              ? 'bg-green-500'
                              : result.overall.score >= 40
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                              }`}
                            style={{ width: `${result.overall.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900">{result.overall.score}%</span>
                      </div>

                      {/* Issues */}
                      {result.overall.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.overall.flags.map((flag, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-xs"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-col sm:flex-row">
                  {result?.overall.status === 'spam' && (
                    <>
                      <button
                        onClick={() => onUpdateLead(lead.id, { status: 'rejected', spam: true })}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium flex items-center gap-1 whitespace-nowrap"
                        title="Marquer comme spam"
                      >
                        <span>🚫</span> Spam
                      </button>
                      <button
                        onClick={() => onUpdateLead(lead.id, { validated: true, status: 'qualified' })}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium flex items-center gap-1 whitespace-nowrap"
                        title="Valider manuellement"
                      >
                        <span>✓</span> Garder
                      </button>
                    </>
                  )}
                  {result?.overall.status === 'suspicious' && (
                    <>
                      <button
                        onClick={() => onUpdateLead(lead.id, { status: 'qualified', validated: true })}
                        className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition font-medium flex items-center gap-1 whitespace-nowrap"
                        title="Valider manuellement"
                      >
                        <span>✓</span> OK
                      </button>
                      <button
                        onClick={() => onUpdateLead(lead.id, { status: 'rejected', spam: true })}
                        className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium flex items-center gap-1 whitespace-nowrap"
                        title="Rejeter"
                      >
                        <span>✗</span> Spam
                      </button>
                    </>
                  )}
                  {result?.overall.status === 'valid' && (
                    <>
                      <button
                        onClick={() => onUpdateLead(lead.id, { status: 'qualified', qualified: true })}
                        className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition font-medium flex items-center gap-1 whitespace-nowrap"
                        title="Qualifier pour contact"
                      >
                        <span>⭐</span> Qualifier
                      </button>
                      <button
                        onClick={() => onUpdateLead(lead.id, { status: 'new' })}
                        className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium flex items-center gap-1 whitespace-nowrap"
                        title="Mettre en attente"
                      >
                        <span>⏸</span> Attente
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredLeads.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <p>Aucun lead a afficher</p>
          </div>
        )}
      </div>

      {/* Footer actions - Enhanced */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
        <div className="text-sm text-gray-700">
          <span className="font-bold text-red-600">{stats.spam}</span> spams identifiés •
          <span className="font-bold text-green-600 ml-2">{stats.valid}</span> leads prêts
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Bulk Actions */}
          <button
            onClick={() => {
              const csvContent = [
                ['Nom', 'Email', 'Téléphone', 'Statut', 'Score'].join(','),
                ...leads.map(lead => {
                  const result = validationResults.get(lead.id);
                  return [
                    `"${lead.firstName || ''} ${lead.lastName || ''}"`,
                    `"${lead.email || ''}"`,
                    `"${lead.phone || ''}"`,
                    result?.overall.status || 'unknown',
                    result?.overall.score || 0
                  ].join(',');
                })
              ].join('\n');

              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
            }}
            className="px-4 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium flex items-center gap-2"
            title="Exporter les leads en CSV"
          >
            <span>📥</span> Exporter CSV
          </button>

          <button
            onClick={() => {
              validationResults.forEach((result, leadId) => {
                if (result.overall.status === 'spam') {
                  onUpdateLead(leadId, { status: 'rejected', spam: true });
                }
              });
              alert(`${stats.spam} spams supprimés!`);
            }}
            className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium flex items-center gap-2"
            title="Rejeter tous les spams détectés"
          >
            <span>🗑️</span> Rejeter Spams
          </button>

          <button
            onClick={() => {
              let duplicateCount = 0;
              const emailMap = new Map<string, string>();

              leads.forEach(lead => {
                if (lead.email) {
                  if (emailMap.has(lead.email)) {
                    // Marquer comme doublon (rejected)
                    onUpdateLead(lead.id, { status: 'rejected', spam: true });
                    duplicateCount++;
                  } else {
                    emailMap.set(lead.email, lead.id);
                  }
                }
              });
              alert(`${duplicateCount} doublon(s) détecté(s) et marqué(s)!`);
            }}
            className="px-4 py-2 text-sm border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium flex items-center gap-2"
            title="Détecter et marquer les doublons"
          >
            <span>🔄</span> Doublon
          </button>

          <button
            onClick={() => {
              validationResults.forEach((result, leadId) => {
                if (result.overall.status === 'valid') {
                  onUpdateLead(leadId, { status: 'qualified', qualified: true });
                }
              });
              alert(`${stats.valid} leads qualifiés!`);
            }}
            className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-medium flex items-center gap-2"
            title="Qualifier tous les leads valides"
          >
            <span>✓</span> Qualifier Valides
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadValidator;
