import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// ========== AGENT PROFILE ==========

export class CreateAgentProfileDto {
  @ApiProperty({ description: 'User ID for this agent profile' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Job title (agent, commercial, manager, etc.)' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Agent phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ description: 'Is agent active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAgentProfileDto extends PartialType(CreateAgentProfileDto) {}

// ========== COMMISSION CONFIG ==========

export class UpdateCommissionConfigDto {
  @ApiPropertyOptional({ description: 'Below this monthly CA amount: 0% commission', default: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier1MaxAmount?: number;

  @ApiPropertyOptional({ description: 'Above this monthly CA: tier2 rate applies', default: 7000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier2MinAmount?: number;

  @ApiPropertyOptional({ description: 'Commission rate for tier2 (percentage)', default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier2Rate?: number;

  @ApiPropertyOptional({ description: 'Above this monthly CA: tier3 rate applies', default: 11000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier3MinAmount?: number;

  @ApiPropertyOptional({ description: 'Commission rate for tier3 (percentage)', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier3Rate?: number;

  @ApiPropertyOptional({ description: 'Commission rate for direct sale transactions (percentage)', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  directSaleRate?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;
}

// ========== AGENT COMMISSION OVERRIDE ==========

export class UpdateAgentCommissionOverrideDto {
  @ApiPropertyOptional({ description: 'Override tier1 max amount for this agent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier1MaxAmount?: number;

  @ApiPropertyOptional({ description: 'Override tier2 min amount for this agent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier2MinAmount?: number;

  @ApiPropertyOptional({ description: 'Override tier2 rate for this agent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier2Rate?: number;

  @ApiPropertyOptional({ description: 'Override tier3 min amount for this agent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier3MinAmount?: number;

  @ApiPropertyOptional({ description: 'Override tier3 rate for this agent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier3Rate?: number;

  @ApiPropertyOptional({ description: 'Override direct sale rate for this agent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  directSaleRate?: number;
}

// ========== ANNUAL BONUS CONFIG ==========

export class UpdateAnnualBonusConfigDto {
  @ApiPropertyOptional({ description: 'Annual CA threshold for tier1 bonus', default: 180000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier1MinAmount?: number;

  @ApiPropertyOptional({ description: 'Bonus rate for tier1 (percentage)', default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier1Rate?: number;

  @ApiPropertyOptional({ description: 'Annual CA threshold for tier2 bonus (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier2MinAmount?: number;

  @ApiPropertyOptional({ description: 'Bonus rate for tier2 (percentage, optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier2Rate?: number;

  @ApiPropertyOptional({ description: 'Annual CA threshold for tier3 bonus (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tier3MinAmount?: number;

  @ApiPropertyOptional({ description: 'Bonus rate for tier3 (percentage, optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tier3Rate?: number;

  @ApiPropertyOptional({ description: 'Currency', default: 'TND' })
  @IsOptional()
  @IsString()
  currency?: string;
}

// ========== MONTHLY PERFORMANCE ==========

export class UpsertMonthlyPerformanceDto {
  @ApiProperty({ description: 'Year (e.g. 2026)' })
  @IsNumber()
  @Min(2000)
  year: number;

  @ApiProperty({ description: 'Month (1-12)' })
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({ description: 'Monthly CA amount (TND)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caAmount?: number;

  @ApiPropertyOptional({ description: 'Direct sales CA amount (TND)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  directSalesCA?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
