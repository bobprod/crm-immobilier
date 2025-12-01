import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/database/prisma.service';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { LLMProvider } from './providers/llm-provider.interface';
import { MAX_TOKENS_DEFAULTS } from './providers/llm-provider.interface';

/**
 * Service d'optimisation SEO automatique avec IA
 *
 * Supporte plusieurs providers LLM via LLMProviderFactory
 */
@Injectable()
export class SeoAiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly llmFactory: LLMProviderFactory,
  ) {}

  private async getProvider(userId: string): Promise<LLMProvider> {
    return this.llmFactory.createProvider(userId);
  }

  async optimizeProperty(propertyId: string, userId: string) {
    const property = await this.prisma.properties.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new Error('Bien non trouvé');
    }

    const provider = await this.getProvider(userId);

    const [metaTitle, metaDescription, keywords, faq, description, slug] = await Promise.all([
      this.generateMetaTitle(property, provider),
      this.generateMetaDescription(property, provider),
      this.generateKeywords(property, provider),
      this.generateFAQ(property, provider),
      this.generateEnhancedDescription(property, provider),
      this.generateSlug(property),
    ]);

    const seoScore = this.calculateSeoScore(property, {
      metaTitle,
      metaDescription,
      keywords,
      faq,
      description,
    });

    const propertySeo = await this.prisma.propertySeo.upsert({
      where: { propertyId },
      create: {
        propertyId,
        metaTitle,
        metaDescription,
        slug,
        keywords,
        faq,
        seoScore,
        lastOptimized: new Date(),
      },
      update: {
        metaTitle,
        metaDescription,
        slug,
        keywords,
        faq,
        seoScore,
        lastOptimized: new Date(),
      },
    });

    return {
      property,
      seo: propertySeo,
      suggestions: this.generateSuggestions(property, propertySeo),
    };
  }

  private async generateMetaTitle(property: any, provider: LLMProvider): Promise<string> {
    const prompt = `Tu es un expert SEO immobilier. Génère un meta title optimisé pour Google.

Bien immobilier :
- Type : ${property.type}
- Ville : ${property.city}
- Prix : ${property.price}€
- Surface : ${property.area}m²

Règles : Maximum 60 caractères, inclure mots-clés principaux.
Réponds UNIQUEMENT avec le meta title.`;

    const text = await provider.generate(prompt, {
      maxTokens: MAX_TOKENS_DEFAULTS.metaTitle,
    });

    return text.substring(0, 60);
  }

  private async generateMetaDescription(property: any, provider: LLMProvider): Promise<string> {
    const prompt = `Génère une meta description SEO optimisée (max 155 caractères) pour ce bien :
${property.type} ${property.bedrooms} pièces, ${property.city}, ${property.price}€, ${property.area}m²`;

    const text = await provider.generate(prompt, {
      maxTokens: MAX_TOKENS_DEFAULTS.metaDescription,
    });

    return text.substring(0, 155);
  }

  private async generateKeywords(property: any, provider: LLMProvider): Promise<string[]> {
    const prompt = `Génère 10-15 mots-clés SEO pour: ${property.type} à ${property.city}, ${property.price}€, ${property.area}m². Format: liste séparée par virgules uniquement.`;

    const text = await provider.generate(prompt, {
      maxTokens: MAX_TOKENS_DEFAULTS.keywords,
    });

    return text
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);
  }

  private async generateFAQ(property: any, provider: LLMProvider): Promise<any> {
    const prompt = `Génère une FAQ JSON pour ce bien: ${property.type}, ${property.city}, ${property.price}€.
Format JSON uniquement: {"questions": [{"question": "...", "answer": "..."}]}`;

    const text = await provider.generate(prompt, {
      maxTokens: MAX_TOKENS_DEFAULTS.faq,
    });

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { questions: [] };
    } catch {
      return { questions: [] };
    }
  }

  private async generateEnhancedDescription(property: any, provider: LLMProvider): Promise<string> {
    const prompt = `Réécris cette description immobilière (300-500 mots, SEO-optimisée):
${property.description || 'Belle propriété'}
Bien: ${property.type}, ${property.bedrooms} pièces, ${property.area}m², ${property.city}, ${property.price}€`;

    const text = await provider.generate(prompt, {
      maxTokens: MAX_TOKENS_DEFAULTS.description,
    });

    return text.trim() || property.description || '';
  }

  private async generateSlug(property: any): Promise<string> {
    const base = `${property.type}-${property.bedrooms || 'x'}-pieces-${property.city}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${base}-${property.id.substring(0, 8)}`;
  }

  private calculateSeoScore(property: any, seo: any): number {
    let score = 0;
    if (seo.metaTitle && seo.metaTitle.length > 0 && seo.metaTitle.length <= 60) score += 15;
    if (seo.metaDescription && seo.metaDescription.length > 0 && seo.metaDescription.length <= 155)
      score += 15;
    if (seo.keywords && seo.keywords.length >= 5) score += 10;
    if (seo.description && seo.description.length >= 300) score += 15;
    if (property.images && property.images.length >= 3) score += 10;
    if (property.city && property.zipCode) score += 10;
    if (seo.faq && seo.faq.questions && seo.faq.questions.length >= 3) score += 10;
    if (property.price && property.area) score += 10;
    if (seo.slug) score += 5;
    return Math.min(score, 100);
  }

  private generateSuggestions(property: any, seo: any): string[] {
    const suggestions = [];
    if (!seo.metaTitle || seo.metaTitle.length === 0) suggestions.push('Générer un meta title');
    if (!seo.metaDescription || seo.metaDescription.length === 0)
      suggestions.push('Générer une meta description');
    if (!seo.keywords || seo.keywords.length < 5) suggestions.push('Ajouter plus de mots-clés');
    if (!property.images || property.images.length < 3) suggestions.push('Ajouter plus de photos');
    if (!seo.faq || !seo.faq.questions || seo.faq.questions.length < 3)
      suggestions.push('Générer une FAQ');
    if (!seo.description || seo.description.length < 300)
      suggestions.push('Enrichir la description');
    if (seo.seoScore < 80) suggestions.push('Améliorer le score SEO');
    return suggestions;
  }

  async generateAltText(
    propertyId: string,
    userId: string,
    imageUrl: string,
    imageIndex: number,
  ): Promise<string> {
    const property = await this.prisma.properties.findUnique({
      where: { id: propertyId },
    });

    if (!property) return '';

    const provider = await this.getProvider(userId);
    const prompt = `Alt text SEO pour image ${imageIndex + 1} de ${property.type} à ${property.city} (max 125 caractères)`;

    const text = await provider.generate(prompt, { maxTokens: 100 });
    return text.substring(0, 125);
  }

  async getPropertySeo(propertyId: string) {
    return this.prisma.propertySeo.findUnique({
      where: { propertyId },
      include: { property: true },
    });
  }

  async bulkOptimize(userId: string, propertyIds?: string[]) {
    let properties;

    if (propertyIds && propertyIds.length > 0) {
      properties = await this.prisma.properties.findMany({
        where: { id: { in: propertyIds } },
      });
    } else {
      properties = await this.prisma.properties.findMany({
        where: { userId },
        take: 50,
      });
    }

    const results = [];

    for (const property of properties) {
      try {
        const result = await this.optimizeProperty(property.id, userId);
        results.push({
          propertyId: property.id,
          success: true,
          seoScore: result.seo.seoScore,
        });
      } catch (error) {
        results.push({
          propertyId: property.id,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      total: properties.length,
      optimized: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
