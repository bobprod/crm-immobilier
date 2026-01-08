import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider Kimi (Moonshot AI - 月之暗面)
 * https://platform.moonshot.cn/
 *
 * Modèles disponibles:
 * - moonshot-v1-8k (contexte 8k tokens)
 * - moonshot-v1-32k (contexte 32k tokens)
 * - moonshot-v1-128k (contexte 128k tokens)
 *
 * Tarification: ~$1.00/1M tokens (input), $2.00/1M tokens (output)
 */
export class KimiProvider implements LLMProvider {
  name = 'Kimi';
  private apiKey: string;
  private model: string;
  private endpoint = 'https://api.moonshot.cn/v1/chat/completions';

  constructor(apiKey: string, model = 'moonshot-v1-8k') {
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
        const message = error.response?.data?.error?.message || error.message;
        console.error('Kimi API Error:', message);
        throw new Error(`Kimi generation failed: ${message}`);
      }
      throw new Error(`Kimi generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    // Clés Moonshot (Kimi) commencent par sk-
    return (
      !!this.apiKey &&
      this.apiKey.startsWith('sk-') &&
      this.apiKey.length >= 40
    );
  }
}
