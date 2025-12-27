import { Injectable, Logger } from '@nestjs/common';
import { LLMProviderFactory } from '../../llm-config/providers/llm-provider.factory';
import { GenerateOptions } from '../../llm-config/providers/llm-provider.interface';

/**
 * Service LLM pour l'orchestrateur IA
 * Wrapper autour du LLMProviderFactory existant
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly llmFactory: LLMProviderFactory) {}

  /**
   * Générer du texte avec un LLM
   */
  async generate(params: {
    userId: string;
    prompt: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }): Promise<{
    text: string;
    tokensUsed?: number;
    cost?: number;
  }> {
    const { userId, prompt, systemPrompt, maxTokens, temperature, model } = params;

    try {
      this.logger.log(`Generating text for user ${userId}`);

      const provider = await this.llmFactory.createProvider(userId);

      const options: GenerateOptions = {
        systemPrompt,
        maxTokens: maxTokens || 2000,
        temperature: temperature ?? 0.7,
        model,
      };

      const text = await provider.generate(prompt, options);

      // Estimation basique des tokens (4 chars ≈ 1 token)
      const estimatedTokens = Math.ceil((prompt.length + text.length) / 4);

      // TODO: récupérer le vrai provider name pour le coût
      const estimatedCost = this.llmFactory.estimateCost('anthropic', estimatedTokens / 2, estimatedTokens / 2);

      return {
        text,
        tokensUsed: estimatedTokens,
        cost: estimatedCost,
      };
    } catch (error) {
      this.logger.error(`LLM generation failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Extraire des données structurées avec un LLM
   * Utile pour parser du HTML/texte et obtenir du JSON
   */
  async extractStructuredData<T = any>(params: {
    userId: string;
    content: string;
    schema: string; // Description du format attendu
    instructions?: string;
  }): Promise<T> {
    const { userId, content, schema, instructions } = params;

    const systemPrompt = `Tu es un extracteur de données. Tu dois extraire des informations du contenu fourni et les retourner UNIQUEMENT au format JSON valide, sans markdown ni explications.

Format attendu:
${schema}

${instructions || ''}`;

    const prompt = `Contenu à analyser:
${content}

Retourne UNIQUEMENT le JSON, rien d'autre.`;

    const result = await this.generate({
      userId,
      prompt,
      systemPrompt,
      temperature: 0.3, // Plus déterministe pour extraction
      maxTokens: 3000,
    });

    try {
      // Nettoyer le texte (enlever markdown backticks si présents)
      let jsonText = result.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }

      return JSON.parse(jsonText) as T;
    } catch (error) {
      this.logger.error('Failed to parse LLM JSON response:', result.text);
      throw new Error('LLM returned invalid JSON');
    }
  }

  /**
   * Analyser du texte (intent, classification, etc.)
   */
  async analyze(params: {
    userId: string;
    content: string;
    analysisType: string;
    instructions: string;
  }): Promise<string> {
    const { userId, content, analysisType, instructions } = params;

    const systemPrompt = `Tu es un analyseur expert en ${analysisType}.`;
    const prompt = `${instructions}

Contenu:
${content}`;

    const result = await this.generate({
      userId,
      prompt,
      systemPrompt,
      temperature: 0.5,
    });

    return result.text;
  }
}
