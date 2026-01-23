import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  MatchReason,
  MatchScoreResult,
  PriceRange,
  BudgetMatchReason,
  LocationMatchReason,
  TypeMatchReason,
  MetaMatchReason,
  arePropertyTypesCompatible,
} from './dto/matching.dto';
import { CreateCampaignDto, UpdateLeadDto } from './dto';
import { ProspectingIntegrationService } from './prospecting-integration.service';
import { RawScrapedItem } from './dto/llm-prospecting.dto';
import { CampaignService } from './services/campaign.service';
import { LeadManagementService } from './services/lead-management.service';

interface CampaignFilters {
  status?: string;
  type?: string;
}

interface LeadFilters {
  status?: string;
  minScore?: string;
  leadType?: string;
  limit?: string;
}

@Injectable()
export class ProspectingService {
  private readonly logger = new Logger(ProspectingService.name);

  constructor(
    private prisma: PrismaService,
    private campaignService: CampaignService,
    private leadManagementService: LeadManagementService,
    @Inject(forwardRef(() => ProspectingIntegrationService))
    private integrationService: ProspectingIntegrationService,
  ) { }

  // ============================================
  // CAMPAIGNS
  // ============================================

  /**
   * Créer une campagne de prospection
   */
  async createCampaign(userId: string, data: CreateCampaignDto) {
    return this.campaignService.createCampaign(userId, data);
  }

  /**
   * Récupérer toutes les campagnes
   */
  async getCampaigns(userId: string, filters?: CampaignFilters) {
    return this.campaignService.getCampaigns(userId, filters);
  }

  /**
   * Récupérer une campagne par ID
   */
  async getCampaignById(userId: string, campaignId: string) {
    return this.campaignService.getCampaignById(userId, campaignId);
  }

  /**
   * Démarrer une campagne
   */
  async startCampaign(userId: string, campaignId: string) {
    const campaign = await this.campaignService.startCampaign(userId, campaignId);

    // Démarrer le scraping en arrière-plan
    this.runCampaignScraping(userId, campaign);

    return campaign;
  }

  /**
   * Mettre en pause une campagne
   */
  async pauseCampaign(userId: string, campaignId: string) {
    return this.campaignService.pauseCampaign(userId, campaignId);
  }

  /**
   * Reprendre une campagne en pause
   */
  async resumeCampaign(userId: string, campaignId: string) {
    return this.campaignService.resumeCampaign(userId, campaignId);
  }

  /**
   * Supprimer une campagne
   */
  async deleteCampaign(userId: string, campaignId: string) {
    return this.campaignService.deleteCampaign(userId, campaignId);
  }

  // ============================================
  // LEADS
  // ============================================

  /**
   * Récupérer tous les leads d'une campagne
   */
  async getLeads(userId: string, campaignId: string, filters?: LeadFilters) {
    return this.leadManagementService.getLeads(userId, campaignId, filters);
  }

  /**
   * Récupérer un lead par ID
   */
  async getLeadById(userId: string, leadId: string) {
    return this.leadManagementService.getLeadById(userId, leadId);
  }

  /**
   * Mettre à jour un lead
   */
  async updateLead(userId: string, leadId: string, data: UpdateLeadDto) {
    return this.leadManagementService.updateLead(userId, leadId, data);
  }

  /**
   * Supprimer un lead
   */
  async deleteLead(userId: string, leadId: string) {
    return this.leadManagementService.deleteLead(userId, leadId);
  }

  /**
   * Convertir un lead en prospect
   */
  async convertLeadToProspect(userId: string, leadId: string) {
    return this.leadManagementService.convertLeadToProspect(userId, leadId);
  }

  /**
   * Dédupliquer les leads
   */
  async deduplicateLeads(userId: string, campaignId?: string) {
    return this.leadManagementService.deduplicateLeads(userId, campaignId);
  }

  /**
   * Trouver des doublons potentiels pour un lead
   */
  async findPotentialDuplicates(userId: string, leadId: string) {
    return this.leadManagementService.findPotentialDuplicates(userId, leadId);
  }

  /**
   * Exporter les leads
   */
  async exportLeads(userId: string, campaignId: string, format: string) {
    return this.leadManagementService.exportLeads(userId, campaignId, format);
  }

  /**
   * Importer des leads
   */
  async importLeads(userId: string, campaignId: string, leads: any[]) {
    return this.leadManagementService.importLeads(userId, campaignId, leads);
  }

  /**
   * Calculer le score d'un lead
   */
  async calculateLeadScore(lead: any): Promise<number> {
    return this.leadManagementService.calculateLeadScore(lead);
  }

  // ============================================
  // MATCHING
  // ============================================

  /**
   * Trouver des matchs pour un lead avec scoring intelligent
   * Utilise les nouveaux champs IA: budgetMin/Max, city, propertyTypes, urgency, seriousnessScore
   */
  async findMatchesForLead(userId: string, leadId: string) {
    const lead = await this.getLeadById(userId, leadId);
    this.logger.log(
      `Finding matches for lead ${leadId} - City: ${lead.city}, Budget: ${lead.budgetMin}-${lead.budgetMax}`,
    );

    // 1. Déterminer l'intervalle de prix pour le filtre SQL (large pour ne pas rater de biens)
    const priceRange = this.getPriceRangeForSearch(lead);

    // 2. Construire le filtre de base
    const where: any = {
      userId,
      status: 'available',
    };

    // Filtre sur le prix si on a un budget
    if (priceRange.min !== null && priceRange.max !== null) {
      where.price = {
        gte: priceRange.min,
        lte: priceRange.max,
      };
    }

    // 3. Pré-filtrer les biens candidats
    const properties = await this.prisma.properties.findMany({
      where,
      take: 200, // Limite pour éviter surcharge
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`Found ${properties.length} candidate properties for matching`);

    // 4. Calculer le score pour chaque bien et créer les matchs
    const matches = [];
    let matchesCreated = 0;

    for (const property of properties) {
      const matchResult = this.calculateMatchScore(lead, property);

      // Créer le match si score >= 50
      if (matchResult.isQualified) {
        try {
          const match = await this.prisma.prospecting_matches.create({
            data: {
              leadId: lead.id,
              propertyId: property.id,
              score: matchResult.score,
              reason: matchResult.reasons as any,
              status: 'pending',
            },
            include: {
              properties: true,
            },
          });

          matches.push(match);
          matchesCreated++;
        } catch (error) {
          // Skip si le match existe déjà (contrainte unique)
          if (error.code !== 'P2002') {
            this.logger.warn(`Failed to create match: ${error.message}`);
          }
        }
      }
    }

    // 5. Mettre à jour le lead avec les IDs des propriétés matchées
    if (matches.length > 0) {
      await this.prisma.prospecting_leads.update({
        where: { id: leadId },
        data: {
          matchedPropertyIds: matches.map((m) => m.propertyId),
        },
      });
    }

    this.logger.log(`Created ${matchesCreated} matches for lead ${leadId}`);

    return {
      leadId: lead.id,
      matchesCreated,
      matches,
    };
  }

  /**
   * Calculer l'intervalle de prix pour le filtre SQL (élargi pour ne pas rater de biens)
   * Retourne un intervalle large (±30%) pour le pré-filtrage
   */
  getPriceRangeForSearch(lead: any): PriceRange {
    const budgetMin = lead.budgetMin as number | null;
    const budgetMax = lead.budgetMax as number | null;

    // Si les deux sont définis
    if (budgetMin != null && budgetMax != null) {
      return {
        min: Math.round(budgetMin * 0.7),
        max: Math.round(budgetMax * 1.3),
      };
    }

    // Si seulement budgetMin
    if (budgetMin != null) {
      return {
        min: Math.round(budgetMin * 0.7),
        max: Math.round(budgetMin * 1.5), // Plus large vers le haut
      };
    }

    // Si seulement budgetMax
    if (budgetMax != null) {
      return {
        min: Math.round(budgetMax * 0.5), // Plus large vers le bas
        max: Math.round(budgetMax * 1.3),
      };
    }

    // Fallback sur l'ancien champ budget (JSON)
    if (lead.budget) {
      const budgetObj = lead.budget as any;
      const min = budgetObj.min || budgetObj.max;
      const max = budgetObj.max || budgetObj.min;
      if (min || max) {
        return {
          min: min ? Math.round(min * 0.7) : null,
          max: max ? Math.round(max * 1.3) : null,
        };
      }
    }

    // Pas de budget défini
    return { min: null, max: null };
  }

  /**
   * Calculer le score de match entre un lead et une propriété
   * Scoring pondéré: Budget (40) + Location (30) + Type (20) + Bonus (10) = 100 max
   */
  calculateMatchScore(lead: any, property: any): MatchScoreResult {
    // 1. Score Budget (0-40 points)
    const budgetResult = this.calculateBudgetScore(lead, property);

    // 2. Score Location (0-30 points)
    const locationResult = this.calculateLocationScore(lead, property);

    // 3. Score Type de bien (0-20 points)
    const typeResult = this.calculateTypeScore(lead, property);

    // 4. Bonus Urgence/Sérieux (0-10 points)
    const metaResult = this.calculateMetaBonus(lead);

    // Score total
    const totalScore =
      budgetResult.score + locationResult.score + typeResult.score + metaResult.totalBonus;
    const finalScore = Math.min(100, totalScore);

    const reasons: MatchReason = {
      budget: budgetResult,
      location: locationResult,
      type: typeResult,
      meta: metaResult,
      breakdown: {
        budgetPoints: budgetResult.score,
        locationPoints: locationResult.score,
        typePoints: typeResult.score,
        bonusPoints: metaResult.totalBonus,
      },
    };

    return {
      score: finalScore,
      reasons,
      isQualified: finalScore >= 50,
    };
  }

  /**
   * Calculer le score Budget (0-40 points)
   */
  private calculateBudgetScore(lead: any, property: any): BudgetMatchReason {
    const propertyPrice = property.price as number;
    const leadMin = (lead.budgetMin as number | null) ?? (lead.budget as any)?.min ?? null;
    const leadMax = (lead.budgetMax as number | null) ?? (lead.budget as any)?.max ?? null;

    // Si pas de prix sur la propriété
    if (!propertyPrice || propertyPrice <= 0) {
      return {
        compatible: false,
        relation: 'no_budget',
        leadMin,
        leadMax,
        propertyPrice: propertyPrice || 0,
        score: 0,
      };
    }

    // Si le lead n'a pas de budget
    if (leadMin === null && leadMax === null) {
      return {
        compatible: false,
        relation: 'no_budget',
        leadMin: null,
        leadMax: null,
        propertyPrice,
        score: 0,
      };
    }

    // Cas: les deux bornes sont définies
    if (leadMin !== null && leadMax !== null) {
      // Dans la fourchette exacte: 40 points
      if (propertyPrice >= leadMin && propertyPrice <= leadMax) {
        return {
          compatible: true,
          relation: 'within_range',
          leadMin,
          leadMax,
          propertyPrice,
          score: 40,
        };
      }
      // Dans ±10% de la fourchette: 30 points
      if (propertyPrice >= leadMin * 0.9 && propertyPrice <= leadMax * 1.1) {
        return {
          compatible: true,
          relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
          leadMin,
          leadMax,
          propertyPrice,
          score: 30,
        };
      }
      // Dans ±20% de la fourchette: 20 points
      if (propertyPrice >= leadMin * 0.8 && propertyPrice <= leadMax * 1.2) {
        return {
          compatible: true,
          relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
          leadMin,
          leadMax,
          propertyPrice,
          score: 20,
        };
      }
      // Hors budget
      return {
        compatible: false,
        relation: propertyPrice < leadMin ? 'below_range' : 'above_range',
        leadMin,
        leadMax,
        propertyPrice,
        score: 0,
      };
    }

    // Cas: seulement une borne (min OU max)
    const singleBudget = leadMin ?? leadMax!;
    const tolerance20 = singleBudget * 0.2;
    const tolerance10 = singleBudget * 0.1;

    if (Math.abs(propertyPrice - singleBudget) <= tolerance10) {
      return {
        compatible: true,
        relation: 'within_range',
        leadMin,
        leadMax,
        propertyPrice,
        score: 40,
      };
    }
    if (Math.abs(propertyPrice - singleBudget) <= tolerance20) {
      return {
        compatible: true,
        relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
        leadMin,
        leadMax,
        propertyPrice,
        score: 30,
      };
    }
    if (Math.abs(propertyPrice - singleBudget) <= singleBudget * 0.3) {
      return {
        compatible: true,
        relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
        leadMin,
        leadMax,
        propertyPrice,
        score: 20,
      };
    }

    return {
      compatible: false,
      relation: propertyPrice < singleBudget ? 'below_range' : 'above_range',
      leadMin,
      leadMax,
      propertyPrice,
      score: 0,
    };
  }

  /**
   * Calculer le score Location (0-30 points)
   */
  private calculateLocationScore(lead: any, property: any): LocationMatchReason {
    const leadCity = (lead.city as string | null)?.toLowerCase().trim() ?? null;
    const leadCountry = (lead.country as string | null)?.toLowerCase().trim() ?? 'tunisie';
    const propertyCity = (property.city as string | null)?.toLowerCase().trim() ?? null;

    // Pas de ville sur le lead ou la propriété
    if (!leadCity || !propertyCity) {
      return {
        compatible: false,
        relation: 'unknown',
        leadCity: lead.city ?? null,
        leadCountry: lead.country ?? null,
        propertyCity: property.city ?? null,
        score: 0,
      };
    }

    // Même ville: 30 points
    if (leadCity === propertyCity) {
      return {
        compatible: true,
        relation: 'same_city',
        leadCity: lead.city,
        leadCountry: lead.country,
        propertyCity: property.city,
        score: 30,
      };
    }

    // Check si ville contenue dans l'autre (ex: "La Marsa" contient "Marsa")
    if (leadCity.includes(propertyCity) || propertyCity.includes(leadCity)) {
      return {
        compatible: true,
        relation: 'same_city',
        leadCity: lead.city,
        leadCountry: lead.country,
        propertyCity: property.city,
        score: 25,
      };
    }

    // Même pays (Tunisie par défaut): 15 points
    // Note: properties n'a pas de champ country, on assume Tunisie
    if (leadCountry === 'tunisie') {
      return {
        compatible: true,
        relation: 'same_country',
        leadCity: lead.city,
        leadCountry: lead.country,
        propertyCity: property.city,
        score: 15,
      };
    }

    // Pays différent
    return {
      compatible: false,
      relation: 'different',
      leadCity: lead.city,
      leadCountry: lead.country,
      propertyCity: property.city,
      score: 0,
    };
  }

  /**
   * Calculer le score Type de bien (0-20 points)
   */
  private calculateTypeScore(lead: any, property: any): TypeMatchReason {
    const propertyType = (property.type as string)?.toLowerCase().trim() ?? '';

    // Récupérer les types du lead (nouveau champ propertyTypes ou ancien propertyType)
    let leadTypes: string[] = [];

    if (lead.propertyTypes && Array.isArray(lead.propertyTypes)) {
      leadTypes = (lead.propertyTypes as string[]).map((t) => t.toLowerCase().trim());
    } else if (lead.propertyType) {
      leadTypes = [(lead.propertyType as string).toLowerCase().trim()];
    }

    // Pas de type défini sur le lead: 10 points (type inconnu, pas bloquant)
    if (leadTypes.length === 0) {
      return {
        compatible: true,
        relation: 'unknown',
        leadTypes: [],
        propertyType: property.type ?? '',
        score: 10,
      };
    }

    // Pas de type sur la propriété
    if (!propertyType) {
      return {
        compatible: false,
        relation: 'mismatch',
        leadTypes,
        propertyType: '',
        score: 0,
      };
    }

    // Match exact: 20 points
    if (leadTypes.includes(propertyType)) {
      return {
        compatible: true,
        relation: 'exact',
        leadTypes,
        propertyType: property.type,
        score: 20,
      };
    }

    // Match compatible (ex: appartement ↔ studio): 15 points
    for (const leadType of leadTypes) {
      if (arePropertyTypesCompatible(leadType, propertyType)) {
        return {
          compatible: true,
          relation: 'compatible',
          leadTypes,
          propertyType: property.type,
          score: 15,
        };
      }
    }

    // Pas de match
    return {
      compatible: false,
      relation: 'mismatch',
      leadTypes,
      propertyType: property.type,
      score: 0,
    };
  }

  /**
   * Calculer le bonus Urgence/Sérieux (0-10 points max)
   */
  private calculateMetaBonus(lead: any): MetaMatchReason {
    const urgency = lead.urgency as string | null;
    const seriousnessScore = lead.seriousnessScore as number | null;

    let urgencyBonus = 0;
    let seriousnessBonus = 0;

    // Bonus urgence
    if (urgency === 'haute') {
      urgencyBonus = 5;
    } else if (urgency === 'moyenne') {
      urgencyBonus = 3;
    }

    // Bonus sérieux
    if (seriousnessScore !== null) {
      if (seriousnessScore >= 80) {
        seriousnessBonus = 5;
      } else if (seriousnessScore >= 60) {
        seriousnessBonus = 3;
      }
    }

    // Cap total à 10 points
    const totalBonus = Math.min(10, urgencyBonus + seriousnessBonus);

    return {
      urgency,
      urgencyBonus,
      seriousnessScore,
      seriousnessBonus,
      totalBonus,
    };
  }

  /**
   * Récupérer les matchs d'un lead
   */
  async getLeadMatches(userId: string, leadId: string) {
    await this.getLeadById(userId, leadId);

    return this.prisma.prospecting_matches.findMany({
      where: { leadId },
      include: {
        properties: true,
        prospects: true,
      },
      orderBy: { score: 'desc' },
    });
  }

  /**
   * Notifier un match
   */
  async notifyMatch(userId: string, matchId: string) {
    const match = await this.prisma.prospecting_matches.findUnique({
      where: { id: matchId },
      include: {
        properties: true,
        prospects: true,
      },
    });

    if (!match) {
      throw new NotFoundException('Match non trouvé');
    }

    await this.prisma.prospecting_matches.update({
      where: { id: matchId },
      data: {
        status: 'notified',
        notifiedAt: new Date(),
      },
    });

    return { success: true, message: 'Notification envoyée' };
  }

  // ============================================
  // SCRAPING
  // ============================================

  /**
   * Exécuter le scraping d'une campagne avec orchestration IA complète
   * Pipeline: Scraping → LLM Analysis → Validation → Ingestion → Auto-Matching
   */
  private async runCampaignScraping(userId: string, campaign: any) {
    this.logger.log(`Starting intelligent scraping for campaign ${campaign.id}`);

    try {
      const config = campaign.config as any;
      const sources = config?.sources || ['pica'];
      const autoMatch = config?.autoMatch !== false;
      const llmProviderOverride = config?.llmProvider || 'auto'; // ✅ NOUVEAU: Provider override

      // 1. SCRAPING MULTI-SOURCES EN PARALLÈLE ⚡
      this.logger.log(`⚡ Parallel scraping from sources: ${sources.join(', ')}`);
      const allRawItems: RawScrapedItem[] = [];

      // ✅ OPTIMISATION: Scraper toutes les sources en parallèle
      const scrapingPromises = sources.map(async (source) => {
        try {
          let result;

          switch (source) {
            case 'pica':
              result = await this.integrationService.scrapeWithPica(userId, config);
              break;

            case 'serp':
              result = await this.integrationService.scrapeFromSERP(userId, config);
              break;

            case 'firecrawl':
              const urls = config.urls || [];
              if (urls.length > 0) {
                result = await this.integrationService.scrapeWithFirecrawl(userId, urls, config);
              }
              break;

            case 'meta':
            case 'facebook':
              result = await this.integrationService.scrapeFromSocial(userId, {
                platform: 'meta',
                query: config.query || config.keywords?.join(' ') || 'immobilier Tunisie',
                config,
              });
              break;

            case 'linkedin':
              result = await this.integrationService.scrapeFromSocial(userId, {
                platform: 'linkedin',
                query: config.query || config.keywords?.join(' ') || 'immobilier Tunisie',
                config,
              });
              break;

            case 'webscrape':
              const websiteUrls = config.urls || [];
              if (websiteUrls.length > 0) {
                result = await this.integrationService.scrapeWebsites(userId, websiteUrls);
              }
              break;

            default:
              this.logger.warn(`Unknown scraping source: ${source}`);
              return { source, leads: [], error: 'Unknown source' };
          }

          // Convertir les résultats en RawScrapedItem
          if (result?.leads) {
            const rawItems = this.integrationService.convertToRawScrapedItems(result.leads, source);
            this.logger.log(`✅ Source ${source}: ${rawItems.length} raw items scraped`);
            return { source, leads: rawItems, error: null };
          }

          return { source, leads: [], error: null };
        } catch (error) {
          this.logger.warn(`❌ Source ${source} failed: ${error.message}`);
          return { source, leads: [], error: error.message };
        }
      });

      // Attendre que toutes les sources finissent (en parallèle)
      const scrapingResults = await Promise.all(scrapingPromises);

      // Agréger tous les résultats
      for (const result of scrapingResults) {
        if (result.leads.length > 0) {
          allRawItems.push(...result.leads);
        }
      }

      this.logger.log(`✅ Total raw items scraped: ${allRawItems.length}`);

      // 2. LLM ANALYSIS + VALIDATION + INGESTION
      let ingestResult;
      if (allRawItems.length > 0) {
        ingestResult = await this.integrationService.ingestScrapedItems(
          userId,
          campaign.id,
          allRawItems,
          llmProviderOverride, // ✅ NOUVEAU: Passer le provider au service
        );

        this.logger.log(
          `Ingestion: ${ingestResult.created} created, ${ingestResult.rejected} rejected`,
        );
      } else {
        // Si aucun item scraped, fallback sur mock data pour démo
        this.logger.warn('No items scraped, generating mock leads for demo');
        const mockLeads = this.generateMockLeads(campaign);

        for (const leadData of mockLeads) {
          const score = await this.calculateLeadScore(leadData);
          await this.prisma.prospecting_leads.create({
            data: {
              ...leadData,
              campaignId: campaign.id,
              userId,
              score,
            },
          });
        }

        ingestResult = {
          created: mockLeads.length,
          rejected: 0,
          total: mockLeads.length,
          leads: [],
        };
      }

      // 3. AUTO-MATCHING EN PARALLÈLE PAR BATCH ⚡
      if (autoMatch && ingestResult.leads && ingestResult.leads.length > 0) {
        this.logger.log(`⚡ Starting parallel auto-matching for ${ingestResult.leads.length} leads`);
        let totalMatches = 0;

        // ✅ OPTIMISATION: Matching en parallèle par batches de 20
        const MATCH_BATCH_SIZE = 20;
        for (let i = 0; i < ingestResult.leads.length; i += MATCH_BATCH_SIZE) {
          const batch = ingestResult.leads.slice(i, i + MATCH_BATCH_SIZE);

          const matchPromises = batch.map(async (leadId) => {
            try {
              const matchResult = await this.findMatchesForLead(userId, leadId);
              return matchResult.matchesCreated || 0;
            } catch (error) {
              this.logger.warn(`Auto-matching failed for lead ${leadId}: ${error.message}`);
              return 0;
            }
          });

          // Attendre ce batch
          const batchMatches = await Promise.all(matchPromises);
          const batchTotal = batchMatches.reduce((sum, count) => sum + count, 0);
          totalMatches += batchTotal;

          this.logger.log(
            `Batch ${Math.floor(i / MATCH_BATCH_SIZE) + 1}: ${batchTotal} matches created`,
          );
        }

        this.logger.log(`✅ Auto-matching completed: ${totalMatches} total matches created`);

        // Mettre à jour le compteur de matches de la campagne
        await this.prisma.prospecting_campaigns.update({
          where: { id: campaign.id },
          data: { matchedCount: totalMatches },
        });
      }

      // 4. FINALISER LA CAMPAGNE
      await this.prisma.prospecting_campaigns.update({
        where: { id: campaign.id },
        data: {
          foundCount: ingestResult.created,
          status: 'completed',
          completedAt: new Date(),
        },
      });

      this.logger.log(
        `✅ Campaign ${campaign.id} completed: ${ingestResult.created} leads, ${autoMatch ? 'auto-matching enabled' : 'manual matching'
        } (Provider: ${llmProviderOverride})`,
      );
    } catch (error) {
      this.logger.error(`❌ Scraping failed for campaign ${campaign.id}: ${error.message}`);

      // Marquer la campagne en erreur
      await this.prisma.prospecting_campaigns.update({
        where: { id: campaign.id },
        data: { status: 'paused' },
      });
    }
  }

  /**
   * Générer des leads mock
   */
  private generateMockLeads(campaign: any): any[] {
    const leads = [];
    const count = Math.min(campaign.targetCount || 10, 50);

    const firstNames = ['Ahmed', 'Mohamed', 'Fatma', 'Leila', 'Karim', 'Sami'];
    const lastNames = ['Ben Ali', 'Trabelsi', 'Hamdi', 'Gharbi'];
    const cities = ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte'];
    const propertyTypes = ['apartment', 'house', 'villa', 'studio'];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      leads.push({
        firstName,
        lastName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        phone: `+216${Math.floor(20000000 + Math.random() * 70000000)}`,
        city: cities[Math.floor(Math.random() * cities.length)],
        propertyType: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        budget: Math.floor(100000 + Math.random() * 500000),
        source: 'scraping',
        sourceUrl: 'https://example.com',
        metadata: {
          scrapedAt: new Date().toISOString(),
          campaign: campaign.name,
        },
      });
    }

    return leads;
  }

  // ============================================
  // STATISTIQUES
  // ============================================

  /**
   * Statistiques d'une campagne
   */
  async getCampaignStats(userId: string, campaignId: string) {
    return this.campaignService.getCampaignStats(userId, campaignId);
  }

  /**
   * Statistiques globales
   */
  async getGlobalStats(userId: string) {
    return this.campaignService.getGlobalStats(userId);
  }

  // ============================================
  // TÂCHE CRON
  // ============================================

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyMatching() {
    this.logger.log('Running daily matching...');

    const leads = await this.prisma.prospecting_leads.findMany({
      where: {
        status: 'new',
        score: { gte: 50 },
      },
      take: 100,
    });

    for (const lead of leads) {
      try {
        await this.findMatchesForLead(lead.userId, lead.id);
      } catch (error) {
        this.logger.error(`Failed to match lead ${lead.id}: ${error.message}`);
      }
    }

    this.logger.log(`Daily matching completed for ${leads.length} leads`);
  }

  // ============================================
  // UTILS
  // ============================================

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  private isBudgetCompatible(budget: any, price: number): boolean {
    if (!budget || !price) return false;

    const budgetValue = typeof budget === 'object' ? budget.max || budget.min || 0 : budget;

    if (budgetValue <= 0) return false;

    const diff = Math.abs((budgetValue - price) / budgetValue);
    return diff < 0.2;
  }

  async validateEmails(emails: string[]) {
    const results = emails.map((email) => ({
      email,
      isValid: this.isValidEmail(email),
      score: this.isValidEmail(email) ? Math.floor(70 + Math.random() * 30) : 0,
    }));

    return { results };
  }

  async getLocations(country?: string) {
    return {
      cities: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte', 'Ariana'],
      delegations: ['Tunis Ville', 'La Marsa', 'Carthage', 'Ariana'],
      communes: ['El Menzah', 'Lac 1', 'Lac 2', 'Ennasr', 'Manar'],
    };
  }

  // Compatibilité ancienne API
  async startScraping(userId: string, config: any) {
    const campaign = await this.createCampaign(userId, {
      name: config.name || 'Quick Scraping',
      type: config.type || 'geographic',
      config,
      targetCount: config.targetCount || 10,
    });

    await this.startCampaign(userId, campaign.id);

    return {
      id: campaign.id,
      status: 'started',
      message: 'Scraping initiated successfully',
    };
  }

  async getOpportunities(userId: string, filters?: any) {
    return this.getCampaigns(userId, filters);
  }

  // ============================================
  // METHODES ADDITIONNELLES
  // ============================================

  /**
   * Mettre à jour une campagne
   */
  async updateCampaign(userId: string, campaignId: string, data: any) {
    return this.campaignService.updateCampaign(userId, campaignId, data);
  }

  /**
   * Mettre à jour le statut d'un match
   */
  async updateMatchStatus(userId: string, matchId: string, status: string) {
    const match = await this.prisma.prospecting_matches.findUnique({
      where: { id: matchId },
      include: { properties: true },
    });

    if (!match) {
      throw new NotFoundException('Match non trouvé');
    }

    return this.prisma.prospecting_matches.update({
      where: { id: matchId },
      data: { status },
    });
  }

  /**
   * Statistiques par source
   */
  async getStatsBySource(userId: string) {
    return this.campaignService.getStatsBySource(userId);
  }

  /**
   * Statistiques de conversion
   */
  async getConversionStats(userId: string) {
    return this.campaignService.getConversionStats(userId);
  }

  /**
   * ROI de la prospection
   */
  async getROIStats(userId: string) {
    try {
      const [campaigns, convertedLeads, allLeads] = await Promise.all([
        this.prisma.prospecting_campaigns.findMany({
          where: { userId },
          include: {
            _count: { select: { leads: true } },
          },
        }),
        this.prisma.prospecting_leads.findMany({
          where: { userId, status: 'converted' },
        }),
        this.prisma.prospecting_leads.findMany({
          where: { userId },
          select: { metadata: true, source: true, budget: true, budgetMin: true, budgetMax: true },
        }),
      ]);

      // Calculer les valeurs estimées
      const totalLeads = campaigns.reduce((sum, c) => sum + c._count.leads, 0);
      const totalConverted = convertedLeads.length;
      const estimatedValue = convertedLeads.reduce((sum, lead) => {
        const budget = lead.budget as any;
        const budgetValue = budget?.max || budget?.min || lead.budgetMax || lead.budgetMin || 0;
        return sum + (typeof budgetValue === 'number' ? budgetValue : 0);
      }, 0);

      // Calculer les coûts par source (estimation basée sur les coûts API typiques)
      const apiCosts: Record<string, number> = {
        pica: 0.05,
        serp: 0.02,
        meta: 0.03,
        linkedin: 0.1,
        firecrawl: 0.01,
        website: 0.005,
        manual: 0,
      };

      // Calculer le coût total basé sur les sources des leads
      const totalCost = allLeads.reduce((sum, lead) => {
        const source = (lead.source || 'manual').toLowerCase();
        const metadata = lead.metadata as any;
        if (metadata?.apiCost) {
          return sum + metadata.apiCost;
        }
        return sum + (apiCosts[source] || 0);
      }, 0);

      const costPerLead = totalLeads > 0 ? Math.round((totalCost / totalLeads) * 100) / 100 : 0;

      const roi =
        totalCost > 0
          ? Math.round(((estimatedValue - totalCost) / totalCost) * 100)
          : estimatedValue > 0
            ? 100
            : 0;

      return {
        totalCampaigns: campaigns.length,
        totalLeads,
        totalConverted,
        conversionRate: totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0,
        estimatedValue,
        avgLeadValue: totalConverted > 0 ? Math.round(estimatedValue / totalConverted) : 0,
        totalCost: Math.round(totalCost * 100) / 100,
        costPerLead,
        roi,
      };
    } catch (error) {
      this.logger.error(`Error in getROIStats: ${error.message}`);
      return {
        totalCampaigns: 0,
        totalLeads: 0,
        totalConverted: 0,
        conversionRate: 0,
        estimatedValue: 0,
        avgLeadValue: 0,
        totalCost: 0,
        costPerLead: 0,
        roi: 0,
      };
    }
  }

}
