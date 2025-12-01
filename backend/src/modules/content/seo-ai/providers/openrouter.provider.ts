import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider OpenRouter (Multi-models)
 * Supporte : Claude, GPT-4, Llama, Mistral, etc.
 */
export class OpenRouterProvider implements LLMProvider {
  name = 'OpenRouter';
  private apiKey: string;
  private model: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string, model = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: options?.model || this.model,
          messages: [
            {
              role: 'system',
              content: options?.systemPrompt || 'Tu es un expert SEO immobilier.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://crm-immobilier.com',
            'X-Title': 'CRM Immobilier SEO AI',
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw new Error(
        `OpenRouter generation failed: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-or-');
  }
}
