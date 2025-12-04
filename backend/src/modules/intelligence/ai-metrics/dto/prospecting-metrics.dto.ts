import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProspectingMetricsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by agency ID (multi-tenant)' })
  @IsOptional()
  @IsString()
  agencyId?: string;

  @ApiPropertyOptional({ description: 'Filter by user/agent ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by campaign ID' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class TimelineQueryDto extends ProspectingMetricsQueryDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month'])
  granularity?: 'day' | 'week' | 'month';
}

export class TopPerformersQueryDto extends ProspectingMetricsQueryDto {
  @ApiPropertyOptional({ description: 'Number of top items to return', default: 5 })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class ExportQueryDto extends ProspectingMetricsQueryDto {
  @ApiPropertyOptional({ enum: ['csv', 'xlsx'], default: 'csv' })
  @IsOptional()
  @IsEnum(['csv', 'xlsx'])
  format?: 'csv' | 'xlsx';
}

// Response types
export interface ProspectingOverviewResponse {
  period: {
    from: string;
    to: string;
  };
  totals: {
    rawItemsScraped: number;
    leadsCreated: number;
    leadsValid: number;
    leadsSuspicious: number;
    leadsSpam: number;
    matchesCreated: number;
    leadsContacted: number;
    leadsQualified: number;
    leadsConverted: number;
  };
  rates: {
    leadConversionRate: number;
    spamRate: number;
    contactRate: number;
    qualificationRate: number;
    conversionRate: number;
  };
  averages: {
    avgSeriousnessScore: number;
    avgMatchScore: number;
    avgLeadsPerCampaign: number;
  };
}

export interface BySourceResponse {
  sources: Array<{
    source: string;
    rawItemsScraped: number;
    leadsCreated: number;
    leadsValid: number;
    leadsSuspicious: number;
    leadsSpam: number;
    spamRate: number;
    matchesCreated: number;
    leadsContacted: number;
    leadsConverted: number;
    conversionRate: number;
    avgSeriousnessScore: number;
    avgMatchScore: number;
  }>;
}

export interface ByCampaignResponse {
  campaigns: Array<{
    campaignId: string;
    campaignName: string;
    campaignType: string;
    createdAt: string;
    status: string;
    leadsCreated: number;
    leadsValid: number;
    leadsSpam: number;
    spamRate: number;
    matchesCreated: number;
    avgMatchScore: number;
    leadsContacted: number;
    leadsConverted: number;
    conversionRate: number;
    avgSeriousnessScore: number;
  }>;
}

export interface QualityMetricsResponse {
  aiAccuracy: {
    validLeads: {
      total: number;
      contacted: number;
      rejected: number;
      pending: number;
      accuracyRate: number;
    };
    spamLeads: {
      total: number;
      recovered: number;
      ignored: number;
      accuracyRate: number;
    };
    suspiciousLeads: {
      total: number;
      validated: number;
      rejected: number;
      pending: number;
    };
  };
  matchingAccuracy: {
    highScoreMatches: {
      total: number;
      converted: number;
      conversionRate: number;
    };
    mediumScoreMatches: {
      total: number;
      converted: number;
      conversionRate: number;
    };
    lowScoreMatches: {
      total: number;
      converted: number;
      conversionRate: number;
    };
  };
}

export interface ScoreDistributionResponse {
  seriousnessScore: {
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    avg: number;
    median: number;
  };
  matchScore: {
    ranges: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    avg: number;
    median: number;
  };
}

export interface TimelineResponse {
  granularity: 'day' | 'week' | 'month';
  dataPoints: Array<{
    date: string;
    leadsCreated: number;
    leadsValid: number;
    leadsSpam: number;
    matchesCreated: number;
    leadsContacted: number;
    leadsConverted: number;
    avgSeriousnessScore: number;
    avgMatchScore: number;
  }>;
}

export interface TopPerformersResponse {
  topCampaigns: Array<{
    campaignId: string;
    campaignName: string;
    leadsCreated: number;
    leadsConverted: number;
    conversionRate: number;
  }>;
  topSources: Array<{
    source: string;
    leadsCreated: number;
    leadsConverted: number;
    conversionRate: number;
  }>;
  topCities: Array<{
    city: string;
    leadsCreated: number;
    leadsConverted: number;
    conversionRate: number;
  }>;
}

export interface InsightItem {
  type: 'warning' | 'success' | 'info';
  category: 'spam' | 'conversion' | 'matching' | 'source' | 'campaign';
  title: string;
  description: string;
  metric?: number;
  recommendation?: string;
}

export interface InsightsResponse {
  insights: InsightItem[];
}
