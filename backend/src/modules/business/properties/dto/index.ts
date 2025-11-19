import { IsString, IsNumber, IsOptional, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['apartment', 'house', 'villa', 'studio', 'office', 'land'] })
  @IsEnum(['apartment', 'house', 'villa', 'studio', 'office', 'land'])
  type: string;

  @ApiProperty({ enum: ['sale', 'rent'] })
  @IsEnum(['sale', 'rent'])
  category: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  area?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;
}

export class UpdatePropertyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  features?: any;
}
