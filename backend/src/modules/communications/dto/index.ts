import { IsEmail, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CommunicationAttachment } from '../../../shared/types/relation-summaries';

export class SendEmailDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Nouveau bien disponible' })
  @IsString()
  subject: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Pièces jointes', type: 'array' })
  @IsOptional()
  @IsArray()
  attachments?: CommunicationAttachment[];
}

export class SendSmsDto {
  @ApiProperty({ example: '+21655123456' })
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;
}

export class SendWhatsAppDto {
  @ApiProperty({ example: '+21655123456' })
  @IsString()
  to: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;
}

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ['email', 'sms', 'whatsapp'] })
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  variables?: string[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  variables?: string[];
}
