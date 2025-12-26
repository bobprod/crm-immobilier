import { IsString, IsOptional, IsNumber } from 'class-validator';

export class PriorityInboxQueryDto {
  @IsString()
  @IsOptional()
  type?: 'prospects' | 'messages' | 'tasks' | 'all';

  @IsNumber()
  @IsOptional()
  limit?: number;
}

export interface PriorityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  priorityScore: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
  metadata?: Record<string, any>;
  recommendedActions?: string[];
}

export interface PriorityScoreFactors {
  urgencyKeywords: number;
  budgetLevel: number;
  responseTime: number;
  engagementLevel: number;
  conversionProbability: number;
}
