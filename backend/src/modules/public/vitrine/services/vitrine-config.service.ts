import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto } from '../dto';

@Injectable()
export class VitrineConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      return this.prisma.vitrineConfig.create({
        data: {
          user: { connect: { id: userId } },
          agencyName: 'Mon Agence',
          phone: '',
          email: '',
          isActive: false,
        },
      });
    }

    return config;
  }

  async updateConfig(userId: string, dto: UpdateVitrineConfigDto) {
    const exists = await this.prisma.vitrineConfig.findUnique({
      where: { userId },
    });

    if (!exists) {
      return this.prisma.vitrineConfig.create({
        data: {
          userId,
          agencyName: dto.agencyName || 'Mon Agence',
          phone: dto.phone || '',
          email: dto.email || '',
          isActive: dto.isActive ?? false,
          logo: dto.logo,
          slogan: dto.slogan,
          primaryColor: dto.primaryColor,
          secondaryColor: dto.secondaryColor,
          address: dto.address,
          schedule: dto.schedule,
          socialLinks: dto.socialLinks,
          theme: dto.theme,
          heroImage: dto.heroImage,
          aboutText: dto.aboutText,
          services: dto.services,
          testimonials: dto.testimonials,
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          seoKeywords: dto.seoKeywords,
          analyticsId: dto.analyticsId,
        },
      });
    }

    return this.prisma.vitrineConfig.update({
      where: { userId },
      data: dto,
    });
  }

  async toggleVitrine(userId: string, isActive: boolean) {
    return this.prisma.vitrineConfig.update({
      where: { userId },
      data: { isActive },
    });
  }

  async getPublishedProperties(userId: string) {
    return this.prisma.$queryRaw<any[]>`
      SELECT p.*, pp."isFeatured", pp."order" as "publishedOrder"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${userId}
      ORDER BY pp."isFeatured" DESC, pp."order" ASC
    `;
  }

  async publishProperty(userId: string, propertyId: string, dto: UpdatePublishedPropertyDto) {
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const existing = await this.prisma.publishedProperty.findFirst({
      where: { propertyId, userId },
    });

    if (existing) {
      return this.prisma.publishedProperty.update({
        where: { id: existing.id },
        data: dto,
      });
    }

    return this.prisma.publishedProperty.create({
      data: { propertyId, userId, ...dto },
    });
  }

  async unpublishProperty(userId: string, propertyId: string) {
    const published = await this.prisma.publishedProperty.findFirst({
      where: { propertyId, userId },
    });

    if (!published) {
      throw new NotFoundException('Published property not found');
    }

    return this.prisma.publishedProperty.delete({
      where: { id: published.id },
    });
  }

  async getAnalytics(userId: string, period?: string) {
    const startDate = this.getStartDate(period);

    const analytics = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "VitrineAnalytics"
      WHERE "userId" = ${userId} AND date >= ${startDate}
      ORDER BY date DESC
    `;

    return {
      analytics,
      total: {
        pageViews: analytics.reduce((sum, a) => sum + (a.pageViews || 0), 0),
        visitors: analytics.reduce((sum, a) => sum + (a.visitors || 0), 0),
      },
    };
  }

  private getStartDate(period?: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
