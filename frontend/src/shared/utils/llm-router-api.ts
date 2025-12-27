import apiClient from './backend-api';

/**
 * Types pour le LLM Router
 */

export type OperationType =
  | 'seo'
  | 'prospecting_mass'
  | 'prospecting_qualify'
  | 'analysis_quick'
  | 'content_generation'
  | 'long_context'
  | 'scraping_analysis';

export type ProviderName =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'openrouter'
  | 'deepseek'
  | 'qwen'
  | 'kimi'
  | 'mistral';

export interface UserLlmProvider {
  id: string;
  userId: string;
  provider: ProviderName;
  apiKey: string; // Masked in responses
  model?: string;
  isActive: boolean;
  priority: number;
  monthlyBudget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LlmUsageLog {
  id: string;
  userId: string;
  userLlmProviderId?: string;
  provider: string;
  operationType: OperationType;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latency: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface ProviderPerformance {
  id: string;
  userId: string;
  userLlmProviderId?: string;
  provider: string;
  avgLatency: number;
  successRate: number;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  lastUsed?: string;
  updatedAt: string;
}

export interface ProviderSuggestion {
  provider: ProviderName;
  reason: string;
  score: number;
  cost: number;
  latency: number;
  quality: number;
}

export interface DashboardMetrics {
  totalCost: number;
  totalCalls: number;
  totalTokens: number;
  avgLatency: number;
  successRate: number;
  costByProvider: Record<string, number>;
  callsByProvider: Record<string, number>;
  costByOperation: Record<string, number>;
  callsByOperation: Record<string, number>;
  recentUsage: Array<{
    date: string;
    cost: number;
    calls: number;
  }>;
}

export interface BudgetCheck {
  userId: string;
  currentMonth: string;
  totalSpent: number;
  totalBudget: number;
  remainingBudget: number;
  percentUsed: number;
  isOverBudget: boolean;
  providers: Array<{
    provider: string;
    spent: number;
    budget: number;
    remaining: number;
    percentUsed: number;
  }>;
}

/**
 * Service API pour le LLM Router
 */
export const llmRouterAPI = {
  // ============================================
  // GESTION DES PROVIDERS
  // ============================================

  /**
   * Récupérer tous les providers configurés de l'utilisateur
   */
  getUserProviders: async (): Promise<UserLlmProvider[]> => {
    const response = await apiClient.get('/llm-config/user-providers');
    return response.data;
  },

  /**
   * Ajouter un nouveau provider
   */
  addProvider: async (data: {
    provider: ProviderName;
    apiKey: string;
    model?: string;
    priority?: number;
    monthlyBudget?: number;
  }): Promise<UserLlmProvider> => {
    const response = await apiClient.post('/llm-config/user-providers', data);
    return response.data;
  },

  /**
   * Mettre à jour un provider existant
   */
  updateProvider: async (
    provider: ProviderName,
    data: {
      apiKey?: string;
      model?: string;
      isActive?: boolean;
      priority?: number;
      monthlyBudget?: number;
    },
  ): Promise<UserLlmProvider> => {
    const response = await apiClient.put(`/llm-config/user-providers/${provider}`, data);
    return response.data;
  },

  /**
   * Supprimer un provider
   */
  deleteProvider: async (provider: ProviderName): Promise<void> => {
    await apiClient.delete(`/llm-config/user-providers/${provider}`);
  },

  /**
   * Tester un provider
   */
  testProvider: async (provider: ProviderName): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/llm-config/user-providers/${provider}/test`);
    return response.data;
  },

  // ============================================
  // SUGGESTIONS & ANALYTICS
  // ============================================

  /**
   * Suggérer le meilleur provider pour un type d'opération
   */
  suggestProvider: async (operationType: OperationType): Promise<ProviderSuggestion> => {
    const response = await apiClient.get(`/llm-config/suggest/${operationType}`);
    return response.data;
  },

  /**
   * Récupérer les analytics d'utilisation
   */
  getAnalytics: async (params?: {
    startDate?: string;
    endDate?: string;
    provider?: string;
    operationType?: string;
  }): Promise<{
    logs: LlmUsageLog[];
    performance: ProviderPerformance[];
    totalCost: number;
    totalCalls: number;
  }> => {
    const response = await apiClient.get('/llm-config/analytics', { params });
    return response.data;
  },

  /**
   * Récupérer les métriques du dashboard
   */
  getDashboardMetrics: async (params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<DashboardMetrics> => {
    const response = await apiClient.get('/llm-config/dashboard-metrics', { params });
    return response.data;
  },

  /**
   * Vérifier le budget mensuel
   */
  checkBudget: async (budgetLimit?: number): Promise<BudgetCheck> => {
    const response = await apiClient.get('/llm-config/budget-check', {
      params: { budget: budgetLimit },
    });
    return response.data;
  },

  // ============================================
  // LOGS & PERFORMANCE
  // ============================================

  /**
   * Récupérer l'historique d'utilisation
   */
  getUsageLogs: async (params?: {
    limit?: number;
    offset?: number;
    provider?: string;
    operationType?: string;
    success?: boolean;
  }): Promise<{ logs: LlmUsageLog[]; total: number }> => {
    const response = await apiClient.get('/llm-config/usage-logs', { params });
    return response.data;
  },

  /**
   * Récupérer les performances par provider
   */
  getProviderPerformance: async (): Promise<ProviderPerformance[]> => {
    const response = await apiClient.get('/llm-config/provider-performance');
    return response.data;
  },
};

/**
 * Constantes pour les providers disponibles
 */
export const AVAILABLE_PROVIDERS: Record<
  ProviderName,
  {
    name: string;
    description: string;
    models: string[];
    pricing: string;
    keyFormat: string;
    website: string;
  }
> = {
  anthropic: {
    name: 'Anthropic (Claude)',
    description: 'Claude - Excellent pour la rédaction et l\'analyse',
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    pricing: '15$ / 1M tokens (entrée), 75$ / 1M tokens (sortie)',
    keyFormat: 'sk-ant-...',
    website: 'https://console.anthropic.com/',
  },
  openai: {
    name: 'OpenAI (GPT)',
    description: 'ChatGPT - Polyvalent et performant',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    pricing: '10$ / 1M tokens (entrée), 30$ / 1M tokens (sortie)',
    keyFormat: 'sk-...',
    website: 'https://platform.openai.com/',
  },
  gemini: {
    name: 'Google (Gemini)',
    description: 'Gemini - Très rapide et économique',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    pricing: '3.5$ / 1M tokens (entrée), 10.5$ / 1M tokens (sortie)',
    keyFormat: 'AIza...',
    website: 'https://aistudio.google.com/',
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Gateway unifié vers tous les modèles',
    models: ['openai/gpt-4', 'anthropic/claude-3', 'google/gemini-pro'],
    pricing: 'Variable selon le modèle',
    keyFormat: 'sk-or-...',
    website: 'https://openrouter.ai/',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Ultra économique - Idéal pour le volume',
    models: ['deepseek-chat', 'deepseek-coder'],
    pricing: '0.14$ / 1M tokens (le moins cher !)',
    keyFormat: 'sk-...',
    website: 'https://platform.deepseek.com/',
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    description: 'Très performant et économique',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
    pricing: '0.5$ / 1M tokens',
    keyFormat: 'sk-...',
    website: 'https://dashscope.aliyun.com/',
  },
  kimi: {
    name: 'Kimi (Moonshot)',
    description: 'Long context (128K tokens)',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    pricing: '1$ / 1M tokens',
    keyFormat: 'sk-...',
    website: 'https://platform.moonshot.cn/',
  },
  mistral: {
    name: 'Mistral AI',
    description: 'Open source et performant',
    models: ['mistral-large', 'mistral-medium', 'mistral-small'],
    pricing: '2$ / 1M tokens',
    keyFormat: '...',
    website: 'https://console.mistral.ai/',
  },
};

/**
 * Types d'opérations avec descriptions
 */
export const OPERATION_TYPES: Record<OperationType, { name: string; description: string }> = {
  seo: {
    name: 'SEO',
    description: 'Optimisation du contenu pour le référencement',
  },
  prospecting_mass: {
    name: 'Prospecting (Masse)',
    description: 'Analyse en volume - Coût minimal prioritaire',
  },
  prospecting_qualify: {
    name: 'Prospecting (Qualification)',
    description: 'Qualification de leads - Équilibre qualité/coût',
  },
  analysis_quick: {
    name: 'Analyse Rapide',
    description: 'Analyses simples - Vitesse prioritaire',
  },
  content_generation: {
    name: 'Génération de Contenu',
    description: 'Rédaction créative - Qualité prioritaire',
  },
  long_context: {
    name: 'Long Contexte',
    description: 'Documents volumineux - Context window large',
  },
  scraping_analysis: {
    name: 'Analyse Scraping',
    description: 'Extraction de données web',
  },
};
