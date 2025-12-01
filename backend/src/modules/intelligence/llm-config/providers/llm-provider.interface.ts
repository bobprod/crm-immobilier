/**
 * Interface abstraite pour les providers LLM
 *
 * Permet de supporter plusieurs providers IA :
 * - Anthropic (Claude)
 * - OpenAI (GPT-4)
 * - Google (Gemini)
 * - OpenRouter (Multi-models)
 */

export interface LLMProvider {
  /**
   * Nom du provider
   */
  name: string;

  /**
   * Génération de texte avec prompt
   */
  generate(prompt: string, options?: GenerateOptions): Promise<string>;

  /**
   * Vérifier si le provider est configuré (clé API valide)
   */
  isConfigured(): boolean;
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
  systemPrompt?: string;
}

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'gemini' | 'openrouter' | 'deepseek';
  apiKey: string;
  model?: string;
  defaultMaxTokens?: number;
  defaultTemperature?: number;
}

export const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4-turbo-preview',
  gemini: 'gemini-1.5-pro',
  openrouter: 'anthropic/claude-3.5-sonnet',
  deepseek: 'deepseek-chat',
};

export const PRICING_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  anthropic: { input: 3.0, output: 15.0 },
  openai: { input: 10.0, output: 30.0 },
  gemini: { input: 1.25, output: 5.0 },
  openrouter: { input: 3.0, output: 15.0 },
  deepseek: { input: 0.14, output: 0.28 },
};

export const MAX_TOKENS_DEFAULTS: Record<string, number> = {
  metaTitle: 100,
  metaDescription: 150,
  keywords: 200,
  faq: 1000,
  description: 800,
  altText: 100,
  analysis: 2000,
  matching: 500,
};
