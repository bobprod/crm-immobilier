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

// ========== COMMUNICATIONS SETTINGS ==========
export class CommunicationsSettingsDto {
  @ApiPropertyOptional({ example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  smtpPort?: number;

  @ApiPropertyOptional()
  @IsOptional()
  smtpSecure?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiPropertyOptional({ example: 'noreply@monagence.com' })
  @IsOptional()
  @IsString()
  smtpFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twilioAccountSid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  twilioAuthToken?: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsOptional()
  @IsString()
  twilioPhoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappPhoneNumberId?: string;

  @ApiPropertyOptional({ example: 'smtp | resend | sendgrid' })
  @IsOptional()
  @IsString()
  emailProvider?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resendApiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sendgridApiKey?: string;

  // ========== META PLATFORM (Messenger + Instagram) ==========
  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  metaAppId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaAppSecret?: string;

  @ApiPropertyOptional({ description: 'Page Access Token (long-lived)' })
  @IsOptional()
  @IsString()
  metaPageAccessToken?: string;

  @ApiPropertyOptional({ example: '123456789012345' })
  @IsOptional()
  @IsString()
  metaPageId?: string;

  @ApiPropertyOptional({ example: '17841400000000000' })
  @IsOptional()
  @IsString()
  metaInstagramAccountId?: string;

  @ApiPropertyOptional({ description: 'Token de vérification Webhook' })
  @IsOptional()
  @IsString()
  metaWebhookVerifyToken?: string;

  @ApiPropertyOptional({ example: 'v21.0' })
  @IsOptional()
  @IsString()
  metaGraphApiVersion?: string;

  // ========== TIKTOK BUSINESS ==========
  @ApiPropertyOptional({ description: 'TikTok Business App ID' })
  @IsOptional()
  @IsString()
  tiktokAppId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tiktokAppSecret?: string;

  @ApiPropertyOptional({ description: 'TikTok Business Access Token (long-lived)' })
  @IsOptional()
  @IsString()
  tiktokAccessToken?: string;

  @ApiPropertyOptional({ description: 'TikTok Business Account ID (Advertiser ID)' })
  @IsOptional()
  @IsString()
  tiktokBusinessId?: string;

  @ApiPropertyOptional({ description: 'TikTok Webhook Secret' })
  @IsOptional()
  @IsString()
  tiktokWebhookSecret?: string;

  // ========== LINKEDIN PAGE ==========
  @ApiPropertyOptional({ description: 'LinkedIn App Client ID' })
  @IsOptional()
  @IsString()
  linkedinClientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  linkedinClientSecret?: string;

  @ApiPropertyOptional({ description: 'LinkedIn Page Access Token' })
  @IsOptional()
  @IsString()
  linkedinAccessToken?: string;

  @ApiPropertyOptional({ description: 'LinkedIn Organization ID (urn:li:organization:xxxxx)' })
  @IsOptional()
  @IsString()
  linkedinOrganizationId?: string;
}

// ========== AI-POWERED COMMUNICATIONS ==========
export * from './communications-ai.dto';
