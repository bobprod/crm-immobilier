import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { UpdateVitrineConfigDto, UpdatePublishedPropertyDto, SubmitLeadDto } from './dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class VitrineService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
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
    return this.prisma.$queryRaw<any[]>`
      SELECT p.*, pp."isFeatured", pp."order" as "publishedOrder"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${userId}
      ORDER BY pp."isFeatured" DESC, pp."order" ASC
    `;
  }

  async publishProperty(userId: string, propertyId: string, dto: UpdatePublishedPropertyDto) {
    // Vérifier que le bien existe
    const property = await this.prisma.properties.findFirst({
      where: { id: propertyId, userId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    // Vérifier si déjà publié
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
      data: {
        propertyId,
        userId,
        ...dto,
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
      where: { id: published.id },
    });
  }

  /**
   * Analytics de la vitrine
   */
  async getAnalytics(userId: string, period?: string) {
    const startDate = this.getStartDate(period);

    const analytics = await this.prisma.$queryRaw<any[]>(
      `SELECT * FROM "VitrineAnalytics"
       WHERE "userId" = '${userId}' AND date >= '${startDate.toISOString()}'
       ORDER BY date DESC`,
    );

    return {
      analytics,
      total: {
        pageViews: analytics.reduce((sum, a) => sum + (a.pageViews || 0), 0),
        visitors: analytics.reduce((sum, a) => sum + (a.visitors || 0), 0),
      },
    };
  }

  /**
   * Vitrine publique (sans authentification)
   */
  async getPublicVitrine(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.isActive) {
      throw new NotFoundException('Vitrine not found or inactive');
    }

    const properties = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.reference, p.title, p.description, p.type, p.category,
             p.price, p.currency, p.city, p.delegation, p.bedrooms, p.bathrooms,
             p.area, p.images, p.features, p."createdAt",
             pp."isFeatured", pp."order" as "publishedOrder"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${userId}
      ORDER BY pp."isFeatured" DESC, pp."order" ASC
    `;

    return {
      config,
      properties,
    };
  }

  // ============================================================
  // MÉTHODES PUBLIQUES PAR SLUG
  // ============================================================

  /** Helper — résoudre la config depuis le slug */
  private async findConfigBySlug(slug: string) {
    const config = await this.prisma.vitrineConfig.findFirst({ where: { slug } });
    if (!config) throw new NotFoundException(`Vitrine '${slug}' introuvable`);
    return config;
  }

  async getPublicVitrineBySlug(slug: string) {
    const config = await this.findConfigBySlug(slug);
    if (!config.isActive) throw new NotFoundException('Vitrine inactive');

    // Propriétés vedettes (JOIN via SQL raw)
    const featuredProperties = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.reference, p.title, p.description, p.type, p.category,
             p.price, p.currency, p.city, p.delegation, p.bedrooms, p.bathrooms,
             p.area, p.images, p.features, p.tags, p.status, p.latitude, p.longitude,
             p."viewsCount", p."createdAt",
             pp."isFeatured", pp."order" as "publishedOrder"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${config.userId}
        AND p."deletedAt" IS NULL
      ORDER BY pp."isFeatured" DESC, pp."order" ASC
      LIMIT 12
    `;

    const agents = await this.prisma.publicAgentProfile.findMany({
      where: { vitrineConfigId: config.id, isActive: true },
      orderBy: { order: 'asc' },
    });

    const totalProperties = await this.prisma.publishedProperty.count({
      where: { userId: config.userId },
    });

    return {
      config,
      featuredProperties,
      agents,
      stats: { totalProperties, propertyTypeStats: [] },
    };
  }

  async getPublicPropertiesBySlug(
    slug: string,
    filters: {
      type?: string;
      category?: string;
      city?: string;
      minPrice?: number;
      maxPrice?: number;
      minArea?: number;
      maxArea?: number;
      bedrooms?: number;
      sort?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const config = await this.findConfigBySlug(slug);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(filters.limit || 12, 50);
    const offset = (page - 1) * limit;

    // Sanitiser les entrées pour éviter les injections SQL
    const sanitize = (val: string) => val.replace(/'/g, "''");

    // Construire les conditions WHERE dynamiquement
    const conditions: string[] = [
      `pp."userId" = '${sanitize(config.userId)}'`,
      `p."deletedAt" IS NULL`,
    ];
    if (filters.type) conditions.push(`p.type = '${sanitize(filters.type.toLowerCase())}'`);
    if (filters.category) conditions.push(`p.category = '${sanitize(filters.category.toLowerCase())}'`);
    if (filters.city) conditions.push(`LOWER(p.city) LIKE LOWER('%${sanitize(filters.city)}%')`);
    if (filters.minPrice) conditions.push(`p.price >= ${Number(filters.minPrice) || 0}`);
    if (filters.maxPrice) conditions.push(`p.price <= ${Number(filters.maxPrice) || 999999999}`);
    if (filters.minArea) conditions.push(`p.area >= ${Number(filters.minArea) || 0}`);
    if (filters.maxArea) conditions.push(`p.area <= ${Number(filters.maxArea) || 999999999}`);
    if (filters.bedrooms) conditions.push(`p.bedrooms >= ${Number(filters.bedrooms) || 0}`);

    const whereSQL = conditions.join(' AND ');

    const orderSQL =
      filters.sort === 'price_asc' ? 'p.price ASC'
      : filters.sort === 'price_desc' ? 'p.price DESC'
      : filters.sort === 'area_desc' ? 'p.area DESC'
      : 'p."createdAt" DESC';

    const countResult = await this.prisma.$queryRaw<[{ count: string }]>(
      `SELECT COUNT(*) as count FROM "PublishedProperty" pp JOIN properties p ON p.id = pp."propertyId" WHERE ${whereSQL}`,
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    const items = await this.prisma.$queryRaw<any[]>(
      `SELECT p.id, p.reference, p.title, p.description, p.type, p.category,
              p.price, p.currency, p.city, p.delegation, p.bedrooms, p.bathrooms,
              p.area, p.images, p.features, p.tags, p.status, p.latitude, p.longitude,
              p."viewsCount", p."createdAt", pp."isFeatured"
       FROM "PublishedProperty" pp
       JOIN properties p ON p.id = pp."propertyId"
       WHERE ${whereSQL}
       ORDER BY pp."isFeatured" DESC, ${orderSQL}
       LIMIT ${limit} OFFSET ${offset}`,
    );

    // Villes distinctes pour les filtres
    const citiesResult = await this.prisma.$queryRaw<{ city: string }[]>(
      `SELECT DISTINCT p.city FROM properties p WHERE p."userId" = '${sanitize(config.userId)}' AND p."deletedAt" IS NULL AND p.city IS NOT NULL ORDER BY p.city`,
    );

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      filters: { cities: citiesResult.map((c) => c.city) },
    };
  }

  async getPublicPropertyDetail(slug: string, propertyRef: string) {
    const config = await this.findConfigBySlug(slug);

    // Chercher par id ou reference
    const results = await this.prisma.$queryRaw<any[]>(
      `SELECT p.*, pp."isFeatured"
       FROM "PublishedProperty" pp
       JOIN properties p ON p.id = pp."propertyId"
       WHERE pp."userId" = '${config.userId}'
         AND p."deletedAt" IS NULL
         AND (p.id = '${propertyRef}' OR p.reference = '${propertyRef}')
       LIMIT 1`,
    );

    if (!results.length) throw new NotFoundException('Bien introuvable');
    const property = results[0];

    // Incrémenter les vues
    await this.prisma.$executeRaw(
      `UPDATE properties SET "viewsCount" = COALESCE("viewsCount", 0) + 1 WHERE id = '${property.id}'`,
    );

    // Biens similaires
    const similar = await this.prisma.$queryRaw<any[]>(
      `SELECT p.id, p.title, p.price, p.currency, p.city, p.bedrooms, p.area, p.images, p.type
       FROM "PublishedProperty" pp
       JOIN properties p ON p.id = pp."propertyId"
       WHERE pp."userId" = '${config.userId}'
         AND p.id != '${property.id}'
         AND p."deletedAt" IS NULL
         AND p.type = '${property.type}'
       LIMIT 4`,
    );

    // Stats contact
    const contactResult = await this.prisma.$queryRaw<[{ count: string }]>(
      `SELECT COUNT(*) as count FROM "PublicLead" WHERE "vitrineConfigId" = '${config.id}' AND "propertyId" = '${property.id}'`,
    );

    return {
      ...property,
      contactCount: parseInt(contactResult[0]?.count || '0', 10),
      similarProperties: similar,
      agencyConfig: {
        agencyName: config.agencyName,
        phone: config.phone,
        email: config.email,
        whatsappNumber: (config as any).whatsappNumber,
        primaryColor: config.primaryColor,
        logo: config.logo,
      },
    };
  }

  async getPublicAgents(slug: string) {
    const config = await this.findConfigBySlug(slug);
    return this.prisma.publicAgentProfile.findMany({
      where: { vitrineConfigId: config.id, isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async getPublicAgent(slug: string, agentId: string) {
    const config = await this.findConfigBySlug(slug);
    const agent = await this.prisma.publicAgentProfile.findFirst({
      where: { id: agentId, vitrineConfigId: config.id, isActive: true },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    return agent;
  }

  async submitPublicLead(slug: string, data: SubmitLeadDto, ipAddress?: string) {
    const config = await this.findConfigBySlug(slug);

    // Créer le PublicLead
    const lead = await this.prisma.publicLead.create({
      data: {
        vitrineConfigId: config.id,
        vitrineSlug: slug,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        message: data.message,
        type: data.type || 'CONTACT',
        propertyId: data.propertyId,
        agentProfileId: data.agentProfileId,
        utmSource: data.utmSource,
        utmMedium: data.utmMedium,
        utmCampaign: data.utmCampaign,
        referrer: data.referrer,
        ipAddress,
        status: 'NEW',
      },
    });

    // Auto-créer un Prospect dans le CRM
    const scoreBase = (data.phone ? 20 : 0) + (data.email ? 20 : 0);
    const prospect = await this.prisma.prospects.create({
      data: {
        userId: config.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        type: 'buyer',
        source: `vitrine_${(data.type || 'contact').toLowerCase()}`,
        status: 'active',
        notes: data.message,
        score: scoreBase,
      },
    });

    // Lier le lead au prospect
    await this.prisma.publicLead.update({
      where: { id: lead.id },
      data: { prospectId: prospect.id, status: 'CONVERTED', convertedAt: new Date() },
    });

    // Notifier l'agent avec priorité haute
    try {
      const propertyInfo = data.propertyId
        ? await this.prisma.properties.findUnique({
            where: { id: data.propertyId },
            select: { title: true, reference: true },
          })
        : null;

      await this.notificationsService.createNotification(
        {
          userId: config.userId,
          type: 'LEAD' as any,
          title: `🎯 Nouveau lead vitrine — ${data.firstName} ${data.lastName || ''}`,
          message: `${data.type}${propertyInfo ? ` · ${propertyInfo.title}` : ''} · ${data.email}${data.phone ? ` · ${data.phone}` : ''}`,
          actionUrl: `/prospects?highlight=${prospect.id}`,
          metadata: JSON.stringify({
            leadId: lead.id,
            prospectId: prospect.id,
            type: data.type,
            slug,
          }),
        },
        { priority: 'high', bypassSmartRouting: true },
      );
    } catch (e) {
      // Non-bloquant
      console.error('[Vitrine] Notification échec:', e);
    }

    return { success: true, leadId: lead.id, prospectId: prospect.id };
  }

  async getPublicSitemap(slug: string): Promise<string> {
    const config = await this.findConfigBySlug(slug);
    const baseUrl = (config as any).customDomain
      ? `https://${(config as any).customDomain}`
      : `https://${slug}.${process.env.APP_DOMAIN || 'app.example.com'}`;

    const properties = await this.prisma.$queryRaw<any[]>(
      `SELECT p.id, p."updatedAt" FROM "PublishedProperty" pp
       JOIN properties p ON p.id = pp."propertyId"
       WHERE pp."userId" = '${config.userId}'`,
    );

    const urls = [
      `<url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/biens</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/agents</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
      `<url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
      ...properties.map((p) => {
        const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        return `<url><loc>${baseUrl}/biens/${p.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  }

  async getPublicLeads(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) return [];
    return this.prisma.publicLead.findMany({
      where: { vitrineConfigId: config.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================================
  // GESTION AGENTS PUBLICS (SaaS Dashboard)
  // ============================================================

  async getAgentProfiles(userId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) return [];
    return this.prisma.publicAgentProfile.findMany({
      where: { vitrineConfigId: config.id },
      orderBy: { order: 'asc' },
    });
  }

  async upsertAgentProfile(userId: string, data: any) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) throw new NotFoundException('Vitrine non configurée');

    if (data.id) {
      return this.prisma.publicAgentProfile.update({
        where: { id: data.id },
        data: { ...data, vitrineConfigId: config.id },
      });
    }
    return this.prisma.publicAgentProfile.create({
      data: { ...data, vitrineConfigId: config.id },
    });
  }

  async deleteAgentProfile(userId: string, agentId: string) {
    const config = await this.prisma.vitrineConfig.findUnique({ where: { userId } });
    if (!config) throw new NotFoundException('Vitrine non configurée');
    const agent = await this.prisma.publicAgentProfile.findFirst({
      where: { id: agentId, vitrineConfigId: config.id },
    });
    if (!agent) throw new NotFoundException('Agent introuvable');
    return this.prisma.publicAgentProfile.delete({ where: { id: agentId } });
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
