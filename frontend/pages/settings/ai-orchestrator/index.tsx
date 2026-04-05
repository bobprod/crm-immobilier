import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import {
  Activity,
  TrendingUp,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';

export default function AIOrchestratorDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalRequests: 1247,
        successRate: 98.5,
        avgLatency: 850,
        totalCost: 12.47,
        activeProviders: 5,
      });

      setRecentRequests([
        {
          id: '1',
          objective: 'Analyze property description',
          operationType: 'analysis_quick',
          provider: 'gemini',
          latency: 756,
          cost: 0.002,
          success: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          objective: 'Generate SEO content',
          operationType: 'seo',
          provider: 'anthropic',
          latency: 1200,
          cost: 0.015,
          success: true,
          createdAt: new Date(Date.now() - 300000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
     <MainLayout title="Settings" breadcrumbs={[{ label: "Paramètres" }]}>
      <Head>
        <title>AI Orchestrator - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Orchestrator</h1>
          <p className="text-gray-600 mt-1">
            Centralized AI operations monitoring and management
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats?.totalRequests?.toLocaleString() || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.successRate || 0}%</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.avgLatency || 0}ms</p>
            <p className="text-xs text-gray-500 mt-1">Response time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.totalCost?.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Providers</p>
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.activeProviders || 0}</p>
            <p className="text-xs text-gray-500 mt-1">LLM providers</p>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Requests</h2>
              <button
                onClick={() => router.push('/settings/ai-orchestrator/requests')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {recentRequests.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No recent requests</p>
              </div>
            ) : (
              recentRequests.map((req) => (
                <div key={req.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {req.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}

                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{req.objective}</p>
                        <p className="text-sm text-gray-500">
                          Type: <span className="font-medium">{req.operationType}</span>
                          {' • '}
                          Provider: <span className="font-medium">{req.provider}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{req.latency}ms</p>
                        <p className="text-xs text-gray-500">${req.cost.toFixed(4)}</p>
                      </div>

                      <div className="text-sm text-gray-500">
                        {new Date(req.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/settings/ai-orchestrator/requests')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Request History</h3>
            <p className="text-sm text-gray-600">View detailed logs of all AI requests</p>
          </button>

          <button
            onClick={() => router.push('/settings/ai-orchestrator/providers')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <Zap className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Configure Providers</h3>
            <p className="text-sm text-gray-600">Manage LLM providers and routing rules</p>
          </button>

          <button
            onClick={() => router.push('/settings/ai-billing')}
            className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
          >
            <DollarSign className="w-8 h-8 text-green-600 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">AI Billing</h3>
            <p className="text-sm text-gray-600">Manage credits and view usage details</p>
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
