import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour la configuration Jina.ai
 */
export class JinaConfigDto {
  @ApiProperty({ description: 'Clé API Jina.ai' })
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: 'Modèle d\'embeddings', default: 'jina-embeddings-v2-base-en' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: 'Activer le reranking', default: true })
  @IsOptional()
  @IsBoolean()
  enableReranking?: boolean;

  @ApiPropertyOptional({ description: 'Activer la lecture d\'URL', default: true })
  @IsOptional()
  @IsBoolean()
  enableReader?: boolean;
}

/**
 * DTO pour tester la configuration Jina
 */
export class TestJinaDto {
  @ApiProperty({ description: 'Clé API Jina.ai à tester' })
  @IsString()
  apiKey: string;
}

/**
 * DTO pour les embeddings Jina
 */
export class JinaEmbeddingsDto {
  @ApiProperty({ description: 'Texte à vectoriser' })
  @IsString()
  text: string;
}

/**
 * DTO pour le reranking Jina
 */
export class JinaRerankDto {
  @ApiProperty({ description: 'Requête de recherche' })
  @IsString()
  query: string;

  @ApiProperty({ description: 'Documents à reranker', type: [String] })
  documents: string[];
}

/**
 * DTO pour la lecture d'URL Jina
 */
export class JinaReadUrlDto {
  @ApiProperty({ description: 'URL à lire' })
  @IsString()
  url: string;
}
