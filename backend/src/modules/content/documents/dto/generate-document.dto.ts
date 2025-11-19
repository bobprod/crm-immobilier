import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateDocumentDto {
  @ApiProperty({ example: 'Rédige un contrat de vente immobilière' })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({ 
    example: 'openai', 
    enum: ['openai', 'gemini', 'anthropic', 'deepseek', 'openrouter']
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'gpt-4' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'contract' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  saveAsDocument?: boolean;
}
