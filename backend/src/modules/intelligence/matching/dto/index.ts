import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateMatchesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minScore?: number;
}

export class MatchActionDto {
  @ApiProperty({ enum: ['call', 'email', 'appointment'] })
  @IsEnum(['call', 'email', 'appointment'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endTime?: string;
}

export class UpdateMatchStatusDto {
  @ApiProperty({ enum: ['pending', 'contacted', 'accepted', 'rejected'] })
  @IsEnum(['pending', 'contacted', 'accepted', 'rejected'])
  status: string;
}

export class MatchFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prospectId?: string;
}
