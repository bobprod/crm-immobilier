import React from 'react';
import { ConversionFunnelData, FunnelMetrics } from '../types/ai-prospection.types';

interface ConversionFunnelProps {
  funnelData: ConversionFunnelData;
}

const FunnelStageCard: React.FC<{ stage: FunnelMetrics; index: number; total: number }> = ({ stage, index, total }) => {
  const stageConfigs = {
    new: {
      label: 'Nouveaux',
      color: 'bg-blue-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
        </svg>
      ),
    },
    contacted: {
      label: 'Contactés',
      color: 'bg-purple-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
        </svg>
      ),
    },
    qualified: {
      label: 'Qualifiés',
      color: 'bg-yellow-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    converted: {
      label: 'Convertis',
      color: 'bg-green-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    rejected: {
      label: 'Rejetés',
      color: 'bg-red-500',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = stageConfigs[stage.stage] || stageConfigs.new;
  const widthPercentage = (stage.count / total) * 100;

  return (
    <div className="flex-1 min-w-0">
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className={`p-1.5 ${config.color} text-white rounded-lg`}>
            {config.icon}
          </div>
          <h4 className="text-sm font-semibold text-gray-900">{config.label}</h4>
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{stage.count}</span>
          <span className="text-sm text-gray-500">({stage.percentage.toFixed(1)}%)</span>
        </div>
        {stage.avgTimeInStage !== undefined && stage.avgTimeInStage > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Temps moyen: {stage.avgTimeInStage < 24 ? `${stage.avgTimeInStage}h` : `${Math.round(stage.avgTimeInStage / 24)}j`}
          </p>
        )}
      </div>

      {/* Visual Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${config.color} transition-all duration-500`}
            style={{ width: `${widthPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ funnelData }) => {
  // Filter out rejected stage for funnel visualization (show separately)
  const funnelStages = funnelData.stages.filter((s) => s.stage !== 'rejected');
  const rejectedStage = funnelData.stages.find((s) => s.stage === 'rejected');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Tunnel de Conversion</h3>
            <p className="text-sm text-gray-600">Suivi de la performance de la campagne</p>
          </div>
        </div>

        {/* Conversion Rate Badge */}
        <div className="text-right">
          <p className="text-xs text-gray-500 mb-1">Taux de conversion</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg border border-green-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
            </svg>
            <span className="text-2xl font-bold">{funnelData.conversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Funnel Stages */}
      <div className="space-y-8 mb-8">
        <div className="flex items-center gap-4">
          {funnelStages.map((stage, index) => (
            <React.Fragment key={stage.stage}>
              <FunnelStageCard stage={stage} index={index} total={funnelData.totalLeads} />
              {index < funnelStages.length - 1 && (
                <div className="flex-shrink-0 text-gray-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Rejected Stage (Separate) */}
      {rejectedStage && rejectedStage.count > 0 && (
        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-red-500 text-white rounded-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Leads Rejetés</h4>
                <p className="text-xs text-gray-500">Non qualifiés ou non pertinents</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">{rejectedStage.count}</span>
                <span className="text-sm text-gray-500">({rejectedStage.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-purple-50 rounded-lg p-4 border border-purple-100">
        {/* Total Value */}
        {funnelData.totalValue && (
          <div className="text-center">
            <p className="text-xs font-medium text-purple-700 mb-1">Valeur Générée</p>
            <p className="text-2xl font-bold text-purple-900">
              {(funnelData.totalValue / 1000).toFixed(0)}k TND
            </p>
          </div>
        )}

        {/* Avg Conversion Time */}
        {funnelData.avgConversionTime && (
          <div className="text-center">
            <p className="text-xs font-medium text-purple-700 mb-1">Temps Moyen de Conversion</p>
            <p className="text-2xl font-bold text-purple-900">
              {funnelData.avgConversionTime} jours
            </p>
          </div>
        )}

        {/* Total Leads */}
        <div className="text-center">
          <p className="text-xs font-medium text-purple-700 mb-1">Total Leads</p>
          <p className="text-2xl font-bold text-purple-900">
            {funnelData.totalLeads}
          </p>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">À propos du tunnel de conversion</p>
            <p className="text-sm text-blue-700 mt-1">
              Ces données représentent le parcours moyen des leads générés par cette campagne.
              Les métriques sont calculées en fonction de l'historique de vos conversions précédentes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
