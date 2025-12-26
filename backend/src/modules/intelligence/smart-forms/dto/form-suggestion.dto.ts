import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class FormSuggestionQueryDto {
  @IsString()
  fieldName: string;

  @IsString()
  @IsOptional()
  partialValue?: string;

  @IsString()
  @IsOptional()
  formType?: string; // 'prospect', 'property', 'appointment', etc.

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;
}

export class FormSuggestionResponseDto {
  @IsArray()
  suggestions: FormSuggestion[];

  @IsString()
  fieldName: string;
}

export interface FormSuggestion {
  value: string;
  label: string;
  frequency?: number;
  lastUsed?: Date;
  metadata?: Record<string, any>;
}
