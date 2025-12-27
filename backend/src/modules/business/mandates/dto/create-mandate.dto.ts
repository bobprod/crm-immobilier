import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MandateType {
  SIMPLE = 'simple',
  EXCLUSIVE = 'exclusive',
  SEMI_EXCLUSIVE = 'semi_exclusive',
}

export enum MandateCategory {
  SALE = 'sale',
  RENTAL = 'rental',
}

export class CreateMandateDto {
  @ApiProperty({ description: 'Owner ID' })
  @IsString()
  ownerId: string;

  @ApiPropertyOptional({ description: 'Property ID (optional)' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({ description: 'Mandate reference number' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Mandate type', enum: MandateType })
  @IsEnum(MandateType)
  type: MandateType;

  @ApiProperty({ description: 'Mandate category', enum: MandateCategory })
  @IsEnum(MandateCategory)
  category: MandateCategory;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Property price' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Commission amount or percentage' })
  @IsNumber()
  commission: number;

  @ApiPropertyOptional({ description: 'Commission type', default: 'percentage' })
  @IsOptional()
  @IsString()
  commissionType?: string;

  @ApiPropertyOptional({ description: 'Exclusivity bonus' })
  @IsOptional()
  @IsNumber()
  exclusivityBonus?: number;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Signature date' })
  @IsOptional()
  @IsDateString()
  signedAt?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
