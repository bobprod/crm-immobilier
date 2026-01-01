import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsDateString,
  ValidateNested,
  IsObject,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CampaignType {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
}

export class CampaignRecipientDto {
  @ApiPropertyOptional({
    description: 'Contact ID (if linked to existing contact)',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsOptional()
  contactId?: string;

  @ApiProperty({
    description: 'Recipient phone number in E.164 format',
    example: '+33612345678',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Template variables as key-value pairs',
    type: 'object',
    example: { '1': 'Jean', '2': 'ABC123' },
  })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer Promotion 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'Promotional campaign for summer offers',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Campaign type',
    enum: CampaignType,
    example: CampaignType.IMMEDIATE,
  })
  @IsEnum(CampaignType)
  @IsNotEmpty()
  type: CampaignType;

  @ApiProperty({
    description: 'Template ID to use for the campaign',
    example: 'clxxx123456789',
  })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({
    description: 'Array of recipients',
    type: [CampaignRecipientDto],
    example: [
      {
        phoneNumber: '+33612345678',
        variables: { '1': 'Jean', '2': 'ABC123' },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignRecipientDto)
  recipients: CampaignRecipientDto[];

  @ApiPropertyOptional({
    description: 'Scheduled date and time (ISO 8601 format)',
    example: '2024-12-31T10:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;
}
