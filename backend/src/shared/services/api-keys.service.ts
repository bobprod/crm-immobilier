import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type ProviderType =
  | 'llm'           // LLM générique
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'serp'          // Google SERP API
  | 'firecrawl'
  | 'pica'
  | 'jina'
  | 'scrapingbee'
  | 'browserless'
  | 'rapidapi';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

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
    const aiSettings = await this.prisma.aiSettings.findUnique({
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
}
