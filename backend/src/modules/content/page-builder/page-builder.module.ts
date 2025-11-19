import { Module } from '@nestjs/common';
import { PageBuilderService } from './page-builder.service';
import { PageBuilderController, PublicPagesController } from './page-builder.controller';
import { PrismaModule } from '@/shared/database/prisma.module';

/**
 * Module Page Builder
 * 
 * Éditeur visuel drag & drop pour créer et personnaliser
 * les pages de la vitrine publique (comme Elementor/Gutenberg)
 * 
 * Fonctionnalités :
 * - Création de pages avec blocs modulaires
 * - 22 types de blocs (Hero, Text, Image, Property Grid, etc.)
 * - 5 templates prédéfinis (Home, Listing, About, Contact)
 * - Gestion SEO par page
 * - Publication/dépublication
 * - Duplication de pages
 */
@Module({
  imports: [PrismaModule],
  controllers: [PageBuilderController, PublicPagesController],
  providers: [PageBuilderService],
  exports: [PageBuilderService],
})
export class PageBuilderModule {}
