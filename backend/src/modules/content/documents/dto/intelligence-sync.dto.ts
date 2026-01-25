import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LinkDocumentToInvestmentDto {
  @ApiProperty({ description: 'ID du projet d\'investissement' })
  @IsString()
  investmentProjectId: string;

  @ApiProperty({ 
    description: 'Type de lien (contract, analysis_report, commission, supporting_doc)',
    example: 'analysis_report'
  })
  @IsString()
  linkType: string;

  @ApiProperty({ description: 'Raison du lien', required: false })
  @IsOptional()
  @IsString()
  linkReason?: string;

  @ApiProperty({ description: 'Métadonnées supplémentaires', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class GenerateDocumentFromInvestmentDto {
  @ApiProperty({ description: 'ID du projet d\'investissement' })
  @IsString()
  investmentProjectId: string;

  @ApiProperty({ 
    description: 'Type de document à générer',
    example: 'investment_analysis'
  })
  @IsString()
  documentType: string;

  @ApiProperty({ description: 'ID du template à utiliser (optionnel)', required: false })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiProperty({ description: 'Variables pour le template', required: false })
  @IsOptional()
  @IsObject()
  variables?: any;

  @ApiProperty({ 
    description: 'Lier automatiquement au projet',
    default: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  autoLink?: boolean;
}
