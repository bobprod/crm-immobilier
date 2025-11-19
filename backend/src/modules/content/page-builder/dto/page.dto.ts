import { IsString, IsBoolean, IsOptional, IsArray, IsObject } from 'class-validator';

/**
 * Block dans une page
 */
export interface PageBlock {
  id: string;
  type: string;
  order: number;
  props: Record<string, any>;
  children?: PageBlock[];
}

/**
 * DTO pour créer/mettre à jour une page
 */
export class PageDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  blocks: PageBlock[];

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsString()
  @IsOptional()
  template?: string;

  @IsObject()
  @IsOptional()
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

/**
 * Types de blocs disponibles
 */
export enum BlockType {
  // Layout
  CONTAINER = 'container',
  SECTION = 'section',
  COLUMNS = 'columns',
  
  // Contenu
  HEADING = 'heading',
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  
  // Immobilier
  PROPERTY_GRID = 'property_grid',
  PROPERTY_FEATURED = 'property_featured',
  PROPERTY_SEARCH = 'property_search',
  
  // Formulaires
  CONTACT_FORM = 'contact_form',
  SEARCH_FORM = 'search_form',
  
  // Navigation
  HERO = 'hero',
  CTA = 'cta',
  BUTTON = 'button',
  
  // Médias
  GALLERY = 'gallery',
  SLIDER = 'slider',
  
  // Informations
  TESTIMONIALS = 'testimonials',
  STATS = 'stats',
  FEATURES = 'features',
  FAQ = 'faq',
  
  // Social
  SOCIAL_LINKS = 'social_links',
  MAP = 'map',
}

/**
 * Template de page prédéfini
 */
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  blocks: PageBlock[];
  category: 'home' | 'listing' | 'about' | 'contact' | 'custom';
}
