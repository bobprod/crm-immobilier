import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  async generateMatches(userId: string) {
    const properties = await this.prisma.properties.findMany({
      where: { userId, status: 'available' },
    });

    const prospects = await this.prisma.prospects.findMany({
      where: { userId, status: 'active' },
    });

    const matches = [];

    for (const property of properties) {
      for (const prospect of prospects) {
        const score = this.calculateMatchScore(property, prospect);

        if (score >= 50) {
          const reasons = this.getMatchReasons(property, prospect);
          matches.push({
            propertyId: property.id,
            prospectId: prospect.id,
            score,
            reasons,
          });
        }
      }
    }

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

    return matches;
  }

  private calculateMatchScore(property: any, prospect: any): number {
    let score = 0;
    const preferences = prospect.preferences || {};

    if (prospect.budget) {
      const priceDiff = Math.abs(property.price - prospect.budget);
      const priceRatio = priceDiff / prospect.budget;

      if (priceRatio <= 0.1) score += 30;
      else if (priceRatio <= 0.2) score += 20;
      else if (priceRatio <= 0.3) score += 10;
    }

    if (preferences.type && property.type === preferences.type) score += 20;
    if (preferences.category && property.category === preferences.category) score += 20;
    if (preferences.city && property.city === preferences.city) score += 15;
    if (preferences.bedrooms && property.bedrooms === preferences.bedrooms) score += 10;

    if (preferences.minArea && preferences.maxArea) {
      if (property.area >= preferences.minArea && property.area <= preferences.maxArea) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  private getMatchReasons(property: any, prospect: any): any {
    const reasons = [];
    const preferences = prospect.preferences || {};

    if (prospect.budget && Math.abs(property.price - prospect.budget) / prospect.budget <= 0.2) {
      reasons.push({ type: 'budget', message: 'Prix dans le budget' });
    }

    if (preferences.type && property.type === preferences.type) {
      reasons.push({ type: 'type', message: `Type: ${property.type}` });
    }

    if (preferences.city && property.city === preferences.city) {
      reasons.push({ type: 'location', message: `Ville: ${property.city}` });
    }

    return reasons;
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
