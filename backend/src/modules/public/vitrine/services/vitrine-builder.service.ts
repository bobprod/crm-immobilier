import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../shared/database/prisma.service';
import { CreateVitrinePageDto, UpdateVitrinePageDto } from '../dto';

@Injectable()
export class VitrineBuilderService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // TEMPLATES
  // ============================================

  async getTemplates() {
    return this.prisma.vitrineTemplate.findMany({
      where: { isActive: true },
    });
  }

  async getTemplateBySlug(slug: string) {
    const template = await this.prisma.vitrineTemplate.findFirst({
      where: { slug },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async applyTemplate(userId: string, templateSlug: string) {
    const template = await this.getTemplateBySlug(templateSlug);
    const config = await this.getOrCreateConfig(userId);

    // Mettre à jour le templateId
    await this.prisma.vitrineConfig.update({
      where: { id: config.id },
      data: { templateId: template.id },
    });

    // Supprimer les pages existantes
    const existingPages = await this.prisma.vitrinePage.findMany({
      where: { vitrineConfigId: config.id },
    });
    for (const page of existingPages) {
      await this.prisma.vitrinePage.delete({ where: { id: page.id } });
    }

    // Créer les pages par défaut du template
    const defaultPages = (template.defaultPages as any[]) || [];
    for (let i = 0; i < defaultPages.length; i++) {
      const pageDef = defaultPages[i];
      await this.prisma.vitrinePage.create({
        data: {
          vitrineConfigId: config.id,
          slug: pageDef.slug,
          title: pageDef.title,
          puckData: pageDef.puckData || {},
          order: i,
          isActive: true,
          isDefault: pageDef.isDefault || false,
        },
      });
    }

    return { template, pagesCreated: defaultPages.length };
  }

  // ============================================
  // PAGES
  // ============================================

  async getPages(userId: string) {
    const config = await this.getOrCreateConfig(userId);
    return this.prisma.vitrinePage.findMany({
      where: { vitrineConfigId: config.id },
    });
  }

  async getPage(userId: string, pageId: string) {
    const config = await this.getOrCreateConfig(userId);
    const page = await this.prisma.vitrinePage.findFirst({
      where: { id: pageId, vitrineConfigId: config.id },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async getPageBySlug(userId: string, pageSlug: string) {
    const config = await this.getOrCreateConfig(userId);
    const page = await this.prisma.vitrinePage.findFirst({
      where: { slug: pageSlug, vitrineConfigId: config.id },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async createPage(userId: string, dto: CreateVitrinePageDto) {
    const config = await this.getOrCreateConfig(userId);

    // Vérifier slug unique
    const existing = await this.prisma.vitrinePage.findFirst({
      where: { vitrineConfigId: config.id, slug: dto.slug },
    });
    if (existing) throw new ConflictException('Page slug already exists');

    // Déterminer l'ordre
    const pages = await this.prisma.vitrinePage.findMany({
      where: { vitrineConfigId: config.id },
    });
    const maxOrder = pages.reduce((max, p) => Math.max(max, p.order || 0), -1);

    return this.prisma.vitrinePage.create({
      data: {
        vitrineConfigId: config.id,
        slug: dto.slug,
        title: dto.title,
        puckData: dto.puckData || {},
        order: dto.order ?? maxOrder + 1,
        isActive: dto.isActive ?? true,
        seoTitle: dto.seoTitle || null,
        seoDescription: dto.seoDescription || null,
      },
    });
  }

  async updatePage(userId: string, pageId: string, dto: UpdateVitrinePageDto) {
    const page = await this.getPage(userId, pageId);
    return this.prisma.vitrinePage.update({
      where: { id: page.id },
      data: dto,
    });
  }

  async savePuckData(userId: string, pageId: string, puckData: Record<string, any>) {
    const page = await this.getPage(userId, pageId);
    return this.prisma.vitrinePage.update({
      where: { id: page.id },
      data: { puckData },
    });
  }

  async deletePage(userId: string, pageId: string) {
    const page = await this.getPage(userId, pageId);
    if (page.isDefault) {
      throw new ConflictException('Cannot delete default page');
    }
    return this.prisma.vitrinePage.delete({ where: { id: page.id } });
  }

  async reorderPages(userId: string, pages: { id: string; order: number }[]) {
    const config = await this.getOrCreateConfig(userId);
    for (const p of pages) {
      await this.prisma.vitrinePage.update({
        where: { id: p.id },
        data: { order: p.order },
      });
    }
    return this.prisma.vitrinePage.findMany({
      where: { vitrineConfigId: config.id },
    });
  }

  // ============================================
  // PUBLIC RENDERER
  // ============================================

  async getPublicPage(slug: string, pageSlug: string) {
    const config = await this.prisma.vitrineConfig.findFirst({
      where: { slug, isActive: true },
    });
    if (!config) throw new NotFoundException('Site not found');

    const page = await this.prisma.vitrinePage.findFirst({
      where: { vitrineConfigId: config.id, slug: pageSlug, isActive: true },
    });
    if (!page) throw new NotFoundException('Page not found');

    // Charger le template pour les styles
    let template = null;
    if (config.templateId) {
      template = await this.prisma.vitrineTemplate.findFirst({
        where: { id: config.templateId },
      });
    }

    // Charger toutes les pages pour la navigation
    const allPagesRaw = await this.prisma.vitrinePage.findMany({
      where: { vitrineConfigId: config.id, isActive: true },
    });
    const allPages = allPagesRaw.map((p) => ({
      slug: p.slug,
      title: p.title,
      order: p.order,
    }));

    return { config, page, template, allPages };
  }

  async getPublicPages(slug: string) {
    const config = await this.prisma.vitrineConfig.findFirst({
      where: { slug, isActive: true },
    });
    if (!config) throw new NotFoundException('Site not found');

    const pages = await this.prisma.vitrinePage.findMany({
      where: { vitrineConfigId: config.id, isActive: true },
    });

    return pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      order: p.order,
    }));
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getOrCreateConfig(userId: string) {
    let config = await this.prisma.vitrineConfig.findFirst({
      where: { userId },
    });
    if (!config) {
      config = await this.prisma.vitrineConfig.create({
        data: {
          userId,
          agencyName: 'Mon Agence',
          phone: '',
          email: '',
          isActive: false,
        },
      });
    }
    return config;
  }
}
