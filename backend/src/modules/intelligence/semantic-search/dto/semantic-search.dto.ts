import { IsString, IsOptional, IsArray, IsNumber } from 'class-validator';

export class SemanticSearchQueryDto {
  @IsString()
  query: string;

  @IsString()
  @IsOptional()
  searchType?: 'properties' | 'prospects' | 'appointments' | 'all';

  @IsNumber()
  @IsOptional()
  limit?: number;

  @IsArray()
  @IsOptional()
  filters?: Record<string, any>[];
}

export interface SemanticSearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  metadata?: Record<string, any>;
}
