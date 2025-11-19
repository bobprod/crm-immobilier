import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardFiltersDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month', 'year'] })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'year'])
  period?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class StatsResponseDto {
  activeProspects: number;
  availableProperties: number;
  todayAppointments: number;
  totalMatches: number;
  activeCampaigns: number;
  pendingTasks: number;
  totalCommunications: number;
  conversionRate: number;
  matchSuccessRate: number;
}

export class ChartDataDto {
  labels: string[];
  values: number[];
}

export class AlertDto {
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  action: string;
}
