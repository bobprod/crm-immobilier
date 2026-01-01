import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessagesMetricsDto {
  @ApiProperty({ description: 'Total messages' })
  total: number;

  @ApiProperty({ description: 'Sent messages' })
  sent: number;

  @ApiProperty({ description: 'Received messages' })
  received: number;

  @ApiProperty({ description: 'Delivered messages' })
  delivered: number;

  @ApiProperty({ description: 'Read messages' })
  read: number;

  @ApiProperty({ description: 'Failed messages' })
  failed: number;

  @ApiProperty({ description: 'Average response time in minutes' })
  avgResponseTime: number;
}

export class ConversationsMetricsDto {
  @ApiProperty({ description: 'Total conversations' })
  total: number;

  @ApiProperty({ description: 'Active conversations' })
  active: number;

  @ApiProperty({ description: 'New conversations' })
  new: number;

  @ApiProperty({ description: 'Closed conversations' })
  closed: number;

  @ApiProperty({ description: 'Average conversation duration in hours' })
  avgDuration: number;
}

export class TopTemplateDto {
  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Usage count' })
  count: number;
}

export class TemplatesMetricsDto {
  @ApiProperty({ description: 'Total templates' })
  total: number;

  @ApiProperty({ description: 'Used templates' })
  used: number;

  @ApiProperty({ description: 'Overall success rate (0-100)' })
  successRate: number;

  @ApiPropertyOptional({ description: 'Most used template' })
  topTemplate?: TopTemplateDto;
}

export class EngagementMetricsDto {
  @ApiProperty({ description: 'Response rate (0-100)' })
  responseRate: number;

  @ApiProperty({ description: 'Read rate (0-100)' })
  readRate: number;

  @ApiProperty({ description: 'Reply rate (0-100)' })
  replyRate: number;
}

export class AnalyticsMetricsDto {
  @ApiProperty({ description: 'Messages metrics' })
  messages: MessagesMetricsDto;

  @ApiProperty({ description: 'Conversations metrics' })
  conversations: ConversationsMetricsDto;

  @ApiProperty({ description: 'Templates metrics' })
  templates: TemplatesMetricsDto;

  @ApiProperty({ description: 'Engagement metrics' })
  engagement: EngagementMetricsDto;
}
