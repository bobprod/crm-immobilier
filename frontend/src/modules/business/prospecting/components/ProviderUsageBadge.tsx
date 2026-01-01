import React from 'react';
import { Zap, Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';

export interface ProviderUsageInfo {
  provider: 'anthropic' | 'openai' | 'gemini' | 'mistral';
  providerName: string;
  latencyMs?: number;
  tokensUsed?: number;
  cost?: number;
  success: boolean;
  timestamp: string;
}

export interface ProviderUsageBadgeProps {
  usage: ProviderUsageInfo;
  variant?: 'compact' | 'full';
  showMetrics?: boolean;
}

export const ProviderUsageBadge: React.FC<ProviderUsageBadgeProps> = ({
  usage,
  variant = 'compact',
  showMetrics = true,
}) => {
  const getProviderColor = (provider: string) => {
    const colors = {
      anthropic: 'bg-purple-100 text-purple-800 border-purple-200',
      openai: 'bg-blue-100 text-blue-800 border-blue-200',
      gemini: 'bg-green-100 text-green-800 border-green-200',
      mistral: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {/* Provider Badge */}
        <span
          className={`px-2 py-1 text-xs font-medium rounded border inline-flex items-center gap-1 ${getProviderColor(
            usage.provider
          )}`}
        >
          <Zap className="w-3 h-3" />
          {usage.providerName}
        </span>

        {/* Success/Failure Icon */}
        {usage.success ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600" />
        )}

        {/* Quick Metrics */}
        {showMetrics && usage.latencyMs && (
          <span className="text-xs text-gray-600">
            {usage.latencyMs}ms
          </span>
        )}
      </div>
    );
  }

  // Full variant
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Provider IA Utilisé</h4>
        </div>
        {usage.success ? (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded border border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Succès
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Échec
          </span>
        )}
      </div>

      {/* Provider Info */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`px-3 py-2 text-sm font-medium rounded border ${getProviderColor(
            usage.provider
          )}`}
        >
          {usage.providerName}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(usage.timestamp).toLocaleString('fr-FR')}
        </span>
      </div>

      {/* Metrics Grid */}
      {showMetrics && (
        <div className="grid grid-cols-3 gap-4">
          {usage.latencyMs && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Latence</p>
                <p className="font-semibold text-gray-900">{usage.latencyMs}ms</p>
              </div>
            </div>
          )}

          {usage.tokensUsed && (
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Tokens</p>
                <p className="font-semibold text-gray-900">{usage.tokensUsed.toLocaleString()}</p>
              </div>
            </div>
          )}

          {usage.cost && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-xs text-gray-600">Coût</p>
                <p className="font-semibold text-gray-900">${usage.cost.toFixed(4)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface ProspectionResultWithProvider {
  id: string;
  status: 'success' | 'error';
  leadsCount: number;
  providerUsage?: ProviderUsageInfo;
  createdAt: string;
}

export const ProspectionResultCard: React.FC<{
  result: ProspectionResultWithProvider;
}> = ({ result }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Prospection #{result.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {new Date(result.createdAt).toLocaleString('fr-FR')}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded border ${
            result.status === 'success'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-red-100 text-red-800 border-red-200'
          }`}
        >
          {result.status === 'success' ? 'Terminé' : 'Erreur'}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold text-purple-600">{result.leadsCount} leads</p>
        <p className="text-sm text-gray-600">trouvés et qualifiés</p>
      </div>

      {/* Provider Usage Badge */}
      {result.providerUsage && (
        <div className="pt-4 border-t border-gray-200">
          <ProviderUsageBadge usage={result.providerUsage} variant="full" showMetrics />
        </div>
      )}
    </div>
  );
};
