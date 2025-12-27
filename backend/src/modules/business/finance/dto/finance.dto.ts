import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ========== COMMISSIONS ==========

export enum CommissionStatus {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class CreateCommissionDto {
  @ApiProperty({ description: 'Transaction ID' })
  @IsString()
  transactionId: string;

  @ApiProperty({ description: 'Agent ID' })
  @IsString()
  agentId: string;

  @ApiPropertyOptional({ description: 'Commission type', default: 'agent' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Commission amount' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Commission percentage' })
  @IsOptional()
  @IsNumber()
  percentage?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateCommissionDto extends PartialType(CreateCommissionDto) {
  @ApiPropertyOptional({ description: 'Commission status', enum: CommissionStatus })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({ description: 'Paid date' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

// ========== INVOICES ==========

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum ClientType {
  BUYER = 'buyer',
  SELLER = 'seller',
  TENANT = 'tenant',
  LANDLORD = 'landlord',
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Owner ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiProperty({ description: 'Invoice number' })
  @IsString()
  number: string;

  @ApiProperty({ description: 'Client type', enum: ClientType })
  @IsEnum(ClientType)
  clientType: ClientType;

  @ApiProperty({ description: 'Client name' })
  @IsString()
  clientName: string;

  @ApiPropertyOptional({ description: 'Client email' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ description: 'Client phone' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiPropertyOptional({ description: 'Client address' })
  @IsOptional()
  @IsString()
  clientAddress?: string;

  @ApiProperty({ description: 'Amount (before tax)' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'VAT amount', default: 0 })
  @IsOptional()
  @IsNumber()
  vat?: number;

  @ApiProperty({ description: 'Total amount (with tax)' })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Due date' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Line items' })
  @IsOptional()
  @IsObject()
  items?: any;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @ApiPropertyOptional({ description: 'Invoice status', enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({ description: 'Paid date' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ description: 'PDF URL' })
  @IsOptional()
  @IsString()
  pdfUrl?: string;
}

// ========== PAYMENTS ==========

export enum PaymentMethod {
  CASH = 'cash',
  CHECK = 'check',
  BANK_TRANSFER = 'bank_transfer',
  CREDIT_CARD = 'credit_card',
  OTHER = 'other',
}

export class CreatePaymentDto {
  @ApiPropertyOptional({ description: 'Invoice ID' })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Commission ID' })
  @IsOptional()
  @IsString()
  commissionId?: string;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment reference' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}
