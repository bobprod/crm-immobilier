import {
  IsString, IsOptional, IsEnum, IsNumber, IsDateString,
  IsBoolean, IsObject, IsArray, IsInt, Min, Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum CommitmentCategoryDto {
  INVESTOR = 'INVESTOR',
  RENT     = 'RENT',
  LOAN     = 'LOAN',
  TAX      = 'TAX',
  SALARY   = 'SALARY',
  CUSTOM   = 'CUSTOM',
}

export enum CommitmentFrequencyDto {
  MONTHLY   = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY    = 'YEARLY',
  CUSTOM    = 'CUSTOM',
}

export enum AlertLevelDto {
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateCommitmentDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: CommitmentCategoryDto }) @IsEnum(CommitmentCategoryDto) category: CommitmentCategoryDto;
  @ApiProperty() @IsString() type: string;
  @ApiProperty() @IsNumber() amount: number;
  @ApiPropertyOptional({ default: 'TND' }) @IsOptional() @IsString() currency?: string;
  @ApiProperty({ enum: CommitmentFrequencyDto }) @IsEnum(CommitmentFrequencyDto) frequency: CommitmentFrequencyDto;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) @Max(31) customDayOfMonth?: number;
  @ApiPropertyOptional({ default: 5 }) @IsOptional() @IsInt() gracePeriodDays?: number;
  @ApiProperty() @IsDateString() startDate: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() totalOccurrences?: number;
  @ApiPropertyOptional({ enum: AlertLevelDto, default: 'HIGH' }) @IsOptional() @IsEnum(AlertLevelDto) alertLevel?: AlertLevelDto;
  @ApiPropertyOptional() @IsOptional() @IsArray() alertChannels?: string[];
  @ApiPropertyOptional() @IsOptional() @IsObject() metadata?: any;
}

export class UpdateCommitmentDto extends PartialType(CreateCommitmentDto) {}

export class MarkDoneDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() paidAmount?: number;
  @ApiPropertyOptional() @IsOptional() @IsDateString() paidAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentRef?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
