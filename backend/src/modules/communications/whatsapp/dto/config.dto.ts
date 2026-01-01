import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WhatsAppProvider {
  META = 'meta',
  TWILIO = 'twilio',
}

export class CreateWhatsAppConfigDto {
  @ApiProperty({ enum: WhatsAppProvider })
  @IsEnum(WhatsAppProvider)
  provider: WhatsAppProvider;

  // Meta Cloud API fields
  @ApiPropertyOptional({ description: 'Meta Phone Number ID' })
  @IsString()
  @IsOptional()
  phoneNumberId?: string;

  @ApiPropertyOptional({ description: 'Meta Business Account ID' })
  @IsString()
  @IsOptional()
  businessAccountId?: string;

  @ApiPropertyOptional({ description: 'Meta Access Token' })
  @IsString()
  @IsOptional()
  accessToken?: string;

  // Twilio fields
  @ApiPropertyOptional({ description: 'Twilio Account SID' })
  @IsString()
  @IsOptional()
  twilioAccountSid?: string;

  @ApiPropertyOptional({ description: 'Twilio Auth Token' })
  @IsString()
  @IsOptional()
  twilioAuthToken?: string;

  @ApiPropertyOptional({ description: 'Twilio Phone Number' })
  @IsString()
  @IsOptional()
  twilioPhoneNumber?: string;

  // Webhook
  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Webhook Secret' })
  @IsString()
  @IsOptional()
  webhookSecret?: string;

  // Auto-reply
  @ApiPropertyOptional({ description: 'Enable auto-reply', default: false })
  @IsBoolean()
  @IsOptional()
  autoReplyEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Business hours only', default: false })
  @IsBoolean()
  @IsOptional()
  businessHoursOnly?: boolean;

  @ApiPropertyOptional({ description: 'Business hours start (HH:mm)', example: '09:00' })
  @IsString()
  @IsOptional()
  businessHoursStart?: string;

  @ApiPropertyOptional({ description: 'Business hours end (HH:mm)', example: '18:00' })
  @IsString()
  @IsOptional()
  businessHoursEnd?: string;
}

export class UpdateWhatsAppConfigDto {
  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Meta Access Token' })
  @IsString()
  @IsOptional()
  accessToken?: string;

  @ApiPropertyOptional({ description: 'Twilio Auth Token' })
  @IsString()
  @IsOptional()
  twilioAuthToken?: string;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'Enable auto-reply' })
  @IsBoolean()
  @IsOptional()
  autoReplyEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Business hours only' })
  @IsBoolean()
  @IsOptional()
  businessHoursOnly?: boolean;

  @ApiPropertyOptional({ description: 'Business hours start' })
  @IsString()
  @IsOptional()
  businessHoursStart?: string;

  @ApiPropertyOptional({ description: 'Business hours end' })
  @IsString()
  @IsOptional()
  businessHoursEnd?: string;
}

export class WhatsAppConfigResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: WhatsAppProvider })
  provider: WhatsAppProvider;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  phoneNumberId?: string;

  @ApiProperty()
  webhookUrl?: string;

  @ApiProperty()
  autoReplyEnabled: boolean;

  @ApiProperty()
  businessHoursOnly: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
