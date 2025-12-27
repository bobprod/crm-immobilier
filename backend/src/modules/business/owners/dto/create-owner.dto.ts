import { IsString, IsOptional, IsEmail, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOwnerDto {
  @ApiProperty({ description: 'First name of the owner' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name of the owner' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Zip code' })
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ description: 'Country', default: 'Tunisie' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Tax ID number' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'ID card number' })
  @IsOptional()
  @IsString()
  idCard?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Is owner active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
