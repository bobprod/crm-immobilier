import axios from 'axios';
import { LLMProvider, GenerateOptions, DEFAULT_MODELS } from './llm-provider.interface';

/**
 * Provider DeepSeek
 * API compatible OpenAI avec tarifs très compétitifs
 */
export class DeepSeekProvider implements LLMProvider {
  name = 'DeepSeek';
  private apiKey: string;
  private model: string;
  private baseURL = 'https://api.deepseek.com/v1';

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODELS.deepseek;
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
              content: options?.systemPrompt || 'Tu es un assistant expert en immobilier.',
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
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      console.error('DeepSeek API Error:', error);
      throw new Error(
        `DeepSeek generation failed: ${error.response?.data?.error?.message || error.message}`,
      );
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 10;
  }
}
