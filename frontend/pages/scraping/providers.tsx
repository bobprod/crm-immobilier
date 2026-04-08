import { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Cloud,
  Code,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '@/shared/utils/backend-api';

interface Provider {
  provider: string;
  name: string;
  category: string;
  isActive: boolean;
  status: string;
  successRate: number;
  avgLatency: number;
  totalCalls: number;
  monthlyUsage: number;
  monthlyBudget: number | null;
  hasApiKey: boolean;
}

export default function ScrapingProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/provider-registry/available/scraping');
      setProviders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProvider = async (providerId: string) => {
    setTesting(providerId);
    try {
      const res = await apiClient.post(`/provider-registry/${providerId}/test`);
      const result = res.data;

      if (result.success) {
        alert(`✅ ${result.message}\nLatency: ${result.latency}ms`);
      } else {
        alert(`❌ Test failed: ${result.message}`);
      }

      fetchProviders();
    } catch (error) {
      console.error('Test failed:', error);
      alert('❌ Test failed');
    } finally {
      setTesting(null);
    }
  };

  const getProviderIcon = (category: string) => {
    switch (category) {
      case 'internal':
        return <Code className="w-6 h-6 text-purple-600" />;
      case 'external_api':
        return <Cloud className="w-6 h-6 text-blue-600" />;
      default:
        return <Zap className="w-6 h-6 text-gray-600" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'internal':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Internal</span>;
      case 'external_api':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">External API</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{category}</span>;
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        Inactive
      </span>;
    }

    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Active
        </span>;
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          Error
        </span>;
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          {status}
        </span>;
    }
  };

  return (
    <>
      <Head>
        <title>Scraping Providers - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scraping Providers</h1>
          <p className="text-gray-600 mt-1">
            Configure and test scraping providers (Internal & External APIs)
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Provider Selection</p>
              <p className="text-sm text-blue-700 mt-1">
                The system automatically selects the best provider based on URL type, performance metrics, and availability.
                Internal providers (Cheerio, Puppeteer) are free, while external APIs (Firecrawl) may have costs.
              </p>
            </div>
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-2 flex items-center justify-center py-12">
              <Activity className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : providers.length === 0 ? (
            <div className="col-span-2 text-center py-12">
              <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No providers configured yet</p>
            </div>
          ) : (
            providers.map((provider) => (
              <div
                key={provider.provider}
                className="bg-white rounded-lg shadow border border-gray-200 p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {getProviderIcon(provider.category)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                      <p className="text-sm text-gray-500">{provider.provider}</p>
                    </div>
                  </div>
                  {getStatusBadge(provider.status, provider.isActive)}
                </div>

                {/* Category & API Key */}
                <div className="flex items-center gap-2 mb-4">
                  {getCategoryBadge(provider.category)}
                  {provider.hasApiKey ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      API Key
                    </span>
                  ) : provider.category !== 'internal' ? (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      No API Key
                    </span>
                  ) : null}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Success Rate</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {provider.successRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Latency</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {provider.avgLatency > 0 ? `${provider.avgLatency.toFixed(0)}ms` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Calls</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {provider.totalCalls.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Cost</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${provider.monthlyUsage.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Budget */}
                {provider.monthlyBudget && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Budget Usage</span>
                      <span className="text-xs font-medium text-gray-900">
                        {((provider.monthlyUsage / provider.monthlyBudget) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
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

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => testProvider(provider.provider)}
                    disabled={testing === provider.provider}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing === provider.provider ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Test
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.location.href = `/settings/providers?provider=${provider.provider}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Configure
                  </button>
                </div>

                {/* Description */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    {provider.provider === 'cheerio' && 'Fast HTML parsing for static sites. 100% free, ideal for simple scraping.'}
                    {provider.provider === 'puppeteer' && 'Browser automation for JavaScript-heavy sites. Free but slower, supports screenshots.'}
                    {provider.provider === 'firecrawl' && 'AI-powered scraping for complex sites. Paid service with LLM extraction capabilities.'}
                    {provider.provider === 'pica' && 'Multi-source real estate data aggregator. Paid API for property listings.'}
                    {provider.provider === 'serpapi' && 'Google Search scraping. Paid API for SERP results extraction.'}
                    {provider.provider === 'scrapingbee' && 'Proxy-based scraping with anti-bot protection. Paid service.'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Performance Summary */}
        {providers.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Providers</p>
                <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {providers.filter(p => p.isActive && p.status === 'active').length}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-blue-600">
                  {providers.reduce((sum, p) => sum + p.totalCalls, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Monthly Cost</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${providers.reduce((sum, p) => sum + p.monthlyUsage, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
