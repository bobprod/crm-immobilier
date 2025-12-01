import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  async generateText(userId: string, options: any) {
    this.logger.log(`Generating text with AI for user: ${userId}`);

    const settings = await this.getSettings(userId);
    const provider = options.provider || settings?.defaultProvider || 'openai';
    const model = options.model || settings?.defaultModel || 'gpt-3.5-turbo';
    const temperature = options.temperature || settings?.temperature || 0.7;
    const maxTokens = options.maxTokens || settings?.maxTokens || 2000;

    const apiKey = this.getApiKey(settings, provider);
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${provider}`);
    }

    let response: string;
    let tokensUsed = 0;

    try {
      switch (provider) {
        case 'openai':
          ({ response, tokensUsed } = await this.callOpenAI(
            apiKey,
            options.prompt,
            model,
            temperature,
            maxTokens,
          ));
          break;
        case 'gemini':
          ({ response, tokensUsed } = await this.callGemini(apiKey, options.prompt, maxTokens));
          break;
        case 'anthropic':
          ({ response, tokensUsed } = await this.callAnthropic(
            apiKey,
            options.prompt,
            model,
            maxTokens,
          ));
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const generation = await this.prisma.ai_generations.create({
        data: {
          userId,
          provider,
          model,
          prompt: options.prompt,
          response,
          tokensUsed,
          type: 'document_generation',
          metadata: {
            documentType: options.documentType,
            prospectId: options.prospectId,
            propertyId: options.propertyId,
          },
        },
      });

      return {
        generationId: generation.id,
        provider,
        model,
        response,
        tokensUsed,
      };
    } catch (error) {
      this.logger.error(`AI generation error: ${error.message}`);
      throw error;
    }
  }

  private async callOpenAI(
    apiKey: string,
    prompt: string,
    model: string,
    temperature: number,
    maxTokens: number,
  ) {
    const res = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
      },
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );

    return {
      response: res.data.choices[0].message.content,
      tokensUsed: res.data.usage.total_tokens,
    };
  }

  private async callGemini(apiKey: string, prompt: string, maxTokens: number) {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }] },
    );

    return {
      response: res.data.candidates[0].content.parts[0].text,
      tokensUsed: Math.ceil(prompt.length / 4),
    };
  }

  private async callAnthropic(apiKey: string, prompt: string, model: string, maxTokens: number) {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
    );

    return {
      response: res.data.content[0].text,
      tokensUsed: res.data.usage.input_tokens + res.data.usage.output_tokens,
    };
  }

  private getApiKey(settings: any, provider: string): string | null {
    if (!settings) return null;

    const keyMap: Record<string, string> = {
      openai: settings.openaiApiKey,
      gemini: settings.geminiApiKey,
      anthropic: settings.anthropicApiKey || settings.claudeApiKey,
      deepseek: settings.deepseekApiKey,
      openrouter: settings.openrouterApiKey,
    };

    return keyMap[provider] || null;
  }

  async getSettings(userId: string) {
    return this.prisma.ai_settings.findUnique({ where: { userId } });
  }

  async updateSettings(userId: string, data: any) {
    return this.prisma.ai_settings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  async getHistory(userId: string, limit: number = 50) {
    return this.prisma.ai_generations.findMany({
      where: { userId, type: 'document_generation' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getStats(userId: string) {
    const [total, totalTokens, byProvider] = await Promise.all([
      this.prisma.ai_generations.count({
        where: { userId, type: 'document_generation' },
      }),
      this.prisma.ai_generations.aggregate({
        where: { userId, type: 'document_generation' },
        _sum: { tokensUsed: true },
      }),
      this.prisma.ai_generations.groupBy({
        by: ['provider'],
        where: { userId, type: 'document_generation' },
        _count: true,
        _sum: { tokensUsed: true },
      }),
    ]);

    return {
      total,
      totalTokens: totalTokens._sum.tokensUsed || 0,
      byProvider,
    };
  }
}
