import React from 'react';
import { AiProspectionPanel } from '../AiProspectionPanel';

interface AiProspectionTabProps {
  language?: 'fr' | 'en';
}

/**
 * Onglet 1: Prospection IA
 * Prospection automatique intelligente avec IA
 */
export const AiProspectionTab: React.FC<AiProspectionTabProps> = ({ language = 'fr' }) => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-start gap-6">
          <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path
                fillRule="evenodd"
                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Prospection IA Automatisée</h1>
            <p className="text-purple-100 text-lg mb-4">
              Trouvez des leads qualifiés en quelques minutes grâce à l'intelligence artificielle
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Rapide et automatisé</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Leads qualifiés par IA</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <svg className="w-5 h-5 text-purple-200" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Export CRM direct</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prospection Panel */}
      <AiProspectionPanel language={language} />
    </div>
  );
};

export default AiProspectionTab;
