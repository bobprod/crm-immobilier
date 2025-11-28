import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class ProspectsEnhancedService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un prospect enrichi avec toutes les informations
   */
  async createProspectEnhanced(userId: string, data: any) {
    return this.prisma.prospects.create({
      data: {
        ...data,
        userId,
      },
      include: {
        interactions: true,
        preferences_details: true,
        propertiesShown: true,
        timelineStages: true,
      },
    });
  }

  /**
   * Récupérer un prospect avec toutes ses relations
   */
  async getProspectFull(id: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id, userId },
      include: {
        interactions: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        preferences_details: true,
        propertiesShown: {
          include: {
            properties: true,
          },
          orderBy: { shownDate: 'desc' },
        },
        timelineStages: {
          orderBy: { enteredAt: 'desc' },
        },
        matches: {
          include: {
            properties: true,
          },
        },
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        documents: true,
        communications: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return prospect;
  }

  /**
   * Ajouter une interaction à un prospect
   */
  async addInteraction(prospectId: string, userId: string, data: any) {
    // Vérifier que le prospect appartient à l'utilisateur
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return this.prisma.prospect_interactions.create({
      data: {
        prospectId,
        userId,
        channel: data.channel || 'phone',
        type: data.type || 'call',
        subject: data.subject,
        notes: data.notes,
        nextAction: data.nextAction,
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
        sentiment: data.sentiment,
        propertyShown: data.propertyShown,
        feedback: data.feedback,
      },
    });
  }

  /**
   * Définir une préférence pour un prospect
   */
  async setPreference(prospectId: string, userId: string, data: any) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    // Upsert la préférence
    const existing = await this.prisma.prospect_preferences.findFirst({
      where: { prospectId, category: data.category },
    });

    if (existing) {
      return this.prisma.prospect_preferences.update({
        where: { id: existing.id },
        data: {
          liked: data.liked,
          disliked: data.disliked,
          priority: data.priority,
          notes: data.notes,
        },
      });
    }

    return this.prisma.prospect_preferences.create({
      data: {
        prospectId,
        category: data.category,
        liked: data.liked,
        disliked: data.disliked,
        priority: data.priority || 1,
        notes: data.notes,
      },
    });
  }

  /**
   * Récupérer les préférences d'un prospect
   */
  async getPreferences(prospectId: string, userId: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return this.prisma.prospect_preferences.findMany({
      where: { prospectId },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Enregistrer un bien montré à un prospect
   */
  async recordPropertyShown(prospectId: string, userId: string, data: any) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    return this.prisma.prospect_properties_shown.create({
      data: {
        prospectId,
        propertyId: data.propertyId,
        visitType: data.visitType,
        feedback: data.feedback,
        interestLevel: data.interestLevel,
        reasons: data.reasons,
        outcome: data.outcome,
      },
      include: {
        properties: true,
      },
    });
  }

  /**
   * Changer l'étape du funnel d'un prospect
   */
  async changeStage(prospectId: string, userId: string, stage: string) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    // Fermer l'étape précédente
    const currentStage = await this.prisma.prospect_timeline.findFirst({
      where: { prospectId, exitedAt: null },
    });

    if (currentStage) {
      const duration = Math.floor(
        (Date.now() - currentStage.enteredAt.getTime()) / 1000 / 60,
      );
      await this.prisma.prospect_timeline.update({
        where: { id: currentStage.id },
        data: {
          exitedAt: new Date(),
          duration,
        },
      });
    }

    // Créer la nouvelle étape
    await this.prisma.prospect_timeline.create({
      data: {
        prospectId,
        stage,
      },
    });

    // Mettre à jour le statut du prospect
    return this.prisma.prospects.update({
      where: { id: prospectId },
      data: { status: stage },
    });
  }

  /**
   * Récupérer les prospects par type
   */
  async getProspectsByType(userId: string, type: string) {
    return this.prisma.prospects.findMany({
      where: { userId, prospectType: type },
      include: {
        interactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Récupérer les actions du jour
   */
  async getActionsToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [appointments, followUps] = await Promise.all([
      this.prisma.appointments.findMany({
        where: {
          userId,
          startTime: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          prospects: true,
          properties: true,
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.prospect_interactions.findMany({
        where: {
          userId,
          nextActionDate: {
            gte: today,
            lt: tomorrow,
          },
        },
        include: {
          prospects: true,
        },
        orderBy: { nextActionDate: 'asc' },
      }),
    ]);

    return { appointments, followUps };
  }

  /**
   * Statistiques par type de prospect
   */
  async getStatsByType(userId: string) {
    const stats = await this.prisma.prospects.groupBy({
      by: ['prospectType'],
      where: { userId },
      _count: true,
    });

    const byStatus = await this.prisma.prospects.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    return { byType: stats, byStatus };
  }

  /**
   * Recherche intelligente de prospects
   */
  async smartSearch(userId: string, criteria: any) {
    const where: any = { userId };

    if (criteria.query) {
      where.OR = [
        { firstName: { contains: criteria.query, mode: 'insensitive' } },
        { lastName: { contains: criteria.query, mode: 'insensitive' } },
        { email: { contains: criteria.query, mode: 'insensitive' } },
        { phone: { contains: criteria.query } },
      ];
    }

    if (criteria.type) where.type = criteria.type;
    if (criteria.prospectType) where.prospectType = criteria.prospectType;
    if (criteria.status) where.status = criteria.status;
    if (criteria.minScore) where.score = { gte: criteria.minScore };

    return this.prisma.prospects.findMany({
      where,
      include: {
        interactions: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: criteria.orderBy || { updatedAt: 'desc' },
      take: criteria.limit || 50,
    });
  }

  /**
   * Obtenir les propriétés recommandées pour un prospect
   */
  async getRecommendedProperties(prospectId: string, userId: string, limit = 10) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new NotFoundException('Prospect non trouvé');
    }

    const where: any = { userId };

    // Filtrer par budget si défini
    if (prospect.budget) {
      const budget = prospect.budget as any;
      if (budget.max) {
        where.price = { lte: budget.max * 1.1 };
      }
    }

    // Filtrer par critères de recherche
    if (prospect.searchCriteria) {
      const criteria = prospect.searchCriteria as any;
      if (criteria.propertyType) where.type = criteria.propertyType;
      if (criteria.city) where.city = { contains: criteria.city, mode: 'insensitive' };
    }

    const properties = await this.prisma.properties.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Calculer un score de match pour chaque propriété
    return properties.map((property) => ({
      ...property,
      matchScore: this.calculateMatchScore(prospect, property),
    }));
  }

  /**
   * Vérifier le match entre un prospect et une propriété
   */
  async checkPropertyMatch(prospectId: string, propertyId: string, userId: string) {
    const [prospect, property] = await Promise.all([
      this.prisma.prospects.findFirst({ where: { id: prospectId, userId } }),
      this.prisma.properties.findFirst({ where: { id: propertyId, userId } }),
    ]);

    if (!prospect || !property) {
      throw new NotFoundException('Prospect ou propriété non trouvé');
    }

    const score = this.calculateMatchScore(prospect, property);
    const reasons = this.getMatchReasons(prospect, property);

    return {
      score,
      reasons,
      isGoodMatch: score >= 70,
    };
  }

  /**
   * Calculer le score de match
   */
  private calculateMatchScore(prospect: any, property: any): number {
    let score = 0;

    // Budget (40 points max)
    if (prospect.budget && property.price) {
      const budget = prospect.budget as any;
      const maxBudget = budget.max || budget.min || 0;
      if (maxBudget > 0) {
        const diff = Math.abs((maxBudget - property.price) / maxBudget);
        if (diff < 0.1) score += 40;
        else if (diff < 0.2) score += 30;
        else if (diff < 0.3) score += 20;
      }
    }

    // Type de propriété (20 points)
    if (prospect.searchCriteria) {
      const criteria = prospect.searchCriteria as any;
      if (criteria.propertyType === property.type) {
        score += 20;
      }
    }

    // Localisation (30 points)
    if (prospect.searchCriteria) {
      const criteria = prospect.searchCriteria as any;
      if (criteria.city && property.city) {
        if (criteria.city.toLowerCase() === property.city.toLowerCase()) {
          score += 30;
        }
      }
    }

    // Critères supplémentaires (10 points)
    if (prospect.searchCriteria) {
      const criteria = prospect.searchCriteria as any;
      if (criteria.bedrooms && property.bedrooms >= criteria.bedrooms) {
        score += 5;
      }
      if (criteria.area && property.area >= criteria.area) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Obtenir les raisons du match
   */
  private getMatchReasons(prospect: any, property: any): string[] {
    const reasons: string[] = [];

    if (prospect.budget && property.price) {
      const budget = prospect.budget as any;
      const maxBudget = budget.max || budget.min || 0;
      if (maxBudget > 0 && property.price <= maxBudget * 1.1) {
        reasons.push('Budget compatible');
      }
    }

    if (prospect.searchCriteria) {
      const criteria = prospect.searchCriteria as any;
      if (criteria.propertyType === property.type) {
        reasons.push('Type de bien correspondant');
      }
      if (criteria.city && property.city?.toLowerCase() === criteria.city.toLowerCase()) {
        reasons.push('Localisation recherchée');
      }
    }

    return reasons;
  }
}
