import { IsString, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO pour générer un alt text d'image
 */
export class GenerateAltTextDto {
  @IsString()
  propertyId: string;

  @IsString()
  imageUrl: string;

  @IsNumber()
  imageIndex: number;

  @IsString()
  @IsOptional()
  userId?: string;
}
