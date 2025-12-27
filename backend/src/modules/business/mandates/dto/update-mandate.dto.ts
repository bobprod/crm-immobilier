import { PartialType } from '@nestjs/swagger';
import { CreateMandateDto } from './create-mandate.dto';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MandateStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export class UpdateMandateDto extends PartialType(CreateMandateDto) {
  @ApiPropertyOptional({ description: 'Mandate status', enum: MandateStatus })
  @IsOptional()
  @IsEnum(MandateStatus)
  status?: MandateStatus;

  @ApiPropertyOptional({ description: 'Cancellation date' })
  @IsOptional()
  @IsDateString()
  cancelledAt?: string;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
