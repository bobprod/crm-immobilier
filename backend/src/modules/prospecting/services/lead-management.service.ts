import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { UnifiedValidationService } from '../../../shared/validation/unified-validation.service';
import { UpdateLeadDto } from '../dto';

interface LeadFilters {
  status?: string;
  minScore?: string;
  leadType?: string;
  limit?: string;
}

@Injectable()
export class LeadManagementService {
  private readonly logger = new Logger(LeadManagementService.name);

  constructor(
    private prisma: PrismaService,
    private validationService: UnifiedValidationService,
  ) {}

  /**
   * Récupérer tous les leads d'une campagne
   */
  async getLeads(userId: string, campaignId: string, filters?: LeadFilters) {
    const where: Record<string, unknown> = { campaignId, userId };

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
  async updateLead(userId: string, leadId: string, data: UpdateLeadDto) {
    await this.getLeadById(userId, leadId);

    return this.prisma.prospecting_leads.update({
      where: { id: leadId },
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
   * Convertir un lead en prospect
   * - Vérifie si un prospect existe déjà (déduplication)
   * - Préserve toutes les métadonnées de prospection
   * - Log l'activité
   */
  async convertLeadToProspect(userId: string, leadId: string) {
    const lead = await this.getLeadById(userId, leadId);

    // 1. Vérifier si le lead a déjà été converti
    if (lead.convertedProspectId) {
      const existingProspect = await this.prisma.prospects.findUnique({
        where: { id: lead.convertedProspectId },
      });
      if (existingProspect) {
        this.logger.warn(
          `Lead ${leadId} already converted to prospect ${lead.convertedProspectId}`,
        );
        return existingProspect;
      }
    }

    // 2. Validate lead data before conversion
    if (lead.email) {
      const emailValidation = await this.validationService.validateEmail(lead.email);
      if (emailValidation.format?.isDisposable || emailValidation.risk?.isSpam) {
        this.logger.warn(`Lead ${leadId} has disposable/spam email: ${lead.email}`);
        await this.prisma.prospecting_leads.update({
          where: { id: leadId },
          data: { status: 'spam' },
        });
        throw new Error('Email détecté comme spam ou jetable — conversion refusée');
      }
    }

    // 3. Vérifier si un prospect existe avec le même email ou téléphone (déduplication)
    const existingProspect = await this.findExistingProspect(userId, lead);
    if (existingProspect) {
      this.logger.log(`Found existing prospect ${existingProspect.id} matching lead ${leadId}`);

      // Fusionner les données du lead avec le prospect existant
      const mergedProspect = await this.mergeLeadIntoProspect(existingProspect, lead);

      // Mettre à jour le lead
      await this.prisma.prospecting_leads.update({
        where: { id: leadId },
        data: {
          status: 'converted',
          convertedProspectId: mergedProspect.id,
          convertedAt: new Date(),
        },
      });

      // Logger l'activité
      await this.logActivity(userId, 'lead_merged', leadId, mergedProspect.id);

      return mergedProspect;
    }

    // 3. Construire les métadonnées enrichies à préserver
    const prospectingMetadata = {
      leadType: lead.leadType,
      intention: lead.intention,
      urgency: lead.urgency,
      seriousnessScore: lead.seriousnessScore,
      validationStatus: lead.validationStatus,
      qualificationNotes: lead.qualificationNotes,
      propertyTypes: lead.propertyTypes,
      surfaceM2: lead.surfaceM2,
      rooms: lead.rooms,
      budgetMin: lead.budgetMin,
      budgetMax: lead.budgetMax,
      sourceUrl: lead.sourceUrl,
      rawText: lead.rawText,
      originalCampaignId: lead.campaignId,
      convertedFromLeadId: lead.id,
      convertedAt: new Date().toISOString(),
    };

    // 4. Créer le prospect avec toutes les métadonnées
    const prospect = await this.prisma.prospects.create({
      data: {
        userId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        zipCode: lead.zipCode,
        type: this.mapLeadTypeToProspectType(lead.leadType, lead.intention),
        budget:
          lead.budget ||
          (lead.budgetMin || lead.budgetMax ? { min: lead.budgetMin, max: lead.budgetMax } : null),
        preferences: lead.metadata,
        source: `Prospection: ${lead.source}`,
        status: 'active',
        score: lead.seriousnessScore || lead.score || 50,
        notes: lead.qualificationNotes || `Converti depuis lead ${leadId}`,
        metadata: prospectingMetadata,
      },
    });

    // 5. Mettre à jour le lead
    await this.prisma.prospecting_leads.update({
      where: { id: leadId },
      data: {
        status: 'converted',
        convertedProspectId: prospect.id,
        convertedAt: new Date(),
      },
    });

    // 6. Mettre à jour les prospecting_matches existants avec le prospectId
    await this.prisma.prospecting_matches.updateMany({
      where: { leadId: lead.id },
      data: { prospectId: prospect.id },
    });

    // 7. Logger l'activité
    await this.logActivity(userId, 'lead_converted', leadId, prospect.id);

    this.logger.log(`Lead ${leadId} converted to prospect ${prospect.id}`);
    return prospect;
  }

  /**
   * Calculer le score d'un lead
   */
  async calculateLeadScore(lead: any): Promise<number> {
    let score = 0;

    // Email valide: +20 (utilise UnifiedValidationService)
    if (lead.email) {
      const emailValidation = await this.validationService.validateEmail(lead.email);
      if (emailValidation.isValid) {
        score += 20;
        // Bonus pour email professionnel
        if (!emailValidation.format.isFreeProvider) {
          score += 5;
        }
      } else if (emailValidation.format.isDisposable) {
        // Pénalité pour email jetable
        score -= 15;
      }
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
      const budgetValue =
        typeof lead.budget === 'object' ? lead.budget.max || lead.budget.min || 0 : lead.budget;
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
        keys.forEach((key) => uniqueLeads.set(key, lead));
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
   * Trouver des doublons potentiels pour un lead
   */
  async findPotentialDuplicates(userId: string, leadId: string) {
    const lead = await this.getLeadById(userId, leadId);

    const otherLeads = await this.prisma.prospecting_leads.findMany({
      where: {
        userId,
        id: { not: leadId },
      },
    });

    const potentialDuplicates: any[] = [];

    for (const other of otherLeads) {
      let similarity = 0;
      const reasons: string[] = [];

      // Comparer les emails
      if (lead.email && other.email && lead.email.toLowerCase() === other.email.toLowerCase()) {
        similarity += 50;
        reasons.push('Email identique');
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
        const nameSimilarity = 1 - distance / maxLen;

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
    const headers = [
      'Prénom',
      'Nom',
      'Email',
      'Téléphone',
      'Ville',
      'Type',
      'Budget',
      'Score',
      'Statut',
      'Source',
    ];
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
    const created: any[] = [];
    const errors: any[] = [];

    for (const leadData of leads) {
      try {
        const score = await this.calculateLeadScore(leadData);

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
    if (created.length > 0) {
      await this.prisma.prospecting_campaigns.update({
        where: { id: campaignId },
        data: {
          foundCount: { increment: created.length },
        },
      });
    }

    return {
      success: true,
      imported: created.length,
      errors: errors.length,
      errorDetails: errors,
    };
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Rechercher un prospect existant par email ou téléphone
   */
  private async findExistingProspect(userId: string, lead: any) {
    const conditions = [];

    if (lead.email) {
      conditions.push({ email: lead.email.toLowerCase() });
    }
    if (lead.phone) {
      const normalizedPhone = this.normalizePhone(lead.phone);
      conditions.push({ phone: normalizedPhone });
      conditions.push({ phone: lead.phone });
    }

    if (conditions.length === 0) return null;

    return this.prisma.prospects.findFirst({
      where: {
        userId,
        OR: conditions,
      },
    });
  }

  /**
   * Fusionner les données d'un lead dans un prospect existant
   */
  private async mergeLeadIntoProspect(prospect: any, lead: any) {
    const updates: any = {};

    // Compléter les champs manquants
    if (!prospect.firstName && lead.firstName) updates.firstName = lead.firstName;
    if (!prospect.lastName && lead.lastName) updates.lastName = lead.lastName;
    if (!prospect.phone && lead.phone) updates.phone = lead.phone;
    if (!prospect.email && lead.email) updates.email = lead.email;
    if (!prospect.city && lead.city) updates.city = lead.city;
    if (!prospect.address && lead.address) updates.address = lead.address;

    // Mettre à jour le score si le lead a un meilleur score
    const leadScore = lead.seriousnessScore || lead.score || 0;
    if (leadScore > (prospect.score || 0)) {
      updates.score = leadScore;
    }

    // Fusionner les métadonnées
    const existingMetadata = prospect.metadata || {};
    updates.metadata = {
      ...existingMetadata,
      mergedFromLeads: [...(existingMetadata.mergedFromLeads || []), lead.id],
      lastMergedAt: new Date().toISOString(),
      leadType: lead.leadType,
      intention: lead.intention,
      urgency: lead.urgency,
      seriousnessScore: lead.seriousnessScore,
    };

    // Ajouter une note sur la fusion
    const mergeNote = `\n[${new Date().toLocaleDateString('fr-FR')}] Fusionné avec lead ${lead.id} (${lead.source})`;
    updates.notes = (prospect.notes || '') + mergeNote;

    if (Object.keys(updates).length > 0) {
      return this.prisma.prospects.update({
        where: { id: prospect.id },
        data: updates,
      });
    }

    return prospect;
  }

  /**
   * Mapper le type de lead vers le type de prospect
   */
  private mapLeadTypeToProspectType(leadType: string | null, intention: string | null): string {
    if (intention === 'acheter' || intention === 'investir') return 'buyer';
    if (intention === 'louer') return 'tenant';
    if (intention === 'vendre' || leadType === 'mandat') return 'seller';
    if (leadType === 'requete') return 'buyer';
    return 'buyer'; // default
  }

  /**
   * Logger une activité de prospection
   */
  private async logActivity(userId: string, type: string, leadId: string, prospectId?: string) {
    try {
      await this.prisma.activity.create({
        data: {
          userId,
          type,
          entityType: 'prospecting_lead',
          entityId: leadId,
          description:
            type === 'lead_converted'
              ? `Lead converti en prospect ${prospectId}`
              : `Lead fusionné avec prospect existant ${prospectId}`,
          metadata: { leadId, prospectId },
        },
      });
    } catch (error) {
      // Ne pas bloquer si le logging échoue
      this.logger.warn(`Failed to log activity: ${error.message}`);
    }
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
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
        }
      }
    }

    return dp[m][n];
  }
}
