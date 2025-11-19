import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdateVitrineConfigDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  agencyName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slogan?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  primaryColor?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  schedule?: any;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  socialLinks?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  heroImage?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  aboutText?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  services?: any;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  testimonials?: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoKeywords?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  analyticsId?: string;
}
