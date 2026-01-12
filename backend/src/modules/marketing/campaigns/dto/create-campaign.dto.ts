import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsArray, IsDateString } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ description: 'Nom de la campagne' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Type de campagne', enum: ['email', 'sms', 'whatsapp', 'social', 'mixed'] })
  @IsEnum(['email', 'sms', 'whatsapp', 'social', 'mixed'])
  type: string;

  @ApiProperty({ description: 'Contenu de la campagne', required: false })
  @IsObject()
  @IsOptional()
  content?: any;

  @ApiProperty({ description: 'Message de la campagne', required: false })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({ description: 'Recipients/Target audience', required: false })
  @IsArray()
  @IsOptional()
  targetAudience?: string[];

  @ApiProperty({ description: 'Date de programmation', required: false })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiProperty({ description: 'Statistiques', required: false })
  @IsObject()
  @IsOptional()
  stats?: any;

  @ApiProperty({ description: 'Template ID', required: false })
  @IsString()
  @IsOptional()
  templateId?: string;
}
