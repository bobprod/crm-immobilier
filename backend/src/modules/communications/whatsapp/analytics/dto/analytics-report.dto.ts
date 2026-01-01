import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { AnalyticsPeriodDto } from './analytics-period.dto';
import { AnalyticsMetricsDto } from './analytics-metrics.dto';
import { AnalyticsChartDataDto, TemplatePerformanceDto } from './analytics-chart.dto';

export enum ExportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export class AnalyticsReportDto {
  @ApiProperty({ description: 'Report unique ID' })
  id: string;

  @ApiProperty({ description: 'Report period' })
  period: AnalyticsPeriodDto;

  @ApiProperty({ description: 'Analytics metrics' })
  metrics: AnalyticsMetricsDto;

  @ApiProperty({ description: 'Chart data' })
  charts: AnalyticsChartDataDto;

  @ApiProperty({
    description: 'Template performance data',
    type: [TemplatePerformanceDto],
  })
  templates: TemplatePerformanceDto[];

  @ApiProperty({ description: 'Report generation timestamp' })
  generatedAt: Date;
}

export class ExportReportDto {
  @ApiPropertyOptional({
    description: 'Export format',
    enum: ExportFormat,
    default: ExportFormat.PDF,
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.PDF;
}

export class ExportResultDto {
  @ApiProperty({ description: 'Export file data (base64)' })
  data: string;

  @ApiProperty({ description: 'File name' })
  filename: string;

  @ApiProperty({ description: 'MIME type' })
  mimeType: string;
}
