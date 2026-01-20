import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type ProviderType =
  | 'llm'           // LLM générique
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'qwen'          // Alibaba Cloud Qwen
  | 'kimi'          // Moonshot AI Kimi
  | 'mistral'       // Mistral AI
  | 'serp'          // Google SERP API
  | 'firecrawl'
  | 'pica'
  | 'jina'
  | 'scrapingbee'
  | 'browserless'
  | 'rapidapi';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) { }

  /**
   * ═══════════════════════════════════════════════════════════
   * STRATÉGIE DE RÉCUPÉRATION DES CLÉS API
   * ═══════════════════════════════════════════════════════════
   *
   * 1. Clé au niveau USER (ai_settings) - PRIORITÉ 1
   * 2. Clé au niveau AGENCY (AgencyApiKeys) - PRIORITÉ 2 (si user en agence)
   * 3. Clé SUPER ADMIN (GlobalSettings) - FALLBACK ULTIME
   */
  async getApiKey(
    userId: string,
    provider: ProviderType,
    agencyId?: string | null,
  ): Promise<string | null> {
    // 1. User level (TOUJOURS prioritaire)
    const userKey = await this.getUserKey(userId, provider);
    if (userKey) return userKey;

    // 2. Agency level (si user en agence)
    if (agencyId) {
      const agencyKey = await this.getAgencyKey(agencyId, provider);
      if (agencyKey) return agencyKey;
    }

    // 3. Super Admin fallback
    const superAdminKey = await this.getSuperAdminKey(provider);
    if (superAdminKey) return superAdminKey;

    return null;
  }

  /**
   * Récupère la clé au niveau USER (ai_settings)
   */
  private async getUserKey(
    userId: string,
    provider: ProviderType,
  ): Promise<string | null> {
    const aiSettings = await this.prisma.ai_settings.findUnique({
      where: { userId },
    });

    if (!aiSettings) return null;

    const keyMap: Record<ProviderType, string | null> = {
      llm: aiSettings.openaiApiKey || aiSettings.claudeApiKey || aiSettings.geminiApiKey,
      anthropic: aiSettings.claudeApiKey,
      openai: aiSettings.openaiApiKey,
      gemini: aiSettings.geminiApiKey,
      deepseek: aiSettings.deepseekApiKey,
      openrouter: aiSettings.openrouterApiKey,
      qwen: aiSettings.qwenApiKey || null,
      kimi: aiSettings.kimiApiKey || null,
      mistral: aiSettings.mistralApiKey || null,
      // Pas de scraping keys dans ai_settings
      serp: null,
      firecrawl: null,
      pica: null,
      jina: null,
      scrapingbee: null,
      browserless: null,
      rapidapi: null,
    };

    return keyMap[provider] || null;
  }

  /**
   * Récupère la clé au niveau AGENCY (AgencyApiKeys)
   */
  private async getAgencyKey(
    agencyId: string,
    provider: ProviderType,
  ): Promise<string | null> {
    const agencyKeys = await this.prisma.agencyApiKeys.findUnique({
      where: { agencyId },
    });

    if (!agencyKeys) return null;

    const keyMap: Record<ProviderType, string | null> = {
      llm: agencyKeys.llmApiKey,
      anthropic: agencyKeys.anthropicApiKey || agencyKeys.llmApiKey,
      openai: agencyKeys.openaiApiKey,
      gemini: agencyKeys.geminiApiKey,
      deepseek: agencyKeys.deepseekApiKey,
      openrouter: agencyKeys.openrouterApiKey,
      qwen: agencyKeys.qwenApiKey || null,
      kimi: agencyKeys.kimiApiKey || null,
      mistral: agencyKeys.mistralApiKey || null,
      serp: agencyKeys.serpApiKey,
      firecrawl: agencyKeys.firecrawlApiKey,
      pica: agencyKeys.picaApiKey,
      jina: agencyKeys.jinaReaderApiKey,
      scrapingbee: agencyKeys.scrapingBeeApiKey,
      browserless: agencyKeys.browserlessApiKey,
      rapidapi: agencyKeys.rapidApiKey,
    };

    return keyMap[provider] || null;
  }

  /**
   * Fallback : clé SUPER ADMIN
   */
  private async getSuperAdminKey(provider: ProviderType): Promise<string | null> {
    const keyName = `superadmin_${provider}_key`;

    const setting = await this.prisma.globalSettings.findUnique({
      where: { key: keyName },
    });

    return setting?.value || null;
  }

  /**
   * Récupère une clé ou throw exception
   */
  async getRequiredApiKey(
    userId: string,
    provider: ProviderType,
    agencyId?: string | null,
  ): Promise<string> {
    const key = await this.getApiKey(userId, provider, agencyId);

    if (!key) {
      throw new UnauthorizedException(
        `Clé API "${provider}" non configurée. ` +
        `Veuillez configurer vos clés API dans les paramètres ou contactez l'administrateur.`
      );
    }

    return key;
  }

  /**
   * Vérifie si une clé existe (user OU agency)
   */
  async hasApiKey(
    userId: string,
    provider: ProviderType,
    agencyId?: string | null,
  ): Promise<boolean> {
    const key = await this.getApiKey(userId, provider, agencyId);
    return !!key;
  }

  /**
   * Met à jour les clés API d'une AGENCE
   */
  async updateAgencyKeys(
    agencyId: string,
    keys: Partial<{
      llmProvider: string;
      llmApiKey: string;
      anthropicApiKey: string;
      openaiApiKey: string;
      geminiApiKey: string;
      deepseekApiKey: string;
      openrouterApiKey: string;
      serpApiKey: string;
      firecrawlApiKey: string;
      picaApiKey: string;
      jinaReaderApiKey: string;
      scrapingBeeApiKey: string;
      browserlessApiKey: string;
      rapidApiKey: string;
    }>,
  ) {
    return this.prisma.agencyApiKeys.upsert({
      where: { agencyId },
      create: { agencyId, ...keys },
      update: keys,
    });
  }

  /**
   * Récupère toutes les clés d'une agence
   */
  async getAgencyKeys(agencyId: string) {
    return this.prisma.agencyApiKeys.findUnique({
      where: { agencyId },
    });
  }

  /**
   * Valide une clé API en effectuant un test simple
   */
  async validateApiKey(provider: string, apiKey: string): Promise<{ valid: boolean; message?: string; models?: string[] }> {
    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          return await this.validateOpenAIKey(apiKey);
        case 'gemini':
          return await this.validateGeminiKey(apiKey);
        case 'deepseek':
          return await this.validateDeepseekKey(apiKey);
        case 'anthropic':
          return await this.validateAnthropicKey(apiKey);
        default:
          return { valid: false, message: 'Provider non supporté' };
      }
    } catch (error) {
      console.error(`Error validating ${provider} key:`, error);
      return { valid: false, message: 'Erreur lors de la validation de la clé' };
    }
  }

  private async validateOpenAIKey(apiKey: string): Promise<{ valid: boolean; message?: string; models?: string[] }> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { valid: true, models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'] };
      } else if (response.status === 401) {
        return { valid: false, message: 'Clé OpenAI invalide ou expirée' };
      } else {
        return { valid: false, message: 'Erreur OpenAI API' };
      }
    } catch (error) {
      return { valid: false, message: 'Impossible de contacter OpenAI API' };
    }
  }

  private async validateGeminiKey(apiKey: string): Promise<{ valid: boolean; message?: string; models?: string[] }> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (response.ok) {
        return { valid: true, models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] };
      } else if (response.status === 400 || response.status === 401) {
        return { valid: false, message: 'Clé Gemini invalide' };
      } else {
        return { valid: false, message: 'Erreur Gemini API' };
      }
    } catch (error) {
      return { valid: false, message: 'Impossible de contacter Gemini API' };
    }
  }

  private async validateDeepseekKey(apiKey: string): Promise<{ valid: boolean; message?: string; models?: string[] }> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        return { valid: true, models: ['deepseek-chat', 'deepseek-coder'] };
      } else if (response.status === 401) {
        return { valid: false, message: 'Clé DeepSeek invalide ou expirée' };
      } else {
        return { valid: false, message: 'Erreur DeepSeek API' };
      }
    } catch (error) {
      return { valid: false, message: 'Impossible de contacter DeepSeek API' };
    }
  }

  private async validateAnthropicKey(apiKey: string): Promise<{ valid: boolean; message?: string; models?: string[] }> {
    try {
      // Anthropic n'a pas d'endpoint public de validation, on fait un simple test de format
      if (apiKey && apiKey.startsWith('sk-ant-') && apiKey.length > 20) {
        return { valid: true, models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229'] };
      } else {
        return { valid: false, message: 'Format de clé Anthropic invalide' };
      }
    } catch (error) {
      return { valid: false, message: 'Erreur lors de la validation Anthropic' };
    }
  }
}
