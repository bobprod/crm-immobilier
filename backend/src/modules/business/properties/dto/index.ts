import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProspectSummary, UserSummary } from '../../../../shared/types/relation-summaries';

// ============================================
// ENUMS - Aligned with Prisma schema
// ============================================

export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'pending';
export type PropertyCategory = 'sale' | 'rent';
export type PropertyPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PropertyType = 'apartment' | 'house' | 'villa' | 'studio' | 'office' | 'land' | 'commercial' | 'appartement' | 'maison' | 'terrain';

// ============================================
// CREATE DTO
// ============================================

export class CreatePropertyDto {
  @ApiProperty({ description: 'Titre du bien' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description du bien' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: ['apartment', 'house', 'villa', 'studio', 'office', 'land', 'commercial', 'appartement', 'maison', 'terrain'],
    description: 'Type de bien'
  })
  @IsString()
  type: string;

  @ApiProperty({ enum: ['sale', 'rent'], description: 'Catégorie (vente/location)' })
  @IsIn(['sale', 'rent'])
  category: PropertyCategory;

  @ApiProperty({ description: 'Prix du bien' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Devise', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Surface en m²' })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ description: 'Nombre de chambres' })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Nombre de salles de bain' })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional({ description: 'Adresse' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Ville' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Délégation/Région' })
  @IsOptional()
  @IsString()
  delegation?: string;

  @ApiPropertyOptional({ description: 'Code postal' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Latitude GPS' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude GPS' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ type: [String], description: 'URLs des images' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Caractéristiques du bien' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'], description: 'Priorité' })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: PropertyPriority;

  @ApiPropertyOptional({ type: [String], description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'ID utilisateur assigné' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Bien mis en avant' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Notes internes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID du propriétaire (prospect)' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Prix net vendeur' })
  @IsOptional()
  @IsNumber()
  netPrice?: number;

  @ApiPropertyOptional({ description: 'Frais/Commission' })
  @IsOptional()
  @IsNumber()
  fees?: number;

  @ApiPropertyOptional({ description: 'Pourcentage de commission' })
  @IsOptional()
  @IsNumber()
  feesPercentage?: number;

  @ApiPropertyOptional({ description: 'Référence du bien' })
  @IsOptional()
  @IsString()
  reference?: string;
}

// ============================================
// UPDATE DTO
// ============================================

export class UpdatePropertyDto {
  @ApiPropertyOptional({ description: 'Titre du bien' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Description du bien' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Type de bien' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['sale', 'rent'], description: 'Catégorie' })
  @IsOptional()
  @IsIn(['sale', 'rent'])
  category?: PropertyCategory;

  @ApiPropertyOptional({ description: 'Prix du bien' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Devise' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Surface en m²' })
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional({ enum: ['available', 'reserved', 'sold', 'rented', 'pending'], description: 'Statut' })
  @IsOptional()
  @IsIn(['available', 'reserved', 'sold', 'rented', 'pending'])
  status?: PropertyStatus;

  @ApiPropertyOptional({ type: [String], description: 'Caractéristiques' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Images' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'], description: 'Priorité' })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: PropertyPriority;

  @ApiPropertyOptional({ type: [String], description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'ID utilisateur assigné' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Bien mis en avant' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Notes internes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'ID du propriétaire' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Prix net vendeur' })
  @IsOptional()
  @IsNumber()
  netPrice?: number;

  @ApiPropertyOptional({ description: 'Frais/Commission' })
  @IsOptional()
  @IsNumber()
  fees?: number;

  @ApiPropertyOptional({ description: 'Pourcentage de commission' })
  @IsOptional()
  @IsNumber()
  feesPercentage?: number;

  @ApiPropertyOptional({ description: 'Référence du bien' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Adresse' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Ville' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Délégation/Région' })
  @IsOptional()
  @IsString()
  delegation?: string;

  @ApiPropertyOptional({ description: 'Code postal' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Latitude GPS' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude GPS' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Nombre de chambres' })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Nombre de salles de bain' })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;
}

// ============================================
// RESPONSE DTO
// ============================================

export class PropertyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  agencyId?: string;

  @ApiPropertyOptional()
  reference?: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiProperty({ enum: ['sale', 'rent'] })
  category: PropertyCategory;

  @ApiProperty()
  price: number;

  @ApiProperty({ default: 'TND' })
  currency: string;

  @ApiPropertyOptional()
  address?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  delegation?: string;

  @ApiPropertyOptional()
  zipCode?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  bedrooms?: number;

  @ApiPropertyOptional()
  bathrooms?: number;

  @ApiPropertyOptional()
  area?: number;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty({ type: [String] })
  features: string[];

  @ApiProperty({ enum: ['available', 'reserved', 'sold', 'rented', 'pending'] })
  status: PropertyStatus;

  @ApiProperty({ description: 'Nombre de vues', default: 0 })
  viewsCount: number;

  @ApiProperty({ enum: ['low', 'medium', 'high', 'urgent'] })
  priority: PropertyPriority;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional()
  assignedTo?: string;

  @ApiProperty()
  isFeatured: boolean;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  lastContactAt?: Date;

  @ApiPropertyOptional()
  ownerId?: string;

  @ApiPropertyOptional()
  netPrice?: number;

  @ApiPropertyOptional()
  fees?: number;

  @ApiPropertyOptional()
  feesPercentage?: number;

  @ApiPropertyOptional()
  wpSyncId?: string;

  @ApiPropertyOptional()
  wpSyncedAt?: Date;

  @ApiPropertyOptional()
  wordpressId?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations (optional, populated on demand)
  @ApiPropertyOptional({ description: 'Propriétaire du bien' })
  owner?: ProspectSummary;

  @ApiPropertyOptional({ description: 'Agent assigné' })
  assignedUser?: UserSummary;
}

// ============================================
// FILTERS DTO
// ============================================

export class PropertyFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: ['sale', 'rent'] })
  @IsOptional()
  @IsIn(['sale', 'rent'])
  category?: PropertyCategory;

  @ApiPropertyOptional({ enum: ['available', 'reserved', 'sold', 'rented', 'pending'] })
  @IsOptional()
  @IsIn(['available', 'reserved', 'sold', 'rented', 'pending'])
  status?: PropertyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxArea?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsOptional()
  @IsIn(['low', 'medium', 'high', 'urgent'])
  priority?: PropertyPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
