import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { LLMRouterService } from '../intelligence/llm-config/llm-router.service';
import {
  RawScrapedItem,
  LLMAnalyzedLead,
  ProspectingLeadCreateInput,
  BatchAnalysisResult,
  AnalysisConfig,
  ValidationResult,
  ValidationStatus,
} from './dto/llm-prospecting.dto';

/**
 * Service LLM pour l'analyse intelligente des donnees scrappees
 *
 * Pipeline:
 *   SOURCES (Pica, SERP, Meta, LinkedIn, Firecrawl, Websites)
 *        ↓
 *   Integration Service (scraping brut)
 *        ↓
 *   LLMProspectingService  ← CE SERVICE
 *        ↓
 *   Prisma.prospecting_leads (leads propres)
 *        ↓
 *   Validation / Deduplication / Scoring
 *        ↓
 *   Matching (findMatchesForLead)
 *        ↓
 *   Conversion → Prospects / CRM
 */
@Injectable()
export class LLMProspectingService {
  private readonly logger = new Logger(LLMProspectingService.name);

  // Prompt systeme pour l'analyse des leads
  private readonly ANALYSIS_SYSTEM_PROMPT = `Tu es un assistant specialise dans l'analyse de donnees immobilieres en Tunisie.
Tu recois du texte brut scrappe depuis diverses sources (annonces, posts Facebook, LinkedIn, etc.).
Ton role est d'extraire les informations structurees sur les leads potentiels.

REGLES:
1. Un "lead" est une personne cherchant a acheter/louer (requete) ou proposant un bien (mandat)
2. Extrait UNIQUEMENT les informations presentes dans le texte
3. Ne devine pas les informations manquantes
4. Normalise les villes tunisiennes (ex: "la marsa" → "La Marsa", "tunis" → "Tunis")
5. Normalise les numeros de telephone au format tunisien (+216 XX XXX XXX)
6. Le budget doit etre en TND (Dinar Tunisien)
7. Evalue le serieux du lead de 0 a 100 selon la qualite des informations

TYPES DE BIENS:
- appartement, studio, duplex, triplex
- maison, villa, etage de villa
- terrain, local commercial, bureau
- immeuble, ferme, autres`;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private llmRouter: LLMRouterService,
  ) {}

  // ============================================
  // 1) ANALYSE UN ELEMENT BRUT SCRAPPE
  // ============================================

  /**
   * Analyse un element brut scrappe et retourne les infos extraites par le LLM
   * @param raw - Element brut à analyser
   * @param userId - ID utilisateur pour récupérer la config LLM personnalisée
   * @param providerOverride - Provider manuel (optionnel, 'auto' par défaut)
   */
  async analyzeRawItem(
    raw: RawScrapedItem,
    userId: string,
    providerOverride?: string,
  ): Promise<LLMAnalyzedLead> {
    this.logger.log(`Analyzing raw item from source: ${raw.source} for user ${userId}`);

    const startTime = Date.now();
    let providerName: string;

    try {
      // ✅ Sélection intelligente : prospecting en masse = coût minimal
      const provider = await this.llmRouter.selectBestProvider(
        userId,
        'prospecting_mass', // DeepSeek, Qwen prioritaires
        providerOverride,
      );
      providerName = provider.name.toLowerCase();

      const userPrompt = this.buildAnalysisPrompt(raw);

      // Utiliser provider.generate()
      const response = await provider.generate(userPrompt, {
        systemPrompt: this.ANALYSIS_SYSTEM_PROMPT,
        maxTokens: 1000,
        temperature: 0.3,
      });

      const latency = Date.now() - startTime;

      // Parser la réponse JSON
      const parsed = JSON.parse(response);
      const result = this.parseAnalysisResponse(parsed, raw);

      // ✅ Tracking automatique des métriques
      const tokensInput = Math.ceil(userPrompt.length / 4);
      const tokensOutput = Math.ceil(response.length / 4);

      await this.llmRouter.trackUsage(
        userId,
        providerName,
        'prospecting_mass',
        tokensInput,
        tokensOutput,
        latency,
        true,
      );

      return result;
    } catch (error) {
      this.logger.error(`LLM analysis failed: ${error.message}`);

      // Tracking de l'échec
      if (providerName) {
        await this.llmRouter.trackUsage(
          userId,
          providerName,
          'prospecting_mass',
          Math.ceil(raw.text.length / 4),
          0,
          Date.now() - startTime,
          false,
          error.message,
        );
      }

      // Fallback sur l'extraction par regles
      return this.analyzeWithRules(raw);
    }
  }

  /**
   * ⚡ OPTIMISATION: Analyse PLUSIEURS items en un SEUL appel LLM
   * Économie: 10x moins d'appels API = 90% de réduction des coûts
   *
   * @param raws - Tableau d'items à analyser ensemble (recommandé: 10-15 items max)
   * @param userId - ID utilisateur
   * @param providerOverride - Provider manuel (optionnel)
   * @returns Tableau de résultats analysés (même ordre que l'input)
   */
  async analyzeRawItemsBatch(
    raws: RawScrapedItem[],
    userId: string,
    providerOverride?: string,
  ): Promise<LLMAnalyzedLead[]> {
    if (raws.length === 0) return [];

    // Pour 1 seul item, utiliser la méthode classique
    if (raws.length === 1) {
      return [await this.analyzeRawItem(raws[0], userId, providerOverride)];
    }

    this.logger.log(`Batch analyzing ${raws.length} items in a SINGLE LLM call for user ${userId}`);

    const startTime = Date.now();
    let providerName: string;

    try {
      // Sélection intelligente du provider
      const provider = await this.llmRouter.selectBestProvider(
        userId,
        'prospecting_mass',
        providerOverride,
      );
      providerName = provider.name.toLowerCase();

      // Construire le prompt batch avec tous les items numérotés
      const batchPrompt = this.buildBatchAnalysisPrompt(raws);

      // ✅ UN SEUL appel LLM pour tous les items
      const response = await provider.generate(batchPrompt, {
        systemPrompt: this.ANALYSIS_SYSTEM_PROMPT + `

IMPORTANT: Tu dois retourner un tableau JSON avec exactement ${raws.length} résultats, dans le MÊME ORDRE que les items reçus.
Format de réponse attendu:
{
  "results": [
    { /* résultat pour item 0 */ },
    { /* résultat pour item 1 */ },
    ...
  ]
}`,
        maxTokens: 2000 + raws.length * 500, // Allouer suffisamment de tokens
        temperature: 0.3,
      });

      const latency = Date.now() - startTime;

      // Parser la réponse JSON batch
      const parsed = JSON.parse(response);
      const results: LLMAnalyzedLead[] = [];

      // Vérifier que nous avons reçu le bon nombre de résultats
      if (!parsed.results || !Array.isArray(parsed.results)) {
        throw new Error('Invalid batch response format: missing results array');
      }

      if (parsed.results.length !== raws.length) {
        this.logger.warn(
          `Batch response mismatch: expected ${raws.length} results, got ${parsed.results.length}`,
        );
      }

      // Associer chaque résultat à son raw item correspondant
      for (let i = 0; i < raws.length; i++) {
        const rawItem = raws[i];
        const analysisResult = parsed.results[i] || {};

        try {
          const analyzed = this.parseAnalysisResponse(analysisResult, rawItem);
          results.push(analyzed);
        } catch (error) {
          this.logger.warn(`Failed to parse batch result ${i}: ${error.message}`);
          // Fallback sur extraction par règles pour cet item
          results.push(this.analyzeWithRules(rawItem));
        }
      }

      // ✅ Tracking: 1 seul appel pour tous les items
      const tokensInput = Math.ceil(batchPrompt.length / 4);
      const tokensOutput = Math.ceil(response.length / 4);

      await this.llmRouter.trackUsage(
        userId,
        providerName,
        'prospecting_mass',
        tokensInput,
        tokensOutput,
        latency,
        true,
        `batch:${raws.length}`, // Note dans errorMessage pour tracking
      );

      this.logger.log(
        `✅ Batch analysis complete: ${raws.length} items in ${latency}ms (${Math.round(latency / raws.length)}ms/item avg)`,
      );

      return results;
    } catch (error) {
      this.logger.error(`Batch LLM analysis failed: ${error.message}`);

      // Tracking de l'échec
      if (providerName) {
        const totalTextLength = raws.reduce((sum, raw) => sum + raw.text.length, 0);
        await this.llmRouter.trackUsage(
          userId,
          providerName,
          'prospecting_mass',
          Math.ceil(totalTextLength / 4),
          0,
          Date.now() - startTime,
          false,
          error.message,
        );
      }

      // Fallback: analyser individuellement chaque item
      this.logger.warn(`Falling back to individual analysis for ${raws.length} items`);
      const fallbackResults: LLMAnalyzedLead[] = [];
      for (const raw of raws) {
        try {
          fallbackResults.push(await this.analyzeRawItem(raw, userId, providerOverride));
        } catch (itemError) {
          fallbackResults.push(this.analyzeWithRules(raw));
        }
      }
      return fallbackResults;
    }
  }

  /**
   * Construit un prompt pour analyser plusieurs items en batch
   */
  private buildBatchAnalysisPrompt(raws: RawScrapedItem[]): string {
    const itemsJson = raws.map((raw, index) => ({
      index,
      source: raw.source,
      title: raw.title || '',
      text: raw.text,
      url: raw.url || '',
      date: raw.publishedAt || '',
    }));

    return `Analyse les ${raws.length} items immobiliers suivants et retourne un tableau de résultats structurés.

ITEMS À ANALYSER:
${JSON.stringify(itemsJson, null, 2)}

Pour CHAQUE item, extrais les informations selon le format suivant:
{
  "isLead": boolean,
  "leadType": "requete" | "mandat" | "inconnu",
  "firstName": string | null,
  "lastName": string | null,
  "email": string | null,
  "phone": string | null,
  "city": string | null,
  "propertyTypes": string[],
  "budgetMin": number | null,
  "budgetMax": number | null,
  "budgetCurrency": "TND" | "EUR" | "USD",
  "surfaceM2": { min: number | null, max: number | null },
  "rooms": number | null,
  "intention": "achat" | "location" | "vente" | "mise_en_location" | null,
  "urgency": "immediate" | "1_mois" | "3_mois" | "6_mois" | null,
  "seriousnessScore": number (0-100),
  "confidence": number (0-100)
}

Retourne au format:
{
  "results": [
    { /* résultat pour index 0 */ },
    { /* résultat pour index 1 */ },
    ...
  ]
}`;
  }

  // ============================================
  // 2) TRANSFORME RAW → PROSPECTING LEAD
  // ============================================

  /**
   * Transforme un RawScrapedItem directement en ProspectingLead pret a etre insere en BDD
   * @param raw - Element brut à transformer
   * @param userId - ID utilisateur pour l'analyse LLM
   * @param providerOverride - Provider manuel (optionnel)
   */
  async buildProspectingLeadFromRaw(
    raw: RawScrapedItem,
    userId: string,
    providerOverride?: string,
  ): Promise<ProspectingLeadCreateInput> {
    // 1. Analyser avec le LLM (avec routing intelligent)
    const analyzed = await this.analyzeRawItem(raw, userId, providerOverride);

    // 2. Valider les donnees
    const validation = this.validateLead(analyzed);

    // 3. Calculer le score global
    const score = this.calculateGlobalScore(analyzed, validation);

    // 4. Construire l'objet pour Prisma
    const lead: ProspectingLeadCreateInput = {
      source: raw.source,
      rawText: raw.text,
      url: raw.url,
      title: raw.title,

      firstName: analyzed.firstName,
      lastName: analyzed.lastName,
      email: analyzed.email,
      phone: this.normalizePhone(analyzed.phone),

      city: analyzed.city,
      country: analyzed.country || 'Tunisie',

      budgetMin: analyzed.budget?.min ?? null,
      budgetMax: analyzed.budget?.max ?? null,
      budgetCurrency: analyzed.budget?.currency || 'TND',

      propertyTypes: analyzed.propertyTypes || [],
      leadType: analyzed.leadType,
      intention: analyzed.intention,
      urgency: analyzed.urgency,

      surfaceM2: analyzed.surfaceM2,
      rooms: analyzed.rooms,

      seriousnessScore: analyzed.seriousnessScore,

      validationStatus: validation.status,
      score,
      status: 'new',

      metadata: {
        analyzedAt: new Date().toISOString(),
        rawItem: raw,
        llmAnalysis: analyzed,
        validation,
        authorName: raw.authorName,
        publishedAt: raw.publishedAt,
      },
    };

    return lead;
  }

  // ============================================
  // 3) BATCH PROCESSING
  // ============================================

  /**
   * Variante batch pour traiter plusieurs items d'un coup
   * @param raws - Liste d'éléments bruts à traiter
   * @param userId - ID utilisateur pour l'analyse LLM
   * @param config - Configuration optionnelle du batch
   */
  async buildProspectingLeadsFromRawBatch(
    raws: RawScrapedItem[],
    userId: string,
    config?: AnalysisConfig,
    providerOverride?: string,
  ): Promise<ProspectingLeadCreateInput[]> {
    // ⚡ OPTIMISATION: Batch de 10 items = 10x moins d'appels LLM
    const batchSize = config?.batchSize || 10;
    const results: ProspectingLeadCreateInput[] = [];

    this.logger.log(
      `⚡ Processing ${raws.length} items with OPTIMIZED batching (${batchSize} items/LLM call) for user ${userId}`,
    );

    // Traiter par lots de 10 avec UN SEUL appel LLM par batch
    for (let i = 0; i < raws.length; i += batchSize) {
      const batch = raws.slice(i, i + batchSize);

      try {
        // ✅ NOUVEAU: Analyser tout le batch en 1 seul appel LLM
        const analyzedBatch = await this.analyzeRawItemsBatch(batch, userId, providerOverride);

        // Transformer chaque résultat analysé en ProspectingLead
        for (let j = 0; j < batch.length; j++) {
          const raw = batch[j];
          const analyzed = analyzedBatch[j];

          try {
            // Valider et enrichir
            const validation = await this.validateLead(analyzed);
            const score = this.calculateGlobalScore(analyzed, validation);

            const lead: ProspectingLeadCreateInput = {
              source: raw.source,
              rawText: raw.text,
              url: raw.url,
              title: raw.title,
              firstName: analyzed.firstName,
              lastName: analyzed.lastName,
              email: analyzed.email,
              phone: this.normalizePhone(analyzed.phone),
              city: analyzed.city,
              propertyTypes: analyzed.propertyTypes,
              budgetMin: analyzed.budgetMin,
              budgetMax: analyzed.budgetMax,
              budgetCurrency: analyzed.budgetCurrency || 'TND',
              surfaceM2: analyzed.surfaceM2,
              rooms: analyzed.rooms,
              leadType: analyzed.leadType,
              intention: analyzed.intention,
              urgency: analyzed.urgency,
              validationStatus: validation.status,
              score,
              status: validation.status === 'valid' ? 'new' : 'rejected',
              metadata: {
                analyzedAt: new Date().toISOString(),
                confidence: analyzed.confidence,
                seriousnessScore: analyzed.seriousnessScore,
                validationDetails: validation.details,
              },
            };

            results.push(lead);
          } catch (error) {
            this.logger.warn(`Failed to transform batch item ${j}: ${error.message}`);
            results.push(this.createMinimalLead(raw, error.message));
          }
        }

        this.logger.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items processed`);
      } catch (error) {
        this.logger.error(`Batch processing failed: ${error.message}`);
        // Fallback: créer des leads minimaux pour tout le batch
        for (const raw of batch) {
          results.push(this.createMinimalLead(raw, error.message));
        }
      }

      // Petit délai entre les batches pour éviter rate limiting
      if (i + batchSize < raws.length) {
        await this.sleep(300); // Réduit de 500ms à 300ms car on fait moins d'appels
      }
    }

    this.logger.log(`🎯 Total processed: ${results.length} leads with ${Math.ceil(raws.length / batchSize)} LLM calls`);

    return results;
  }

  /**
   * Analyse un batch et retourne des statistiques detaillees
   */
  async analyzeBatch(
    raws: RawScrapedItem[],
    userId: string,
    config?: AnalysisConfig,
    providerOverride?: string,
  ): Promise<BatchAnalysisResult> {
    const items: BatchAnalysisResult['items'] = [];
    let leads = 0;
    let nonLeads = 0;
    let errors = 0;

    for (const raw of raws) {
      try {
        const analyzed = await this.analyzeRawItem(raw, userId, providerOverride);
        items.push({ raw, analyzed });

        if (analyzed.isLead) {
          leads++;
        } else {
          nonLeads++;
        }
      } catch (error) {
        items.push({ raw, analyzed: null, error: error.message });
        errors++;
      }
    }

    return {
      total: raws.length,
      analyzed: raws.length - errors,
      leads,
      nonLeads,
      errors,
      items,
    };
  }

  // ============================================
  // PRIVATE: LLM INTERACTION
  // ============================================

  /**
   * Construire le prompt d'analyse pour le LLM
   */
  private buildAnalysisPrompt(raw: RawScrapedItem): string {
    return `Analyse ce texte immobilier et extrait les informations en JSON.

SOURCE: ${raw.source}
${raw.title ? `TITRE: ${raw.title}` : ''}
${raw.authorName ? `AUTEUR: ${raw.authorName}` : ''}
${raw.publishedAt ? `DATE: ${raw.publishedAt}` : ''}

TEXTE:
"""
${raw.text}
"""

Retourne UNIQUEMENT un JSON valide avec cette structure:
{
  "isLead": boolean,
  "leadType": "mandat" | "requete" | "inconnu",
  "firstName": string | null,
  "lastName": string | null,
  "email": string | null,
  "phone": string | null,
  "city": string | null,
  "country": string | null,
  "budget": {
    "min": number | null,
    "max": number | null,
    "currency": "TND" | null
  },
  "propertyTypes": string[],
  "intention": "acheter" | "louer" | "vendre" | "investir" | "inconnu",
  "urgency": "basse" | "moyenne" | "haute" | "inconnu",
  "surfaceM2": number | null,
  "rooms": number | null,
  "seriousnessScore": number (0-100),
  "notes": string
}`;
  }

  /**
   * Parser la reponse du LLM
   */
  private parseAnalysisResponse(response: any, raw: RawScrapedItem): LLMAnalyzedLead {
    return {
      isLead: response.isLead ?? false,
      leadType: response.leadType || 'inconnu',
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      phone: response.phone,
      city: response.city,
      country: response.country,
      budget: response.budget,
      propertyTypes: response.propertyTypes || [],
      intention: response.intention || 'inconnu',
      urgency: response.urgency || 'inconnu',
      surfaceM2: response.surfaceM2,
      rooms: response.rooms,
      seriousnessScore: response.seriousnessScore ?? 50,
      notes: response.notes,
    };
  }

  // ============================================
  // PRIVATE: EXTRACTION PAR REGLES (FALLBACK)
  // ============================================

  /**
   * Analyse basee sur des regles (fallback si pas de LLM)
   */
  private analyzeWithRules(raw: RawScrapedItem): LLMAnalyzedLead {
    const text = raw.text.toLowerCase();
    const textOriginal = raw.text;

    // Detecter le type de lead
    const leadType = this.detectLeadTypeFromText(text);
    const isLead = leadType !== 'inconnu';

    // Extraire le contact
    const email = this.extractEmail(textOriginal);
    const phone = this.extractPhone(textOriginal);
    const { firstName, lastName } = this.extractName(textOriginal, raw.authorName);

    // Extraire la localisation
    const city = this.extractCity(text);

    // Extraire le budget
    const budget = this.extractBudget(text);

    // Extraire les types de biens
    const propertyTypes = this.extractPropertyTypes(text);

    // Extraire surface et pieces
    const surfaceM2 = this.extractSurface(text);
    const rooms = this.extractRooms(text);

    // Detecter l'intention
    const intention = this.detectIntention(text);

    // Detecter l'urgence
    const urgency = this.detectUrgency(text);

    // Calculer le score de serieux
    const seriousnessScore = this.calculateSeriousnessScore({
      hasEmail: !!email,
      hasPhone: !!phone,
      hasName: !!(firstName || lastName),
      hasBudget: !!(budget.min || budget.max),
      hasCity: !!city,
      hasPropertyType: propertyTypes.length > 0,
      textLength: text.length,
    });

    return {
      isLead,
      leadType,
      firstName,
      lastName,
      email,
      phone,
      city,
      country: 'Tunisie',
      budget: {
        min: budget.min,
        max: budget.max,
        currency: 'TND',
      },
      propertyTypes,
      intention,
      urgency,
      surfaceM2,
      rooms,
      seriousnessScore,
      notes: `Analyse automatique par regles - Source: ${raw.source}`,
    };
  }

  // ============================================
  // PRIVATE: EXTRACTEURS
  // ============================================

  private extractEmail(text: string): string | undefined {
    const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match?.[0];
  }

  private extractPhone(text: string): string | undefined {
    // Patterns pour les numeros tunisiens
    const patterns = [
      /(?:\+216|00216)?[\s.-]?[2579]\d[\s.-]?\d{3}[\s.-]?\d{3}/,
      /(?:\+216|00216)?[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return undefined;
  }

  private extractName(
    text: string,
    authorName?: string,
  ): { firstName?: string; lastName?: string } {
    // Utiliser le nom de l'auteur si disponible
    if (authorName) {
      const parts = authorName.trim().split(/\s+/);
      if (parts.length >= 2) {
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
      }
      return { firstName: authorName, lastName: undefined };
    }

    // Essayer d'extraire du texte
    const namePattern = /(?:M\.|Mme|Mr|Mrs|Monsieur|Madame)?\s*([A-Z][a-z]+)\s+([A-Z][a-z]+)/;
    const match = text.match(namePattern);
    if (match) {
      return { firstName: match[1], lastName: match[2] };
    }

    return { firstName: undefined, lastName: undefined };
  }

  private extractCity(text: string): string | undefined {
    const tunisianCities = [
      'tunis',
      'la marsa',
      'carthage',
      'sidi bou said',
      'gammarth',
      'ariana',
      'la soukra',
      'raoued',
      'menzah',
      'ennasr',
      'lac',
      'sousse',
      'monastir',
      'mahdia',
      'sfax',
      'gabes',
      'bizerte',
      'nabeul',
      'hammamet',
      'kelibia',
      'djerba',
      'zarzis',
      'medenine',
      'kairouan',
      'kasserine',
      'gafsa',
      'tozeur',
      'beja',
      'jendouba',
      'le kef',
      'siliana',
      'zaghouan',
      'ben arous',
      'manouba',
    ];

    const textLower = text.toLowerCase();

    for (const city of tunisianCities) {
      if (textLower.includes(city)) {
        // Capitaliser correctement
        return city
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    return undefined;
  }

  private extractBudget(text: string): { min?: number; max?: number } {
    const budget: { min?: number; max?: number } = {};

    // Patterns pour les prix
    const patterns = [
      // "200 000 - 300 000 TND" ou "200000-300000"
      /(\d{1,3}[\s,.]?\d{3})\s*(?:-|a|à)\s*(\d{1,3}[\s,.]?\d{3})/i,
      // "budget: 250 000" ou "prix: 250000"
      /(?:budget|prix|cout)[\s:]*(\d{1,3}[\s,.]?\d{3})/i,
      // "250k" ou "250 k"
      /(\d{2,3})\s*k/i,
      // Simple nombre > 10000
      /(\d{3,}[\s,.]?\d{3})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (match[2]) {
          // Range
          budget.min = this.parsePrice(match[1]);
          budget.max = this.parsePrice(match[2]);
        } else {
          // Single value
          const value = this.parsePrice(match[1]);
          if (value) {
            budget.min = value * 0.9;
            budget.max = value * 1.1;
          }
        }
        break;
      }
    }

    return budget;
  }

  private parsePrice(str: string): number | undefined {
    const cleaned = str.replace(/[\s,.]/g, '');
    const num = parseInt(cleaned, 10);

    // Si c'est en milliers (ex: "250k")
    if (num < 1000 && str.toLowerCase().includes('k')) {
      return num * 1000;
    }

    return num > 0 ? num : undefined;
  }

  private extractPropertyTypes(text: string): string[] {
    const types: string[] = [];
    const typeKeywords: Record<string, string[]> = {
      appartement: ['appartement', 'appart', 'apt'],
      studio: ['studio', 's+0'],
      duplex: ['duplex'],
      triplex: ['triplex'],
      maison: ['maison'],
      villa: ['villa'],
      terrain: ['terrain', 'parcelle'],
      'local commercial': ['local commercial', 'commerce', 'boutique'],
      bureau: ['bureau', 'office'],
      immeuble: ['immeuble'],
      ferme: ['ferme', 'agricole'],
    };

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          if (!types.includes(type)) {
            types.push(type);
          }
          break;
        }
      }
    }

    return types;
  }

  private extractSurface(text: string): number | undefined {
    // Patterns: "120m2", "120 m2", "120 m²", "120 metres"
    const patterns = [
      /(\d{2,4})\s*m[2²]/i,
      /(\d{2,4})\s*metres?\s*carres?/i,
      /surface[\s:]*(\d{2,4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return undefined;
  }

  private extractRooms(text: string): number | undefined {
    // Patterns: "S+2", "3 pieces", "4 chambres"
    const patterns = [/s\+(\d)/i, /(\d)\s*pi[eè]ces?/i, /(\d)\s*chambres?/i];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1], 10);
      }
    }

    return undefined;
  }

  private detectLeadTypeFromText(text: string): 'mandat' | 'requete' | 'inconnu' {
    const mandatKeywords = [
      'a vendre',
      'à vendre',
      'vends',
      'je vends',
      'a louer',
      'à louer',
      'loue',
      'je loue',
      'proprietaire',
      'propriétaire',
      'cede',
      'cède',
      'mise en vente',
      'offre',
      'propose',
    ];

    const requeteKeywords = [
      'cherche',
      'recherche',
      'je cherche',
      'besoin',
      'souhaite',
      'interesse',
      'intéressé',
      'acheter',
      'acquerir',
      'acquérir',
      'louer un',
      'prendre en location',
    ];

    for (const keyword of mandatKeywords) {
      if (text.includes(keyword)) return 'mandat';
    }

    for (const keyword of requeteKeywords) {
      if (text.includes(keyword)) return 'requete';
    }

    return 'inconnu';
  }

  private detectIntention(text: string): 'acheter' | 'louer' | 'vendre' | 'investir' | 'inconnu' {
    if (
      text.includes('investir') ||
      text.includes('investissement') ||
      text.includes('rendement')
    ) {
      return 'investir';
    }
    if (text.includes('vendre') || text.includes('vente') || text.includes('cede')) {
      return 'vendre';
    }
    if (text.includes('louer') || text.includes('location') || text.includes('loyer')) {
      return 'louer';
    }
    if (text.includes('acheter') || text.includes('achat') || text.includes('acquerir')) {
      return 'acheter';
    }
    return 'inconnu';
  }

  private detectUrgency(text: string): 'basse' | 'moyenne' | 'haute' | 'inconnu' {
    const highUrgencyKeywords = [
      'urgent',
      'tres urgent',
      'très urgent',
      'rapidement',
      'immediatement',
      'immédiatement',
      'asap',
      'vite',
      'des que possible',
      'dès que possible',
    ];

    const mediumUrgencyKeywords = [
      'bientot',
      'bientôt',
      'prochainement',
      'dans les semaines',
      'ce mois',
    ];

    for (const keyword of highUrgencyKeywords) {
      if (text.includes(keyword)) return 'haute';
    }

    for (const keyword of mediumUrgencyKeywords) {
      if (text.includes(keyword)) return 'moyenne';
    }

    return 'inconnu';
  }

  private calculateSeriousnessScore(factors: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasName: boolean;
    hasBudget: boolean;
    hasCity: boolean;
    hasPropertyType: boolean;
    textLength: number;
  }): number {
    let score = 20; // Score de base

    if (factors.hasEmail) score += 20;
    if (factors.hasPhone) score += 20;
    if (factors.hasName) score += 10;
    if (factors.hasBudget) score += 15;
    if (factors.hasCity) score += 10;
    if (factors.hasPropertyType) score += 5;

    // Bonus pour un texte detaille
    if (factors.textLength > 100) score += 5;
    if (factors.textLength > 300) score += 5;

    return Math.min(score, 100);
  }

  // ============================================
  // PRIVATE: VALIDATION
  // ============================================

  /**
   * Valider un lead analyse
   */
  private validateLead(analyzed: LLMAnalyzedLead): ValidationResult {
    const flags = {
      hasValidEmail: this.isValidEmail(analyzed.email),
      hasValidPhone: this.isValidPhone(analyzed.phone),
      hasName: !!(analyzed.firstName || analyzed.lastName),
      hasBudget: !!(analyzed.budget?.min || analyzed.budget?.max),
      hasLocation: !!analyzed.city,
      isSpam: this.isSpam(analyzed),
      isDuplicate: false, // A verifier en base
    };

    const reasons: string[] = [];
    let score = 0;

    // Points positifs
    if (flags.hasValidEmail) {
      score += 25;
    } else if (analyzed.email) {
      reasons.push('Email invalide');
    }

    if (flags.hasValidPhone) {
      score += 25;
    } else if (analyzed.phone) {
      reasons.push('Telephone invalide');
    }

    if (flags.hasName) score += 15;
    if (flags.hasBudget) score += 20;
    if (flags.hasLocation) score += 15;

    // Points negatifs
    if (flags.isSpam) {
      score -= 50;
      reasons.push('Detecte comme spam');
    }

    // Determiner le statut
    let status: ValidationStatus = 'pending';
    if (flags.isSpam || score < 20) {
      status = 'spam';
    } else if (score < 40) {
      status = 'suspicious';
    } else if (score >= 60) {
      status = 'valid';
    }

    return {
      status,
      score: Math.max(0, Math.min(100, score)),
      reasons,
      flags,
    };
  }

  private isValidEmail(email?: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone?: string): boolean {
    if (!phone) return false;
    const cleaned = phone.replace(/[\s.-]/g, '');
    return /^(?:\+216|00216)?[2579]\d{7}$/.test(cleaned);
  }

  private isSpam(analyzed: LLMAnalyzedLead): boolean {
    // Detecter les patterns de spam
    const spamPatterns = [
      /^test\d*@/i,
      /^fake\d*@/i,
      /@mailinator\./i,
      /@tempmail\./i,
      /^0{6,}/,
      /^1234567/,
    ];

    const email = analyzed.email || '';
    const phone = analyzed.phone || '';
    const name = `${analyzed.firstName || ''} ${analyzed.lastName || ''}`.toLowerCase();

    for (const pattern of spamPatterns) {
      if (pattern.test(email) || pattern.test(phone) || pattern.test(name)) {
        return true;
      }
    }

    // Nom trop court ou suspect
    if (name.length > 0 && name.length < 3) return true;
    if (/^[a-z]{1,2}$/.test(name.trim())) return true;

    return false;
  }

  // ============================================
  // PRIVATE: UTILS
  // ============================================

  private normalizePhone(phone?: string): string | undefined {
    if (!phone) return undefined;

    let normalized = phone.replace(/[\s.-]/g, '');

    // Ajouter le prefixe tunisien si absent
    if (normalized.match(/^[2579]\d{7}$/)) {
      normalized = '+216' + normalized;
    } else if (normalized.startsWith('00216')) {
      normalized = '+216' + normalized.substring(5);
    } else if (normalized.startsWith('216')) {
      normalized = '+' + normalized;
    }

    return normalized;
  }

  private calculateGlobalScore(analyzed: LLMAnalyzedLead, validation: ValidationResult): number {
    // Combiner le score de serieux et le score de validation
    const seriousness = analyzed.seriousnessScore || 50;
    const validationScore = validation.score;

    // Moyenne ponderee (serieux: 40%, validation: 60%)
    return Math.round(seriousness * 0.4 + validationScore * 0.6);
  }

  private createMinimalLead(raw: RawScrapedItem, errorMessage: string): ProspectingLeadCreateInput {
    return {
      source: raw.source,
      rawText: raw.text,
      url: raw.url,
      title: raw.title,
      leadType: 'inconnu',
      validationStatus: 'pending',
      score: 0,
      status: 'new',
      metadata: {
        error: errorMessage,
        analyzedAt: new Date().toISOString(),
      },
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
