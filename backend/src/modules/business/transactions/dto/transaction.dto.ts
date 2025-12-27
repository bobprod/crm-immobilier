import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum TransactionType {
  SALE = 'sale',
  RENTAL = 'rental',
}

export enum TransactionStatus {
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  PROMISE_SIGNED = 'promise_signed',
  COMPROMIS_SIGNED = 'compromis_signed',
  FINAL_DEED_SIGNED = 'final_deed_signed',
  CANCELLED = 'cancelled',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'Property ID' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ description: 'Prospect/Buyer ID' })
  @IsOptional()
  @IsString()
  prospectId?: string;

  @ApiPropertyOptional({ description: 'Mandate ID' })
  @IsOptional()
  @IsString()
  mandateId?: string;

  @ApiProperty({ description: 'Transaction reference number' })
  @IsString()
  reference: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ description: 'Offer price' })
  @IsOptional()
  @IsNumber()
  offerPrice?: number;

  @ApiPropertyOptional({ description: 'Negotiated price' })
  @IsOptional()
  @IsNumber()
  negotiatedPrice?: number;

  @ApiPropertyOptional({ description: 'Final price' })
  @IsOptional()
  @IsNumber()
  finalPrice?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Deposit amount' })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  @ApiPropertyOptional({ description: 'Deposit paid date' })
  @IsOptional()
  @IsDateString()
  depositPaidAt?: string;

  @ApiPropertyOptional({ description: 'Estimated closing date' })
  @IsOptional()
  @IsDateString()
  estimatedClosing?: string;

  @ApiPropertyOptional({ description: 'Buyer name' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({ description: 'Buyer email' })
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional({ description: 'Buyer phone' })
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiPropertyOptional({ description: 'Notary name' })
  @IsOptional()
  @IsString()
  notaryName?: string;

  @ApiPropertyOptional({ description: 'Notary contact' })
  @IsOptional()
  @IsString()
  notaryContact?: string;

  @ApiPropertyOptional({ description: 'Loan amount' })
  @IsOptional()
  @IsNumber()
  loanAmount?: number;

  @ApiPropertyOptional({ description: 'Is loan approved', default: false })
  @IsOptional()
  @IsBoolean()
  loanApproved?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Conditions' })
  @IsOptional()
  @IsObject()
  conditions?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {
  @ApiPropertyOptional({ description: 'Transaction status', enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Offer date' })
  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @ApiPropertyOptional({ description: 'Promise date' })
  @IsOptional()
  @IsDateString()
  promiseDate?: string;

  @ApiPropertyOptional({ description: 'Compromis date' })
  @IsOptional()
  @IsDateString()
  compromisDate?: string;

  @ApiPropertyOptional({ description: 'Final deed date' })
  @IsOptional()
  @IsDateString()
  finalDeedDate?: string;

  @ApiPropertyOptional({ description: 'Actual closing date' })
  @IsOptional()
  @IsDateString()
  actualClosing?: string;
}

export class CreateTransactionStepDto {
  @ApiProperty({ description: 'Stage name' })
  @IsString()
  stage: string;

  @ApiPropertyOptional({ description: 'Completed by user ID' })
  @IsOptional()
  @IsString()
  completedBy?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Documents' })
  @IsOptional()
  @IsObject()
  documents?: any;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
