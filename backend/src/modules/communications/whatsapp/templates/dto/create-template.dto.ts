import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  MaxLength,
  MinLength,
  IsObject,
} from 'class-validator';

export enum TemplateCategory {
  UTILITY = 'utility',
  MARKETING = 'marketing',
  AUTHENTICATION = 'authentication',
}

export interface TemplateButton {
  type: 'quick_reply' | 'call_to_action' | 'url';
  text: string;
  url?: string;
  phone_number?: string;
}

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Template name (lowercase, underscores, no spaces)',
    example: 'welcome_message',
    minLength: 1,
    maxLength: 512,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(512)
  name: string;

  @ApiProperty({
    description: 'Template language code (ISO 639-1)',
    example: 'fr',
    default: 'fr',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Template category',
    enum: TemplateCategory,
    example: TemplateCategory.UTILITY,
  })
  @IsEnum(TemplateCategory)
  @IsNotEmpty()
  category: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Template header text',
    example: 'Welcome to our service',
    maxLength: 60,
  })
  @IsString()
  @IsOptional()
  @MaxLength(60)
  header?: string;

  @ApiProperty({
    description: 'Template body text with variables {{1}}, {{2}}, etc.',
    example: 'Bonjour {{1}}, bienvenue chez nous! Votre code est {{2}}.',
    maxLength: 1024,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  body: string;

  @ApiPropertyOptional({
    description: 'Template footer text',
    example: 'Powered by MyCompany',
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
    example: [
      { type: 'quick_reply', text: 'Confirmer' },
      { type: 'url', text: 'En savoir plus', url: 'https://example.com' },
    ],
  })
  @IsArray()
  @IsOptional()
  buttons?: TemplateButton[];

  @ApiPropertyOptional({
    description: 'Array of variable placeholders detected in body',
    type: [String],
    example: ['{{1}}', '{{2}}'],
  })
  @IsArray()
  @IsOptional()
  variables?: string[];
}
