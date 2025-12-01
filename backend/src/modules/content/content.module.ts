import { Module } from '@nestjs/common';
import { DocumentsModule } from './documents/documents.module';
import { SeoAiModule } from './seo-ai/seo-ai.module';
import { PageBuilderModule } from './page-builder/page-builder.module';

/**
 * Content Module
 *
 * Regroupe tous les modules liés au contenu :
 * - Documents (gestion documentaire)
 * - SEO AI (optimisation SEO automatique)
 * - Page Builder (construction de pages)
 */
@Module({
  imports: [DocumentsModule, SeoAiModule, PageBuilderModule],
  exports: [DocumentsModule, SeoAiModule, PageBuilderModule],
})
export class ContentModule {}
