import OpenAI from 'openai';
import { LLMProvider, GenerateOptions, DEFAULT_MODELS } from './llm-provider.interface';

/**
 * Provider OpenAI (GPT-4, GPT-3.5)
 */
export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI GPT';
  private client: OpenAI;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODELS.openai;
    this.client = new OpenAI({ apiKey });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: options?.model || this.model,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
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
      });

      return completion.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }
}
