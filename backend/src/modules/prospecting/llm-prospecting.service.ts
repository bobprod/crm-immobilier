import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import axios from 'axios';
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
  ) {}

  // ============================================
  // 1) ANALYSE UN ELEMENT BRUT SCRAPPE
  // ============================================

  /**
   * Analyse un element brut scrappe et retourne les infos extraites par le LLM
   */
  async analyzeRawItem(raw: RawScrapedItem): Promise<LLMAnalyzedLead> {
    this.logger.log(`Analyzing raw item from source: ${raw.source}`);

    try {
      const llmConfig = await this.getLLMConfig();

      if (!llmConfig?.apiKey) {
        this.logger.warn('LLM not configured, using rule-based extraction');
        return this.analyzeWithRules(raw);
      }

      const userPrompt = this.buildAnalysisPrompt(raw);
      const response = await this.callLLM(llmConfig, userPrompt);

      return this.parseAnalysisResponse(response, raw);
    } catch (error) {
      this.logger.error(`LLM analysis failed: ${error.message}`);
      // Fallback sur l'extraction par regles
      return this.analyzeWithRules(raw);
    }
  }

  // ============================================
  // 2) TRANSFORME RAW → PROSPECTING LEAD
  // ============================================

  /**
   * Transforme un RawScrapedItem directement en ProspectingLead pret a etre insere en BDD
   */
  async buildProspectingLeadFromRaw(raw: RawScrapedItem): Promise<ProspectingLeadCreateInput> {
    // 1. Analyser avec le LLM
    const analyzed = await this.analyzeRawItem(raw);

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
   */
  async buildProspectingLeadsFromRawBatch(
    raws: RawScrapedItem[],
    config?: AnalysisConfig,
  ): Promise<ProspectingLeadCreateInput[]> {
    const batchSize = config?.batchSize || 5;
    const results: ProspectingLeadCreateInput[] = [];

    this.logger.log(`Processing batch of ${raws.length} items (batch size: ${batchSize})`);

    // Traiter par lots pour eviter de surcharger l'API
    for (let i = 0; i < raws.length; i += batchSize) {
      const batch = raws.slice(i, i + batchSize);

      const batchPromises = batch.map(async (raw) => {
        try {
          return await this.buildProspectingLeadFromRaw(raw);
        } catch (error) {
          this.logger.error(`Failed to process item: ${error.message}`);
          // Retourner un lead minimal en cas d'erreur
          return this.createMinimalLead(raw, error.message);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Petit delai entre les batches
      if (i + batchSize < raws.length) {
        await this.sleep(500);
      }
    }

    return results;
  }

  /**
   * Analyse un batch et retourne des statistiques detaillees
   */
  async analyzeBatch(
    raws: RawScrapedItem[],
    config?: AnalysisConfig,
  ): Promise<BatchAnalysisResult> {
    const items: BatchAnalysisResult['items'] = [];
    let leads = 0;
    let nonLeads = 0;
    let errors = 0;

    for (const raw of raws) {
      try {
        const analyzed = await this.analyzeRawItem(raw);
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
   * Recuperer la configuration LLM depuis les settings
   */
  private async getLLMConfig(): Promise<any> {
    // D'abord essayer les variables d'environnement
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    if (openaiKey) {
      return {
        provider: 'openai',
        apiKey: openaiKey,
        model: this.configService.get('OPENAI_MODEL') || 'gpt-4o-mini',
        endpoint: 'https://api.openai.com/v1/chat/completions',
      };
    }

    const anthropicKey = this.configService.get('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      return {
        provider: 'anthropic',
        apiKey: anthropicKey,
        model: this.configService.get('ANTHROPIC_MODEL') || 'claude-3-haiku-20240307',
        endpoint: 'https://api.anthropic.com/v1/messages',
      };
    }

    // Essayer de recuperer depuis la base de donnees
    try {
      const settings = await this.prisma.settings.findFirst({
        where: { key: 'llm_config' },
      });
      if (settings?.value) {
        return typeof settings.value === 'string' ? JSON.parse(settings.value) : settings.value;
      }
    } catch {
      // Ignore
    }

    return null;
  }

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
   * Appeler le LLM (OpenAI ou Anthropic)
   */
  private async callLLM(config: any, userPrompt: string): Promise<any> {
    if (config.provider === 'anthropic') {
      return this.callAnthropic(config, userPrompt);
    }
    return this.callOpenAI(config, userPrompt);
  }

  private async callOpenAI(config: any, userPrompt: string): Promise<any> {
    const response = await axios.post(
      config.endpoint,
      {
        model: config.model,
        messages: [
          { role: 'system', content: this.ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  }

  private async callAnthropic(config: any, userPrompt: string): Promise<any> {
    const response = await axios.post(
      config.endpoint,
      {
        model: config.model,
        max_tokens: 1000,
        system: this.ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      },
      {
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      },
    );

    const content = response.data.content[0].text;
    // Extraire le JSON du texte
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
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
