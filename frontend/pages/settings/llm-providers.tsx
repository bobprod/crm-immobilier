import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/shared/components/layout';
import { apiClient } from '@/shared/utils/backend-api';

/**
 * Interface provider configuré
 */
interface UserProvider {
  id: string;
  provider: string;
  apiKey: string;
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
 * Interface provider disponible
 */
interface AvailableProvider {
  id: string;
  name: string;
  models: string[];
  description: string;
  pricing: string;
  keyFormat: string;
  website: string;
}

/**
 * Page de gestion des providers LLM multi-clés
 *
 * Permet à l'utilisateur de:
 * - Configurer plusieurs providers (plusieurs clés API)
 * - Définir des budgets mensuels par provider
 * - Voir les stats d'utilisation en temps réel
 * - Activer/désactiver des providers
 * - Définir la priorité de fallback
 */
export default function LLMProvidersPage() {
  const [userProviders, setUserProviders] = useState<UserProvider[]>([]);
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<UserProvider | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const userRes = await apiClient.get('/llm-config/user-providers');
      setUserProviders(Array.isArray(userRes.data) ? userRes.data : []);

      const availableRes = await apiClient.get('/llm-config/providers');
      setAvailableProviders(Array.isArray(availableRes.data) ? availableRes.data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProvider(provider: string) {
    if (!confirm(`Supprimer le provider ${provider} ?`)) return;
    try {
      await apiClient.delete(`/llm-config/user-providers/${provider}`);
      await loadData();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  }

  async function toggleActive(provider: UserProvider) {
    try {
      await apiClient.put(`/llm-config/user-providers/${provider.provider}`, { isActive: !provider.isActive });
      await loadData();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Providers LLM Multi-Clés
            </h1>
            <p className="text-gray-600 mt-1">
              Configurez plusieurs providers pour routing intelligent
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Ajouter un provider
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Liste des providers configurés */}
        {userProviders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">
              Aucun provider configuré. Ajoutez votre premier provider pour commencer.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ajouter un provider
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {userProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between">
                  {/* Info provider */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {provider.provider.toUpperCase()}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          provider.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {provider.isActive ? 'Actif' : 'Inactif'}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Priorité: {provider.priority}
                      </span>
                    </div>
                    {provider.model && (
                      <p className="text-sm text-gray-600 mb-3">
                        Modèle: {provider.model}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {/* Budget */}
                      {provider.monthlyBudget && (
                        <div>
                          <p className="text-xs text-gray-500">Budget mensuel</p>
                          <p className="text-lg font-semibold">
                            ${provider.monthlyUsage.toFixed(2)} /{' '}
                            ${provider.monthlyBudget.toFixed(2)}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className={`h-2 rounded-full ${
                                provider.budgetRemaining && provider.budgetRemaining > 0
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (provider.monthlyUsage / provider.monthlyBudget) * 100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Performance */}
                      {provider.performance && (
                        <>
                          <div>
                            <p className="text-xs text-gray-500">Taux de succès</p>
                            <p className="text-lg font-semibold">
                              {provider.performance.successRate.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Latence moyenne</p>
                            <p className="text-lg font-semibold">
                              {provider.performance.avgLatency}ms
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total appels</p>
                            <p className="text-lg font-semibold">
                              {provider.performance.totalCalls}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Clé API (masquée) */}
                    <p className="text-sm text-gray-500">
                      Clé API: {provider.apiKey}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(provider)}
                      className={`p-2 rounded-lg ${
                        provider.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={provider.isActive ? 'Désactiver' : 'Activer'}
                    >
                      {provider.isActive ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <X className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => setEditingProvider(provider)}
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      title="Modifier"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteProvider(provider.provider)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Providers disponibles */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Providers disponibles
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {availableProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <h3 className="font-semibold text-gray-900 mb-1">{provider.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                <p className="text-xs text-gray-500">Prix: {provider.pricing}</p>
                <p className="text-xs text-gray-500">Format clé: {provider.keyFormat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TODO: Modal d'ajout/édition */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Ajouter un provider</h2>
            <p className="text-gray-600">
              Formulaire d'ajout à implémenter...
            </p>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
