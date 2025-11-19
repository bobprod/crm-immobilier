import { IsString, IsOptional } from 'class-validator';

/**
 * DTO pour optimiser le SEO d'un bien immobilier
 */
export class OptimizePropertyDto {
  @IsString()
  propertyId: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

/**
 * DTO pour optimisation en batch
 */
export class OptimizeBatchDto {
  @IsString({ each: true })
  propertyIds: string[];

  @IsString()
  @IsOptional()
  userId?: string;
}
