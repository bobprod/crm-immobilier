import { IsString, IsNumber, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @IsEnum(['buyer', 'seller', 'tenant', 'owner'])
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  preferences?: any;

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

  @ApiPropertyOptional()
  @IsOptional()
  preferences?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
