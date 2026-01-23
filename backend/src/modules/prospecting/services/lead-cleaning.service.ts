import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { LLMRouterService } from '../../intelligence/llm-config/llm-router.service';

/**
 * Tunisian cities mapping for normalization
 */
const TUNISIAN_CITIES: Record<string, string> = {
  // Capital
  'tunis': 'Tunis',
  'tunisie': 'Tunis',
  // La Marsa & variants
  'la marsa': 'La Marsa',
  'lamarsa': 'La Marsa',
  'marsa': 'La Marsa',
  // Sousse & variants
  'sousse': 'Sousse',
  'souse': 'Sousse',
  'souss': 'Sousse',
  // Sfax & variants
  'sfax': 'Sfax',
  'safax': 'Sfax',
  // Hammamet & variants
  'hammamet': 'Hammamet',
  'hamamet': 'Hammamet',
  // Nabeul & variants
  'nabeul': 'Nabeul',
  'nabul': 'Nabeul',
  // Monastir
  'monastir': 'Monastir',
  // Mahdia
  'mahdia': 'Mahdia',
  // Bizerte
  'bizerte': 'Bizerte',
  'bizert': 'Bizerte',
  // Gabes
  'gabes': 'Gabès',
  'gabès': 'Gabès',
  // Kairouan
  'kairouan': 'Kairouan',
  // Ariana
  'ariana': 'Ariana',
  'l\'ariana': 'Ariana',
  // Ben Arous
  'ben arous': 'Ben Arous',
  'benarous': 'Ben Arous',
  // Manouba
  'manouba': 'Manouba',
  'la manouba': 'Manouba',
  // Sidi Bou Said
  'sidi bou said': 'Sidi Bou Said',
  'sidi bousaid': 'Sidi Bou Said',
  // Carthage
  'carthage': 'Carthage',
  // Gammarth
  'gammarth': 'Gammarth',
  // Les Berges du Lac
  'lac': 'Les Berges du Lac',
  'berges du lac': 'Les Berges du Lac',
  'les berges du lac': 'Les Berges du Lac',
  // El Menzah
  'el menzah': 'El Menzah',
  'menzah': 'El Menzah',
  // El Manar
  'el manar': 'El Manar',
  'manar': 'El Manar',
  // Ennasr
  'ennasr': 'Ennasr',
  'nasr': 'Ennasr',
};

/**
 * Common email typo corrections
 */
const EMAIL_TYPO_CORRECTIONS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
};

export interface CleaningResult {
  leadId: string;
  success: boolean;
  changes: {
    field: string;
    before: any;
    after: any;
  }[];
  qualityScoreBefore: number;
  qualityScoreAfter: number;
  errors?: string[];
}

export interface BatchCleaningResult {
  total: number;
  successful: number;
  failed: number;
  results: CleaningResult[];
  averageScoreImprovement: number;
}

@Injectable()
export class LeadCleaningService {
  private readonly logger = new Logger(LeadCleaningService.name);

  constructor(
    private prisma: PrismaService,
    private llmRouter: LLMRouterService,
  ) { }

  /**
   * Clean a single lead with data normalization and AI enrichment
   */
  async cleanLead(userId: string, leadId: string): Promise<CleaningResult> {
    this.logger.log(`Cleaning lead ${leadId} for user ${userId}`);

    const lead = await this.prisma.prospecting_leads.findFirst({
      where: { id: leadId, userId },
    });

    if (!lead) {
      return {
        leadId,
        success: false,
        changes: [],
        qualityScoreBefore: 0,
        qualityScoreAfter: 0,
        errors: ['Lead not found'],
      };
    }

    const changes: { field: string; before: any; after: any }[] = [];
    const qualityScoreBefore = this.calculateDataQualityScore(lead);
    const updates: Record<string, any> = {};

    // 1. Normalize city names (Tunisian focus)
    if (lead.city) {
      const normalizedCity = this.normalizeCity(lead.city);
      if (normalizedCity !== lead.city) {
        changes.push({ field: 'city', before: lead.city, after: normalizedCity });
        updates.city = normalizedCity;
      }
    }

    // 2. Fix email typos
    if (lead.email) {
      const fixedEmail = this.fixEmailTypos(lead.email);
      if (fixedEmail !== lead.email) {
        changes.push({ field: 'email', before: lead.email, after: fixedEmail });
        updates.email = fixedEmail;
      }
    }

    // 3. Normalize phone to E.164 format
    if (lead.phone) {
      const normalizedPhone = this.normalizePhoneE164(lead.phone);
      if (normalizedPhone !== lead.phone) {
        changes.push({ field: 'phone', before: lead.phone, after: normalizedPhone });
        updates.phone = normalizedPhone;
      }
    }

    // 4. Extract data from rawText using AI if available
    if (lead.rawText && (!lead.city || !lead.budgetMin || !lead.propertyTypes?.length)) {
      try {
        const enrichedData = await this.enrichFromRawText(userId, lead.rawText);

        if (enrichedData.city && !lead.city) {
          const normalizedCity = this.normalizeCity(enrichedData.city);
          changes.push({ field: 'city', before: null, after: normalizedCity });
          updates.city = normalizedCity;
        }

        if (enrichedData.budgetMin && !lead.budgetMin) {
          changes.push({ field: 'budgetMin', before: null, after: enrichedData.budgetMin });
          updates.budgetMin = enrichedData.budgetMin;
        }

        if (enrichedData.budgetMax && !lead.budgetMax) {
          changes.push({ field: 'budgetMax', before: null, after: enrichedData.budgetMax });
          updates.budgetMax = enrichedData.budgetMax;
        }

        if (enrichedData.propertyTypes?.length && !lead.propertyTypes?.length) {
          changes.push({ field: 'propertyTypes', before: null, after: enrichedData.propertyTypes });
          updates.propertyTypes = enrichedData.propertyTypes;
        }

        if (enrichedData.surfaceM2 && !lead.surfaceM2) {
          changes.push({ field: 'surfaceM2', before: null, after: enrichedData.surfaceM2 });
          updates.surfaceM2 = enrichedData.surfaceM2;
        }
      } catch (error) {
        this.logger.warn(`AI enrichment failed for lead ${leadId}: ${error.message}`);
      }
    }

    // 5. Normalize name fields
    if (lead.firstName) {
      const normalizedFirstName = this.capitalizeName(lead.firstName);
      if (normalizedFirstName !== lead.firstName) {
        changes.push({ field: 'firstName', before: lead.firstName, after: normalizedFirstName });
        updates.firstName = normalizedFirstName;
      }
    }

    if (lead.lastName) {
      const normalizedLastName = this.capitalizeName(lead.lastName);
      if (normalizedLastName !== lead.lastName) {
        changes.push({ field: 'lastName', before: lead.lastName, after: normalizedLastName });
        updates.lastName = normalizedLastName;
      }
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      updates.validated = true;
      updates.updatedAt = new Date();

      await this.prisma.prospecting_leads.update({
        where: { id: leadId },
        data: updates,
      });
    }

    // Calculate new quality score
    const updatedLead = { ...lead, ...updates };
    const qualityScoreAfter = this.calculateDataQualityScore(updatedLead);

    return {
      leadId,
      success: true,
      changes,
      qualityScoreBefore,
      qualityScoreAfter,
    };
  }

  /**
   * Clean a batch of leads (optimized for 5 leads per LLM call)
   */
  async cleanLeadsBatch(userId: string, leadIds: string[]): Promise<BatchCleaningResult> {
    this.logger.log(`Cleaning batch of ${leadIds.length} leads for user ${userId}`);

    const results: CleaningResult[] = [];
    let successful = 0;
    let failed = 0;
    let totalScoreImprovement = 0;

    // Process in chunks of 5 for LLM efficiency
    const chunkSize = 5;
    for (let i = 0; i < leadIds.length; i += chunkSize) {
      const chunk = leadIds.slice(i, i + chunkSize);

      // Process chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(leadId => this.cleanLead(userId, leadId))
      );

      for (const result of chunkResults) {
        results.push(result);
        if (result.success) {
          successful++;
          totalScoreImprovement += result.qualityScoreAfter - result.qualityScoreBefore;
        } else {
          failed++;
        }
      }
    }

    return {
      total: leadIds.length,
      successful,
      failed,
      results,
      averageScoreImprovement: successful > 0 ? totalScoreImprovement / successful : 0,
    };
  }

  /**
   * Clean all leads in a campaign
   */
  async cleanCampaignLeads(userId: string, campaignId: string): Promise<BatchCleaningResult> {
    this.logger.log(`Cleaning all leads in campaign ${campaignId}`);

    const leads = await this.prisma.prospecting_leads.findMany({
      where: {
        userId,
        campaignId,
        spam: false,
      },
      select: { id: true },
    });

    const leadIds = leads.map(l => l.id);
    return this.cleanLeadsBatch(userId, leadIds);
  }

  /**
   * Calculate data quality score (0-100)
   */
  calculateDataQualityScore(lead: any): number {
    let score = 0;
    const maxScore = 100;

    // Name presence (15 points)
    if (lead.firstName) score += 8;
    if (lead.lastName) score += 7;

    // Contact info (25 points)
    if (lead.email && this.isValidEmail(lead.email)) score += 15;
    if (lead.phone && this.isValidPhone(lead.phone)) score += 10;

    // Location (15 points)
    if (lead.city) score += 10;
    if (lead.country) score += 5;

    // Property criteria (25 points)
    if (lead.propertyTypes?.length > 0) score += 10;
    if (lead.budgetMin || lead.budgetMax) score += 10;
    if (lead.surfaceM2 || lead.surfaceMin) score += 5;

    // Lead classification (10 points)
    if (lead.leadType && lead.leadType !== 'inconnu') score += 5;
    if (lead.intention && lead.intention !== 'inconnu') score += 5;

    // Urgency and seriousness (10 points)
    if (lead.urgency && lead.urgency !== 'inconnu') score += 5;
    if (lead.seriousnessScore && lead.seriousnessScore > 50) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * Normalize city name (Tunisian focus)
   */
  private normalizeCity(city: string): string {
    const normalized = city.toLowerCase().trim();
    return TUNISIAN_CITIES[normalized] || this.capitalizeName(city);
  }

  /**
   * Fix common email typos
   */
  private fixEmailTypos(email: string): string {
    const parts = email.toLowerCase().trim().split('@');
    if (parts.length !== 2) return email;

    const domain = EMAIL_TYPO_CORRECTIONS[parts[1]] || parts[1];
    return `${parts[0]}@${domain}`;
  }

  /**
   * Normalize phone number to E.164 format (Tunisia focus)
   */
  private normalizePhoneE164(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Handle Tunisian numbers
    if (cleaned.startsWith('00216')) {
      cleaned = '+216' + cleaned.slice(5);
    } else if (cleaned.startsWith('216') && !cleaned.startsWith('+')) {
      cleaned = '+216' + cleaned.slice(3);
    } else if (cleaned.startsWith('0') && cleaned.length === 9) {
      // Tunisian local format (0XX XXX XXX)
      cleaned = '+216' + cleaned.slice(1);
    } else if (cleaned.length === 8 && /^[2-9]/.test(cleaned)) {
      // Tunisian mobile without prefix
      cleaned = '+216' + cleaned;
    }

    // Handle French numbers
    if (cleaned.startsWith('0033')) {
      cleaned = '+33' + cleaned.slice(4);
    } else if (cleaned.startsWith('33') && !cleaned.startsWith('+')) {
      cleaned = '+33' + cleaned.slice(2);
    }

    return cleaned;
  }

  /**
   * Capitalize name properly
   */
  private capitalizeName(name: string): string {
    return name
      .trim()
      .split(/[\s-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate phone format
   */
  private isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return cleaned.length >= 8 && cleaned.length <= 15;
  }

  /**
   * Enrich lead data from raw text using AI
   */
  private async enrichFromRawText(
    userId: string,
    rawText: string,
  ): Promise<{
    city?: string;
    budgetMin?: number;
    budgetMax?: number;
    propertyTypes?: string[];
    surfaceM2?: number;
  }> {
    try {
      // Get LLM provider for data cleaning
      const provider = await this.llmRouter.selectBestProvider(userId, 'data_cleaning');

      const prompt = `Analyse ce texte immobilier tunisien et extrait les informations structurées.
Texte: "${rawText}"

Retourne UNIQUEMENT un JSON valide avec ces champs (laisse null si non trouvé):
{
  "city": "nom de la ville/quartier en Tunisie",
  "budgetMin": nombre en dinars tunisiens,
  "budgetMax": nombre en dinars tunisiens,
  "propertyTypes": ["appartement", "villa", "studio", "local commercial", etc.],
  "surfaceM2": nombre en mètres carrés
}

Exemples de villes: Tunis, La Marsa, Sousse, Sfax, Hammamet, Ariana, Lac, Menzah, Ennasr
Note: 1 milliard DT = 1,000,000,000 DT. Convertis les prix en DT si nécessaire.`;

      const response = await provider.generate(prompt, {
        maxTokens: 500,
        temperature: 0.1,
      });

      // Parse the JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          city: parsed.city || undefined,
          budgetMin: parsed.budgetMin ? Number(parsed.budgetMin) : undefined,
          budgetMax: parsed.budgetMax ? Number(parsed.budgetMax) : undefined,
          propertyTypes: parsed.propertyTypes?.length ? parsed.propertyTypes : undefined,
          surfaceM2: parsed.surfaceM2 ? Number(parsed.surfaceM2) : undefined,
        };
      }
    } catch (error) {
      this.logger.warn(`AI enrichment failed: ${error.message}`);
    }

    return {};
  }
}
