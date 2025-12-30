import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Zap,
  Activity,
  ChevronDown,
  ChevronRight,
  Eye
} from 'lucide-react';

interface AIRequest {
  id: string;
  objective: string;
  operationType: string;
  provider: string;
  latencyMs: number;
  tokensUsed?: number;
  cost: number;
  success: boolean;
  errorMessage?: string;
  userId: string;
  agencyId?: string;
  createdAt: string;
  completedAt?: string;
  requestData?: any;
  responseData?: any;
}

export default function AIRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AIRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'success' | 'failed'>('all');
  const [selectedOperationType, setSelectedOperationType] = useState<string>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [selectedStatus, selectedOperationType, selectedProvider, dateRange]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockRequests: AIRequest[] = [
        {
          id: '1',
          objective: 'Analyze property description for SEO optimization',
          operationType: 'seo',
          provider: 'anthropic',
          latencyMs: 1250,
          tokensUsed: 2500,
          cost: 0.015,
          success: true,
          userId: 'user1',
          createdAt: new Date().toISOString(),
          completedAt: new Date(Date.now() + 1250).toISOString(),
          requestData: { property: 'Maison 3 chambres Paris 15e' },
          responseData: { optimizedTitle: 'Appartement 3 pièces lumineux...', score: 95 }
        },
        {
          id: '2',
          objective: 'Qualify lead based on LinkedIn profile',
          operationType: 'prospecting_qualify',
          provider: 'gemini',
          latencyMs: 890,
          tokensUsed: 1800,
          cost: 0.003,
          success: true,
          userId: 'user1',
          createdAt: new Date(Date.now() - 300000).toISOString(),
          completedAt: new Date(Date.now() - 298000).toISOString(),
        },
        {
          id: '3',
          objective: 'Quick property analysis',
          operationType: 'analysis_quick',
          provider: 'openai',
          latencyMs: 2300,
          cost: 0.008,
          success: false,
          errorMessage: 'Rate limit exceeded',
          userId: 'user1',
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
        {
          id: '4',
          objective: 'Mass prospecting enrichment - 50 leads',
          operationType: 'prospecting_mass',
          provider: 'gemini',
          latencyMs: 5600,
          tokensUsed: 12000,
          cost: 0.025,
          success: true,
          userId: 'user1',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          completedAt: new Date(Date.now() - 1794000).toISOString(),
        },
      ];

      setRequests(mockRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    // Status filter
    if (selectedStatus !== 'all' && req.success !== (selectedStatus === 'success')) {
      return false;
    }

    // Operation type filter
    if (selectedOperationType !== 'all' && req.operationType !== selectedOperationType) {
      return false;
    }

    // Provider filter
    if (selectedProvider !== 'all' && req.provider !== selectedProvider) {
      return false;
    }

    // Search filter
    if (searchTerm && !req.objective.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const operationTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'seo', label: 'SEO Generation' },
    { value: 'prospecting_qualify', label: 'Prospecting Qualify' },
    { value: 'prospecting_mass', label: 'Prospecting Mass' },
    { value: 'analysis_quick', label: 'Quick Analysis' },
    { value: 'analysis_deep', label: 'Deep Analysis' },
    { value: 'content_generation', label: 'Content Generation' },
  ];

  const providers = [
    { value: 'all', label: 'All Providers' },
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'openai', label: 'OpenAI (GPT)' },
    { value: 'gemini', label: 'Google Gemini' },
    { value: 'mistral', label: 'Mistral AI' },
  ];

  const stats = {
    total: requests.length,
    success: requests.filter((r) => r.success).length,
    failed: requests.filter((r) => !r.success).length,
    avgLatency: Math.round(
      requests.reduce((sum, r) => sum + r.latencyMs, 0) / requests.length || 0
    ),
    totalCost: requests.reduce((sum, r) => sum + r.cost, 0),
  };

  return (
    <>
      <Head>
        <title>AI Requests History - CRM Immobilier</title>
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
          <h1 className="text-3xl font-bold text-gray-900">AI Requests History</h1>
          <p className="text-gray-600 mt-1">
            Detailed logs of all AI orchestration requests
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Success</p>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.success}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Latency</p>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgLatency}ms</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(3)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search objectives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>

            {/* Operation Type filter */}
            <select
              value={selectedOperationType}
              onChange={(e) => setSelectedOperationType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {operationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Provider filter */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Requests ({filteredRequests.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin" />
                <p>Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No requests found</p>
              </div>
            ) : (
              filteredRequests.map((req) => (
                <div key={req.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Status Icon */}
                      {req.success ? (
                        <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600 mt-1" />
                      )}

                      {/* Main Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{req.objective}</h3>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded border border-blue-200">
                            {req.operationType}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            <span>Provider: <span className="font-medium">{req.provider}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{req.latencyMs}ms</span>
                          </div>
                          {req.tokensUsed && (
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              <span>{req.tokensUsed.toLocaleString()} tokens</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span>${req.cost.toFixed(4)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          {new Date(req.createdAt).toLocaleString()}
                        </p>

                        {req.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <span className="font-medium">Error:</span> {req.errorMessage}
                          </div>
                        )}

                        {/* Expandable Details */}
                        {expandedRequest === req.id && (req.requestData || req.responseData) && (
                          <div className="mt-4 space-y-3">
                            {req.requestData && (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Request Data:</p>
                                <pre className="text-xs text-gray-600 overflow-x-auto">
                                  {JSON.stringify(req.requestData, null, 2)}
                                </pre>
                              </div>
                            )}
                            {req.responseData && (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Response Data:</p>
                                <pre className="text-xs text-gray-600 overflow-x-auto">
                                  {JSON.stringify(req.responseData, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedRequest(expandedRequest === req.id ? null : req.id)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="View details"
                      >
                        {expandedRequest === req.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
