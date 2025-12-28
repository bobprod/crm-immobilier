import { IsString, IsEnum, IsOptional, IsArray, IsNumber, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========== SMART CONTENT GENERATION ==========

export class GenerateSmartEmailDto {
  @ApiPropertyOptional({ description: 'ID du prospect pour contexte' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID de la propriété pour contexte' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({
    enum: ['follow_up', 'appointment', 'negotiation', 'information', 'custom'],
    description: 'Objectif de l\'email',
  })
  @IsEnum(['follow_up', 'appointment', 'negotiation', 'information', 'custom'])
  purpose: 'follow_up' | 'appointment' | 'negotiation' | 'information' | 'custom';

  @ApiPropertyOptional({
    enum: ['formal', 'friendly', 'commercial'],
    description: 'Ton du message',
  })
  @IsOptional()
  @IsEnum(['formal', 'friendly', 'commercial'])
  tone?: 'formal' | 'friendly' | 'commercial';

  @ApiPropertyOptional({ description: 'Contexte additionnel libre' })
  @IsOptional()
  @IsString()
  additionalContext?: string;
}

export class GenerateSmartSMSDto {
  @ApiPropertyOptional({ description: 'ID du prospect pour contexte' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID de la propriété pour contexte' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({
    enum: ['appointment_reminder', 'follow_up', 'confirmation', 'custom'],
    description: 'Objectif du SMS',
  })
  @IsEnum(['appointment_reminder', 'follow_up', 'confirmation', 'custom'])
  purpose: 'appointment_reminder' | 'follow_up' | 'confirmation' | 'custom';

  @ApiPropertyOptional({ description: 'Longueur maximum du SMS', default: 160 })
  @IsOptional()
  @IsNumber()
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Contexte additionnel libre' })
  @IsOptional()
  @IsString()
  additionalContext?: string;
}

// ========== TEMPLATE AI ==========

export class SuggestTemplatesDto {
  @ApiProperty({
    enum: ['email', 'sms', 'whatsapp'],
    description: 'Type de template',
  })
  @IsEnum(['email', 'sms', 'whatsapp'])
  type: 'email' | 'sms' | 'whatsapp';

  @ApiPropertyOptional({ description: 'ID du prospect pour contexte' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID de la propriété pour contexte' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ description: 'Objectif de la communication' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Mots-clés pour filtrage' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

export class GenerateTemplateDto {
  @ApiProperty({
    enum: ['email', 'sms', 'whatsapp'],
    description: 'Type de template',
  })
  @IsEnum(['email', 'sms', 'whatsapp'])
  type: 'email' | 'sms' | 'whatsapp';

  @ApiProperty({ description: 'Objectif du template' })
  @IsString()
  purpose: string;

  @ApiPropertyOptional({
    enum: ['formal', 'friendly', 'commercial'],
    description: 'Ton du template',
  })
  @IsOptional()
  @IsEnum(['formal', 'friendly', 'commercial'])
  tone?: 'formal' | 'friendly' | 'commercial';

  @ApiPropertyOptional({ description: 'Variables à inclure dans le template' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includeVariables?: string[];

  @ApiPropertyOptional({ description: 'Contexte d\'exemple pour générer le template' })
  @IsOptional()
  @IsString()
  sampleContext?: string;
}

// ========== SMART COMPOSER ==========

export class AutoCompleteDto {
  @ApiProperty({ description: 'Texte partiel à compléter' })
  @IsString()
  partialText: string;

  @ApiProperty({
    enum: ['email', 'sms'],
    description: 'Type de message',
  })
  @IsEnum(['email', 'sms'])
  type: 'email' | 'sms';

  @ApiPropertyOptional({ description: 'ID du prospect pour contexte' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'ID de la propriété pour contexte' })
  @IsOptional()
  @IsString()
  propertyId?: string;
}

export class ImproveTextDto {
  @ApiProperty({ description: 'Texte à améliorer' })
  @IsString()
  text: string;

  @ApiProperty({
    description: 'Types d\'améliorations à appliquer',
    isArray: true,
    enum: ['grammar', 'tone', 'clarity', 'professional', 'concise'],
  })
  @IsArray()
  @IsEnum(['grammar', 'tone', 'clarity', 'professional', 'concise'], { each: true })
  improvements: ('grammar' | 'tone' | 'clarity' | 'professional' | 'concise')[];
}

export class TranslateMessageDto {
  @ApiProperty({ description: 'Texte à traduire' })
  @IsString()
  text: string;

  @ApiProperty({
    enum: ['ar', 'en', 'fr'],
    description: 'Langue cible',
  })
  @IsIn(['ar', 'en', 'fr'])
  targetLanguage: 'ar' | 'en' | 'fr';
}
