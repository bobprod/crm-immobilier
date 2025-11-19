import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentTemplateDto {
  @ApiProperty({ example: 'Template Contrat de Vente' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '<h1>Contrat de vente</h1><p>Entre {{sellerName}} et {{buyerName}}...</p>' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: ['sellerName', 'buyerName', 'propertyAddress'] })
  @IsOptional()
  @IsArray()
  variables?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ default: 'text/html' })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
