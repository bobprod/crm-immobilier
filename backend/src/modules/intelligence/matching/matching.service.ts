import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import {
  calculateMatchScore,
  getPriceRangeForSearch,
  MATCH_WEIGHTS,
} from '../../../shared/utils/matching.utils';

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

    this.logger.log(`Generating matches for ${prospects.length} prospects and ${properties.length} properties`);

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
            propertyTypes: preferences.propertyTypes || (preferences.type ? [preferences.type] : []),
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

    this.logger.log(`Synced ${prospectingMatches.length} prospecting matches for prospect ${prospectId}`);
  }

  async findAll(userId: string, filters?: any) {
    const where: any = { properties: { userId } };

    if (filters?.minScore) where.score = { gte: parseFloat(filters.minScore) };
    if (filters?.status) where.status = filters.status;

    return this.prisma.matches.findMany({
      where,
      include: { properties: true, prospects: true },
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
    const match = await this.prisma.matches.findFirst({
      where: { id: matchId, properties: { userId } },
      include: { properties: true, prospects: true },
    });

    if (!match) throw new Error('Match not found');

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
    const matches = await this.prisma.matches.findMany({
      where: { properties: { userId }, status: 'contacted' },
      include: { properties: true, prospects: true },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    return { interactions: matches };
  }
}
