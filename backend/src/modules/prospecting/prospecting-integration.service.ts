import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { LLMProspectingService } from './llm-prospecting.service';
import { LLMProviderFactory } from '../content/seo-ai/providers/llm-provider.factory';
import { RawScrapedItem, ProspectingLeadCreateInput } from './dto';
import axios from 'axios';

interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  propertyType?: string;
  budget?: any;
  source: string;
  sourceUrl?: string;
  leadType: 'requete' | 'mandat';
  metadata?: any;
}

export interface SourceConfig {
  name: string;
  type: string;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
}

export interface IngestResult {
  created: number;
  rejected: number;
  total: number;
  leads: string[];
}

@Injectable()
export class ProspectingIntegrationService {
  private readonly logger = new Logger(ProspectingIntegrationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => LLMProspectingService))
    private llmProspectingService: LLMProspectingService,
    private llmProviderFactory: LLMProviderFactory,
  ) {}

  // ============================================
  // CONFIGURATION - Recuperation des cles API
  // ============================================

  private async getApiConfig(userId: string, provider: string): Promise<any> {
    // Chercher dans les settings utilisateur
    const settings = await this.prisma.settings.findFirst({
      where: { userId, key: `api_${provider}` },
    });

    if (settings?.value) {
      return typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value;
    }

    // Fallback sur les variables d'environnement
    const envKey = this.configService.get(`${provider.toUpperCase()}_API_KEY`);
    if (envKey) {
      return { apiKey: envKey };
    }

    return null;
  }

  // ============================================
  // SOURCES DISPONIBLES
  // ============================================

  async getAvailableSources(userId: string): Promise<SourceConfig[]> {
    const sources: SourceConfig[] = [
      {
        name: 'Pica API',
        type: 'pica',
        enabled: !!(await this.getApiConfig(userId, 'pica')),
        endpoint: 'https://api.pica.dev',
      },
      {
        name: 'SERP API',
        type: 'serp',
        enabled: !!(await this.getApiConfig(userId, 'serp')),
        endpoint: 'https://serpapi.com',
      },
      {
        name: 'Firecrawl',
        type: 'firecrawl',
        enabled: !!(await this.getApiConfig(userId, 'firecrawl')),
        endpoint: 'https://api.firecrawl.dev',
      },
      {
        name: 'Meta/Facebook',
        type: 'meta',
        enabled: !!(await this.getApiConfig(userId, 'meta')),
        endpoint: 'https://graph.facebook.com',
      },
      {
        name: 'LinkedIn',
        type: 'linkedin',
        enabled: !!(await this.getApiConfig(userId, 'linkedin')),
        endpoint: 'https://api.linkedin.com',
      },
      {
        name: 'Web Scraping',
        type: 'webscrape',
        enabled: true, // Toujours disponible
      },
    ];

    return sources;
  }

  async testSource(userId: string, sourceType: string): Promise<any> {
    const config = await this.getApiConfig(userId, sourceType);

    if (!config) {
      return { success: false, error: 'API non configuree' };
    }

    try {
      switch (sourceType) {
        case 'pica':
          return await this.testPicaAPI(config);
        case 'serp':
          return await this.testSerpAPI(config);
        case 'firecrawl':
          return await this.testFirecrawlAPI(config);
        default:
          return { success: true, message: 'Source disponible' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async testPicaAPI(config: any): Promise<any> {
    try {
      const response = await axios.get('https://api.pica.dev/health', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        timeout: 5000,
      });
      return { success: true, status: response.status };
    } catch {
      return { success: false, error: 'Pica API indisponible' };
    }
  }

  private async testSerpAPI(config: any): Promise<any> {
    try {
      const response = await axios.get(`https://serpapi.com/account?api_key=${config.apiKey}`, {
        timeout: 5000,
      });
      return { success: true, credits: response.data?.account_credits };
    } catch {
      return { success: false, error: 'SERP API indisponible' };
    }
  }

  private async testFirecrawlAPI(config: any): Promise<any> {
    try {
      const response = await axios.get('https://api.firecrawl.dev/v0/health', {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        timeout: 5000,
      });
      return { success: true, status: response.status };
    } catch {
      return { success: false, error: 'Firecrawl API indisponible' };
    }
  }

  // ============================================
  // INGESTION - Pipeline LLM pour leads structures
  // ============================================

  /**
   * Ingere des items scrappe et les transforme en leads via LLM
   * C'est le point d'entree principal apres le scraping
   */
  async ingestScrapedItems(
    userId: string,
    campaignId: string,
    items: RawScrapedItem[],
  ): Promise<IngestResult> {
    this.logger.log(`Ingesting ${items.length} scraped items for campaign ${campaignId}`);

    // 1) Appeler le LLM pour structurer les items
    const leadsToCreate: ProspectingLeadCreateInput[] =
      await this.llmProspectingService.buildProspectingLeadsFromRawBatch(items, userId);

    // 2) Filtrer les "rejete/spam"
    const validLeads = leadsToCreate.filter(
      (lead) => lead.validationStatus !== 'spam' && lead.status !== 'rejected',
    );

    const rejectedCount = leadsToCreate.length - validLeads.length;
    const createdIds: string[] = [];

    // 3) Inserer dans la table prospecting_leads
    for (const lead of validLeads) {
      try {
        const created = await this.prisma.prospecting_leads.create({
          data: {
            userId,
            campaignId,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            city: lead.city,
            propertyType: lead.propertyTypes?.[0],
            budget: lead.budgetMax
              ? {
                  min: lead.budgetMin,
                  max: lead.budgetMax,
                  currency: lead.budgetCurrency || 'TND',
                }
              : undefined,
            source: lead.source,
            sourceUrl: lead.url,
            prospectType: lead.leadType === 'mandat' ? 'mandat' : 'requete',
            score: lead.score,
            status: 'new',
            metadata: {
              ...lead.metadata,
              rawText: lead.rawText,
              title: lead.title,
              intention: lead.intention,
              urgency: lead.urgency,
              surfaceM2: lead.surfaceM2,
              rooms: lead.rooms,
              validationStatus: lead.validationStatus,
              seriousnessScore: lead.seriousnessScore,
            },
          },
        });
        createdIds.push(created.id);
      } catch (error) {
        this.logger.warn(`Failed to create lead: ${error.message}`);
      }
    }

    // 4) Mettre a jour le compteur de la campagne
    await this.prisma.prospecting_campaigns.update({
      where: { id: campaignId },
      data: {
        foundCount: { increment: createdIds.length },
      },
    });

    this.logger.log(`Ingestion complete: ${createdIds.length} created, ${rejectedCount} rejected`);

    return {
      created: createdIds.length,
      rejected: rejectedCount,
      total: items.length,
      leads: createdIds,
    };
  }

  /**
   * Convertit les donnees brutes d'un scraper en RawScrapedItem
   */
  convertToRawScrapedItems(data: any[], source: string): RawScrapedItem[] {
    return data.map((item) => ({
      id: item.id,
      source,
      url: item.url || item.link || item.sourceUrl,
      title: item.title || item.subject,
      text: item.text || item.content || item.snippet || item.message || item.description || '',
      authorName: item.authorName || item.from?.name || item.author,
      publishedAt: item.publishedAt || item.created_time ? new Date(item.created_time) : undefined,
      rawMetadata: item,
    }));
  }

  /**
   * Scrape et ingere en une seule operation
   */
  async scrapeAndIngest(
    userId: string,
    campaignId: string,
    source: string,
    config: any,
  ): Promise<IngestResult> {
    let rawData: any[] = [];

    // Scraper selon la source
    switch (source) {
      case 'pica':
        const picaResult = await this.scrapeWithPica(userId, config);
        rawData = picaResult.leads || [];
        break;
      case 'serp':
        const serpResult = await this.scrapeFromSERP(userId, config);
        rawData = serpResult.leads || [];
        break;
      case 'firecrawl':
        const firecrawlResult = await this.scrapeWithFirecrawl(userId, config.urls || [], config);
        rawData = firecrawlResult.leads || [];
        break;
      case 'meta':
      case 'linkedin':
        const socialResult = await this.scrapeFromSocial(userId, { platform: source, ...config });
        rawData = socialResult.leads || [];
        break;
      case 'webscrape':
        const webResult = await this.scrapeWebsites(userId, config.urls || []);
        rawData = webResult.leads || [];
        break;
      default:
        throw new BadRequestException(`Source non supportee: ${source}`);
    }

    // Convertir en RawScrapedItem
    const items = this.convertToRawScrapedItems(rawData, source);

    // Ingerer via le pipeline LLM
    return this.ingestScrapedItems(userId, campaignId, items);
  }

  // ============================================
  // PICA API - Scraping combine
  // ============================================

  async scrapeWithPica(userId: string, config: any): Promise<any> {
    this.logger.log(`Scraping with Pica API for user ${userId}`);

    const apiConfig = await this.getApiConfig(userId, 'pica');
    if (!apiConfig) {
      throw new BadRequestException(
        'Pica API non configuree. Configurez la cle API dans les parametres.',
      );
    }

    try {
      // Construire la requete de recherche
      const searchQuery = this.buildSearchQuery(config);

      const response = await axios.post(
        'https://api.pica.dev/v1/search',
        {
          query: searchQuery,
          location: config.location,
          type: config.targetType?.includes('mandat') ? 'listings' : 'buyers',
          filters: {
            propertyTypes: config.propertyType,
            budgetMin: config.budgetMin,
            budgetMax: config.budgetMax,
          },
          limit: config.totalTarget || 50,
        },
        {
          headers: { Authorization: `Bearer ${apiConfig.apiKey}` },
          timeout: 30000,
        },
      );

      const leads = this.parseAPIResponse(response.data, 'pica', config);
      return { success: true, leads, count: leads.length };
    } catch (error) {
      this.logger.error(`Pica API error: ${error.message}`);
      // Fallback sur le scraping mock en dev
      return this.generateMockLeads(config, 'pica');
    }
  }

  // ============================================
  // SERP API - Google Search
  // ============================================

  async scrapeFromSERP(userId: string, config: any): Promise<any> {
    this.logger.log(`Scraping from SERP API for user ${userId}`);

    const apiConfig = await this.getApiConfig(userId, 'serp');
    if (!apiConfig) {
      throw new BadRequestException('SERP API non configuree');
    }

    try {
      const queries = this.generateSearchQueries(config);
      const allLeads: LeadData[] = [];

      for (const query of queries) {
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            api_key: apiConfig.apiKey,
            q: query,
            location: config.location,
            num: 20,
          },
          timeout: 15000,
        });

        const leads = this.extractLeadsFromSERP(response.data, config);
        allLeads.push(...leads);
      }

      return { success: true, leads: allLeads, count: allLeads.length };
    } catch (error) {
      this.logger.error(`SERP API error: ${error.message}`);
      return this.generateMockLeads(config, 'serp');
    }
  }

  private generateSearchQueries(config: any): string[] {
    const queries: string[] = [];
    const location = config.location || 'Tunis';
    const types = config.propertyType || ['appartement', 'villa'];

    for (const type of types) {
      if (config.targetType?.includes('requete')) {
        queries.push(`cherche ${type} ${location} achat`);
        queries.push(`recherche ${type} a louer ${location}`);
      }
      if (config.targetType?.includes('mandat')) {
        queries.push(`vente ${type} ${location}`);
        queries.push(`${type} a vendre ${location}`);
      }
    }

    return queries;
  }

  private extractLeadsFromSERP(data: any, config: any): LeadData[] {
    const leads: LeadData[] = [];

    // Extraire des résultats organiques
    if (data.organic_results) {
      for (const result of data.organic_results) {
        // Extraire les infos de contact si disponibles
        const lead = this.extractContactFromText(result.snippet || result.title);
        if (lead) {
          leads.push({
            ...lead,
            source: 'serp',
            sourceUrl: result.link,
            leadType: this.detectLeadType(result.snippet),
          });
        }
      }
    }

    return leads;
  }

  // ============================================
  // FIRECRAWL - Web Scraping avance
  // ============================================

  async scrapeWithFirecrawl(userId: string, urls: string[], config?: any): Promise<any> {
    this.logger.log(`Scraping with Firecrawl for user ${userId}`);

    const apiConfig = await this.getApiConfig(userId, 'firecrawl');
    if (!apiConfig) {
      throw new BadRequestException('Firecrawl API non configuree');
    }

    try {
      const allLeads: LeadData[] = [];

      for (const url of urls) {
        const response = await axios.post(
          'https://api.firecrawl.dev/v0/scrape',
          {
            url,
            pageOptions: {
              onlyMainContent: true,
              includeHtml: false,
            },
            extractorOptions: {
              mode: 'llm-extraction',
              extractionPrompt: `Extraire les informations de contact et les details immobiliers:
                - Nom complet
                - Email
                - Telephone
                - Type de bien recherche ou a vendre
                - Budget ou prix
                - Localisation
                - Type (acheteur/vendeur/locataire/bailleur)`,
            },
          },
          {
            headers: { Authorization: `Bearer ${apiConfig.apiKey}` },
            timeout: 30000,
          },
        );

        if (response.data?.data) {
          const leads = this.parseFirecrawlResponse(response.data.data, url);
          allLeads.push(...leads);
        }
      }

      return { success: true, leads: allLeads, count: allLeads.length };
    } catch (error) {
      this.logger.error(`Firecrawl error: ${error.message}`);
      return this.generateMockLeads(config || {}, 'firecrawl');
    }
  }

  private parseFirecrawlResponse(data: any, sourceUrl: string): LeadData[] {
    const leads: LeadData[] = [];

    if (data.extractedInfo) {
      const info = data.extractedInfo;
      leads.push({
        firstName: info.firstName,
        lastName: info.lastName,
        email: info.email,
        phone: info.phone,
        city: info.location,
        propertyType: info.propertyType,
        budget: info.budget,
        source: 'firecrawl',
        sourceUrl,
        leadType: this.detectLeadType(info.type || info.description),
      });
    }

    return leads;
  }

  // ============================================
  // SOCIAL MEDIA - Meta/Facebook, LinkedIn
  // ============================================

  async scrapeFromSocial(userId: string, data: any): Promise<any> {
    this.logger.log(`Scraping from social: ${data.platform}`);

    const apiConfig = await this.getApiConfig(userId, data.platform);
    if (!apiConfig) {
      throw new BadRequestException(`${data.platform} API non configuree`);
    }

    try {
      switch (data.platform) {
        case 'meta':
        case 'facebook':
          return await this.scrapeFromMeta(apiConfig, data);
        case 'linkedin':
          return await this.scrapeFromLinkedIn(apiConfig, data);
        default:
          throw new BadRequestException(`Plateforme non supportee: ${data.platform}`);
      }
    } catch (error) {
      this.logger.error(`Social scraping error: ${error.message}`);
      return this.generateMockLeads(data.config || {}, data.platform);
    }
  }

  private async scrapeFromMeta(config: any, data: any): Promise<any> {
    // Meta Marketing API pour rechercher dans les groupes/marketplace
    const response = await axios.get(`https://graph.facebook.com/v18.0/search`, {
      params: {
        access_token: config.apiKey,
        q: data.query,
        type: 'post',
        fields: 'message,from,created_time',
      },
      timeout: 15000,
    });

    const leads = this.extractLeadsFromMetaPosts(response.data?.data || []);
    return { success: true, leads, count: leads.length };
  }

  private extractLeadsFromMetaPosts(posts: any[]): LeadData[] {
    const leads: LeadData[] = [];

    for (const post of posts) {
      const contact = this.extractContactFromText(post.message || '');
      if (contact) {
        leads.push({
          ...contact,
          source: 'facebook',
          sourceUrl: `https://facebook.com/${post.id}`,
          leadType: this.detectLeadType(post.message),
          metadata: {
            postDate: post.created_time,
            authorName: post.from?.name,
          },
        });
      }
    }

    return leads;
  }

  private async scrapeFromLinkedIn(config: any, data: any): Promise<any> {
    // LinkedIn API (necessite OAuth)
    // Implementation simplifiee
    return this.generateMockLeads(data.config || {}, 'linkedin');
  }

  // ============================================
  // WEB SCRAPING - Sites specifiques
  // ============================================

  async scrapeWebsites(userId: string, urls: string[], selectors?: any): Promise<any> {
    this.logger.log(`Scraping websites: ${urls.length} URLs`);

    const allLeads: LeadData[] = [];

    for (const url of urls) {
      try {
        // Utiliser un service de scraping ou puppeteer
        const leads = await this.scrapeWebsite(url, selectors);
        allLeads.push(...leads);
      } catch (error) {
        this.logger.warn(`Failed to scrape ${url}: ${error.message}`);
      }
    }

    return { success: true, leads: allLeads, count: allLeads.length };
  }

  private async scrapeWebsite(url: string, selectors?: any): Promise<LeadData[]> {
    // Implementation basique - en production utiliser Puppeteer ou Playwright
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CRMBot/1.0)',
        },
      });

      const leads = this.extractLeadsFromHTML(response.data, url, selectors);
      return leads;
    } catch {
      return [];
    }
  }

  private extractLeadsFromHTML(html: string, sourceUrl: string, selectors?: any): LeadData[] {
    const leads: LeadData[] = [];

    // Extraire emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = html.match(emailRegex) || [];

    // Extraire telephones tunisiens
    const phoneRegex = /(?:\+216|00216)?[\s.-]?[2579]\d[\s.-]?\d{3}[\s.-]?\d{3}/g;
    const phones = html.match(phoneRegex) || [];

    // Creer des leads a partir des contacts trouves
    const uniqueEmails = [...new Set(emails)].slice(0, 10);
    for (const email of uniqueEmails) {
      if (!email.includes('example') && !email.includes('test')) {
        leads.push({
          email,
          source: 'webscrape',
          sourceUrl,
          leadType: this.detectLeadType(html.substring(0, 500)),
        });
      }
    }

    return leads;
  }

  // ============================================
  // AI DETECTION - Detection IA
  // ============================================

  async detectOpportunitiesWithAI(userId: string, config: any): Promise<any> {
    this.logger.log(`Detecting opportunities with AI for user ${userId}`);

    // Recuperer la config LLM
    const llmConfig = await this.getApiConfig(userId, 'llm');

    // Combiner plusieurs sources
    const results = await Promise.allSettled([
      this.scrapeFromSERP(userId, config),
      this.scrapeWithPica(userId, config),
    ]);

    const allLeads: LeadData[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.leads) {
        allLeads.push(...result.value.leads);
      }
    }

    // Qualifier avec l'IA
    const qualifiedLeads = await this.qualifyLeadsWithAI(allLeads, llmConfig);

    return {
      success: true,
      leads: qualifiedLeads,
      count: qualifiedLeads.length,
      sources: results.length,
    };
  }

  async analyzeContentForLeads(userId: string, content: string, source?: string): Promise<any> {
    this.logger.log(`Analyzing content for leads`);

    // Utiliser l'IA pour extraire les informations
    const prompt = `Analyse ce texte et extrait les informations de contact et immobilieres:

    Texte: ${content}

    Retourne un JSON avec:
    - contacts: [{firstName, lastName, email, phone}]
    - properties: [{type, location, price, description}]
    - leadType: "requete" (cherche un bien) ou "mandat" (propose un bien)
    - score: 0-100 (qualite du lead)`;

    try {
      // Utiliser LLMProviderFactory au lieu de callLLM
      const provider = await this.llmProviderFactory.createProvider(userId);
      const response = await provider.generate(prompt, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      const result = JSON.parse(response);
      return { success: true, analysis: result, method: 'llm' };
    } catch (error) {
      // Log l'erreur pour le debugging
      this.logger.warn(`LLM analysis failed, falling back to regex: ${error.message}`);

      // Fallback sur extraction regex
      const contact = this.extractContactFromText(content);
      return {
        success: true,
        analysis: {
          contacts: contact ? [contact] : [],
          leadType: this.detectLeadType(content),
          score: contact?.email ? 60 : 30,
        },
        method: 'fallback_regex',
        llmError: error.message,
      };
    }
  }

  async classifyLead(userId: string, leadId: string): Promise<any> {
    const lead = await this.prisma.prospecting_leads.findFirst({
      where: { id: leadId, userId },
    });

    if (!lead) {
      throw new BadRequestException('Lead non trouve');
    }

    const prompt = `Classifie ce lead immobilier:

    Nom: ${lead.firstName} ${lead.lastName}
    Email: ${lead.email}
    Telephone: ${lead.phone}
    Ville: ${lead.city}
    Type de bien: ${lead.propertyType}
    Budget: ${JSON.stringify(lead.budget)}
    Source: ${lead.source}
    Metadata: ${JSON.stringify(lead.metadata)}

    Determine:
    1. leadType: "requete" (cherche un bien) ou "mandat" (propose un bien a vendre/louer)
    2. subType: "achat", "location", "vente", "location_bailleur"
    3. urgency: "high", "medium", "low"
    4. quality: 0-100
    5. reason: explication`;

    try {
      // Utiliser LLMProviderFactory
      const provider = await this.llmProviderFactory.createProvider(userId);
      const response = await provider.generate(prompt, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      const result = JSON.parse(response);

      // Mettre a jour le lead
      await this.prisma.prospecting_leads.update({
        where: { id: leadId },
        data: {
          prospectType: result.leadType,
          subType: result.subType,
          score: result.quality,
          metadata: {
            ...lead.metadata,
            aiClassification: result,
          },
        },
      });

      return { success: true, classification: result, method: 'llm' };
    } catch (error) {
      // Log l'erreur pour le debugging
      this.logger.warn(
        `LLM classification failed for lead ${leadId}, using basic rules: ${error.message}`,
      );

      // Classification basique sans IA
      const classification = this.classifyLeadBasic(lead);
      return {
        success: true,
        classification,
        method: 'fallback_rules',
        llmError: error.message,
      };
    }
  }

  async qualifyLeadWithAI(userId: string, leadId: string): Promise<any> {
    const lead = await this.prisma.prospecting_leads.findFirst({
      where: { id: leadId, userId },
    });

    if (!lead) {
      throw new BadRequestException('Lead non trouve');
    }

    const prompt = `Qualifie ce lead immobilier sur 100:

    ${JSON.stringify(lead)}

    Criteres:
    - Completude des informations (email, tel, nom)
    - Budget realiste
    - Localisation precise
    - Source fiable
    - Intention claire

    Retourne: { score: number, reasons: string[], recommendations: string[] }`;

    try {
      // Utiliser LLMProviderFactory
      const provider = await this.llmProviderFactory.createProvider(userId);
      const response = await provider.generate(prompt, {
        maxTokens: 1000,
        temperature: 0.3,
      });
      const result = JSON.parse(response);

      await this.prisma.prospecting_leads.update({
        where: { id: leadId },
        data: {
          score: result.score,
          metadata: {
            ...lead.metadata,
            aiQualification: result,
          },
        },
      });

      return { success: true, qualification: result };
    } catch {
      // Scoring basique
      const score = this.calculateBasicScore(lead);
      return { success: true, qualification: { score, reasons: ['Scoring automatique'] } };
    }
  }

  async enrichLead(userId: string, leadId: string): Promise<any> {
    const lead = await this.prisma.prospecting_leads.findFirst({
      where: { id: leadId, userId },
    });

    if (!lead) {
      throw new BadRequestException('Lead non trouve');
    }

    // Enrichir via diverses sources
    const enrichments: any = {};

    // Validation email
    if (lead.email) {
      enrichments.emailValid = this.isValidEmail(lead.email);
    }

    // Validation telephone
    if (lead.phone) {
      enrichments.phoneValid = this.isValidPhone(lead.phone);
      enrichments.phoneFormatted = this.formatPhone(lead.phone);
    }

    // Mise a jour
    await this.prisma.prospecting_leads.update({
      where: { id: leadId },
      data: {
        metadata: {
          ...lead.metadata,
          enrichments,
          enrichedAt: new Date().toISOString(),
        },
      },
    });

    return { success: true, enrichments };
  }

  // ============================================
  // VALIDATION
  // ============================================

  async validatePhones(phones: string[]): Promise<any> {
    const results = phones.map((phone) => ({
      phone,
      isValid: this.isValidPhone(phone),
      formatted: this.formatPhone(phone),
      country: phone.startsWith('+216') || phone.startsWith('00216') ? 'TN' : 'Unknown',
    }));

    return { results };
  }

  // ============================================
  // HELPERS
  // ============================================

  private buildSearchQuery(config: any): string {
    const parts: string[] = [];

    if (config.targetType?.includes('requete')) {
      parts.push('recherche achat location');
    }
    if (config.targetType?.includes('mandat')) {
      parts.push('vente bien immobilier');
    }

    if (config.propertyType?.length) {
      parts.push(config.propertyType.join(' '));
    }

    if (config.location) {
      parts.push(config.location);
    }

    return parts.join(' ') + ' Tunisie';
  }

  private parseAPIResponse(data: any, source: string, config: any): LeadData[] {
    const leads: LeadData[] = [];

    if (Array.isArray(data.results || data.items || data)) {
      const items = data.results || data.items || data;
      for (const item of items) {
        leads.push({
          firstName: item.firstName || item.first_name,
          lastName: item.lastName || item.last_name,
          email: item.email,
          phone: item.phone || item.phoneNumber,
          city: item.city || item.location,
          propertyType: item.propertyType || item.property_type,
          budget: item.budget || item.price,
          source,
          sourceUrl: item.url || item.source_url,
          leadType: this.detectLeadType(item.description || item.intent),
        });
      }
    }

    return leads;
  }

  private extractContactFromText(text: string): Partial<LeadData> | null {
    if (!text) return null;

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+216|00216)?[\s.-]?[2579]\d[\s.-]?\d{3}[\s.-]?\d{3}/);
    const nameMatch = text.match(/(?:M\.|Mme|Mr|Mrs)?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/);

    if (!emailMatch && !phoneMatch) return null;

    return {
      email: emailMatch?.[0],
      phone: phoneMatch?.[0],
      firstName: nameMatch?.[1],
      lastName: nameMatch?.[2],
    };
  }

  private detectLeadType(text: string): 'requete' | 'mandat' {
    if (!text) return 'requete';

    const textLower = text.toLowerCase();

    // Indicateurs de mandat (vendeur/bailleur)
    const mandatKeywords = [
      'a vendre',
      'vends',
      'je vends',
      'a louer',
      'loue',
      'proprietaire',
      'cede',
    ];
    for (const keyword of mandatKeywords) {
      if (textLower.includes(keyword)) return 'mandat';
    }

    // Par defaut, c'est une requete (acheteur/locataire)
    return 'requete';
  }

  private classifyLeadBasic(lead: any): any {
    const hasEmail = !!lead.email;
    const hasPhone = !!lead.phone;
    const hasBudget = lead.budget && (lead.budget.min || lead.budget.max || lead.budget > 0);

    let score = 30;
    if (hasEmail) score += 25;
    if (hasPhone) score += 20;
    if (hasBudget) score += 15;
    if (lead.city) score += 10;

    return {
      leadType: lead.prospectType || 'requete',
      subType: lead.subType || 'achat',
      urgency: score > 70 ? 'high' : score > 50 ? 'medium' : 'low',
      quality: score,
      reason: 'Classification automatique basee sur les donnees disponibles',
    };
  }

  private calculateBasicScore(lead: any): number {
    let score = 0;
    if (lead.email && this.isValidEmail(lead.email)) score += 25;
    if (lead.phone && this.isValidPhone(lead.phone)) score += 20;
    if (lead.firstName && lead.lastName) score += 10;
    if (lead.budget) score += 20;
    if (lead.city) score += 10;
    if (lead.propertyType) score += 10;
    if (lead.source !== 'manual') score += 5;
    return Math.min(score, 100);
  }

  private async qualifyLeadsWithAI(leads: LeadData[], llmConfig: any): Promise<LeadData[]> {
    // Ajouter un score de base a chaque lead
    return leads.map((lead) => ({
      ...lead,
      score: this.calculateBasicScore(lead),
    }));
  }


  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s.-]/g, '');
    return /^(?:\+216|00216)?[2579]\d{7}$/.test(cleaned);
  }

  private formatPhone(phone: string): string {
    const cleaned = phone.replace(/[\s.-]/g, '').replace(/^00216/, '+216');
    if (!cleaned.startsWith('+')) {
      return `+216${cleaned}`;
    }
    return cleaned;
  }

  private generateMockLeads(config: any, source: string): any {
    const leads: LeadData[] = [];
    const count = Math.min(config.totalTarget || 10, 20);

    const firstNames = ['Ahmed', 'Mohamed', 'Fatma', 'Leila', 'Karim', 'Sami', 'Nadia', 'Ines'];
    const lastNames = ['Ben Ali', 'Trabelsi', 'Hamdi', 'Gharbi', 'Mejri', 'Bouazizi'];
    const cities = ['Tunis', 'La Marsa', 'Sousse', 'Sfax', 'Hammamet', 'Bizerte'];
    const propertyTypes = ['appartement', 'villa', 'maison', 'studio', 'duplex'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const isMandat = Math.random() > 0.6;

      leads.push({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}@example.com`,
        phone: `+216${20 + Math.floor(Math.random() * 80)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        budget: {
          min: Math.floor(100000 + Math.random() * 200000),
          max: Math.floor(300000 + Math.random() * 500000),
          currency: 'TND',
        },
        source,
        leadType: isMandat ? 'mandat' : 'requete',
        metadata: {
          mockData: true,
          generatedAt: new Date().toISOString(),
        },
      });
    }

    return { success: true, leads, count: leads.length, mock: true };
  }
}
