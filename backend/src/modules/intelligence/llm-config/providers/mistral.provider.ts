import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider Mistral AI
 * https://mistral.ai/
 *
 * Modèles disponibles:
 * - mistral-tiny (léger et rapide)
 * - mistral-small (équilibré)
 * - mistral-medium (puissant)
 * - mistral-large-latest (le plus performant)
 *
 * Tarification: ~$0.25/1M tokens (tiny), ~$2.00/1M tokens (small), ~$8.00/1M tokens (large)
 */
export class MistralProvider implements LLMProvider {
  name = 'Mistral';
  private apiKey: string;
  private model: string;
  private endpoint = 'https://api.mistral.ai/v1/chat/completions';

  constructor(apiKey: string, model = 'mistral-small-latest') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await axios.post(
        this.endpoint,
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
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60s timeout
        }
      );

      return response.data.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        console.error('Mistral API Error:', message);
        throw new Error(`Mistral generation failed: ${message}`);
      }
      throw new Error(`Mistral generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    // Clés Mistral AI (format UUID-like ou custom)
    return (
      !!this.apiKey &&
      this.apiKey.length >= 32 &&
      (this.apiKey.includes('-') || this.apiKey.length > 40)
    );
  }
}
