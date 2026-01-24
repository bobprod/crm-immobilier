import { Injectable, Logger } from '@nestjs/common';
import { AiOrchestratorService } from '../../intelligence/ai-orchestrator/services/ai-orchestrator.service';
import { OrchestrationObjective, OrchestrationStatus } from '../../intelligence/ai-orchestrator/dto';
import {
  StartProspectionDto,
  ProspectionResult,
  ProspectionStatus,
  ProspectionLead,
  ProspectionInputMode,
} from '../dto';
import { WebDataService } from '../../scraping/services/web-data.service';
import { FirecrawlService } from '../../scraping/services/firecrawl.service';

/**
 * Service de prospection IA
 *
 * Utilise l'AI Orchestrator pour générer des leads automatiquement
 */
@Injectable()
export class ProspectionService {
  private readonly logger = new Logger(ProspectionService.name);

  constructor(
    private readonly aiOrchestrator: AiOrchestratorService,
    private readonly webDataService: WebDataService,
    private readonly firecrawlService: FirecrawlService,
  ) { }

  /**
   * Lancer une prospection
   */
  async startProspection(params: {
    tenantId: string;
    userId: string;
    request: StartProspectionDto;
  }): Promise<ProspectionResult> {
    const { tenantId, userId, request } = params;

    this.logger.log(`Starting prospection for tenant ${tenantId}, mode: ${request.inputMode}`);

    const startTime = Date.now();
    const prospectionId = `prosp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      // Route selon le mode de prospection
      if (request.inputMode === ProspectionInputMode.URLS) {
        this.logger.log(`URL mode: scraping ${request.urls?.length || 0} URLs`);
        return this.runUrlBasedProspection(prospectionId, tenantId, userId, request, startTime);
      }

      // Mode critères (ancien comportement)
      this.logger.log(`Criteria mode: ${request.zone}`);

      // Choisir le moteur
      const engine = request.options?.engine || 'internal';

      if (engine === 'pica-ai') {
        return this.runPicaAiProspection(prospectionId, tenantId, userId, request);
      }

      // Moteur internal par défaut
      return this.runInternalProspection(prospectionId, tenantId, userId, request, startTime);
    } catch (error) {
      this.logger.error('Prospection failed:', error);

      return {
        id: prospectionId,
        status: ProspectionStatus.FAILED,
        leads: [],
        stats: {
          totalLeads: 0,
          withEmail: 0,
          withPhone: 0,
          avgConfidence: 0,
        },
        metadata: {
          zone: request.zone,
          targetType: request.targetType,
          propertyType: request.propertyType,
          budget: request.budget,
          keywords: request.keywords,
          executionTimeMs: Date.now() - startTime,
        },
        errors: [error.message],
        createdAt: new Date(),
      };
    }
  }

  /**
   * Moteur de prospection interne (via AI Orchestrator)
   * ✅ Phase 1: Utilise les services du module Prospecting via AI Orchestrator
   */
  private async runInternalProspection(
    prospectionId: string,
    tenantId: string,
    userId: string,
    request: StartProspectionDto,
    startTime: number,
  ): Promise<ProspectionResult> {
    this.logger.log('Running internal prospection engine via AI Orchestrator...');

    // ✅ NOUVEAU: Workflow multi-étapes via AI Orchestrator
    // Étape 1: Scraping via outil 'prospecting:scrape'
    const scrapingResult = await this.aiOrchestrator.orchestrate({
      tenantId,
      userId,
      objective: OrchestrationObjective.PROSPECTION,
      context: {
        zone: request.zone,
        targetType: request.targetType,
        propertyType: request.propertyType,
        budget: request.budget,
        keywords: request.keywords?.join(' '),
        maxResults: request.maxLeads || 20,
        step: 'scraping', // Indiquer l'étape
      },
      options: {
        executionMode: 'auto',
        maxCost: request.options?.maxCost || 5,
        timeout: 300000, // 5 minutes
      },
    });

    // Vérifier si le scraping a réussi
    if (scrapingResult.status === OrchestrationStatus.FAILED) {
      return this.buildFailedResult(
        prospectionId,
        request,
        startTime,
        scrapingResult.errors || ['Scraping failed'],
      );
    }

    // Extraire les leads bruts du résultat de scraping
    const rawItems = this.extractRawItemsFromOrchestration(scrapingResult);

    if (rawItems.length === 0) {
      this.logger.warn('No raw items found from scraping');
      return this.buildEmptyResult(prospectionId, request, startTime);
    }

    this.logger.log(`Scraped ${rawItems.length} raw items, now analyzing with LLM...`);

    // Étape 2: Analyse LLM via outil 'prospecting:analyze'
    const analysisResult = await this.aiOrchestrator.orchestrate({
      tenantId,
      userId,
      objective: OrchestrationObjective.PROSPECTION,
      context: {
        rawItems,
        step: 'analysis',
      },
      options: {
        executionMode: 'auto',
        maxCost: request.options?.maxCost || 5,
        timeout: 300000,
      },
    });

    // Extraire les leads analysés
    const analyzedLeads = this.extractAnalyzedLeadsFromOrchestration(analysisResult);

    if (analyzedLeads.length === 0) {
      this.logger.warn('No valid leads after LLM analysis');
      return this.buildEmptyResult(prospectionId, request, startTime);
    }

    this.logger.log(`Analyzed ${analyzedLeads.length} leads, now qualifying and matching...`);

    // Étape 3: Qualification et Matching via outils 'prospecting:qualify' et 'prospecting:match'
    const qualifiedLeads: ProspectionLead[] = [];

    for (const analyzedLead of analyzedLeads.slice(0, request.maxLeads || 20)) {
      try {
        // Qualifier le lead
        const qualificationResult = await this.aiOrchestrator.orchestrate({
          tenantId,
          userId,
          objective: OrchestrationObjective.PROSPECTION,
          context: {
            leadId: analyzedLead.id,
            step: 'qualification',
          },
          options: {
            executionMode: 'auto',
            maxCost: 1,
            timeout: 30000,
          },
        });

        // Extraire le score et enrichir les infos
        const qualificationData = qualificationResult.finalResult;

        qualifiedLeads.push({
          name: analyzedLead.name || 'Unknown',
          email: analyzedLead.email,
          phone: analyzedLead.phone,
          company: analyzedLead.company,
          role: analyzedLead.role,
          context: analyzedLead.context || '',
          source: analyzedLead.source || 'Unknown',
          confidence: qualificationData?.score ? qualificationData.score / 100 : 0.7,
        });
      } catch (error) {
        this.logger.warn(`Failed to qualify lead ${analyzedLead.id}: ${error.message}`);
        // Ajouter le lead sans qualification complète
        qualifiedLeads.push({
          name: analyzedLead.name || 'Unknown',
          email: analyzedLead.email,
          phone: analyzedLead.phone,
          company: analyzedLead.company,
          role: analyzedLead.role,
          context: analyzedLead.context || '',
          source: analyzedLead.source || 'Unknown',
          confidence: 0.5, // Score par défaut
        });
      }
    }

    // Calculer les statistiques
    const stats = this.calculateStats(qualifiedLeads);

    // Calculer le coût total (somme des coûts de toutes les étapes)
    const totalCost =
      (scrapingResult.metrics?.totalCost || 0) +
      (analysisResult.metrics?.totalCost || 0);

    return {
      id: prospectionId,
      status: ProspectionStatus.COMPLETED,
      leads: qualifiedLeads,
      stats,
      metadata: {
        zone: request.zone,
        targetType: request.targetType,
        propertyType: request.propertyType,
        budget: request.budget,
        keywords: request.keywords,
        executionTimeMs: Date.now() - startTime,
        cost: totalCost,
      },
      errors: [],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  /**
   * Prospection basée sur URLs directes
   * ✨ Phase 1 - URL Mode: L'utilisateur fournit des URLs, l'IA extrait tout
   */
  private async runUrlBasedProspection(
    prospectionId: string,
    tenantId: string,
    userId: string,
    request: StartProspectionDto,
    startTime: number,
  ): Promise<ProspectionResult> {
    this.logger.log('Running URL-based prospection with AI extraction...');

    const urls = request.urls || [];

    if (urls.length === 0) {
      return this.buildEmptyResult(prospectionId, request, startTime);
    }

    // Étape 1: Scraper toutes les URLs avec extraction IA
    this.logger.log(`Scraping ${urls.length} URLs with Firecrawl/Puppeteer + LLM...`);

    const rawItems: any[] = [];
    const scrapingErrors: string[] = [];

    for (const url of urls) {
      try {
        // Utiliser Firecrawl avec extraction LLM si disponible
        const extractionPrompt = `
          Extraire les informations de contact pour cette annonce immobilière:
          - Nom/Prénom du propriétaire ou agent
          - Email
          - Téléphone
          - Entreprise/Agence
          - Rôle (propriétaire, agent, agence)
          - Budget/Prix du bien
          - Type de bien (appartement, villa, terrain, etc.)
          - Localisation (ville, quartier)

          Retourner UNIQUEMENT les données structurées en JSON.
        `;

        this.logger.log(`Extracting from: ${url}`);

        const webData = await this.webDataService.fetchHtml(url, {
          tenantId,
          extractionPrompt,
          forceProvider: false, // Allow fallback
        });

        // Si Firecrawl a extrait des données structurées, les utiliser
        if (webData.extractedData) {
          rawItems.push({
            url,
            ...webData.extractedData,
            source: url,
            rawHtml: webData.html?.substring(0, 1000), // Garder un extrait pour contexte
            text: webData.text?.substring(0, 2000),
          });
        } else {
          // Sinon, utiliser le texte brut pour analyse LLM ultérieure
          rawItems.push({
            url,
            source: url,
            text: webData.text,
            title: webData.title,
            metadata: webData.metadata,
          });
        }

        this.logger.log(`✓ Extracted data from ${url}`);
      } catch (error) {
        this.logger.warn(`Failed to scrape ${url}: ${error.message}`);
        scrapingErrors.push(`${url}: ${error.message}`);
      }
    }

    if (rawItems.length === 0) {
      this.logger.warn('No data extracted from any URLs');
      return this.buildFailedResult(
        prospectionId,
        request,
        startTime,
        ['No data could be extracted from the provided URLs', ...scrapingErrors],
      );
    }

    this.logger.log(`Scraped ${rawItems.length}/${urls.length} URLs successfully`);

    // Étape 2: Analyse LLM pour normaliser et enrichir les données
    this.logger.log('Analyzing scraped data with LLM...');

    const analysisResult = await this.aiOrchestrator.orchestrate({
      tenantId,
      userId,
      objective: OrchestrationObjective.PROSPECTION,
      context: {
        rawItems,
        step: 'analysis',
      },
      options: {
        executionMode: 'auto',
        maxCost: request.options?.maxCost || 5,
        timeout: 300000,
      },
    });

    // Extraire les leads analysés
    const analyzedLeads = this.extractAnalyzedLeadsFromOrchestration(analysisResult);

    if (analyzedLeads.length === 0) {
      this.logger.warn('No valid leads after LLM analysis');
      return this.buildEmptyResult(prospectionId, request, startTime);
    }

    this.logger.log(`Analyzed ${analyzedLeads.length} leads from URLs`);

    // Étape 3: Qualification (même process que criteria mode)
    const qualifiedLeads: ProspectionLead[] = [];

    for (const analyzedLead of analyzedLeads) {
      try {
        const qualificationResult = await this.aiOrchestrator.orchestrate({
          tenantId,
          userId,
          objective: OrchestrationObjective.PROSPECTION,
          context: {
            leadId: analyzedLead.id,
            step: 'qualification',
          },
          options: {
            executionMode: 'auto',
            maxCost: 1,
            timeout: 30000,
          },
        });

        const qualificationData = qualificationResult.finalResult;

        qualifiedLeads.push({
          name: analyzedLead.name || 'Unknown',
          email: analyzedLead.email,
          phone: analyzedLead.phone,
          company: analyzedLead.company,
          role: analyzedLead.role,
          context: analyzedLead.context || '',
          source: analyzedLead.source || 'URL Direct',
          confidence: qualificationData?.score ? qualificationData.score / 100 : 0.7,
        });
      } catch (error) {
        this.logger.warn(`Failed to qualify lead ${analyzedLead.id}: ${error.message}`);
        qualifiedLeads.push({
          name: analyzedLead.name || 'Unknown',
          email: analyzedLead.email,
          phone: analyzedLead.phone,
          company: analyzedLead.company,
          role: analyzedLead.role,
          context: analyzedLead.context || '',
          source: analyzedLead.source || 'URL Direct',
          confidence: 0.5,
        });
      }
    }

    // Calculer les statistiques
    const stats = this.calculateStats(qualifiedLeads);

    // Calculer le coût (Firecrawl ~$0.001/URL + LLM analysis)
    const totalCost = (urls.length * 0.001) + (analysisResult.metrics?.totalCost || 0);

    return {
      id: prospectionId,
      status: ProspectionStatus.COMPLETED,
      leads: qualifiedLeads,
      stats,
      metadata: {
        zone: 'URL Mode',
        targetType: 'URLs',
        propertyType: undefined,
        budget: undefined,
        keywords: undefined,
        executionTimeMs: Date.now() - startTime,
        cost: totalCost,
        urlsScraped: rawItems.length,
        urlsTotal: urls.length,
        scrapingErrors,
      },
      errors: scrapingErrors.length > 0 ? scrapingErrors : [],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  /**
   * Moteur de prospection Pica.AI (à implémenter plus tard)
   */
  private async runPicaAiProspection(
    prospectionId: string,
    tenantId: string,
    userId: string,
    request: StartProspectionDto,
  ): Promise<ProspectionResult> {
    // TODO: Implémenter l'intégration Pica.AI
    this.logger.warn('Pica.AI engine not implemented yet, falling back to internal');

    return this.runInternalProspection(
      prospectionId,
      tenantId,
      userId,
      request,
      Date.now(),
    );
  }

  /**
   * Extraire les items bruts du résultat d'orchestration (étape scraping)
   */
  private extractRawItemsFromOrchestration(orchestrationResult: any): any[] {
    const finalResult = orchestrationResult.finalResult;

    if (!finalResult || !finalResult.data) {
      return [];
    }

    // Le résultat du scraping devrait contenir un tableau de données brutes
    const data = finalResult.data;

    if (Array.isArray(data)) {
      return data;
    }

    // Si c'est un objet avec une propriété items ou leads
    if (data.items && Array.isArray(data.items)) {
      return data.items;
    }

    if (data.leads && Array.isArray(data.leads)) {
      return data.leads;
    }

    return [];
  }

  /**
   * Extraire les leads analysés du résultat d'orchestration (étape analysis)
   */
  private extractAnalyzedLeadsFromOrchestration(orchestrationResult: any): any[] {
    const finalResult = orchestrationResult.finalResult;

    if (!finalResult || !finalResult.analyzed) {
      this.logger.warn('No analyzed data found in orchestration result');
      return [];
    }

    const analyzed = finalResult.analyzed;

    if (!Array.isArray(analyzed)) {
      this.logger.warn('Invalid analyzed format in orchestration result');
      return [];
    }

    return analyzed.filter((item: any) => item && item.name);
  }

  /**
   * Construire un résultat d'échec
   */
  private buildFailedResult(
    prospectionId: string,
    request: StartProspectionDto,
    startTime: number,
    errors: string[],
  ): ProspectionResult {
    return {
      id: prospectionId,
      status: ProspectionStatus.FAILED,
      leads: [],
      stats: {
        totalLeads: 0,
        withEmail: 0,
        withPhone: 0,
        avgConfidence: 0,
      },
      metadata: {
        zone: request.zone,
        targetType: request.targetType,
        propertyType: request.propertyType,
        budget: request.budget,
        keywords: request.keywords,
        executionTimeMs: Date.now() - startTime,
      },
      errors,
      createdAt: new Date(),
    };
  }

  /**
   * Construire un résultat vide (aucun lead trouvé)
   */
  private buildEmptyResult(
    prospectionId: string,
    request: StartProspectionDto,
    startTime: number,
  ): ProspectionResult {
    return {
      id: prospectionId,
      status: ProspectionStatus.COMPLETED,
      leads: [],
      stats: {
        totalLeads: 0,
        withEmail: 0,
        withPhone: 0,
        avgConfidence: 0,
      },
      metadata: {
        zone: request.zone,
        targetType: request.targetType,
        propertyType: request.propertyType,
        budget: request.budget,
        keywords: request.keywords,
        executionTimeMs: Date.now() - startTime,
      },
      errors: [],
      createdAt: new Date(),
      completedAt: new Date(),
    };
  }

  /**
   * Extraire les leads du résultat d'orchestration
   */
  private extractLeadsFromOrchestration(orchestrationResult: any): ProspectionLead[] {
    const finalResult = orchestrationResult.finalResult;

    if (!finalResult || !finalResult.leads) {
      this.logger.warn('No leads found in orchestration result');
      return [];
    }

    // Le finalResult.leads devrait être un tableau de leads bruts
    const rawLeads = finalResult.leads;

    if (!Array.isArray(rawLeads)) {
      this.logger.warn('Invalid leads format in orchestration result');
      return [];
    }

    // Mapper et valider les leads
    return rawLeads
      .map((raw: any) => ({
        name: raw.name || 'Unknown',
        email: raw.email || undefined,
        phone: raw.phone || undefined,
        company: raw.company || undefined,
        role: raw.role || undefined,
        context: raw.context || '',
        source: raw.source || raw.url || 'Unknown',
        confidence: raw.confidence || 0.7,
      }))
      .filter((lead) => lead.name && lead.name !== 'Unknown'); // Filtrer les leads invalides
  }

  /**
   * Calculer les statistiques des leads
   */
  private calculateStats(leads: ProspectionLead[]) {
    const totalLeads = leads.length;
    const withEmail = leads.filter((l) => l.email).length;
    const withPhone = leads.filter((l) => l.phone).length;
    const avgConfidence =
      totalLeads > 0
        ? leads.reduce((sum, l) => sum + (l.confidence || 0), 0) / totalLeads
        : 0;

    return {
      totalLeads,
      withEmail,
      withPhone,
      avgConfidence,
    };
  }

  /**
   * Mapper le statut d'orchestration vers le statut de prospection
   */
  private mapOrchestrationStatus(status: OrchestrationStatus): ProspectionStatus {
    const mapping: Record<OrchestrationStatus, ProspectionStatus> = {
      [OrchestrationStatus.PENDING]: ProspectionStatus.PENDING,
      [OrchestrationStatus.PLANNING]: ProspectionStatus.RUNNING,
      [OrchestrationStatus.EXECUTING]: ProspectionStatus.RUNNING,
      [OrchestrationStatus.COMPLETED]: ProspectionStatus.COMPLETED,
      [OrchestrationStatus.FAILED]: ProspectionStatus.FAILED,
      [OrchestrationStatus.PARTIAL]: ProspectionStatus.PARTIAL,
    };

    return mapping[status] || ProspectionStatus.FAILED;
  }
}
