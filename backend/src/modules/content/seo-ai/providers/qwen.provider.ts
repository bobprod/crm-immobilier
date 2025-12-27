import axios from 'axios';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider Qwen (Alibaba Cloud - 通义千问)
 * https://dashscope.aliyun.com/
 *
 * Modèles disponibles:
 * - qwen-turbo (rapide et économique)
 * - qwen-plus (équilibré)
 * - qwen-max (plus performant)
 *
 * Tarification compétitive: ~$0.50/1M tokens (input), $1.50/1M tokens (output)
 */
export class QwenProvider implements LLMProvider {
  name = 'Qwen';
  private apiKey: string;
  private model: string;
  private endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  constructor(apiKey: string, model = 'qwen-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const response = await axios.post(
        this.endpoint,
        {
          model: options?.model || this.model,
          input: {
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
          },
          parameters: {
            max_tokens: options?.maxTokens || 1000,
            temperature: options?.temperature || 0.7,
            result_format: 'message',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60s timeout
        }
      );

      return response.data.output?.choices[0]?.message?.content?.trim() || '';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        console.error('Qwen API Error:', message);
        throw new Error(`Qwen generation failed: ${message}`);
      }
      throw new Error(`Qwen generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 20;
  }
}
