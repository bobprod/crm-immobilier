import React, { useState, useEffect } from 'react';
import { ProspectingLead } from '@/shared/utils/prospecting-api';
import {
    LeadQualificationService,
    QualificationResult
} from '../services/lead-qualification.service';

interface LeadQualificationPanelProps {
    leads: ProspectingLead[];
    onLeadQualified: (leadId: string, qualified: boolean) => void;
    onLeadRejected: (leadId: string) => void;
}

export const LeadQualificationPanel: React.FC<LeadQualificationPanelProps> = ({
    leads,
    onLeadQualified,
    onLeadRejected,
}) => {
    const [qualificationResults, setQualificationResults] = useState<QualificationResult[]>([]);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'qualified' | 'needs-review' | 'rejected'>('all');
    const [selectedLead, setSelectedLead] = useState<QualificationResult | null>(null);

    // Auto-qualification au chargement
    useEffect(() => {
        if (leads.length > 0 && qualificationResults.length === 0) {
            handleQualifyAll();
        }
    }, [leads]);

    const handleQualifyAll = async () => {
        setProcessing(true);
        try {
            const results = await LeadQualificationService.qualifyLeadsBatch(leads);
            setQualificationResults(results);

            // Auto-actions basées sur la qualification
            for (const result of results) {
                if (result.status === 'qualified') {
                    onLeadQualified(result.leadId, true);
                } else if (result.status === 'rejected') {
                    onLeadRejected(result.leadId);
                }
            }
        } finally {
            setProcessing(false);
        }
    };

    const filteredResults = qualificationResults.filter(r =>
        filter === 'all' || r.status === filter
    );

    const stats = qualificationResults.length > 0
        ? LeadQualificationService.getQualificationStats(qualificationResults)
        : null;

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-600';
        if (score >= 50) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 75) return 'bg-green-50 border-green-200';
        if (score >= 50) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            qualified: 'bg-green-100 text-green-800 border-green-300',
            'needs-review': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
        };
        const labels = {
            qualified: '✅ Qualifié',
            'needs-review': '⚠️ À vérifier',
            rejected: '🚫 Rejeté',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${badges[status as keyof typeof badges]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* En-tête avec statistiques */}
            {stats && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-xl font-bold">🎯 Qualification Automatique Intelligente</h3>
                            <p className="text-purple-100 text-sm mt-1">
                                Analyse IA de la qualité des leads avec scoring avancé
                            </p>
                        </div>
                        <button
                            onClick={handleQualifyAll}
                            disabled={processing}
                            className="px-6 py-3 bg-white text-purple-600 rounded-xl font-bold hover:bg-purple-50 disabled:opacity-50 transition"
                        >
                            {processing ? '⏳ Analyse en cours...' : '🔄 Re-analyser'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                            <div className="text-3xl font-bold">{stats.total}</div>
                            <div className="text-sm text-purple-100">Total Leads</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                            <div className="text-3xl font-bold text-green-300">{stats.qualified}</div>
                            <div className="text-sm text-purple-100">✅ Qualifiés</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                            <div className="text-3xl font-bold text-yellow-300">{stats.needsReview}</div>
                            <div className="text-sm text-purple-100">⚠️ À vérifier</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                            <div className="text-3xl font-bold text-red-300">{stats.rejected}</div>
                            <div className="text-sm text-purple-100">🚫 Rejetés</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4 backdrop-blur">
                            <div className="text-3xl font-bold">{stats.qualifiedRate.toFixed(0)}%</div>
                            <div className="text-sm text-purple-100">Taux qualif.</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div className="flex gap-3 flex-wrap">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'all'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Tous ({qualificationResults.length})
                </button>
                <button
                    onClick={() => setFilter('qualified')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'qualified'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    ✅ Qualifiés ({qualificationResults.filter(r => r.status === 'qualified').length})
                </button>
                <button
                    onClick={() => setFilter('needs-review')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'needs-review'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    ⚠️ À vérifier ({qualificationResults.filter(r => r.status === 'needs-review').length})
                </button>
                <button
                    onClick={() => setFilter('rejected')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${filter === 'rejected'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    🚫 Rejetés ({qualificationResults.filter(r => r.status === 'rejected').length})
                </button>
            </div>

            {/* Liste des leads qualifiés */}
            <div className="grid gap-4">
                {filteredResults.map((result) => {
                    const lead = leads.find(l => l.id === result.leadId);
                    if (!lead) return null;

                    return (
                        <div
                            key={result.leadId}
                            className={`border-2 rounded-xl p-5 hover:shadow-lg transition cursor-pointer ${getScoreBgColor(result.score.overall)}`}
                            onClick={() => setSelectedLead(result)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-lg font-bold text-gray-900">
                                            {lead.firstName} {lead.lastName}
                                        </h4>
                                        {getStatusBadge(result.status)}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span>📧</span>
                                            <span>{lead.email || 'N/A'}</span>
                                            <span className={`font-semibold ${getScoreColor(result.score.email)}`}>
                                                ({result.score.email}%)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span>📱</span>
                                            <span>{lead.phone || 'N/A'}</span>
                                            <span className={`font-semibold ${getScoreColor(result.score.phone)}`}>
                                                ({result.score.phone}%)
                                            </span>
                                        </div>
                                        {lead.company && (
                                            <div className="flex items-center gap-2">
                                                <span>🏢</span>
                                                <span>{lead.company}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Score global */}
                                <div className="text-center">
                                    <div className={`text-4xl font-bold ${getScoreColor(result.score.overall)}`}>
                                        {result.score.overall}
                                    </div>
                                    <div className="text-xs text-gray-500 font-semibold">Score</div>
                                </div>
                            </div>

                            {/* Barre de score détaillée */}
                            <div className="grid grid-cols-5 gap-2 mb-3">
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Email</div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${result.score.email >= 75 ? 'bg-green-500' : result.score.email >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${result.score.email}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${result.score.phone >= 75 ? 'bg-green-500' : result.score.phone >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${result.score.phone}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Nom</div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${result.score.name >= 75 ? 'bg-green-500' : result.score.name >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${result.score.name}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Engage.</div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${result.score.engagement >= 75 ? 'bg-green-500' : result.score.engagement >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${result.score.engagement}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Complet</div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${result.score.dataCompleteness >= 75 ? 'bg-green-500' : result.score.dataCompleteness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${result.score.dataCompleteness}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Issues */}
                            {result.issues.length > 0 && (
                                <div className="space-y-1 mb-3">
                                    {result.issues.slice(0, 2).map((issue, i) => (
                                        <div key={i} className="text-xs text-gray-700 flex items-start gap-2">
                                            <span>•</span>
                                            <span>{issue}</span>
                                        </div>
                                    ))}
                                    {result.issues.length > 2 && (
                                        <div className="text-xs text-gray-500 italic">
                                            +{result.issues.length - 2} autres problèmes...
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                {result.status === 'qualified' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLeadQualified(result.leadId, true);
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition"
                                    >
                                        ✅ Confirmer & Contacter
                                    </button>
                                )}
                                {result.status === 'needs-review' && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLeadQualified(result.leadId, true);
                                            }}
                                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-semibold hover:bg-yellow-700 transition"
                                        >
                                            ✓ Valider quand même
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLeadRejected(result.leadId);
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300 transition"
                                        >
                                            ✗ Rejeter
                                        </button>
                                    </>
                                )}
                                {result.status === 'rejected' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onLeadRejected(result.leadId);
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                                    >
                                        🗑️ Supprimer définitivement
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de détails */}
            {selectedLead && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedLead(null)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Détails de Qualification
                                </h3>
                                {getStatusBadge(selectedLead.status)}
                            </div>
                            <button
                                onClick={() => setSelectedLead(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Scores */}
                            <div>
                                <h4 className="font-bold text-gray-900 mb-3">📊 Scores détaillés</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(selectedLead.score).map(([key, value]) => (
                                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                                            <div className="text-sm text-gray-600 capitalize mb-1">
                                                {key === 'overall' ? 'Score Global' :
                                                    key === 'dataCompleteness' ? 'Complétude' :
                                                        key === 'engagement' ? 'Engagement' : key}
                                            </div>
                                            <div className={`text-2xl font-bold ${getScoreColor(value)}`}>
                                                {value}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Issues */}
                            {selectedLead.issues.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">⚠️ Problèmes détectés</h4>
                                    <div className="space-y-2">
                                        {selectedLead.issues.map((issue, i) => (
                                            <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            {selectedLead.recommendations.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">💡 Recommandations</h4>
                                    <div className="space-y-2">
                                        {selectedLead.recommendations.map((rec, i) => (
                                            <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                                {rec}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Auto Actions */}
                            {selectedLead.autoActions.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3">🤖 Actions automatiques</h4>
                                    <div className="space-y-2">
                                        {selectedLead.autoActions.map((action, i) => (
                                            <div key={i} className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
                                                {action}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
