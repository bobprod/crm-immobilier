import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory, TemplateButton } from './create-template.dto';
import { TemplateStatus } from './update-template.dto';

export class TemplateStatsDto {
  @ApiProperty({ description: 'Total number of times template was sent' })
  sentCount: number;

  @ApiProperty({ description: 'Number of delivered messages' })
  deliveredCount: number;

  @ApiProperty({ description: 'Number of read messages' })
  readCount: number;

  @ApiProperty({ description: 'Number of failed messages' })
  failedCount: number;

  @ApiProperty({ description: 'Delivery rate (0-100)' })
  deliveryRate: number;

  @ApiProperty({ description: 'Read rate (0-100)' })
  readRate: number;

  @ApiProperty({ description: 'Success rate (0-100)' })
  successRate: number;
}

export class TemplateResponseDto {
  @ApiProperty({ description: 'Template unique ID' })
  id: string;

  @ApiProperty({ description: 'WhatsApp config ID' })
  configId: string;

  @ApiProperty({ description: 'Template name' })
  name: string;

  @ApiProperty({ description: 'Language code' })
  language: string;

  @ApiProperty({ description: 'Template category', enum: TemplateCategory })
  category: TemplateCategory;

  @ApiPropertyOptional({ description: 'Header text' })
  header?: string;

  @ApiProperty({ description: 'Body text with variables' })
  body: string;

  @ApiPropertyOptional({ description: 'Footer text' })
  footer?: string;

  @ApiPropertyOptional({ description: 'Template buttons', type: 'array' })
  buttons?: TemplateButton[];

  @ApiProperty({ description: 'Variable placeholders', type: [String] })
  variables: string[];

  @ApiProperty({ description: 'Template status', enum: TemplateStatus })
  status: TemplateStatus;

  @ApiPropertyOptional({ description: 'Approval timestamp' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectedReason?: string;

  @ApiProperty({ description: 'Template statistics' })
  stats: TemplateStatsDto;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

export class TemplatesListResponseDto {
  @ApiProperty({ description: 'Array of templates', type: [TemplateResponseDto] })
  templates: TemplateResponseDto[];

  @ApiProperty({ description: 'Total count of templates' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
