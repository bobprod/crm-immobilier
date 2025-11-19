import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, GenerateOptions } from './llm-provider.interface';

/**
 * Provider Google Gemini
 */
export class GeminiProvider implements LLMProvider {
  name = 'Google Gemini';
  private client: GoogleGenerativeAI;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: options?.model || this.model,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: options?.maxTokens || 1000,
          temperature: options?.temperature || 0.7,
        },
      });

      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 20;
  }
}
