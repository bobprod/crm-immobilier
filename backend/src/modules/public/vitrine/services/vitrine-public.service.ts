import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/database/prisma.service';

@Injectable()
export class VitrinePublicService {
  constructor(private prisma: PrismaService) {}

  /** Résoudre la config depuis le slug */
  async findConfigBySlug(slug: string) {
    const config = await this.prisma.vitrineConfig.findFirst({ where: { slug } });
    if (!config) throw new NotFoundException(`Vitrine '${slug}' introuvable`);
    return config;
  }

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

    return { config, properties };
  }

  async getPublicVitrineBySlug(slug: string) {
    const config = await this.findConfigBySlug(slug);
    if (!config.isActive) throw new NotFoundException('Vitrine inactive');

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

    // Construction sécurisée avec requêtes paramétrées
    const conditions: Prisma.Sql[] = [
      Prisma.sql`pp."userId" = ${config.userId}`,
      Prisma.sql`p."deletedAt" IS NULL`,
    ];

    if (filters.type) conditions.push(Prisma.sql`p.type = ${filters.type.toLowerCase()}`);
    if (filters.category)
      conditions.push(Prisma.sql`p.category = ${filters.category.toLowerCase()}`);
    if (filters.city)
      conditions.push(Prisma.sql`LOWER(p.city) LIKE LOWER(${'%' + filters.city + '%'})`);
    if (filters.minPrice) conditions.push(Prisma.sql`p.price >= ${Number(filters.minPrice) || 0}`);
    if (filters.maxPrice)
      conditions.push(Prisma.sql`p.price <= ${Number(filters.maxPrice) || 999999999}`);
    if (filters.minArea) conditions.push(Prisma.sql`p.area >= ${Number(filters.minArea) || 0}`);
    if (filters.maxArea)
      conditions.push(Prisma.sql`p.area <= ${Number(filters.maxArea) || 999999999}`);
    if (filters.bedrooms)
      conditions.push(Prisma.sql`p.bedrooms >= ${Number(filters.bedrooms) || 0}`);

    const whereClause = Prisma.join(conditions, ' AND ');

    const orderMap: Record<string, Prisma.Sql> = {
      price_asc: Prisma.sql`p.price ASC`,
      price_desc: Prisma.sql`p.price DESC`,
      area_desc: Prisma.sql`p.area DESC`,
    };
    const orderSQL = orderMap[filters.sort || ''] || Prisma.sql`p."createdAt" DESC`;

    const countResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE ${whereClause}
    `;
    const total = Number(countResult[0]?.count || 0);

    const items = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.reference, p.title, p.description, p.type, p.category,
             p.price, p.currency, p.city, p.delegation, p.bedrooms, p.bathrooms,
             p.area, p.images, p.features, p.tags, p.status, p.latitude, p.longitude,
             p."viewsCount", p."createdAt", pp."isFeatured"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE ${whereClause}
      ORDER BY pp."isFeatured" DESC, ${orderSQL}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const citiesResult = await this.prisma.$queryRaw<{ city: string }[]>`
      SELECT DISTINCT p.city
      FROM properties p
      WHERE p."userId" = ${config.userId}
        AND p."deletedAt" IS NULL
        AND p.city IS NOT NULL
      ORDER BY p.city
    `;

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      filters: { cities: citiesResult.map((c) => c.city) },
    };
  }

  async getPublicPropertyDetail(slug: string, propertyRef: string) {
    const config = await this.findConfigBySlug(slug);

    const results = await this.prisma.$queryRaw<any[]>`
      SELECT p.*, pp."isFeatured"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${config.userId}
        AND p."deletedAt" IS NULL
        AND (p.id = ${propertyRef} OR p.reference = ${propertyRef})
      LIMIT 1
    `;

    if (!results.length) throw new NotFoundException('Bien introuvable');
    const property = results[0];

    // Incrémenter les vues
    await this.prisma.$executeRaw`
      UPDATE properties SET "viewsCount" = COALESCE("viewsCount", 0) + 1
      WHERE id = ${property.id}
    `;

    // Biens similaires
    const similar = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.title, p.price, p.currency, p.city, p.bedrooms, p.area, p.images, p.type
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${config.userId}
        AND p.id != ${property.id}
        AND p."deletedAt" IS NULL
        AND p.type = ${property.type}
      LIMIT 4
    `;

    // Stats contact
    const contactResult = await this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "PublicLead"
      WHERE "vitrineConfigId" = ${config.id}
        AND "propertyId" = ${property.id}
    `;

    return {
      ...property,
      contactCount: Number(contactResult[0]?.count || 0),
      similarProperties: similar,
      agencyConfig: {
        agencyName: config.agencyName,
        phone: config.phone,
        email: config.email,
        primaryColor: config.primaryColor,
        logo: config.logo,
      },
    };
  }

  async getPublicSitemap(slug: string): Promise<string> {
    const config = await this.findConfigBySlug(slug);
    const baseUrl = `https://${slug}.${process.env.APP_DOMAIN || 'app.example.com'}`;

    const properties = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p."updatedAt"
      FROM "PublishedProperty" pp
      JOIN properties p ON p.id = pp."propertyId"
      WHERE pp."userId" = ${config.userId}
    `;

    const urls = [
      `<url><loc>${baseUrl}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
      `<url><loc>${baseUrl}/biens</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`,
      `<url><loc>${baseUrl}/agents</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
      `<url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
      ...properties.map((p) => {
        const lastmod = p.updatedAt
          ? new Date(p.updatedAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        return `<url><loc>${baseUrl}/biens/${p.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      }),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
  }
}
