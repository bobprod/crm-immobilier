import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ example: 'Contrat de vente' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  relatedId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTemplate?: boolean;
}
