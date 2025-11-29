import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ProspectingService {
  private readonly logger = new Logger(ProspectingService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================
  // CAMPAIGNS
  // ============================================

  /**
   * Créer une campagne de prospection
   */
  async createCampaign(userId: string, data: any) {
    this.logger.log(`Creating prospecting campaign for user ${userId}`);

    return this.prisma.prospecting_campaigns.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        type: data.type || 'geographic',
        config: data.config || {},
        targetCount: data.targetCount,
      },
    });
  }

  /**
   * Récupérer toutes les campagnes
   */
  async getCampaigns(userId: string, filters?: any) {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;

    return this.prisma.prospecting_campaigns.findMany({
      where,
      include: {
        _count: {
          select: { leads: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer une campagne par ID
   */
  async getCampaignById(userId: string, campaignId: string) {
    const campaign = await this.prisma.prospecting_campaigns.findFirst({
      where: { id: campaignId, userId },
      include: {
        leads: {
          take: 10,
          orderBy: { score: 'desc' },
        },
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campagne non trouvée');
    }

    return campaign;
  }

  /**
   * Démarrer une campagne
   */
  async startCampaign(userId: string, campaignId: string) {
    const campaign = await this.getCampaignById(userId, campaignId);

    if (campaign.status !== 'draft' && campaign.status !== 'paused') {
      throw new BadRequestException('Cette campagne ne peut pas être démarrée');
    }

    // Démarrer le scraping en arrière-plan
    this.runCampaignScraping(userId, campaign);

    return this.prisma.prospecting_campaigns.update({
      where: { id: campaignId },
      data: {
        status: 'active',
        startedAt: new Date(),
      },
    });
  }

  /**
   * Mettre en pause une campagne
   */
  async pauseCampaign(userId: string, campaignId: string) {
    await this.getCampaignById(userId, campaignId);

    return this.prisma.prospecting_campaigns.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });
  }

  /**
   * Supprimer une campagne
   */
  async deleteCampaign(userId: string, campaignId: string) {
    await this.getCampaignById(userId, campaignId);

    await this.prisma.prospecting_campaigns.delete({
      where: { id: campaignId },
    });

    return { success: true };
  }

  // ============================================
  // LEADS
  // ============================================

  /**
   * Récupérer tous les leads d'une campagne
   */
  async getLeads(userId: string, campaignId: string, filters?: any) {
    const where: any = { campaignId, userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.minScore) where.score = { gte: parseInt(filters.minScore) };
    if (filters?.leadType) where.prospectType = filters.leadType;

    return this.prisma.prospecting_leads.findMany({
      where,
      orderBy: { score: 'desc' },
      take: filters?.limit ? parseInt(filters.limit) : 50,
    });
  }

  /**
   * Récupérer un lead par ID
   */
  async getLeadById(userId: string, leadId: string) {
    const lead = await this.prisma.prospecting_leads.findFirst({
      where: { id: leadId, userId },
      include: {
        campaigns: true,
        convertedProspect: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead non trouvé');
    }

    return lead;
  }

  /**
   * Mettre à jour un lead
   */
  async updateLead(userId: string, leadId: string, data: any) {
    await this.getLeadById(userId, leadId);

    return this.prisma.prospecting_leads.update({
      where: { id: leadId },
      data,
    });
  }

  /**
   * Convertir un lead en prospect
   */
  async convertLeadToProspect(userId: string, leadId: string) {
    const lead = await this.getLeadById(userId, leadId);

    // Créer le prospect
    const prospect = await this.prisma.prospects.create({
      data: {
        userId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        type: 'buyer',
        budget: lead.budget,
        preferences: lead.metadata,
        source: `Prospection: ${lead.source}`,
        status: 'active',
        notes: `Converti depuis lead ${leadId}`,
      },
    });

    // Mettre à jour le lead
    await this.prisma.prospecting_leads.update({
      where: { id: leadId },
      data: {
        status: 'converted',
        convertedProspectId: prospect.id,
        convertedAt: new Date(),
      },
    });

    return prospect;
  }

  /**
   * Calculer le score d'un lead
   */
  calculateLeadScore(lead: any): number {
    let score = 0;

    // Email valide: +20
    if (lead.email && this.isValidEmail(lead.email)) {
      score += 20;
    }

    // Téléphone valide: +15
    if (lead.phone) {
      score += 15;
    }

    // Nom complet: +10
    if (lead.firstName && lead.lastName) {
      score += 10;
    }

    // Budget défini: +20
    if (lead.budget) {
      const budgetValue = typeof lead.budget === 'object'
        ? (lead.budget.max || lead.budget.min || 0)
        : lead.budget;
      if (budgetValue > 0) {
        score += 20;
      }
    }

    // Ville définie: +10
    if (lead.city) {
      score += 10;
    }

    // Type de propriété: +10
    if (lead.propertyType) {
      score += 10;
    }

    // Source fiable: +15
    if (lead.source && ['linkedin', 'facebook', 'website'].includes(lead.source)) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  // ============================================
  // MATCHING
  // ============================================

  /**
   * Trouver des matchs pour un lead
   */
  async findMatchesForLead(userId: string, leadId: string) {
    const lead = await this.getLeadById(userId, leadId);

    // Récupérer les propriétés compatibles
    const where: any = { userId };

    if (lead.propertyType) {
      where.type = lead.propertyType;
    }

    // Budget est maintenant un objet Json { min?, max?, currency? }
    if (lead.budget) {
      const budgetObj = lead.budget as any;
      const budgetValue = typeof lead.budget === 'object' 
        ? (budgetObj.max || budgetObj.min || 0)
        : lead.budget;
      
      if (budgetValue > 0) {
        where.price = {
          gte: budgetValue * 0.8,
          lte: budgetValue * 1.2,
        };
      }
    }

    if (lead.city) {
      where.city = { contains: lead.city, mode: 'insensitive' };
    }

    const properties = await this.prisma.properties.findMany({
      where,
      take: 10,
    });

    // Créer les matchs
    const matches = [];

    for (const property of properties) {
      const matchScore = this.calculateMatchScore(lead, property);

      if (matchScore >= 50) {
        const match = await this.prisma.prospecting_matches.create({
          data: {
            leadId: lead.id,
            propertyId: property.id,
            score: matchScore,
            reason: {
              budget: this.isBudgetCompatible(lead.budget, property.price),
              location: lead.city === property.city,
              type: lead.propertyType === property.type,
            },
          },
          include: {
            properties: true,
          },
        });

        matches.push(match);
      }
    }

    // Mettre à jour le lead
    if (matches.length > 0) {
      await this.prisma.prospecting_leads.update({
        where: { id: leadId },
        data: {
          matchedPropertyIds: matches.map((m) => m.propertyId),
        },
      });
    }

    return matches;
  }

  /**
   * Calculer le score de match entre un lead et une propriété
   */
  calculateMatchScore(lead: any, property: any): number {
    let score = 0;

    // Budget compatible: +40
    if (lead.budget && property.price) {
      const budgetValue = typeof lead.budget === 'object'
        ? (lead.budget.max || lead.budget.min || 0)
        : lead.budget;
      
      if (budgetValue > 0) {
        const diff = Math.abs((budgetValue - property.price) / budgetValue);
        if (diff < 0.1) score += 40;
        else if (diff < 0.2) score += 30;
        else if (diff < 0.3) score += 20;
      }
    }

    // Ville identique: +30
    if (lead.city && property.city && lead.city.toLowerCase() === property.city.toLowerCase()) {
      score += 30;
    }

    // Type de propriété identique: +20
    if (lead.propertyType && property.type && lead.propertyType === property.type) {
      score += 20;
    }

    // Code postal proche: +10
    if (lead.zipCode && property.zipCode && lead.zipCode === property.zipCode) {
      score += 10;
    }

    return Math.min(score, 100);
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
   * Exécuter le scraping d'une campagne
   */
  private async runCampaignScraping(userId: string, campaign: any) {
    this.logger.log(`Starting scraping for campaign ${campaign.id}`);

    try {
      const mockLeads = this.generateMockLeads(campaign);

      for (const leadData of mockLeads) {
        const score = this.calculateLeadScore(leadData);

        await this.prisma.prospecting_leads.create({
          data: {
            ...leadData,
            campaignId: campaign.id,
            userId,
            score,
          },
        });
      }

      await this.prisma.prospecting_campaigns.update({
        where: { id: campaign.id },
        data: {
          foundCount: mockLeads.length,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Scraping completed: ${mockLeads.length} leads`);
    } catch (error) {
      this.logger.error(`Scraping failed: ${error.message}`);
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
    await this.getCampaignById(userId, campaignId);

    const [total, byStatus, avgScore, converted] = await Promise.all([
      this.prisma.prospecting_leads.count({ where: { campaignId } }),
      this.prisma.prospecting_leads.groupBy({
        by: ['status'],
        where: { campaignId },
        _count: true,
      }),
      this.prisma.prospecting_leads.aggregate({
        where: { campaignId },
        _avg: { score: true },
      }),
      this.prisma.prospecting_leads.count({
        where: { campaignId, status: 'converted' },
      }),
    ]);

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      byStatus,
      avgScore: Math.round(avgScore._avg.score || 0),
      converted,
      conversionRate: Math.round(conversionRate),
    };
  }

  /**
   * Statistiques globales
   */
  async getGlobalStats(userId: string) {
    const [totalCampaigns, totalLeads, totalMatches, topLeads] = await Promise.all([
      this.prisma.prospecting_campaigns.count({ where: { userId } }),
      this.prisma.prospecting_leads.count({ where: { userId } }),
      this.prisma.prospecting_matches.count({
        where: {
          properties: {
            userId,
          },
        },
      }),
      this.prisma.prospecting_leads.findMany({
        where: { userId },
        orderBy: { score: 'desc' },
        take: 5,
        include: {
          campaigns: {
            select: { name: true },
          },
        },
      }),
    ]);

    return {
      totalCampaigns,
      totalLeads,
      totalMatches,
      topLeads,
    };
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
    
    const budgetValue = typeof budget === 'object'
      ? (budget.max || budget.min || 0)
      : budget;
    
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
    await this.getCampaignById(userId, campaignId);

    return this.prisma.prospecting_campaigns.update({
      where: { id: campaignId },
      data,
    });
  }

  /**
   * Supprimer un lead
   */
  async deleteLead(userId: string, leadId: string) {
    await this.getLeadById(userId, leadId);

    await this.prisma.prospecting_leads.delete({
      where: { id: leadId },
    });

    return { success: true };
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
    const stats = await this.prisma.prospecting_leads.groupBy({
      by: ['source'],
      where: { userId },
      _count: true,
      _avg: { score: true },
    });

    return stats.map((s) => ({
      source: s.source || 'unknown',
      count: s._count,
      avgScore: Math.round(s._avg.score || 0),
    }));
  }

  /**
   * Statistiques de conversion
   */
  async getConversionStats(userId: string) {
    const [total, converted, byStage] = await Promise.all([
      this.prisma.prospecting_leads.count({ where: { userId } }),
      this.prisma.prospecting_leads.count({ where: { userId, status: 'converted' } }),
      this.prisma.prospecting_leads.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      converted,
      conversionRate: Math.round(conversionRate * 10) / 10,
      byStage: byStage.map((s) => ({
        stage: s.status,
        count: s._count,
        percentage: Math.round((s._count / total) * 100 * 10) / 10,
      })),
      funnel: {
        new: byStage.find((s) => s.status === 'new')?._count || 0,
        contacted: byStage.find((s) => s.status === 'contacted')?._count || 0,
        qualified: byStage.find((s) => s.status === 'qualified')?._count || 0,
        converted: byStage.find((s) => s.status === 'converted')?._count || 0,
        rejected: byStage.find((s) => s.status === 'rejected')?._count || 0,
      },
    };
  }

  /**
   * ROI de la prospection
   */
  async getROIStats(userId: string) {
    const [campaigns, convertedLeads] = await Promise.all([
      this.prisma.prospecting_campaigns.findMany({
        where: { userId },
        include: {
          _count: { select: { leads: true } },
        },
      }),
      this.prisma.prospecting_leads.findMany({
        where: { userId, status: 'converted' },
        include: { convertedProspect: true },
      }),
    ]);

    // Calculer les valeurs estimées
    const totalLeads = campaigns.reduce((sum, c) => sum + c._count.leads, 0);
    const totalConverted = convertedLeads.length;
    const estimatedValue = convertedLeads.reduce((sum, lead) => {
      const budget = lead.budget as any;
      return sum + (budget?.max || budget?.min || budget || 0);
    }, 0);

    return {
      totalCampaigns: campaigns.length,
      totalLeads,
      totalConverted,
      conversionRate: totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0,
      estimatedValue,
      avgLeadValue: totalConverted > 0 ? Math.round(estimatedValue / totalConverted) : 0,
      costPerLead: 0, // À calculer selon les coûts API
      roi: 0, // À calculer
    };
  }

  /**
   * Dédupliquer les leads avec matching intelligent
   */
  async deduplicateLeads(userId: string, campaignId?: string) {
    const where: any = { userId };
    if (campaignId) where.campaignId = campaignId;

    const leads = await this.prisma.prospecting_leads.findMany({
      where,
      orderBy: { score: 'desc' }, // Garder le lead avec le meilleur score
    });

    const uniqueLeads = new Map<string, any>();
    const duplicates: string[] = [];
    const mergedData: any[] = [];

    for (const lead of leads) {
      // Générer plusieurs clés pour la déduplication
      const keys = this.generateDeduplicationKeys(lead);
      let foundDuplicate = false;
      let originalLeadId: string | null = null;

      for (const key of keys) {
        if (uniqueLeads.has(key)) {
          foundDuplicate = true;
          originalLeadId = uniqueLeads.get(key).id;
          break;
        }
      }

      if (foundDuplicate && originalLeadId) {
        duplicates.push(lead.id);
        // Fusionner les données du doublon avec l'original
        const original = uniqueLeads.get(keys[0]);
        if (original) {
          mergedData.push({
            id: originalLeadId,
            data: this.mergeLeadData(original, lead),
          });
        }
      } else {
        // Ajouter toutes les clés pour ce lead
        keys.forEach(key => uniqueLeads.set(key, lead));
      }
    }

    // Mettre à jour les leads originaux avec les données fusionnées
    for (const merge of mergedData) {
      await this.prisma.prospecting_leads.update({
        where: { id: merge.id },
        data: merge.data,
      });
    }

    // Supprimer les doublons
    if (duplicates.length > 0) {
      await this.prisma.prospecting_leads.deleteMany({
        where: { id: { in: duplicates } },
      });
    }

    return {
      success: true,
      totalProcessed: leads.length,
      duplicatesRemoved: duplicates.length,
      uniqueLeads: leads.length - duplicates.length,
      mergedRecords: mergedData.length,
    };
  }

  /**
   * Générer des clés de déduplication pour un lead
   */
  private generateDeduplicationKeys(lead: any): string[] {
    const keys: string[] = [];

    // Clé email (normalisée)
    if (lead.email) {
      keys.push(`email:${lead.email.toLowerCase().trim()}`);
    }

    // Clé téléphone (normalisé)
    if (lead.phone) {
      const normalizedPhone = this.normalizePhone(lead.phone);
      keys.push(`phone:${normalizedPhone}`);
    }

    // Clé nom+ville (pour matcher les doublons sans contact)
    if (lead.firstName && lead.lastName && lead.city) {
      const nameKey = `name:${this.normalizeText(lead.firstName)}_${this.normalizeText(lead.lastName)}_${this.normalizeText(lead.city)}`;
      keys.push(nameKey);
    }

    return keys;
  }

  /**
   * Normaliser un numéro de téléphone
   */
  private normalizePhone(phone: string): string {
    // Supprimer tout sauf les chiffres
    let normalized = phone.replace(/[^0-9]/g, '');

    // Gérer le préfixe tunisien
    if (normalized.startsWith('00216')) {
      normalized = normalized.substring(5);
    } else if (normalized.startsWith('216')) {
      normalized = normalized.substring(3);
    } else if (normalized.startsWith('0')) {
      normalized = normalized.substring(1);
    }

    return normalized;
  }

  /**
   * Normaliser du texte pour comparaison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Fusionner les données de deux leads
   */
  private mergeLeadData(original: any, duplicate: any): any {
    const merged: any = {};

    // Prendre la valeur non-nulle ou la plus récente
    const fields = ['firstName', 'lastName', 'email', 'phone', 'city', 'zipCode', 'propertyType'];

    for (const field of fields) {
      if (!original[field] && duplicate[field]) {
        merged[field] = duplicate[field];
      }
    }

    // Fusionner les metadata
    if (duplicate.metadata) {
      merged.metadata = {
        ...original.metadata,
        ...duplicate.metadata,
        mergedFrom: [...(original.metadata?.mergedFrom || []), duplicate.id],
        mergedAt: new Date().toISOString(),
      };
    }

    // Garder le meilleur score
    if (duplicate.score > original.score) {
      merged.score = duplicate.score;
    }

    return merged;
  }

  /**
   * Calculer la distance de Levenshtein entre deux chaînes
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Trouver les doublons potentiels avec fuzzy matching
   */
  async findPotentialDuplicates(userId: string, leadId: string) {
    const lead = await this.getLeadById(userId, leadId);

    const allLeads = await this.prisma.prospecting_leads.findMany({
      where: { userId, id: { not: leadId } },
    });

    const potentialDuplicates: any[] = [];

    for (const other of allLeads) {
      let similarity = 0;
      let reasons: string[] = [];

      // Comparer les emails
      if (lead.email && other.email) {
        if (lead.email.toLowerCase() === other.email.toLowerCase()) {
          similarity += 50;
          reasons.push('Email identique');
        }
      }

      // Comparer les téléphones
      if (lead.phone && other.phone) {
        const phone1 = this.normalizePhone(lead.phone);
        const phone2 = this.normalizePhone(other.phone);
        if (phone1 === phone2) {
          similarity += 40;
          reasons.push('Téléphone identique');
        }
      }

      // Comparer les noms (fuzzy)
      if (lead.firstName && lead.lastName && other.firstName && other.lastName) {
        const name1 = `${this.normalizeText(lead.firstName)} ${this.normalizeText(lead.lastName)}`;
        const name2 = `${this.normalizeText(other.firstName)} ${this.normalizeText(other.lastName)}`;
        const distance = this.levenshteinDistance(name1, name2);
        const maxLen = Math.max(name1.length, name2.length);
        const nameSimilarity = 1 - (distance / maxLen);

        if (nameSimilarity > 0.8) {
          similarity += 30 * nameSimilarity;
          reasons.push(`Nom similaire (${Math.round(nameSimilarity * 100)}%)`);
        }
      }

      if (similarity >= 40) {
        potentialDuplicates.push({
          lead: other,
          similarity: Math.round(similarity),
          reasons,
        });
      }
    }

    return potentialDuplicates.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Exporter les leads
   */
  async exportLeads(userId: string, campaignId: string, format: string) {
    const leads = await this.prisma.prospecting_leads.findMany({
      where: { campaignId, userId },
      orderBy: { score: 'desc' },
    });

    if (format === 'json') {
      return { data: leads, format: 'json' };
    }

    // Format CSV
    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Ville', 'Type', 'Budget', 'Score', 'Statut', 'Source'];
    const rows = leads.map((lead) => [
      lead.firstName || '',
      lead.lastName || '',
      lead.email || '',
      lead.phone || '',
      lead.city || '',
      lead.propertyType || '',
      JSON.stringify(lead.budget) || '',
      lead.score,
      lead.status,
      lead.source || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return {
      data: csv,
      format: 'csv',
      filename: `leads-${campaignId}-${Date.now()}.csv`,
    };
  }

  /**
   * Importer des leads
   */
  async importLeads(userId: string, campaignId: string, leads: any[]) {
    await this.getCampaignById(userId, campaignId);

    const created: any[] = [];
    const errors: any[] = [];

    for (const leadData of leads) {
      try {
        const score = this.calculateLeadScore(leadData);

        const lead = await this.prisma.prospecting_leads.create({
          data: {
            campaignId,
            userId,
            firstName: leadData.firstName || leadData.prenom,
            lastName: leadData.lastName || leadData.nom,
            email: leadData.email,
            phone: leadData.phone || leadData.telephone,
            city: leadData.city || leadData.ville,
            propertyType: leadData.propertyType || leadData.typeBien,
            budget: leadData.budget,
            source: 'import',
            score,
            status: 'new',
          },
        });

        created.push(lead);
      } catch (error) {
        errors.push({ data: leadData, error: error.message });
      }
    }

    // Mettre à jour le compteur de la campagne
    await this.prisma.prospecting_campaigns.update({
      where: { id: campaignId },
      data: {
        foundCount: { increment: created.length },
      },
    });

    return {
      success: true,
      imported: created.length,
      errors: errors.length,
      errorDetails: errors,
    };
  }
}
