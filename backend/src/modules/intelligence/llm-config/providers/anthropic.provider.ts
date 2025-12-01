import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, GenerateOptions, DEFAULT_MODELS } from './llm-provider.interface';

interface MessageContent {
  type: string;
  text?: string;
}

interface MessageResponse {
  content: MessageContent[];
}

/**
 * Provider Anthropic (Claude)
 */
export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic Claude';
  private client: Anthropic;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model || DEFAULT_MODELS.anthropic;
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      // @ts-ignore - SDK version compatibility
      const message: MessageResponse = await this.client.messages.create({
        model: options?.model || this.model,
        max_tokens: options?.maxTokens || 1000,
        system: options?.systemPrompt || 'Tu es un assistant expert en immobilier.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      return content.type === 'text' && content.text ? content.text.trim() : '';
    } catch (error: any) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.startsWith('sk-');
  }
}
