import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TemplateCategory, TemplateButton } from './create-template.dto';

export enum TemplateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Template name (lowercase, underscores, no spaces)',
    example: 'welcome_message_v2',
    minLength: 1,
    maxLength: 512,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(512)
  name?: string;

  @ApiPropertyOptional({
    description: 'Template language code (ISO 639-1)',
    example: 'en',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'Template category',
    enum: TemplateCategory,
    example: TemplateCategory.MARKETING,
  })
  @IsEnum(TemplateCategory)
  @IsOptional()
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Template header text',
    example: 'Special Offer',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  header?: string;

  @ApiPropertyOptional({
    description: 'Template body text with variables {{1}}, {{2}}, etc.',
    example: 'Hello {{1}}, check out our new offer: {{2}}',
    maxLength: 1024,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1024)
  body?: string;

  @ApiPropertyOptional({
    description: 'Template footer text',
    example: 'Reply STOP to unsubscribe',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  footer?: string;

  @ApiPropertyOptional({
    description: 'Array of template buttons',
    type: 'array',
    items: {
      type: 'object',
    },
  })
  @IsArray()
  @IsOptional()
  buttons?: TemplateButton[];

  @ApiPropertyOptional({
    description: 'Array of variable placeholders',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({
    description: 'Template status (admin only)',
    enum: TemplateStatus,
    example: TemplateStatus.APPROVED,
  })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

  @ApiPropertyOptional({
    description: 'Rejection reason if status is rejected',
    example: 'Template content violates WhatsApp policies',
  })
  @IsString()
  @IsOptional()
  rejectedReason?: string;
}
