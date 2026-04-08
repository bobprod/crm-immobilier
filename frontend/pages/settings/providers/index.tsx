import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { MainLayout } from '@/shared/components/layout';
import {
  Plus,
  Search,
  Filter,
  Settings,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  Database,
  Mail,
  CreditCard,
  MessageSquare,
  Link2,
  TrendingUp,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  TestTube2,
  Eye
} from 'lucide-react';

interface Provider {
  id: string;
  type: 'scraping' | 'llm' | 'storage' | 'email' | 'payment' | 'communication' | 'integration';
  category: 'internal' | 'external_api' | 'cloud_service' | 'saas';
  provider: string;
  name: string;
  isActive: boolean;
  apiKeyConfigured: boolean;
  priority: number;
  successRate: number;
  avgLatency: number;
  totalCalls: number;
  monthlyUsage: number;
  monthlyBudget?: number;
  dailyBudget?: number;
  lastUsedAt?: string;
  userId?: string;
  agencyId?: string;
}

export default function UnifiedProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockProviders: Provider[] = [
        // LLM Providers
        {
          id: '1',
          type: 'llm',
          category: 'external_api',
          provider: 'anthropic',
          name: 'Claude 3.5 Sonnet',
          isActive: true,
          apiKeyConfigured: true,
          priority: 1,
          successRate: 99.2,
          avgLatency: 1200,
          totalCalls: 1247,
          monthlyUsage: 45.50,
          monthlyBudget: 500,
          dailyBudget: 20,
          lastUsedAt: new Date().toISOString(),
          userId: 'user1',
        },
        {
          id: '2',
          type: 'llm',
          category: 'external_api',
          provider: 'openai',
          name: 'GPT-4 Turbo',
          isActive: true,
          apiKeyConfigured: true,
          priority: 2,
          successRate: 97.8,
          avgLatency: 1500,
          totalCalls: 892,
          monthlyUsage: 32.20,
          monthlyBudget: 300,
          lastUsedAt: new Date(Date.now() - 300000).toISOString(),
          userId: 'user1',
        },
        {
          id: '3',
          type: 'llm',
          category: 'external_api',
          provider: 'gemini',
          name: 'Google Gemini 1.5 Pro',
          isActive: true,
          apiKeyConfigured: true,
          priority: 3,
          successRate: 96.5,
          avgLatency: 850,
          totalCalls: 654,
          monthlyUsage: 18.75,
          monthlyBudget: 200,
          lastUsedAt: new Date(Date.now() - 600000).toISOString(),
          userId: 'user1',
        },
        // Scraping Providers
        {
          id: '4',
          type: 'scraping',
          category: 'internal',
          provider: 'cheerio',
          name: 'Cheerio Parser',
          isActive: true,
          apiKeyConfigured: true, // No API key needed
          priority: 1,
          successRate: 95.0,
          avgLatency: 450,
          totalCalls: 3245,
          monthlyUsage: 0,
          lastUsedAt: new Date().toISOString(),
          userId: 'user1',
        },
        {
          id: '5',
          type: 'scraping',
          category: 'internal',
          provider: 'puppeteer',
          name: 'Puppeteer Browser',
          isActive: true,
          apiKeyConfigured: true,
          priority: 2,
          successRate: 92.5,
          avgLatency: 2500,
          totalCalls: 1567,
          monthlyUsage: 0,
          lastUsedAt: new Date(Date.now() - 180000).toISOString(),
          userId: 'user1',
        },
        {
          id: '6',
          type: 'scraping',
          category: 'external_api',
          provider: 'firecrawl',
          name: 'Firecrawl API',
          isActive: true,
          apiKeyConfigured: true,
          priority: 3,
          successRate: 98.7,
          avgLatency: 1800,
          totalCalls: 892,
          monthlyUsage: 12.50,
          monthlyBudget: 100,
          lastUsedAt: new Date(Date.now() - 360000).toISOString(),
          userId: 'user1',
        },
        {
          id: '7',
          type: 'scraping',
          category: 'external_api',
          provider: 'scrapingbee',
          name: 'ScrapingBee',
          isActive: false,
          apiKeyConfigured: false,
          priority: 4,
          successRate: 0,
          avgLatency: 0,
          totalCalls: 0,
          monthlyUsage: 0,
          userId: 'user1',
        },
        // Storage Providers
        {
          id: '8',
          type: 'storage',
          category: 'cloud_service',
          provider: 's3',
          name: 'AWS S3',
          isActive: true,
          apiKeyConfigured: true,
          priority: 1,
          successRate: 99.9,
          avgLatency: 250,
          totalCalls: 5678,
          monthlyUsage: 8.90,
          monthlyBudget: 50,
          lastUsedAt: new Date().toISOString(),
          agencyId: 'agency1',
        },
        // Email Providers
        {
          id: '9',
          type: 'email',
          category: 'saas',
          provider: 'sendgrid',
          name: 'SendGrid',
          isActive: true,
          apiKeyConfigured: true,
          priority: 1,
          successRate: 99.5,
          avgLatency: 350,
          totalCalls: 2345,
          monthlyUsage: 15.60,
          monthlyBudget: 100,
          lastUsedAt: new Date(Date.now() - 120000).toISOString(),
          agencyId: 'agency1',
        },
      ];

      setProviders(mockProviders);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter((provider) => {
    // Type filter
    if (selectedType !== 'all' && provider.type !== selectedType) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && provider.category !== selectedCategory) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && provider.isActive !== (selectedStatus === 'active')) {
      return false;
    }

    // Search filter
    if (searchTerm && !provider.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const providerTypes = [
    { value: 'all', label: 'All Types', icon: Filter },
    { value: 'llm', label: 'LLM', icon: Zap },
    { value: 'scraping', label: 'Scraping', icon: Globe },
    { value: 'storage', label: 'Storage', icon: Database },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'payment', label: 'Payment', icon: CreditCard },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'integration', label: 'Integration', icon: Link2 },
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'internal', label: 'Internal' },
    { value: 'external_api', label: 'External API' },
    { value: 'cloud_service', label: 'Cloud Service' },
    { value: 'saas', label: 'SaaS' },
  ];

  const getTypeIcon = (type: string) => {
    const typeConfig = providerTypes.find(t => t.value === type);
    return typeConfig?.icon || Filter;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      llm: 'bg-purple-100 text-purple-800 border-purple-200',
      scraping: 'bg-blue-100 text-blue-800 border-blue-200',
      storage: 'bg-green-100 text-green-800 border-green-200',
      email: 'bg-orange-100 text-orange-800 border-orange-200',
      payment: 'bg-red-100 text-red-800 border-red-200',
      communication: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      integration: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleTestProvider = async (providerId: string) => {
    // TODO: Test provider
    alert('Testing provider...');
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;
    // TODO: Delete provider
    setProviders(providers.filter(p => p.id !== providerId));
  };

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.isActive).length,
    inactive: providers.filter(p => !p.isActive).length,
    avgSuccessRate: Math.round(
      providers.reduce((sum, p) => sum + p.successRate, 0) / providers.length || 0
    ),
    totalCost: providers.reduce((sum, p) => sum + p.monthlyUsage, 0),
  };

  return (
     <MainLayout title="Settings" breadcrumbs={[{ label: "Paramètres" }]}>
      <Head>
        <title>Unified Provider Management - CRM Immobilier</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
              <p className="text-gray-600 mt-1">
                Unified management for all providers (LLM, Scraping, Storage, Email, etc.)
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Provider
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Total Providers</p>
              <Settings className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <XCircle className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Avg Success</p>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.avgSuccessRate}%</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Monthly Cost</p>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${stats.totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {providerTypes.map((type) => {
            const Icon = type.icon;
            const count = providers.filter(p => type.value === 'all' || p.type === type.value).length;
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  selectedType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
                <span className={`px-2 py-0.5 text-xs rounded ${
                  selectedType === type.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Results count */}
            <div className="flex items-center justify-center text-sm text-gray-600">
              Showing {filteredProviders.length} of {providers.length} providers
            </div>
          </div>
        </div>

        {/* Providers List */}
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Settings className="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin" />
                <p>Loading providers...</p>
              </div>
            ) : filteredProviders.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <Filter className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No providers found</p>
              </div>
            ) : (
              filteredProviders.map((provider) => {
                const TypeIcon = getTypeIcon(provider.type);
                return (
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
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 ${getTypeColor(provider.type)}`}>
                              <TypeIcon className="w-3 h-3" />
                              {provider.type}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border border-gray-200">
                              {provider.category}
                            </span>
                            {!provider.apiKeyConfigured && (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
                                No API Key
                              </span>
                            )}
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <TrendingUp className="w-4 h-4" />
                              <span>{provider.successRate}% success</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>{provider.avgLatency}ms</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Zap className="w-4 h-4" />
                              <span>{provider.totalCalls.toLocaleString()} calls</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>${provider.monthlyUsage.toFixed(2)}</span>
                            </div>
                            {provider.lastUsedAt && (
                              <div className="text-sm text-gray-500">
                                Last used: {new Date(provider.lastUsedAt).toLocaleTimeString()}
                              </div>
                            )}
                          </div>

                          {/* Budget Progress */}
                          {provider.monthlyBudget && provider.monthlyBudget > 0 && (
                            <div className="max-w-md">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Monthly Budget</span>
                                <span>${provider.monthlyUsage.toFixed(2)} / ${provider.monthlyBudget}</span>
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
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/settings/providers/${provider.id}`)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleTestProvider(provider.id)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Test provider"
                          >
                            <TestTube2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => router.push(`/settings/providers/${provider.id}/edit`)}
                            className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                            title="Edit"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProvider(provider.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
