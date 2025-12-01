import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { PageDto, PageBlock, BlockType, PageTemplate } from './dto/page.dto';

/**
 * Service de gestion des pages (Page Builder)
 *
 * Permet de créer et gérer des pages personnalisées pour la vitrine
 * avec un éditeur visuel drag & drop.
 */
@Injectable()
export class PageBuilderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Créer une nouvelle page
   */
  async createPage(userId: string, dto: PageDto) {
    // Générer slug si non fourni
    const slug = dto.slug || this.generateSlug(dto.title);

    return this.prisma.page.create({
      data: {
        userId,
        title: dto.title,
        slug,
        description: dto.description,
        blocks: dto.blocks as any,
        isPublished: dto.isPublished || false,
        template: dto.template,
        seo: dto.seo as any,
      },
    });
  }

  /**
   * Récupérer toutes les pages d'un utilisateur
   */
  async getPages(userId: string) {
    return this.prisma.page.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Récupérer une page par ID
   */
  async getPage(userId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, userId },
    });

    if (!page) {
      throw new NotFoundException('Page non trouvée');
    }

    return page;
  }

  /**
   * Récupérer une page publique par slug
   */
  async getPublicPage(userId: string, slug: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        userId,
        slug,
        isPublished: true,
      },
    });

    if (!page) {
      throw new NotFoundException('Page non trouvée');
    }

    return page;
  }

  /**
   * Mettre à jour une page
   */
  async updatePage(userId: string, pageId: string, dto: Partial<PageDto>) {
    const page = await this.getPage(userId, pageId);

    return this.prisma.page.update({
      where: { id: page.id },
      data: {
        title: dto.title,
        slug: dto.slug,
        description: dto.description,
        blocks: dto.blocks as any,
        isPublished: dto.isPublished,
        template: dto.template,
        seo: dto.seo as any,
      },
    });
  }

  /**
   * Supprimer une page
   */
  async deletePage(userId: string, pageId: string) {
    const page = await this.getPage(userId, pageId);

    await this.prisma.page.delete({
      where: { id: page.id },
    });

    return { success: true };
  }

  /**
   * Publier/dépublier une page
   */
  async togglePublish(userId: string, pageId: string, isPublished: boolean) {
    const page = await this.getPage(userId, pageId);

    return this.prisma.page.update({
      where: { id: page.id },
      data: { isPublished },
    });
  }

  /**
   * Dupliquer une page
   */
  async duplicatePage(userId: string, pageId: string) {
    const page = await this.getPage(userId, pageId);

    return this.prisma.page.create({
      data: {
        userId,
        title: `${page.title} (copie)`,
        slug: `${page.slug}-copy-${Date.now()}`,
        description: page.description,
        blocks: page.blocks,
        isPublished: false,
        template: page.template,
        seo: page.seo,
      },
    });
  }

  /**
   * Récupérer templates prédéfinis
   */
  getTemplates(): PageTemplate[] {
    return [
      {
        id: 'home-modern',
        name: 'Accueil Moderne',
        description: "Page d'accueil moderne avec hero, biens en vedette et CTA",
        category: 'home',
        blocks: this.getHomeModernBlocks(),
      },
      {
        id: 'home-classic',
        name: 'Accueil Classique',
        description: "Page d'accueil classique et épurée",
        category: 'home',
        blocks: this.getHomeClassicBlocks(),
      },
      {
        id: 'listing-grid',
        name: 'Catalogue Grille',
        description: 'Page catalogue avec grille de biens',
        category: 'listing',
        blocks: this.getListingGridBlocks(),
      },
      {
        id: 'about-agency',
        name: 'À Propos',
        description: "Page de présentation de l'agence",
        category: 'about',
        blocks: this.getAboutBlocks(),
      },
      {
        id: 'contact-full',
        name: 'Contact Complet',
        description: 'Page contact avec formulaire et carte',
        category: 'contact',
        blocks: this.getContactBlocks(),
      },
    ];
  }

  /**
   * Créer une page depuis un template
   */
  async createFromTemplate(userId: string, templateId: string, title?: string) {
    const template = this.getTemplates().find((t) => t.id === templateId);

    if (!template) {
      throw new NotFoundException('Template non trouvé');
    }

    return this.createPage(userId, {
      title: title || template.name,
      blocks: template.blocks,
      isPublished: false,
      template: templateId,
    });
  }

  /**
   * Générer slug depuis titre
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ==========================================
  // TEMPLATES PRÉDÉFINIS
  // ==========================================

  private getHomeModernBlocks(): PageBlock[] {
    return [
      {
        id: 'hero-1',
        type: BlockType.HERO,
        order: 0,
        props: {
          title: 'Trouvez la maison de vos rêves',
          subtitle: 'Plus de 500 biens disponibles à la vente et à la location',
          backgroundImage: '/images/hero-bg.jpg',
          ctaText: 'Découvrir nos biens',
          ctaLink: '/biens',
          height: 'large',
        },
      },
      {
        id: 'search-1',
        type: BlockType.PROPERTY_SEARCH,
        order: 1,
        props: {
          style: 'inline',
          fields: ['type', 'city', 'priceRange', 'rooms'],
        },
      },
      {
        id: 'featured-1',
        type: BlockType.PROPERTY_FEATURED,
        order: 2,
        props: {
          title: 'Biens en vedette',
          subtitle: 'Découvrez notre sélection',
          limit: 6,
          layout: 'grid',
        },
      },
      {
        id: 'stats-1',
        type: BlockType.STATS,
        order: 3,
        props: {
          items: [
            { value: '500+', label: 'Biens disponibles' },
            { value: '1200+', label: 'Clients satisfaits' },
            { value: '15', label: "Années d'expérience" },
            { value: '98%', label: 'Taux de satisfaction' },
          ],
        },
      },
      {
        id: 'cta-1',
        type: BlockType.CTA,
        order: 4,
        props: {
          title: 'Prêt à trouver votre bien idéal ?',
          description: "Contactez-nous dès aujourd'hui pour une consultation gratuite",
          buttonText: 'Nous contacter',
          buttonLink: '/contact',
          backgroundColor: '#3B82F6',
        },
      },
    ];
  }

  private getHomeClassicBlocks(): PageBlock[] {
    return [
      {
        id: 'hero-2',
        type: BlockType.HERO,
        order: 0,
        props: {
          title: 'Votre Agence Immobilière de Confiance',
          subtitle: 'Depuis 1995',
          style: 'classic',
          height: 'medium',
        },
      },
      {
        id: 'text-1',
        type: BlockType.TEXT,
        order: 1,
        props: {
          content: '<h2>Bienvenue</h2><p>Notre agence vous accompagne...</p>',
          align: 'center',
        },
      },
      {
        id: 'property-grid-1',
        type: BlockType.PROPERTY_GRID,
        order: 2,
        props: {
          title: 'Nos Biens Immobiliers',
          limit: 9,
        },
      },
    ];
  }

  private getListingGridBlocks(): PageBlock[] {
    return [
      {
        id: 'heading-1',
        type: BlockType.HEADING,
        order: 0,
        props: {
          text: 'Nos Biens Immobiliers',
          level: 1,
          align: 'center',
        },
      },
      {
        id: 'search-2',
        type: BlockType.PROPERTY_SEARCH,
        order: 1,
        props: {
          style: 'full',
          showAdvanced: true,
        },
      },
      {
        id: 'property-grid-2',
        type: BlockType.PROPERTY_GRID,
        order: 2,
        props: {
          showFilters: true,
          pagination: true,
        },
      },
    ];
  }

  private getAboutBlocks(): PageBlock[] {
    return [
      {
        id: 'heading-2',
        type: BlockType.HEADING,
        order: 0,
        props: {
          text: 'À Propos de Notre Agence',
          level: 1,
        },
      },
      {
        id: 'text-2',
        type: BlockType.TEXT,
        order: 1,
        props: {
          content: '<p>Votre contenu ici...</p>',
        },
      },
      {
        id: 'features-1',
        type: BlockType.FEATURES,
        order: 2,
        props: {
          items: [
            { icon: '🏆', title: 'Expérience', description: "15 ans d'expertise" },
            { icon: '🤝', title: 'Confiance', description: 'Des milliers de clients' },
            { icon: '⚡', title: 'Rapidité', description: 'Réponse sous 24h' },
          ],
        },
      },
    ];
  }

  private getContactBlocks(): PageBlock[] {
    return [
      {
        id: 'heading-3',
        type: BlockType.HEADING,
        order: 0,
        props: {
          text: 'Contactez-Nous',
          level: 1,
        },
      },
      {
        id: 'columns-1',
        type: BlockType.COLUMNS,
        order: 1,
        props: {
          columns: 2,
        },
        children: [
          {
            id: 'contact-form-1',
            type: BlockType.CONTACT_FORM,
            order: 0,
            props: {},
          },
          {
            id: 'map-1',
            type: BlockType.MAP,
            order: 1,
            props: {
              address: 'Votre adresse',
            },
          },
        ],
      },
    ];
  }
}
