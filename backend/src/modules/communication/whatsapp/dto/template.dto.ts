import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TemplateCategory {
  UTILITY = 'utility',
  MARKETING = 'marketing',
  AUTHENTICATION = 'authentication',
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name (unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TemplateCategory })
  @IsEnum(TemplateCategory)
  category: TemplateCategory;

  @ApiProperty({ description: 'Template body' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ description: 'Template header' })
  @IsString()
  @IsOptional()
  header?: string;

  @ApiPropertyOptional({ description: 'Template footer' })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiPropertyOptional({ description: 'Language code', default: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ description: 'Variables (e.g., ["{{1}}", "{{2}}"])', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({ description: 'Buttons configuration', type: Object })
  @IsObject()
  @IsOptional()
  buttons?: any;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template body' })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({ description: 'Template header' })
  @IsString()
  @IsOptional()
  header?: string;

  @ApiPropertyOptional({ description: 'Template footer' })
  @IsString()
  @IsOptional()
  footer?: string;

  @ApiPropertyOptional({ description: 'Variables', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  variables?: string[];

  @ApiPropertyOptional({ description: 'Buttons', type: Object })
  @IsObject()
  @IsOptional()
  buttons?: any;
}

export class TemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: TemplateCategory })
  category: TemplateCategory;

  @ApiProperty()
  language: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional()
  header?: string;

  @ApiPropertyOptional()
  footer?: string;

  @ApiProperty({ type: [String] })
  variables: string[];

  @ApiProperty()
  status: 'pending' | 'approved' | 'rejected';

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  rejectedReason?: string;

  @ApiProperty()
  sentCount: number;

  @ApiProperty()
  deliveredCount: number;

  @ApiProperty()
  readCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
