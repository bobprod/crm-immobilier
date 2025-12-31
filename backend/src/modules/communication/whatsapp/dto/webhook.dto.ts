import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Meta Cloud API Webhook Format
export class MetaWebhookEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  changes: any[];
}

export class MetaWebhookDto {
  @ApiProperty()
  object: string;

  @ApiProperty({ type: [MetaWebhookEntryDto] })
  entry: MetaWebhookEntryDto[];
}

// Parsed Webhook Message
export class InboundMessageDto {
  @ApiProperty()
  messageId: string;

  @ApiProperty()
  from: string;

  @ApiProperty()
  timestamp: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  text?: {
    body: string;
  };

  @ApiPropertyOptional()
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
  };

  @ApiPropertyOptional()
  document?: {
    id: string;
    filename: string;
    mime_type: string;
    sha256: string;
  };

  @ApiPropertyOptional()
  video?: {
    id: string;
    mime_type: string;
    sha256: string;
  };

  @ApiPropertyOptional()
  audio?: {
    id: string;
    mime_type: string;
    sha256: string;
  };

  @ApiPropertyOptional()
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };

  @ApiPropertyOptional()
  contacts?: any[];
}

// Webhook Status Update
export class MessageStatusDto {
  @ApiProperty()
  messageId: string;

  @ApiProperty()
  status: 'sent' | 'delivered' | 'read' | 'failed';

  @ApiProperty()
  timestamp: string;

  @ApiPropertyOptional()
  errors?: any[];
}

// Webhook Verification (Meta)
export class WebhookVerificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  'hub.mode': string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  'hub.verify_token': string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  'hub.challenge': string;
}
