import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  calculateMatchScore,
  getPriceRangeForSearch,
  MATCH_WEIGHTS,
} from '../../../shared/utils/matching.utils';
import { ErrorHandler } from '../../../shared/utils/error-handler.utils';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Génère les matches entre prospects et propriétés
   * Utilise l'algorithme de scoring unifié (partagé avec prospecting)
   */
  async generateMatches(userId: string) {
    const properties = await this.prisma.properties.findMany({
      where: { userId, status: 'available' },
    });

    const prospects = await this.prisma.prospects.findMany({
      where: { userId, status: 'active' },
    });

    this.logger.log(
      `Generating matches for ${prospects.length} prospects and ${properties.length} properties`,
    );

    const matches = [];

    for (const prospect of prospects) {
      // Extraire les critères du prospect
      const preferences = (prospect.preferences as any) || {};
      const budget = (prospect.budget as any) || {};

      // Pré-filtrer par prix si budget défini
      const priceRange = getPriceRangeForSearch(
        budget.min || preferences.budgetMin || null,
        budget.max || preferences.budgetMax || null,
      );

      const candidateProperties = properties.filter(
        (p) => !priceRange.max || (p.price >= priceRange.min && p.price <= priceRange.max),
      );

      for (const property of candidateProperties) {
        // Utiliser l'algorithme de scoring unifié
        const result = calculateMatchScore(
          {
            budgetMin: budget.min || preferences.budgetMin || null,
            budgetMax: budget.max || preferences.budgetMax || null,
            city: prospect.city || preferences.city || null,
            country: preferences.country || 'Tunisie',
            propertyTypes:
              preferences.propertyTypes || (preferences.type ? [preferences.type] : []),
            urgency: preferences.urgency || null,
            seriousnessScore: prospect.score || null,
          },
          {
            price: property.price,
            city: property.city,
            type: property.type,
          },
        );

        if (result.isQualified) {
          matches.push({
            propertyId: property.id,
            prospectId: prospect.id,
            score: result.score,
            reasons: result.reasons,
          });
        }
      }
    }

    // Sauvegarder les matches
    for (const match of matches) {
      await this.prisma.matches.upsert({
        where: {
          propertyId_prospectId: {
            propertyId: match.propertyId,
            prospectId: match.prospectId,
          },
        },
        update: { score: match.score, reasons: match.reasons },
        create: match,
      });
    }

    this.logger.log(`Generated ${matches.length} qualified matches`);
    return matches;
  }

  /**
   * Synchronise les matches de prospecting vers matches après conversion de lead
   */
  async syncProspectingMatches(prospectId: string) {
    const prospectingMatches = await this.prisma.prospecting_matches.findMany({
      where: { prospectId },
    });

    for (const pm of prospectingMatches) {
      await this.prisma.matches.upsert({
        where: {
          propertyId_prospectId: {
            propertyId: pm.propertyId,
            prospectId: pm.prospectId!,
          },
        },
        update: {
          score: pm.score,
          reasons: pm.reason,
        },
        create: {
          propertyId: pm.propertyId,
          prospectId: pm.prospectId!,
          score: pm.score,
          reasons: pm.reason,
          status: pm.status,
        },
      });
    }

    this.logger.log(
      `Synced ${prospectingMatches.length} prospecting matches for prospect ${prospectId}`,
    );
  }

  async findAll(userId: string, filters?: any) {
    // First get all properties for this user
    const userProperties = await this.prisma.properties.findMany({
      where: { userId },
      select: { id: true },
    });

    const propertyIds = userProperties.map((p) => p.id);

    // If user has no properties, return empty array
    if (propertyIds.length === 0) {
      return [];
    }

    const where: any = {
      propertyId: { in: propertyIds },
    };

    if (filters?.minScore) where.score = { gte: parseFloat(filters.minScore) };
    if (filters?.status) where.status = filters.status;

    return this.prisma.matches.findMany({
      where,
      include: {
        properties: true,
        prospects: true,
      },
      orderBy: { score: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.matches.update({
      where: { id },
      data: { status },
    });
  }

  async performAction(matchId: string, userId: string, action: any) {
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: { properties: true, prospects: true },
    });

    // Verify the property belongs to the user
    if (!match || match.properties.userId !== userId) {
      ErrorHandler.notFound('Match');
    }

    let result;
    if (action.type === 'appointment') {
      const appointment = await this.prisma.appointments.create({
        data: {
          userId,
          prospectId: match.prospectId,
          title: `Visite - ${match.properties.title}`,
          description: action.description || '',
          startTime: new Date(action.startTime),
          endTime: new Date(action.endTime),
          location: match.properties.address || '',
          type: 'viewing',
          status: 'scheduled',
        },
      });
      result = { success: true, message: 'Rendez-vous créé', appointment };
    } else {
      result = { success: true, message: 'Action effectuée' };
    }

    await this.prisma.matches.update({
      where: { id: matchId },
      data: { status: 'contacted' },
    });

    return result;
  }

  async getInteractions(userId: string) {
    const userProperties = await this.prisma.properties.findMany({
      where: { userId },
      select: { id: true },
    });
    const propertyIds = userProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return { interactions: [] };
    }

    const matches = await this.prisma.matches.findMany({
      where: {
        propertyId: { in: propertyIds },
        status: 'contacted',
      },
      include: { properties: true, prospects: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return { interactions: matches };
  }

  async getStats(userId: string) {
    const userProperties = await this.prisma.properties.findMany({
      where: { userId },
      select: { id: true },
    });
    const propertyIds = userProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return {
        total: 0,
        excellent: 0,
        good: 0,
        average: 0,
        avgScore: 0,
        byStatus: [],
      };
    }

    const [total, byScore, avgScore] = await Promise.all([
      this.prisma.matches.count({ where: { propertyId: { in: propertyIds } } }),
      this.prisma.matches.groupBy({
        by: ['status'],
        where: { propertyId: { in: propertyIds } },
        _count: true,
      }),
      this.prisma.matches.aggregate({
        where: { propertyId: { in: propertyIds } },
        _avg: { score: true },
      }),
    ]);

    const matches = await this.prisma.matches.findMany({
      where: { propertyId: { in: propertyIds } },
      select: { score: true },
    });

    const excellent = matches.filter((m) => m.score >= 80).length;
    const good = matches.filter((m) => m.score >= 60 && m.score < 80).length;
    const average = matches.filter((m) => m.score < 60).length;

    return {
      total,
      excellent,
      good,
      average,
      avgScore: Math.round(avgScore._avg.score || 0),
      byStatus: byScore,
    };
  }

  async getProspectMatches(userId: string, prospectId: string) {
    const userProperties = await this.prisma.properties.findMany({
      where: { userId },
      select: { id: true },
    });
    const propertyIds = userProperties.map((p) => p.id);

    if (propertyIds.length === 0) {
      return [];
    }

    return this.prisma.matches.findMany({
      where: {
        prospectId,
        propertyId: { in: propertyIds },
      },
      include: { properties: true },
      orderBy: { score: 'desc' },
    });
  }

  async getPropertyMatches(userId: string, propertyId: string) {
    // Verify the property belongs to the user
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      ErrorHandler.notFound('Property');
    }

    return this.prisma.matches.findMany({
      where: {
        propertyId,
      },
      include: { prospects: true },
      orderBy: { score: 'desc' },
    });
  }

  async createManualMatch(userId: string, prospectId: string, propertyId: string) {
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!property || !prospect) {
      ErrorHandler.notFound('Property or prospect');
    }

    // Calculate score using unified algorithm
    const preferences = (prospect.preferences as Record<string, unknown>) || {};
    const budget = (prospect.budget as Record<string, number>) || {};

    const result = calculateMatchScore(
      {
        budgetMin: budget.min || (preferences.budgetMin as number) || null,
        budgetMax: budget.max || (preferences.budgetMax as number) || null,
        city: prospect.city || (preferences.city as string) || null,
        country: (preferences.country as string) || 'Tunisie',
        propertyTypes:
          (preferences.propertyTypes as string[]) ||
          (preferences.type ? [preferences.type as string] : []),
        urgency: (preferences.urgency as string) || null,
        seriousnessScore: prospect.score || null,
      },
      {
        price: property.price,
        city: property.city,
        type: property.type,
      },
    );

    return this.prisma.matches.create({
      data: {
        propertyId,
        prospectId,
        score: result.score,
        reasons: result.reasons,
        status: 'pending',
      },
      include: { properties: true, prospects: true },
    });
  }

  async findMatchesForProspect(userId: string, prospectId: string, filters?: any) {
    const prospect = await this.prisma.prospects.findFirst({
      where: { id: prospectId, userId },
    });

    if (!prospect) {
      throw new Error('Prospect not found');
    }

    const preferences = (prospect.preferences as Record<string, unknown>) || {};
    const budget = (prospect.budget as Record<string, number>) || {};

    const priceRange = getPriceRangeForSearch(
      budget.min || (preferences.budgetMin as number) || null,
      budget.max || (preferences.budgetMax as number) || null,
    );

    const where: any = { userId, status: 'available' };
    if (priceRange.max) {
      where.price = { gte: priceRange.min, lte: priceRange.max };
    }
    if (filters?.propertyType) {
      where.type = filters.propertyType;
    }
    // Note: 'contains' not supported by pg driver — city filter applied in-memory below

    const allProperties = await this.prisma.properties.findMany({ where });

    // In-memory case-insensitive city filter
    const properties = filters?.location
      ? allProperties.filter((p: any) =>
          p.city?.toLowerCase().includes((filters.location as string).toLowerCase()),
        )
      : allProperties;

    const matches = [];
    for (const property of properties) {
      const result = calculateMatchScore(
        {
          budgetMin: budget.min || (preferences.budgetMin as number) || null,
          budgetMax: budget.max || (preferences.budgetMax as number) || null,
          city: prospect.city || (preferences.city as string) || null,
          country: (preferences.country as string) || 'Tunisie',
          propertyTypes: (preferences.propertyTypes as string[]) || [],
          urgency: (preferences.urgency as string) || null,
          seriousnessScore: prospect.score || null,
        },
        {
          price: property.price,
          city: property.city,
          type: property.type,
        },
      );

      if (!filters?.minScore || result.score >= (filters.minScore as number)) {
        matches.push({
          id: `temp-${prospect.id}-${property.id}`,
          prospectId: prospect.id,
          propertyId: property.id,
          score: result.score,
          reasons: result.reasons,
          property,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  async findMatchesForProperty(userId: string, propertyId: string, filters?: any) {
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      ErrorHandler.notFound('Property');
    }

    const where: any = { userId, status: 'active' };
    if (filters?.location) {
      // Note: 'contains' not supported — filter in-memory below
    }

    const allProspects = await this.prisma.prospects.findMany({ where });

    // In-memory case-insensitive city filter
    const prospects = filters?.location
      ? allProspects.filter((p: any) =>
          p.city?.toLowerCase().includes((filters.location as string).toLowerCase()),
        )
      : allProspects;

    const matches = [];
    for (const prospect of prospects) {
      const preferences = (prospect.preferences as Record<string, unknown>) || {};
      const budget = (prospect.budget as Record<string, number>) || {};

      const result = calculateMatchScore(
        {
          budgetMin: budget.min || (preferences.budgetMin as number) || null,
          budgetMax: budget.max || (preferences.budgetMax as number) || null,
          city: prospect.city || (preferences.city as string) || null,
          country: (preferences.country as string) || 'Tunisie',
          propertyTypes: (preferences.propertyTypes as string[]) || [],
          urgency: (preferences.urgency as string) || null,
          seriousnessScore: prospect.score || null,
        },
        {
          price: property.price,
          city: property.city,
          type: property.type,
        },
      );

      if (!filters?.minScore || result.score >= (filters.minScore as number)) {
        matches.push({
          id: `temp-${property.id}-${prospect.id}`,
          prospectId: prospect.id,
          propertyId: property.id,
          score: result.score,
          reasons: result.reasons,
          prospect,
        });
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  async findOne(userId: string, id: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
      include: { properties: true, prospects: true },
    });

    if (!match || match.properties.userId !== userId) {
      ErrorHandler.notFound('Match');
    }

    return match;
  }

  async deleteMatch(userId: string, id: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
      include: { properties: true },
    });

    if (!match || match.properties.userId !== userId) {
      ErrorHandler.notFound('Match');
    }

    await this.prisma.matches.delete({ where: { id } });

    return { success: true };
  }
}
