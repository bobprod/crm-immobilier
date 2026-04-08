import apiClient from './backend-api';

export interface OrchestrationRequest {
  objective: string;
  context?: Record<string, any>;
  options?: {
    maxCost?: number;
    executionMode?: 'auto' | 'manual';
  };
}

export interface OrchestrationMetrics {
  totalDurationMs: number;
  totalTokensUsed?: number;
  totalCost?: number;
  successfulCalls: number;
  failedCalls: number;
}

export interface OrchestrationResponse {
  status: 'completed' | 'partial' | 'failed' | 'planning';
  plan?: any;
  results?: any[];
  finalResult?: any;
  metrics: OrchestrationMetrics;
  errors?: string[];
}

export interface AvailableProvider {
  name: string;
  type: string;
  available: boolean;
  configured: boolean;
}

export interface ProviderPreferences {
  searchProviders: string[];
  scrapingProviders: string[];
  autoFallback: boolean;
}

export const aiOrchestratorAPI = {
  /**
   * Déclencher une orchestration IA
   */
  orchestrate: async (request: OrchestrationRequest): Promise<OrchestrationResponse> => {
    const response = await apiClient.post<OrchestrationResponse>('/ai/orchestrate', request);
    return response.data;
  },

  /**
   * Tester l'intégration Firecrawl
   */
  testFirecrawl: async (url: string, formats?: string[]): Promise<any> => {
    const response = await apiClient.post('/ai/orchestrate/test-firecrawl', { url, formats });
    return response.data;
  },

  /**
   * Tester l'intégration LLM
   */
  testLlm: async (prompt: string, model?: string): Promise<any> => {
    const response = await apiClient.post('/ai/orchestrate/test-llm', { prompt, model });
    return response.data;
  },

  /**
   * Obtenir les providers disponibles
   */
  getAvailableProviders: async (): Promise<{
    available: AvailableProvider[];
    preferences: ProviderPreferences;
    strategy: { search: string[]; scrape: string[] };
  }> => {
    const response = await apiClient.get('/ai/orchestrate/providers/available');
    return response.data;
  },

  /**
   * Sauvegarder les préférences de providers
   */
  saveProviderPreferences: async (preferences: ProviderPreferences): Promise<any> => {
    const response = await apiClient.post('/ai/orchestrate/providers/preferences', preferences);
    return response.data;
  },
};

export default aiOrchestratorAPI;
