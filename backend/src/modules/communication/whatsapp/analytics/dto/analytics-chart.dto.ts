import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TimeSeriesDataPointDto {
  @ApiProperty({
    description: 'Date in ISO format',
    example: '2024-01-15',
  })
  date: string;

  @ApiProperty({
    description: 'Data value',
    example: 125,
  })
  value: number;

  @ApiPropertyOptional({
    description: 'Optional label',
    example: 'Monday',
  })
  label?: string;
}

export class AnalyticsChartDataDto {
  @ApiProperty({
    description: 'Messages time series data',
    type: [TimeSeriesDataPointDto],
  })
  messages: TimeSeriesDataPointDto[];

  @ApiProperty({
    description: 'Conversations time series data',
    type: [TimeSeriesDataPointDto],
  })
  conversations: TimeSeriesDataPointDto[];

  @ApiProperty({
    description: 'Response time time series data',
    type: [TimeSeriesDataPointDto],
  })
  responseTime: TimeSeriesDataPointDto[];
}

export class TemplatePerformanceDto {
  @ApiProperty({ description: 'Template ID' })
  templateId: string;

  @ApiProperty({ description: 'Template name' })
  templateName: string;

  @ApiProperty({ description: 'Number of messages sent' })
  sent: number;

  @ApiProperty({ description: 'Number of messages delivered' })
  delivered: number;

  @ApiProperty({ description: 'Number of messages read' })
  read: number;

  @ApiProperty({ description: 'Number of messages failed' })
  failed: number;

  @ApiProperty({ description: 'Success rate (0-100)' })
  successRate: number;

  @ApiProperty({ description: 'Read rate (0-100)' })
  readRate: number;
}

export class ConversationStatsDto {
  @ApiProperty({ description: 'Hour of day (0-23)' })
  hour: number;

  @ApiProperty({ description: 'Conversation count' })
  count: number;
}
