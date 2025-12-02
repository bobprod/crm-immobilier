import { IsString, IsNumber, IsOptional, IsIn, IsEmail, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProspectPreferences } from '../../../../shared/types/relation-summaries';

export class CreateProspectDto {
  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: ['buyer', 'seller', 'tenant', 'owner'] })
  @IsIn(['buyer', 'seller', 'tenant', 'owner'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ description: 'Préférences de recherche du prospect' })
  @IsOptional()
  @IsObject()
  preferences?: ProspectPreferences;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProspectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional({ description: 'Préférences de recherche du prospect' })
  @IsOptional()
  @IsObject()
  preferences?: ProspectPreferences;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
