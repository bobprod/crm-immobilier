import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignType } from './create-campaign.dto';

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum RecipientStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export class CampaignRecipientResponseDto {
  @ApiPropertyOptional({ description: 'Contact ID' })
  contactId?: string;

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Recipient name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Template variables', type: 'object' })
  variables?: Record<string, string>;

  @ApiProperty({ description: 'Recipient status', enum: RecipientStatus })
  status: RecipientStatus;

  @ApiPropertyOptional({ description: 'Sent timestamp' })
  sentAt?: Date;

  @ApiPropertyOptional({ description: 'Delivered timestamp' })
  deliveredAt?: Date;

  @ApiPropertyOptional({ description: 'Read timestamp' })
  readAt?: Date;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  errorMessage?: string;
}

export class CampaignStatsDto {
  @ApiProperty({ description: 'Total number of recipients' })
  totalRecipients: number;

  @ApiProperty({ description: 'Number of messages sent' })
  sent: number;

  @ApiProperty({ description: 'Number of messages delivered' })
  delivered: number;

  @ApiProperty({ description: 'Number of messages read' })
  read: number;

  @ApiProperty({ description: 'Number of failed messages' })
  failed: number;

  @ApiProperty({ description: 'Number of pending messages' })
  pending: number;

  @ApiProperty({ description: 'Success rate (0-100)' })
  successRate: number;

  @ApiProperty({ description: 'Read rate (0-100)' })
  readRate: number;
}

export class CampaignResponseDto {
  @ApiProperty({ description: 'Campaign unique ID' })
  id: string;

  @ApiProperty({ description: 'WhatsApp config ID' })
  configId: string;

  @ApiProperty({ description: 'Campaign name' })
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  description?: string;

  @ApiProperty({ description: 'Campaign type', enum: CampaignType })
  type: CampaignType;

  @ApiProperty({ description: 'Campaign status', enum: CampaignStatus })
  status: CampaignStatus;

  @ApiProperty({ description: 'Template ID' })
  templateId: string;

  @ApiProperty({ description: 'Template name (cached)' })
  templateName: string;

  @ApiProperty({
    description: 'Campaign recipients',
    type: [CampaignRecipientResponseDto],
  })
  recipients: CampaignRecipientResponseDto[];

  @ApiPropertyOptional({ description: 'Scheduled execution time' })
  scheduledAt?: Date;

  @ApiPropertyOptional({ description: 'Campaign start time' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Campaign completion time' })
  completedAt?: Date;

  @ApiProperty({ description: 'Campaign statistics' })
  stats: CampaignStatsDto;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class CampaignsListResponseDto {
  @ApiProperty({
    description: 'Array of campaigns',
    type: [CampaignResponseDto],
  })
  campaigns: CampaignResponseDto[];

  @ApiProperty({ description: 'Total count of campaigns' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  pageSize: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
