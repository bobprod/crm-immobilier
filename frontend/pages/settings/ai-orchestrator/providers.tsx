import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Zap,
  Settings,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  apiKeyConfigured: boolean;
  priority: number;
  successRate: number;
  avgLatency: number;
  monthlyUsage: number;
  monthlyBudget?: number;
  dailyBudget?: number;
  operationTypes: string[];
}

interface RoutingRule {
  operationType: string;
  providers: {
    provider: string;
    priority: number;
    enabled: boolean;
  }[];
}

export default function AIProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProviders();
    fetchRoutingRules();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockProviders: LLMProvider[] = [
        {
          id: '1',
          name: 'Claude 3.5 Sonnet',
          provider: 'anthropic',
          isActive: true,
          apiKeyConfigured: true,
          priority: 1,
          successRate: 99.2,
          avgLatency: 1200,
          monthlyUsage: 45.50,
          monthlyBudget: 500,
          dailyBudget: 20,
          operationTypes: ['seo', 'analysis_deep', 'content_generation', 'prospecting_qualify'],
        },
        {
          id: '2',
          name: 'GPT-4 Turbo',
          provider: 'openai',
          isActive: true,
          apiKeyConfigured: true,
          priority: 2,
          successRate: 97.8,
          avgLatency: 1500,
          monthlyUsage: 32.20,
          monthlyBudget: 300,
          operationTypes: ['seo', 'analysis_quick', 'content_generation'],
        },
        {
          id: '3',
          name: 'Gemini 1.5 Pro',
          provider: 'gemini',
          isActive: true,
          apiKeyConfigured: true,
          priority: 3,
          successRate: 96.5,
          avgLatency: 850,
          monthlyUsage: 18.75,
          monthlyBudget: 200,
          operationTypes: ['prospecting_mass', 'analysis_quick', 'prospecting_qualify'],
        },
        {
          id: '4',
          name: 'Mistral Large',
          provider: 'mistral',
          isActive: false,
          apiKeyConfigured: false,
          priority: 4,
          successRate: 0,
          avgLatency: 0,
          monthlyUsage: 0,
          operationTypes: [],
        },
      ];

      setProviders(mockProviders);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutingRules = async () => {
    try {
      // Mock data - replace with actual API call
      const mockRules: RoutingRule[] = [
        {
          operationType: 'seo',
          providers: [
            { provider: 'anthropic', priority: 1, enabled: true },
            { provider: 'openai', priority: 2, enabled: true },
          ],
        },
        {
          operationType: 'prospecting_qualify',
          providers: [
            { provider: 'anthropic', priority: 1, enabled: true },
            { provider: 'gemini', priority: 2, enabled: true },
          ],
        },
        {
          operationType: 'prospecting_mass',
          providers: [
            { provider: 'gemini', priority: 1, enabled: true },
            { provider: 'anthropic', priority: 2, enabled: false },
          ],
        },
        {
          operationType: 'analysis_quick',
          providers: [
            { provider: 'gemini', priority: 1, enabled: true },
            { provider: 'openai', priority: 2, enabled: true },
          ],
        },
        {
          operationType: 'analysis_deep',
          providers: [
            { provider: 'anthropic', priority: 1, enabled: true },
          ],
        },
        {
          operationType: 'content_generation',
          providers: [
            { provider: 'anthropic', priority: 1, enabled: true },
            { provider: 'openai', priority: 2, enabled: true },
          ],
        },
      ];

      setRoutingRules(mockRules);
    } catch (error) {
      console.error('Failed to fetch routing rules:', error);
    }
  };

  const handleProviderToggle = (providerId: string) => {
    setProviders(providers.map(p =>
      p.id === providerId ? { ...p, isActive: !p.isActive } : p
    ));
    setHasChanges(true);
  };

  const handlePriorityChange = (providerId: string, newPriority: number) => {
    setProviders(providers.map(p =>
      p.id === providerId ? { ...p, priority: newPriority } : p
    ));
    setHasChanges(true);
  };

  const handleRoutingRuleToggle = (operationType: string, provider: string) => {
    setRoutingRules(routingRules.map(rule =>
      rule.operationType === operationType
        ? {
            ...rule,
            providers: rule.providers.map(p =>
              p.provider === provider ? { ...p, enabled: !p.enabled } : p
            )
          }
        : rule
    ));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // TODO: Save to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('✅ Configuration saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
      alert('❌ Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all changes?')) {
      fetchProviders();
      fetchRoutingRules();
      setHasChanges(false);
    }
  };

  const operationTypeLabels: Record<string, string> = {
    seo: 'SEO Generation',
    prospecting_qualify: 'Prospecting Qualify',
    prospecting_mass: 'Prospecting Mass',
    analysis_quick: 'Quick Analysis',
    analysis_deep: 'Deep Analysis',
    content_generation: 'Content Generation',
  };

  return (
    <>
      <Head>
        <title>AI Provider Configuration - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/settings/ai-orchestrator')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to AI Orchestrator
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Provider Configuration</h1>
              <p className="text-gray-600 mt-1">
                Manage LLM providers and routing rules for AI operations
              </p>
            </div>

            {hasChanges && (
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Providers Overview */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">LLM Providers</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {providers.map((provider) => (
              <div key={provider.id} className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Status Icon */}
                    {provider.isActive ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400 mt-1" />
                    )}

                    {/* Provider Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${
                          provider.isActive
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {!provider.apiKeyConfigured && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded border border-yellow-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            API Key Missing
                          </span>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>Success: <span className="font-medium">{provider.successRate}%</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Latency: <span className="font-medium">{provider.avgLatency}ms</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span>Usage: <span className="font-medium">${provider.monthlyUsage}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Zap className="w-4 h-4" />
                          <span>Priority: <span className="font-medium">{provider.priority}</span></span>
                        </div>
                      </div>

                      {/* Budget Progress */}
                      {provider.monthlyBudget && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Monthly Budget</span>
                            <span>${provider.monthlyUsage} / ${provider.monthlyBudget}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                (provider.monthlyUsage / provider.monthlyBudget) > 0.9
                                  ? 'bg-red-500'
                                  : (provider.monthlyUsage / provider.monthlyBudget) > 0.7
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min((provider.monthlyUsage / provider.monthlyBudget) * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Operation Types */}
                      {provider.operationTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {provider.operationTypes.map((type) => (
                            <span
                              key={type}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200"
                            >
                              {operationTypeLabels[type] || type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleProviderToggle(provider.id)}
                        disabled={!provider.apiKeyConfigured}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          provider.isActive
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {provider.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Priority:</label>
                        <input
                          type="number"
                          value={provider.priority}
                          onChange={(e) => handlePriorityChange(provider.id, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                          min="1"
                          max="10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Routing Rules */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Routing Rules by Operation Type</h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure which providers to use for each operation type (ordered by priority)
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {routingRules.map((rule) => (
              <div key={rule.operationType} className="px-6 py-5">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {operationTypeLabels[rule.operationType] || rule.operationType}
                </h3>

                <div className="space-y-2">
                  {rule.providers
                    .sort((a, b) => a.priority - b.priority)
                    .map((ruleProvider) => {
                      const providerInfo = providers.find(p => p.provider === ruleProvider.provider);
                      return (
                        <div
                          key={ruleProvider.provider}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              #{ruleProvider.priority}
                            </span>
                            <span className="font-medium text-gray-900">
                              {providerInfo?.name || ruleProvider.provider}
                            </span>
                            {providerInfo && (
                              <span className="text-sm text-gray-600">
                                ({providerInfo.successRate}% success, {providerInfo.avgLatency}ms)
                              </span>
                            )}
                          </div>

                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={ruleProvider.enabled}
                              onChange={() => handleRoutingRuleToggle(rule.operationType, ruleProvider.provider)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {ruleProvider.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
