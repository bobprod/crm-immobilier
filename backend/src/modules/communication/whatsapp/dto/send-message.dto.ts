import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEMPLATE = 'template',
}

export class SendTextMessageDto {
  @ApiProperty({ description: 'Phone number (E.164 format)', example: '+33612345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Message text content' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Lead ID (optional CRM link)' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Prospect ID (optional CRM link)' })
  @IsString()
  @IsOptional()
  prospectId?: string;
}

export class SendMediaMessageDto {
  @ApiProperty({ description: 'Phone number (E.164 format)', example: '+33612345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Media URL' })
  @IsString()
  @IsNotEmpty()
  mediaUrl: string;

  @ApiProperty({ enum: MessageType, description: 'Media type' })
  @IsEnum(MessageType)
  type: MessageType.IMAGE | MessageType.DOCUMENT | MessageType.VIDEO | MessageType.AUDIO;

  @ApiPropertyOptional({ description: 'Media caption' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiPropertyOptional({ description: 'Lead ID (optional CRM link)' })
  @IsString()
  @IsOptional()
  leadId?: string;
}

export class SendTemplateMessageDto {
  @ApiProperty({ description: 'Phone number (E.164 format)', example: '+33612345678' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({ description: 'Template parameters', type: [String] })
  @IsArray()
  @IsString({ each: true })
  parameters: string[];

  @ApiPropertyOptional({ description: 'Language code', default: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Lead ID (optional CRM link)' })
  @IsString()
  @IsOptional()
  leadId?: string;
}

export class SendBulkMessageDto {
  @ApiProperty({ description: 'Phone numbers array', type: [String] })
  @IsArray()
  @IsString({ each: true })
  phoneNumbers: string[];

  @ApiProperty({ description: 'Message text content' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Delay between messages (ms)', default: 1000 })
  @IsOptional()
  delayMs?: number;
}

export class MessageResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  messageId: string;

  @ApiProperty()
  conversationId: string;

  @ApiPropertyOptional()
  error?: string;
}
