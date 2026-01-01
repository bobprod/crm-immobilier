import React from 'react';
import { Zap, TrendingUp, Clock, DollarSign, Info } from 'lucide-react';

export interface LlmProvider {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'gemini' | 'mistral' | 'auto';
  description: string;
  isActive: boolean;
  successRate?: number;
  avgLatency?: number;
  estimatedCost?: number;
  recommended?: boolean;
}

export interface LlmProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (providerId: string) => void;
  disabled?: boolean;
  showMetrics?: boolean;
}

export const LlmProviderSelector: React.FC<LlmProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  disabled = false,
  showMetrics = true,
}) => {
  // Mock providers - In production, fetch from API
  const providers: LlmProvider[] = [
    {
      id: 'auto',
      name: 'Sélection Automatique (Recommandé)',
      provider: 'auto',
      description: 'Le système choisira automatiquement le meilleur provider basé sur la performance, le coût et la disponibilité',
      isActive: true,
      recommended: true,
    },
    {
      id: 'anthropic',
      name: 'Claude 3.5 Sonnet (Anthropic)',
      provider: 'anthropic',
      description: 'Meilleure qualité pour analyses complexes et prospection qualitative',
      isActive: true,
      successRate: 99.2,
      avgLatency: 1200,
      estimatedCost: 0.025,
    },
    {
      id: 'openai',
      name: 'GPT-4 Turbo (OpenAI)',
      provider: 'openai',
      description: 'Excellent équilibre qualité/vitesse pour prospection standard',
      isActive: true,
      successRate: 97.8,
      avgLatency: 1500,
      estimatedCost: 0.020,
    },
    {
      id: 'gemini',
      name: 'Gemini 1.5 Pro (Google)',
      provider: 'gemini',
      description: 'Rapide et économique pour prospection en masse',
      isActive: true,
      successRate: 96.5,
      avgLatency: 850,
      estimatedCost: 0.008,
    },
    {
      id: 'mistral',
      name: 'Mistral Large',
      provider: 'mistral',
      description: 'Provider européen pour la souveraineté des données',
      isActive: false,
      successRate: 0,
      avgLatency: 0,
      estimatedCost: 0,
    },
  ];

  const activeProviders = providers.filter(p => p.isActive);
  const selected = providers.find(p => p.id === selectedProvider);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Provider LLM pour l'IA
          </h3>
        </div>
        {selected?.recommended && (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded border border-purple-200">
            Recommandé
          </span>
        )}
      </div>

      {/* Provider Cards */}
      <div className="space-y-3">
        {activeProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onProviderChange(provider.id)}
            disabled={disabled}
            className={`
              w-full text-left p-4 rounded-lg border-2 transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${
                selectedProvider === provider.id
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
              }
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Radio Button */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${
                      selectedProvider === provider.id
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300 bg-white'
                    }
                  `}
                >
                  {selectedProvider === provider.id && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>

                {/* Provider Name */}
                <div>
                  <p className="font-semibold text-gray-900">{provider.name}</p>
                  {provider.recommended && (
                    <span className="text-xs text-purple-600 font-medium">
                      ⭐ Recommandé
                    </span>
                  )}
                </div>
              </div>

              {/* Provider Icon/Badge */}
              {provider.provider !== 'auto' && (
                <div className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">
                  {provider.provider}
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 ml-8 mb-3">
              {provider.description}
            </p>

            {/* Metrics */}
            {showMetrics && provider.provider !== 'auto' && provider.successRate && (
              <div className="ml-8 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span>{provider.successRate}% réussite</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>{provider.avgLatency}ms</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <DollarSign className="w-3 h-3 text-orange-600" />
                  <span>~${provider.estimatedCost.toFixed(3)}/req</span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <p className="font-medium mb-1">À propos de la sélection de provider</p>
          <p className="text-blue-700">
            La <strong>sélection automatique</strong> utilise un algorithme intelligent qui choisit le meilleur
            provider en temps réel selon: performance historique, budget disponible, et charge actuelle.
            Vous pouvez forcer un provider spécifique si vous avez des besoins particuliers.
          </p>
        </div>
      </div>

      {/* Selected Provider Summary */}
      {selected && selectedProvider !== 'auto' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Provider sélectionné:</p>
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">{selected.name}</p>
            {selected.estimatedCost && (
              <p className="text-sm text-gray-600">
                Coût estimé: <span className="font-semibold">${selected.estimatedCost.toFixed(3)}</span> par requête
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
