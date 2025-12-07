import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto } from './dto';
import { SeoAiService } from '../../content/seo-ai/seo-ai.service';

@Injectable()
export class VitrineService {
  constructor(
    private prisma: PrismaService,
    private seoAiService: SeoAiService,
  ) {}

  /**
   * Configuration de la vitrine
   */
  async getConfig(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({
      where: { userId },
    });

    if (!config) {
      // Créer une configuration par défaut
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

  /**
   * Biens publiés
   */
  async getPublishedProperties(userId: string) {
    return this.prisma.publishedProperty.findMany({
      where: { userId },
      include: {
        property: true,
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    });
  }

  async publishProperty(userId: string, propertyId: string, dto: UpdatePublishedPropertyDto) {
    // Vérifier que le bien existe
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Auto-optimisation SEO si non existante
    const seo = await this.prisma.propertySEO.findUnique({
      where: { propertyId },
    });

    if (!seo) {
      try {
        // Appeler le service SEO AI pour optimiser automatiquement
        await this.seoAiService.optimizeProperty(propertyId, userId);
      } catch (error) {
        console.error('SEO auto-optimization failed:', error);
        // Continue même si SEO échoue
      }
    }

    // Publier ou mettre à jour
    return this.prisma.publishedProperty.upsert({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
      create: {
        property: { connect: { id: propertyId } },
        user: { connect: { id: userId } },
        ...dto,
      },
      update: dto,
      include: {
        property: {
          include: {
            seo: true,
          },
        },
      },
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
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
    });
  }

  /**
   * Analytics de la vitrine
   */
  async getAnalytics(userId: string, period?: string) {
    const startDate = this.getStartDate(period);

    const analytics = await this.prisma.vitrineAnalytics.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return {
      analytics,
      total: {
        pageViews: analytics.reduce((sum, a) => sum + a.pageViews, 0),
        visitors: analytics.reduce((sum, a) => sum + a.visitors, 0),
      },
    };
  }

  /**
   * Vitrine publique (sans authentification)
   */
  async getPublicVitrine(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({
      where: { userId, isActive: true },
    });

    if (!config) {
      throw new NotFoundException('Vitrine not found or inactive');
    }

    const properties = await this.prisma.publishedProperty.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            reference: true,
            title: true,
            description: true,
            type: true,
            category: true,
            price: true,
            currency: true,
            city: true,
            delegation: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            images: true,
            features: true,
            createdAt: true,
            seo: {
              select: {
                metaTitle: true,
                metaDescription: true,
                keywords: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }],
    });

    return {
      config,
      properties: properties.map((p) => ({
        ...p.property,
        isFeatured: p.isFeatured,
        publishedOrder: p.order,
      })),
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
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut
    }
  }
}
