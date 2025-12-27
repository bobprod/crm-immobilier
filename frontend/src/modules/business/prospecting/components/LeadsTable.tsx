import React, { useState } from 'react';
import { ProspectionLead, ExportFormat } from '../types/ai-prospection.types';

interface LeadsTableProps {
  leads: ProspectionLead[];
  onExport: (format: ExportFormat) => Promise<void>;
  onConvertAll: () => Promise<void>;
  onAddToCrm?: (leadId: string) => void;
  onContact?: (leadId: string) => void;
  onReject?: (leadId: string) => void;
}

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  let colorClass = 'bg-gray-100 text-gray-800 border-gray-300';
  let label = 'Faible';

  if (confidence >= 80) {
    colorClass = 'bg-green-100 text-green-800 border-green-300';
    label = 'Excellent';
  } else if (confidence >= 60) {
    colorClass = 'bg-blue-100 text-blue-800 border-blue-300';
    label = 'Bon';
  } else if (confidence >= 40) {
    colorClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    label = 'Moyen';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span>{confidence}%</span>
      <span className="text-[10px]">({label})</span>
    </span>
  );
};

const LeadRow: React.FC<{
  lead: ProspectionLead;
  onAddToCrm?: (leadId: string) => void;
  onContact?: (leadId: string) => void;
  onReject?: (leadId: string) => void;
}> = ({ lead, onAddToCrm, onContact, onReject }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
      {/* Main Row */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />

          {/* Lead Info */}
          <div className="flex-1 min-w-0">
            {/* Name & Confidence */}
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900">{lead.name}</h4>
              <ConfidenceBadge confidence={lead.confidence} />
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 mb-2">
              {lead.email && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <span>{lead.phone}</span>
                </div>
              )}
            </div>

            {/* Location & Budget */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {lead.location && (lead.location.city || lead.location.region) && (
                <div className="flex items-center gap-1 text-gray-600">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{lead.location.city}{lead.location.region && `, ${lead.location.region}`}</span>
                </div>
              )}
              {lead.budget && (
                <div className="flex items-center gap-1 text-purple-600 font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {lead.budget.min.toLocaleString()}-{lead.budget.max.toLocaleString()} {lead.budget.currency || 'TND'}
                  </span>
                </div>
              )}
            </div>

            {/* Expand/Collapse Button */}
            {lead.metadata && Object.keys(lead.metadata).length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
              >
                {isExpanded ? 'Masquer' : 'Voir'} les détails
                <svg
                  className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onAddToCrm && (
              <button
                onClick={() => onAddToCrm(lead.id)}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5"
                title="Ajouter au CRM"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                CRM
              </button>
            )}
            {onContact && (
              <button
                onClick={() => onContact(lead.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Contacter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </button>
            )}
            {onReject && (
              <button
                onClick={() => onReject(lead.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Rejeter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expanded Metadata */}
        {isExpanded && lead.metadata && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Informations supplémentaires</h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(lead.metadata).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded px-2 py-1">
                  <span className="text-gray-600">{key}:</span>{' '}
                  <span className="font-medium text-gray-900">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onExport,
  onConvertAll,
  onAddToCrm,
  onContact,
  onReject,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConvertAll = async () => {
    setIsConverting(true);
    try {
      await onConvertAll();
    } finally {
      setIsConverting(false);
    }
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-600">Aucun lead trouvé pour le moment.</p>
        <p className="text-sm text-gray-500 mt-1">Les résultats apparaîtront ici dès qu'ils seront disponibles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Leads générés</h3>
            <p className="text-sm text-gray-600">{leads.length} lead{leads.length > 1 ? 's' : ''} trouvé{leads.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isExporting ? 'Export...' : 'JSON'}
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {isExporting ? 'Export...' : 'CSV'}
          </button>

          <button
            onClick={handleConvertAll}
            disabled={isConverting}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            {isConverting ? 'Conversion...' : 'Convertir tout en Prospects'}
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadRow
            key={lead.id}
            lead={lead}
            onAddToCrm={onAddToCrm}
            onContact={onContact}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
};
