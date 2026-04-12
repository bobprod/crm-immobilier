import React, { useState, useEffect } from 'react';
import { AlertCircle, Zap, DollarSign, TrendingUp } from 'lucide-react';

/**
 * Types d'opérations disponibles
 */
export type OperationType =
  | 'seo'
  | 'prospecting_mass'
  | 'prospecting_qualify'
  | 'analysis_quick'
  | 'content_generation'
  | 'long_context'
  | 'scraping_analysis';

/**
 * Props du composant
 */
interface LLMProviderSelectorProps {
  /** Type d'opération pour suggestion intelligente */
  operationType: OperationType;
  /** Provider sélectionné ('auto' ou nom du provider) */
  value: string;
  /** Callback quand le provider change */
  onChange: (provider: string) => void;
  /** Afficher les stats en temps réel */
  showStats?: boolean;
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Interface provider configuré
 */
interface UserProvider {
  id: string;
  provider: string;
  model?: string;
  isActive: boolean;
  priority: number;
  monthlyBudget?: number;
  monthlyUsage: number;
  budgetRemaining?: number;
  performance?: {
    avgLatency: number;
    successRate: number;
    totalCalls: number;
    totalCost: number;
  };
}

/**
 * Interface suggestion
 */
interface Suggestion {
  provider: string;
  reason: string;
  criteria: string;
}

/**
 * Composant de sélection intelligente de provider LLM
 *
 * Features:
 * - Sélection auto basée sur le type d'opération
 * - Override manuel possible
 * - Affichage des stats en temps réel
 * - Budget tracking visuel
 *
 * @example
 * ```tsx
 * <LLMProviderSelector
 *   operationType="seo"
 *   value={selectedProvider}
 *   onChange={setSelectedProvider}
 *   showStats={true}
 * />
 * ```
 */
export function LLMProviderSelector({
  operationType,
  value,
  onChange,
  showStats = true,
  className = '',
}: LLMProviderSelectorProps) {
  const [providers, setProviders] = useState<UserProvider[]>([]);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charger les providers configurés par l'utilisateur
   */
  useEffect(() => {
    loadProviders();
    loadSuggestion();
  }, [operationType]);

  async function loadProviders() {
    try {
      const res = await fetch('/api/llm-config/user-providers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!res.ok) throw new Error('Erreur de chargement des providers');

      const data = await res.json();
      setProviders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSuggestion() {
    try {
      const res = await fetch(`/api/llm-config/suggest/${operationType}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestion(data);
      }
    } catch (err) {
      console.warn('Impossible de charger la suggestion:', err);
    }
  }

  /**
   * Obtenir les détails du provider sélectionné
   */
  const selectedProvider = value === 'auto'
    ? suggestion
      ? providers.find((p) => p.provider === suggestion.provider)
      : providers[0]
    : providers.find((p) => p.provider === value);

  /**
   * Icône selon le critère
   */
  const getCriteriaIcon = (criteria: string) => {
    switch (criteria) {
      case 'cost':
        return <DollarSign className="w-4 h-4" />;
      case 'speed':
        return <Zap className="w-4 h-4" />;
      case 'quality':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  /**
   * Couleur selon le budget restant
   */
  const getBudgetColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-500 text-sm flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <p>Aucun provider configuré.</p>
        <a href="/settings/llm-config" className="text-blue-500 hover:underline">
          Configurer maintenant →
        </a>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        Provider LLM
      </label>

      {/* Select */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        {/* Option Auto */}
        <option value="auto">
          🤖 Auto
          {suggestion &&
            ` - ${suggestion.provider.toUpperCase()} recommandé (${suggestion.reason})`}
        </option>

        {/* Providers configurés */}
        <optgroup label="Vos providers configurés">
          {providers.map((p) => (
            <option key={p.provider} value={p.provider} disabled={!p.isActive}>
              {p.provider.toUpperCase()}
              {p.model && ` - ${p.model}`}
              {p.budgetRemaining !== null &&
                ` (Budget: $${p.budgetRemaining.toFixed(2)})`}
              {!p.isActive && ' [INACTIF]'}
            </option>
          ))}
        </optgroup>
      </select>

      {/* Stats en temps réel */}
      {showStats && selectedProvider && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Provider actuel:</span>
            <span className="font-semibold text-gray-900">
              {value === 'auto' ? '🤖 Auto - ' : ''}
              {selectedProvider.provider.toUpperCase()}
            </span>
          </div>

          {/* Budget */}
          {selectedProvider.monthlyBudget && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Budget mensuel:</span>
                <span
                  className={`font-medium ${getBudgetColor(
                    selectedProvider.budgetRemaining || 0,
                    selectedProvider.monthlyBudget,
                  )}`}
                >
                  ${selectedProvider.monthlyUsage.toFixed(2)} /{' '}
                  ${selectedProvider.monthlyBudget.toFixed(2)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${selectedProvider.budgetRemaining &&
                      selectedProvider.budgetRemaining > 0
                      ? 'bg-green-500'
                      : 'bg-red-500'
                    }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (selectedProvider.monthlyUsage /
                        selectedProvider.monthlyBudget) *
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Performance */}
          {selectedProvider.performance && (
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 pt-2 border-t border-gray-200">
              <div>
                <span className="block">Taux de succès:</span>
                <span className="font-semibold text-gray-900">
                  {selectedProvider.performance.successRate.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="block">Latence moy:</span>
                <span className="font-semibold text-gray-900">
                  {selectedProvider.performance.avgLatency}ms
                </span>
              </div>
              <div>
                <span className="block">Total appels:</span>
                <span className="font-semibold text-gray-900">
                  {selectedProvider.performance.totalCalls}
                </span>
              </div>
              <div>
                <span className="block">Coût total:</span>
                <span className="font-semibold text-gray-900">
                  ${selectedProvider.performance.totalCost.toFixed(4)}
                </span>
              </div>
            </div>
          )}

          {/* Suggestion */}
          {value === 'auto' && suggestion && (
            <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1.5">
              {getCriteriaIcon(suggestion.criteria)}
              <span>{suggestion.reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
