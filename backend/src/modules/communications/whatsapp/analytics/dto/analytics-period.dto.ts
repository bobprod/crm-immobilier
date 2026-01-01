import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';

export enum PeriodPreset {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_7_DAYS = '7days',
  LAST_30_DAYS = '30days',
  THIS_MONTH = 'thisMonth',
  LAST_MONTH = 'lastMonth',
  CUSTOM = 'custom',
}

export class AnalyticsPeriodDto {
  @ApiProperty({
    description: 'Start date (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsDateString()
  start: string;

  @ApiProperty({
    description: 'End date (ISO 8601 format)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsDateString()
  end: string;

  @ApiPropertyOptional({
    description: 'Period label',
    example: 'Last 7 days',
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional({
    description: 'Period preset',
    enum: PeriodPreset,
    example: PeriodPreset.LAST_7_DAYS,
  })
  @IsEnum(PeriodPreset)
  @IsOptional()
  preset?: PeriodPreset;
}
