import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider DeepSeek
 * https://platform.deepseek.com/
 *
 * Modèles disponibles:
 * - deepseek-chat (modèle général, très rapide et économique)
 * - deepseek-coder (spécialisé code, excellent pour l'analyse technique)
 *
 * Tarification compétitive: ~$0.14/1M tokens (input), $0.28/1M tokens (output)
 */
export class DeepSeekProvider implements LLMProvider {
  name = 'DeepSeek';
  private apiKey: string;
  private model: string;
  private endpoint = 'https://api.deepseek.com/v1/chat/completions';

  constructor(apiKey: string, model = 'deepseek-chat') {
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
          stream: false,
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
        console.error('DeepSeek API Error:', message);
        throw new Error(`DeepSeek generation failed: ${message}`);
      }
      throw new Error(`DeepSeek generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }
}
