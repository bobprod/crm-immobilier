import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ScannedDocumentDto {
  @ApiProperty({ example: 'carte_identite_locataire', description: 'Type du document scanné' })
  @IsString()
  docType: string;

  @ApiProperty({ description: 'Texte extrait par OCR' })
  @IsString()
  text: string;
}

export class SmartGenerateDto {
  @ApiPropertyOptional({
    type: [ScannedDocumentDto],
    description: 'Liste des documents scannés (OCR) fournis comme contexte',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScannedDocumentDto)
  scannedDocuments?: ScannedDocumentDto[];

  @ApiProperty({
    example:
      'Fais-moi un contrat de location du 01/01/2025 au 31/12/2025 entre le locataire A et le propriétaire B',
    description: "Instruction en langage naturel de l'agent",
  })
  @IsString()
  userInstruction: string;

  @ApiPropertyOptional({
    example: 'contrat_location',
    description: 'Type de document immobilier à générer',
  })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({
    example: 'openai',
    enum: ['openai', 'gemini', 'anthropic', 'deepseek', 'openrouter'],
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;
}
