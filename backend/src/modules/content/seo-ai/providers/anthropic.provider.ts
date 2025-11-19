import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider Anthropic (Claude)
 */
export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic Claude';
  private client: Anthropic;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514') {
    this.apiKey = apiKey;
    this.model = model;
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      // @ts-ignore - SDK version compatibility
      const message = await this.client.messages.create({
        model: options?.model || this.model,
        max_tokens: options?.maxTokens || 1000,
        temperature: options?.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return message.content[0].type === 'text' 
        ? message.content[0].text.trim()
        : '';
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }
}
