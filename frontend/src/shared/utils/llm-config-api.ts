import apiClient from './backend-api';

// ============================================
// TYPES - Aligned with backend LLM Config DTOs
// ============================================

export type LLMProvider = 'anthropic' | 'openai' | 'gemini' | 'deepseek' | 'openrouter';

export interface UpdateLLMConfigDTO {
  provider: LLMProvider | string;
  model: string;
  apiKey: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMConfig {
  id: string;
  userId: string;
  provider: string;
  model: string;
  apiKey: string; // Masked as ***xxxx
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  models: string[];
  description: string;
  pricing: string;
  keyFormat: string;
  website: string;
}

export interface TestLLMConfigResult {
  success: boolean;
  provider: string;
  model: string;
  message: string;
}

export interface LLMUsageStats {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  lastUsed?: string;
}

// ============================================
// DEFAULT PROVIDERS & MODELS
// ============================================

export const DEFAULT_PROVIDERS: ProviderInfo[] = [
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
      'claude-3-haiku-20240307',
    ],
    description: 'Claude AI models - Best for analysis and creative tasks',
    pricing: '$3-15 / 1M tokens',
    keyFormat: 'sk-ant-...',
    website: 'https://console.anthropic.com/',
  },
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    description: 'GPT models - Versatile and widely used',
    pricing: '$0.5-30 / 1M tokens',
    keyFormat: 'sk-...',
    website: 'https://platform.openai.com/',
  },
  {
    id: 'gemini',
    name: 'Google (Gemini)',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    description: 'Gemini models - Good for multimodal tasks',
    pricing: 'Free tier available',
    keyFormat: 'AIza...',
    website: 'https://aistudio.google.com/',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    description: 'DeepSeek models - Cost effective option',
    pricing: '$0.1-0.3 / 1M tokens',
    keyFormat: 'sk-...',
    website: 'https://platform.deepseek.com/',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3-70b'],
    description: 'Access multiple providers through one API',
    pricing: 'Varies by model',
    keyFormat: 'sk-or-...',
    website: 'https://openrouter.ai/',
  },
];

// ============================================
// API CLIENT
// ============================================

export const llmConfigAPI = {
  /**
   * Obtenir la configuration LLM actuelle
   */
  getConfig: async (): Promise<LLMConfig | null> => {
    try {
      const response = await apiClient.get('/llm-config');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Mettre à jour la configuration LLM
   */
  updateConfig: async (config: UpdateLLMConfigDTO): Promise<LLMConfig> => {
    const response = await apiClient.put('/llm-config', config);
    return response.data;
  },

  /**
   * Tester la configuration LLM actuelle
   */
  testConfig: async (): Promise<TestLLMConfigResult> => {
    const response = await apiClient.post('/llm-config/test');
    return response.data;
  },

  /**
   * Obtenir la liste des providers disponibles
   */
  getProviders: async (): Promise<ProviderInfo[]> => {
    try {
      const response = await apiClient.get('/llm-config/providers');
      return response.data;
    } catch {
      // Return defaults if backend unavailable
      return DEFAULT_PROVIDERS;
    }
  },

  /**
   * Obtenir les statistiques d'utilisation
   */
  getUsageStats: async (): Promise<LLMUsageStats> => {
    const response = await apiClient.get('/llm-config/usage');
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getProviderLabel = (provider: string): string => {
  const labels: Record<string, string> = {
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    gemini: 'Google (Gemini)',
    deepseek: 'DeepSeek',
    openrouter: 'OpenRouter',
  };
  return labels[provider] || provider;
};

export const getProviderColor = (provider: string): string => {
  const colors: Record<string, string> = {
    anthropic: 'bg-orange-100 text-orange-800',
    openai: 'bg-green-100 text-green-800',
    gemini: 'bg-blue-100 text-blue-800',
    deepseek: 'bg-purple-100 text-purple-800',
    openrouter: 'bg-gray-100 text-gray-800',
  };
  return colors[provider] || 'bg-gray-100 text-gray-800';
};

export const maskApiKey = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '***';
  return `***${apiKey.slice(-4)}`;
};

export const formatTokenCount = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
};

export const formatCost = (cost: number): string => {
  return `$${cost.toFixed(4)}`;
};

export default llmConfigAPI;
